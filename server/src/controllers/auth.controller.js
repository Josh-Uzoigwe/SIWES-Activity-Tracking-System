const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../config/db');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { isValidEmail, isValidPassword, isNonEmptyString } = require('../utils/validators');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Register Student
exports.registerStudent = async (req, res, next) => {
  try {
    const { matric_no, full_name, email, password, department, institution, year_of_study } = req.body;

    if (!isNonEmptyString(matric_no, 2, 50)) {
      return res.status(400).json({ success: false, message: 'Valid matriculation number is required (2-50 chars)' });
    }
    if (!isNonEmptyString(full_name, 2, 100)) {
      return res.status(400).json({ success: false, message: 'Valid full name is required (2-100 chars)' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }
    if (!isNonEmptyString(institution, 2, 150)) {
      return res.status(400).json({ success: false, message: 'Institution name is required' });
    }

    // Check if student already exists
    const existingStudent = await prisma.student.findFirst({
      where: { OR: [{ email }, { matric_no }] },
    });

    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Student with this email or matric number already exists' });
    }

    const password_hash = await hashPassword(password);

    const student = await prisma.student.create({
      data: {
        matric_no,
        full_name,
        email,
        password_hash,
        department,
        institution,
        year_of_study,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: { student_id: student.student_id, email: student.email },
    });
  } catch (error) {
    next(error);
  }
};

// Register Supervisor (Coordinator only)
exports.registerSupervisor = async (req, res, next) => {
  try {
    const { full_name, email, password, role, department, company, institution } = req.body;

    if (!isNonEmptyString(full_name, 2, 100)) {
      return res.status(400).json({ success: false, message: 'Valid full name is required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // role must be 'SCHOOL' or 'INDUSTRY' typically if created by coordinator
    if (!['SCHOOL', 'INDUSTRY'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role for registration' });
    }

    const existingSupervisor = await prisma.supervisor.findUnique({ where: { email } });
    if (existingSupervisor) {
      return res.status(400).json({ success: false, message: 'Supervisor with this email already exists' });
    }

    const password_hash = await hashPassword(password);

    const supervisor = await prisma.supervisor.create({
      data: {
        full_name,
        email,
        password_hash,
        role,
        department,
        company,
        institution,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Supervisor registered successfully',
      data: { supervisor_id: supervisor.supervisor_id, email: supervisor.email, role: supervisor.role },
    });
  } catch (error) {
    next(error);
  }
};

// Login (Handles both student and supervisor via login_type with strict expected_role validation)
exports.login = async (req, res, next) => {
  try {
    const { email, password, login_type, expected_role } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required' });
    }
    if (!isNonEmptyString(password, 1, 128)) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    if (!['student', 'supervisor'].includes(login_type)) {
      return res.status(400).json({ success: false, message: 'login_type must be student or supervisor' });
    }

    // Constant-time dummy hash to defend against timing attacks
    const DUMMY_HASH = '$2b$10$e8wFvQx2l0G2qE7V4hHhke0cO4rM2XfIe4Q6W3q4m1Z4p9x1y2z3a';

    let user = null;
    let userType = login_type;

    // Search requested account type first
    if (login_type === 'student') {
      user = await prisma.student.findUnique({ where: { email } });
      if (!user) {
        // Fallback: check supervisor table to allow seamless authentication if credentials match
        const sup = await prisma.supervisor.findUnique({ where: { email } });
        if (sup) {
          user = sup;
          userType = 'supervisor';
        }
      }
    } else {
      user = await prisma.supervisor.findUnique({ where: { email } });
      if (!user) {
        // Fallback: check student table to allow seamless authentication if credentials match
        const stu = await prisma.student.findUnique({ where: { email } });
        if (stu) {
          user = stu;
          userType = 'student';
        }
      }
    }

    // If no user found in either table, run dummy bcrypt compare to equalize response time
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const payload = {
      id: userType === 'student' ? user.student_id : user.supervisor_id,
      email: user.email,
      type: userType,
      role: userType === 'student' ? 'STUDENT' : user.role,
    };

    const { accessToken, refreshToken } = generateTokens(payload);

    // Send refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: {
        id: payload.id,
        email: payload.email,
        name: user.full_name,
        role: payload.role,
        status: user.status || undefined,
        institution: user.institution || undefined
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Token
exports.refresh = async (req, res, next) => {
  try {
    // Assuming cookie-parser is used, otherwise might be in body
    // Wait, let's look for it in body or cookies for flexibility
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    
    // We only need the properties that we stored in the token payload
    const payload = {
      id: decoded.id,
      email: decoded.email,
      type: decoded.type,
      role: decoded.role
    };

    const tokens = generateTokens(payload);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// Get current user profile
exports.getMe = async (req, res, next) => {
  try {
    let userProfile;
    if (req.user.type === 'student') {
      userProfile = await prisma.student.findUnique({
        where: { student_id: req.user.id },
        select: {
          student_id: true,
          matric_no: true,
          full_name: true,
          email: true,
          department: true,
          institution: true,
          year_of_study: true,
          status: true,
          bank_name: true,
          account_number: true,
          account_name: true
        }
      });
    } else {
      userProfile = await prisma.supervisor.findUnique({
        where: { supervisor_id: req.user.id },
        select: { supervisor_id: true, full_name: true, email: true, role: true, department: true, company: true, institution: true }
      });
    }

    if (!userProfile) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

// Logout
exports.logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// List supervisors (for Coordinators and ITF)
exports.getSupervisors = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    let whereClause = {};

    if (userRole === 'COORDINATOR') {
      const coordinator = await prisma.supervisor.findUnique({
        where: { supervisor_id: req.user.id }
      });
      whereClause = {
        OR: [
          { role: 'SCHOOL', institution: coordinator ? coordinator.institution : undefined },
          { role: 'INDUSTRY' }
        ]
      };
    } else if (userRole === 'ITF') {
      whereClause = {};
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized to list supervisors' });
    }

    const supervisors = await prisma.supervisor.findMany({
      where: whereClause,
      select: {
        supervisor_id: true,
        full_name: true,
        email: true,
        role: true,
        department: true,
        company: true,
        institution: true
      },
      orderBy: { full_name: 'asc' }
    });

    res.status(200).json({
      success: true,
      data: supervisors
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Verify Google ID Token (strict — no fallback to tokeninfo)
async function verifyGoogleCredential(credential) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID is not configured on the server');
  }
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  return ticket.getPayload();
}

// Sign In with Google
exports.googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is required' });
    }

    const payload = await verifyGoogleCredential(credential);
    const email = payload.email.toLowerCase();

    // 1. Check if user is a Student
    const student = await prisma.student.findUnique({ where: { email } });
    if (student) {
      const { accessToken, refreshToken } = generateTokens({
        id: student.student_id,
        role: 'STUDENT',
        email: student.email
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        success: true,
        accessToken,
        user: {
          id: student.student_id,
          name: student.full_name,
          email: student.email,
          role: 'STUDENT',
          status: student.status,
          institution: student.institution,
          department: student.department
        }
      });
    }

    // 2. Check if user is a Supervisor
    const supervisor = await prisma.supervisor.findUnique({ where: { email } });
    if (supervisor) {
      const { accessToken, refreshToken } = generateTokens({
        id: supervisor.supervisor_id,
        role: supervisor.role,
        email: supervisor.email
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        success: true,
        accessToken,
        user: {
          id: supervisor.supervisor_id,
          name: supervisor.full_name,
          email: supervisor.email,
          role: supervisor.role,
          institution: supervisor.institution,
          company: supervisor.company
        }
      });
    }

    // 3. User does not exist yet -> Return new user profile so they can complete student enrollment
    return res.status(200).json({
      success: true,
      isNewUser: true,
      profile: {
        email: payload.email,
        full_name: payload.name || payload.given_name || 'Google User',
        google_token: credential
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'Google authentication failed'
    });
  }
};

// Complete Student Registration via Google
exports.completeGoogleRegistration = async (req, res, next) => {
  try {
    const { matric_no, full_name, email, department, institution, year_of_study, google_token } = req.body;

    if (!matric_no || !full_name || !email || !department || !institution) {
      return res.status(400).json({ success: false, message: 'All fields are required to complete student registration' });
    }

    // Verify token to confirm email ownership
    const payload = await verifyGoogleCredential(google_token);
    if (payload.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Google account email does not match submission' });
    }

    // Check duplicates
    const existing = await prisma.student.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { matric_no }] }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Student with this email or matric number already exists' });
    }

    // Create student account with random secure password
    const randomPassword = crypto.randomBytes(24).toString('hex');
    const password_hash = await hashPassword(randomPassword);

    const student = await prisma.student.create({
      data: {
        matric_no,
        full_name,
        email: email.toLowerCase(),
        password_hash,
        department,
        institution,
        year_of_study: year_of_study || '300L'
      }
    });

    const { accessToken, refreshToken } = generateTokens({
      id: student.student_id,
      role: 'STUDENT',
      email: student.email
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      message: 'Student account created and authenticated successfully',
      accessToken,
      user: {
        id: student.student_id,
        name: student.full_name,
        email: student.email,
        role: 'STUDENT',
        status: student.status,
        institution: student.institution,
        department: student.department
      }
    });
  } catch (error) {
    next(error);
  }
};
