const prisma = require('../config/db');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

exports.exportLogbook = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const targetStudentId = parseInt(studentId, 10);

    // Students can only export their own logbook
    if (req.user.role === 'STUDENT' && req.user.id !== targetStudentId) {
      return res.status(403).json({ success: false, message: 'Can only export own logbook' });
    }

    // SCHOOL/INDUSTRY supervisors can only export logbooks of their assigned students
    if (req.user.role === 'SCHOOL' || req.user.role === 'INDUSTRY') {
      const placement = await prisma.placement.findFirst({
        where: {
          student_id: targetStudentId,
          OR: [
            { school_supervisor_id: req.user.id },
            { industry_supervisor_id: req.user.id }
          ]
        }
      });
      if (!placement) {
        return res.status(403).json({ success: false, message: 'Not authorized to export this student\'s logbook' });
      }
    }

    // COORDINATOR: can only export students from their institution
    if (req.user.role === 'COORDINATOR') {
      const coordinator = await prisma.supervisor.findUnique({ where: { supervisor_id: req.user.id } });
      const targetStudent = await prisma.student.findUnique({ where: { student_id: targetStudentId }, select: { institution: true } });
      if (!targetStudent || targetStudent.institution !== coordinator.institution) {
        return res.status(403).json({ success: false, message: 'Not authorized to export this student\'s logbook' });
      }
    }

    const student = await prisma.student.findUnique({
      where: { student_id: targetStudentId },
      include: {
        placements: { include: { school_supervisor: true, industry_supervisor: true } },
        activity_logs: {
          where: {
            status: { not: 'rejected' },
            industry_endorsed: true
          },
          orderBy: { log_date: 'asc' }
        }
      }
    });

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });


    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=logbook_${student.matric_no}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('SIWES Student Certified Logbook', { align: 'center' });
    doc.moveDown();
    
    // Student Details
    doc.fontSize(12)
       .text(`Name: ${student.full_name}`)
       .text(`Matric No: ${student.matric_no}`)
       .text(`Department: ${student.department}`)
       .text(`Institution: ${student.institution}`);
    doc.moveDown();

    // Logs
    if (student.activity_logs.length === 0) {
      doc.fontSize(11).text('No certified (endorsed) activity logs found yet. Only verified and endorsed entries are included in the official logbook.');
    } else {
      student.activity_logs.forEach((log, i) => {
        doc.fontSize(13).text(`Entry #${i + 1} - ${new Date(log.log_date).toDateString()}`, { underline: true });
        doc.fontSize(10)
           .text(`Workplace Status: ENDORSED`)
           .text(`Academic Status: ${log.status.toUpperCase()}`)
           .text(`Description: ${log.description}`)
           .text(`Skills Acquired: ${log.skills_acquired || 'N/A'}`)
           .text(`Supervisor Comment: ${log.supervisor_comment || 'None'}`);
        doc.moveDown();
      });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportInstitutionReport = async (req, res, next) => {
  try {
    const { institutionId } = req.params; // Passing institution name as ID for simplicity
    const format = req.query.format || 'pdf'; // 'pdf' or 'csv'

    // Auth Check
    if (req.user.role === 'COORDINATOR') {
      const coordinator = await prisma.supervisor.findUnique({ where: { supervisor_id: req.user.id } });
      if (coordinator.institution !== institutionId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const students = await prisma.student.findMany({
      where: { institution: institutionId },
      include: {
        placements: true,
        final_reports: true
      }
    });

    if (format === 'csv') {
      const data = students.map(s => ({
        Matric_No: s.matric_no,
        Name: s.full_name,
        Department: s.department,
        Placement_Company: s.placements[0]?.company_name || 'Unassigned',
        Report_Verified: s.final_reports[0]?.stipend_verified ? 'Yes' : 'No'
      }));

      const parser = new Parser();
      const csv = parser.parse(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=institution_${institutionId}_report.csv`);
      return res.status(200).send(csv);
    }

    // PDF Format
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=institution_${institutionId}_report.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text(`Placement Report: ${institutionId}`, { align: 'center' });
    doc.moveDown();

    students.forEach(s => {
      doc.fontSize(12)
         .text(`Student: ${s.full_name} (${s.matric_no})`)
         .text(`Department: ${s.department}`)
         .text(`Company: ${s.placements[0]?.company_name || 'Unassigned'}`)
         .text(`Stipend Verified: ${s.final_reports[0]?.stipend_verified ? 'Yes' : 'No'}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportItfNational = async (req, res, next) => {
  try {
    const format = req.query.format || 'pdf';

    const reports = await prisma.finalReport.findMany({
      where: { stipend_verified: true },
      include: { student: true }
    });

    if (format === 'csv') {
      const data = reports.map(r => ({
        Student_Name: r.student.full_name,
        Matric_No: r.student.matric_no,
        Institution: r.student.institution,
        Bank_Name: r.student.bank_name || 'Pending',
        Account_Number: r.student.account_number ? `'${r.student.account_number}` : 'Pending',
        Account_Name: r.student.account_name || r.student.full_name,
        Verified_At: r.verified_at ? new Date(r.verified_at).toLocaleDateString() : 'N/A'
      }));

      const parser = new Parser();
      const csv = parser.parse(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=itf_national_report.csv`);
      return res.status(200).send(csv);
    }

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=itf_national_report.pdf`);
    doc.pipe(res);

    doc.fontSize(18).text('Industrial Training Fund (ITF)', { align: 'center' });
    doc.fontSize(14).text('National SIWES Stipend Disbursement Roster', { align: 'center' });
    doc.moveDown();

    reports.forEach((r, idx) => {
      doc.fontSize(11)
         .text(`${idx + 1}. Student: ${r.student.full_name} (${r.student.matric_no}) — ${r.student.institution}`)
         .text(`   Bank: ${r.student.bank_name || 'Pending'} | Acc No: ${r.student.account_number || 'Pending'} | Acc Name: ${r.student.account_name || r.student.full_name}`)
         .text(`   Authorized On: ${r.verified_at ? new Date(r.verified_at).toDateString() : 'Record'}`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};
