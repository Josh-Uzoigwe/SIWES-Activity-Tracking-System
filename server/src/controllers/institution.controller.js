const bcrypt = require('bcrypt');
const prisma = require('../config/db');

// Get all accredited institutions (public for registration dropdown)
exports.getInstitutions = async (req, res, next) => {
  try {
    const institutions = await prisma.institution.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({
      success: true,
      data: institutions
    });
  } catch (err) {
    next(err);
  }
};

// Onboard an institution + its Coordinator (ITF Officer only)
exports.onboardInstitution = async (req, res, next) => {
  try {
    const { name, code, state, coordinator_name, coordinator_email, password } = req.body;

    if (!name || !code || !coordinator_name || !coordinator_email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Institution name, code, coordinator name, email, and an initial password are all required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Coordinator password must be at least 8 characters' });
    }

    const { isValidEmail } = require('../utils/validators');
    if (!isValidEmail(coordinator_email)) {
      return res.status(400).json({ success: false, message: 'A valid coordinator email address is required' });
    }

    // Check existing institution or coordinator
    const existingInst = await prisma.institution.findFirst({
      where: { OR: [{ name }, { code }] }
    });
    if (existingInst) {
      return res.status(400).json({ success: false, message: 'Institution name or code already exists' });
    }

    const existingSupervisor = await prisma.supervisor.findUnique({
      where: { email: coordinator_email.toLowerCase() }
    });
    if (existingSupervisor) {
      return res.status(400).json({ success: false, message: 'A user with this coordinator email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create institution and coordinator in transaction
    const [newInstitution, newCoordinator] = await prisma.$transaction([
      prisma.institution.create({
        data: {
          name,
          code: code.toUpperCase(),
          state: state || 'Federal'
        }
      }),
      prisma.supervisor.create({
        data: {
          full_name: coordinator_name,
          email: coordinator_email.toLowerCase(),
          password_hash,
          role: 'COORDINATOR',
          institution: name
        }
      })
    ]);

    res.status(201).json({
      success: true,
      message: 'Institution and Coordinator onboarded successfully',
      data: {
        institution: newInstitution,
        coordinator: {
          supervisor_id: newCoordinator.supervisor_id,
          full_name: newCoordinator.full_name,
          email: newCoordinator.email,
          role: newCoordinator.role,
          institution: newCoordinator.institution
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
