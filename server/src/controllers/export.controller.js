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


    const doc = new PDFDocument({ size: 'A4', margin: 36, bufferPages: true });
    const safeMatric = (student.matric_no || 'student').replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=logbook_${safeMatric}.pdf`);
    doc.pipe(res);

    const PAGE_W = doc.page.width;
    const PAGE_H = doc.page.height;
    const M = 36;
    const CW = PAGE_W - (M * 2);

    // Official Design Palette
    const C = {
      emeraldDark: '#064e3b',
      emeraldPrimary: '#047857',
      emeraldLight: '#ecfdf5',
      emeraldBorder: '#a7f3d0',
      emeraldText: '#065f46',
      emeraldBadgeBg: '#d1fae5',
      gold: '#d97706',
      blueBadgeBg: '#dbeafe',
      blueText: '#1e40af',
      slateDark: '#0f172a',
      slateHeading: '#1e293b',
      slateText: '#334155',
      slateMuted: '#64748b',
      slateBg: '#f8fafc',
      border: '#e2e8f0',
      borderStrong: '#cbd5e1',
      white: '#ffffff',
      calloutBg: '#f0fdf4',
      calloutBorder: '#bbf7d0',
      calloutLeft: '#059669'
    };

    // Helper: Page Space Check
    const checkPageSpace = (neededHeight) => {
      if (doc.y + neededHeight > PAGE_H - 45) {
        doc.addPage();
        // Continuation mini header
        doc.rect(M, M, CW, 3).fill(C.gold);
        doc.rect(M, M + 3, CW, 20).fill(C.emeraldDark);
        doc.fillColor(C.white).fontSize(7.5).font('Helvetica-Bold')
           .text('SIWES CERTIFIED LOGBOOK • CONTINUED', M + 8, M + 9);
        doc.fillColor(C.emeraldBadgeBg).fontSize(7).font('Helvetica')
           .text(`${student.full_name} (${student.matric_no})`, M, M + 9, { align: 'right', width: CW - 8 });
        doc.y = M + 32;
      }
    };

    // 1. Executive Top Header Banner
    doc.rect(M, M, CW, 4).fill(C.gold);
    const bannerH = 58;
    doc.rect(M, M + 4, CW, bannerH).fill(C.emeraldDark);

    doc.fillColor(C.emeraldBadgeBg).fontSize(7).font('Helvetica-Bold')
       .text('FEDERAL REPUBLIC OF NIGERIA • INDUSTRIAL TRAINING FUND (ITF)', M, M + 12, { align: 'center', width: CW, characterSpacing: 1.2 });

    doc.fillColor(C.white).fontSize(13).font('Helvetica-Bold')
       .text('STUDENT INDUSTRIAL WORK EXPERIENCE SCHEME (SIWES)', M, M + 23, { align: 'center', width: CW, characterSpacing: 0.5 });

    doc.fillColor('#a7f3d0').fontSize(9).font('Helvetica')
       .text('OFFICIAL CERTIFIED DIGITAL E-LOGBOOK TRANSCRIPT', M, M + 40, { align: 'center', width: CW, characterSpacing: 1 });

    doc.rect(M, M + 4 + bannerH, CW, 2).fill(C.gold);
    doc.y = M + bannerH + 14;

    // 2. Trainee & Host Establishment Particulars Card
    const placement = (student.placements && student.placements[0]) || {};
    const cardY = doc.y;
    const cardH = 92;

    doc.roundedRect(M, cardY, CW, cardH, 4).fillAndStroke(C.slateBg, C.borderStrong);
    doc.roundedRect(M, cardY, CW, 18, 4).fill(C.emeraldPrimary);
    doc.rect(M, cardY + 12, CW, 6).fill(C.emeraldPrimary);
    doc.fillColor(C.white).fontSize(7.5).font('Helvetica-Bold')
       .text('PARTICULARS OF TRAINEE & APPROVED PLACEMENT', M + 10, cardY + 5, { width: CW - 20 });

    const colW = (CW - 24) / 2;
    const col1X = M + 10;
    const col2X = M + 14 + colW;
    const textY = cardY + 24;

    const renderField = (label, val, x, y, width) => {
      doc.fillColor(C.slateMuted).fontSize(7.5).font('Helvetica-Bold')
         .text(label.toUpperCase() + ': ', x, y, { continued: true });
      doc.fillColor(C.slateHeading).font('Helvetica')
         .text(val || 'N/A', { width: width, lineBreak: false });
    };

    renderField('Trainee Name', student.full_name, col1X, textY, colW);
    renderField('Matric / Reg No', student.matric_no, col1X, textY + 16, colW);
    renderField('Department', student.department, col1X, textY + 32, colW);
    renderField('Institution', student.institution, col1X, textY + 48, colW);

    const indSup = placement.industry_supervisor?.full_name || 'Assigned Workplace Supervisor';
    const schSup = placement.school_supervisor?.full_name || 'Assigned Academic Supervisor';
    renderField('Host Employer', placement.company_name || 'Industrial Attachment Centre', col2X, textY, colW);
    renderField('Workplace Address', placement.address || 'Industrial Placement Station', col2X, textY + 16, colW);
    renderField('Industry Supervisor', indSup, col2X, textY + 32, colW);
    renderField('Academic Supervisor', schSup, col2X, textY + 48, colW);

    doc.y = cardY + cardH + 12;

    // 3. Section Title & Counter
    doc.fillColor(C.slateHeading).fontSize(9.5).font('Helvetica-Bold')
       .text('CERTIFIED ACTIVITY LOGS & WEEKLY DUTIES', M, doc.y);
    doc.fillColor(C.slateMuted).fontSize(7.5).font('Helvetica')
       .text('Chronological record of verified industrial training entries approved for SIWES academic credit.', M, doc.y + 2);
    doc.y += 14;

    // 4. Activity Logs
    if (student.activity_logs.length === 0) {
      const emptyH = 68;
      doc.roundedRect(M, doc.y, CW, emptyH, 4).fillAndStroke(C.slateBg, C.border);
      doc.fillColor(C.emeraldDark).fontSize(9).font('Helvetica-Bold')
         .text('NO CERTIFIED ENTRIES RECORDED YET', M + 14, doc.y + 16, { width: CW - 28, align: 'center' });
      doc.fillColor(C.slateMuted).fontSize(8).font('Helvetica')
         .text('Only daily activities that have been formally signed and endorsed by your Workplace Supervisor will be included in this official certified transcript. Please liaise with your supervisor to review your pending logs.', M + 14, doc.y + 32, { width: CW - 28, align: 'center' });
      doc.y += emptyH + 16;
    } else {
      const innerW = CW - 20;

      student.activity_logs.forEach((log, index) => {
        doc.fontSize(8.5).font('Helvetica');
        const descH = doc.heightOfString(log.description || 'No description provided.', { width: innerW });

        doc.fontSize(8).font('Helvetica');
        const skillsText = log.skills_acquired || 'N/A';
        const skillsH = doc.heightOfString(skillsText, { width: innerW });

        let commentH = 0;
        if (log.supervisor_comment) {
          doc.fontSize(8).font('Helvetica-Oblique');
          commentH = doc.heightOfString(`"${log.supervisor_comment}"`, { width: innerW - 16 });
        }

        let entryCardH = 24 + 14 + 12 + descH + 12 + skillsH;
        if (log.supervisor_comment) {
          entryCardH += 12 + commentH + 14;
        }
        entryCardH += 8;

        checkPageSpace(entryCardH + 8);

        const startY = doc.y;

        // Card Container
        doc.roundedRect(M, startY, CW, entryCardH, 4).fillAndStroke(C.white, C.border);

        // Card Header Bar
        doc.roundedRect(M, startY, CW, 22, 4).fill(C.slateBg);
        doc.rect(M, startY + 16, CW, 6).fill(C.slateBg);
        doc.moveTo(M, startY + 22).lineTo(M + CW, startY + 22).strokeColor(C.border).lineWidth(1).stroke();

        // Entry Pill Badge
        const pillW = 54;
        const pillH = 14;
        doc.roundedRect(M + 8, startY + 4, pillW, pillH, 3).fill(C.emeraldDark);
        doc.fillColor(C.white).fontSize(7).font('Helvetica-Bold')
           .text(`ENTRY #${index + 1}`, M + 8, startY + 7.5, { width: pillW, align: 'center' });

        // Date
        const dateStr = new Date(log.log_date).toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        doc.fillColor(C.slateHeading).fontSize(8.5).font('Helvetica-Bold')
           .text(dateStr, M + pillW + 16, startY + 6.5);

        // Status Badges
        const acadW = 86;
        const acadX = M + CW - acadW - 8;
        doc.roundedRect(acadX, startY + 4, acadW, pillH, 3).fill(C.blueBadgeBg);
        doc.fillColor(C.blueText).fontSize(6.5).font('Helvetica-Bold')
           .text(`ACADEMIC: ${(log.status || 'APPROVED').toUpperCase()}`, acadX, startY + 7.5, { width: acadW, align: 'center' });

        const workW = 104;
        const workX = acadX - workW - 6;
        doc.roundedRect(workX, startY + 4, workW, pillH, 3).fill(C.emeraldBadgeBg);
        doc.fillColor(C.emeraldText).fontSize(6.5).font('Helvetica-Bold')
           .text('✓ WORKPLACE ENDORSED', workX, startY + 7.5, { width: workW, align: 'center' });

        // Content
        let curY = startY + 28;

        doc.fillColor(C.slateMuted).fontSize(7).font('Helvetica-Bold')
           .text('TASKS & OPERATIONAL ACTIVITIES', M + 10, curY, { width: innerW, characterSpacing: 0.5 });
        curY += 9;
        doc.fillColor(C.slateHeading).fontSize(8.5).font('Helvetica')
           .text(log.description || 'No description provided.', M + 10, curY, { width: innerW, lineGap: 1.5 });
        curY += descH + 8;

        doc.fillColor(C.slateMuted).fontSize(7).font('Helvetica-Bold')
           .text('COMPETENCIES & SKILLS ACQUIRED', M + 10, curY, { width: innerW, characterSpacing: 0.5 });
        curY += 9;
        doc.fillColor(C.emeraldPrimary).fontSize(8).font('Helvetica-Bold')
           .text(`• ${skillsText}`, M + 10, curY, { width: innerW });
        curY += skillsH + 8;

        if (log.supervisor_comment) {
          const boxH = commentH + 12;
          doc.roundedRect(M + 10, curY, innerW, boxH, 3).fillAndStroke(C.calloutBg, C.calloutBorder);
          doc.rect(M + 10, curY, 3, boxH).fill(C.calloutLeft);

          doc.fillColor(C.emeraldText).fontSize(6.5).font('Helvetica-Bold')
             .text('WORKPLACE SUPERVISOR EVALUATION / REMARKS:', M + 18, curY + 3);

          doc.fillColor(C.emeraldDark).fontSize(8).font('Helvetica-Oblique')
             .text(`"${log.supervisor_comment}"`, M + 18, curY + 11, { width: innerW - 16 });

          curY += boxH + 6;
        }

        doc.y = startY + entryCardH + 10;
      });
    }

    // 5. Dual-Tier Institutional Sign-off Block
    const signH = 95;
    checkPageSpace(signH + 10);

    const signBlockY = doc.y;
    doc.roundedRect(M, signBlockY, CW, signH, 4).fillAndStroke(C.slateBg, C.borderStrong);
    doc.roundedRect(M, signBlockY, CW, 18, 4).fill(C.slateDark);
    doc.rect(M, signBlockY + 12, CW, 6).fill(C.slateDark);
    doc.fillColor(C.white).fontSize(7.5).font('Helvetica-Bold')
       .text('INSTITUTIONAL & INDUSTRY DUAL-TIER CERTIFICATION SIGN-OFF', M + 10, signBlockY + 5, { width: CW - 20 });

    const halfW = (CW - 24) / 2;
    const sigCol1X = M + 10;
    const sigCol2X = M + 14 + halfW;
    const sigY = signBlockY + 24;

    doc.fillColor(C.slateHeading).fontSize(7.5).font('Helvetica-Bold')
       .text('INDUSTRY WORKPLACE SUPERVISOR', sigCol1X, sigY);
    doc.fillColor(C.slateMuted).fontSize(7).font('Helvetica')
       .text('I hereby certify that the trainee completed the above logged duties.', sigCol1X, sigY + 10, { width: halfW });

    doc.moveTo(sigCol1X, sigY + 42).lineTo(sigCol1X + halfW - 10, sigY + 42).strokeColor(C.borderStrong).lineWidth(1).stroke();
    doc.fillColor(C.slateMuted).fontSize(6.5).font('Helvetica')
       .text('Signature & Official Stamp / Date', sigCol1X, sigY + 45);

    doc.fillColor(C.slateHeading).fontSize(7.5).font('Helvetica-Bold')
       .text('INSTITUTION ACADEMIC SUPERVISOR', sigCol2X, sigY);
    doc.fillColor(C.slateMuted).fontSize(7).font('Helvetica')
       .text('I confirm academic review and credit endorsement of this record.', sigCol2X, sigY + 10, { width: halfW });

    doc.moveTo(sigCol2X, sigY + 42).lineTo(sigCol2X + halfW - 10, sigY + 42).strokeColor(C.borderStrong).lineWidth(1).stroke();
    doc.fillColor(C.slateMuted).fontSize(6.5).font('Helvetica')
       .text('Signature & Departmental Stamp / Date', sigCol2X, sigY + 45);

    doc.fillColor(C.slateMuted).fontSize(6).font('Helvetica-Oblique')
       .text('Digital Verification Note: This document has been validated on the SIWES Activity Tracking System. Any unauthorized alteration or falsification renders it null and void under ITF Act Regulations.', M + 10, signBlockY + signH - 18, { width: CW - 20, align: 'center' });

    doc.y = signBlockY + signH + 10;

    // 6. Running Footers on All Pages
    const range = doc.bufferedPageRange();
    const footerDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.moveTo(M, PAGE_H - 28).lineTo(M + CW, PAGE_H - 28).strokeColor(C.border).lineWidth(1).stroke();

      doc.fillColor(C.slateMuted).fontSize(6.5).font('Helvetica')
         .text('SIWES Activity Tracking System • Official Student E-Logbook Record', M, PAGE_H - 22, { width: CW / 2, align: 'left' });

      doc.fillColor(C.slateMuted).fontSize(6.5).font('Helvetica')
         .text(`Generated on ${footerDate} • Page ${i + 1} of ${range.count}`, M + CW / 2, PAGE_H - 22, { width: CW / 2, align: 'right' });
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
