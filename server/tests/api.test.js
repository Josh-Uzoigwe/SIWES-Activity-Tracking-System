const request = require('supertest');
const app = require('../src/server');
const prisma = require('../src/config/db');

// Mock Prisma
jest.mock('../src/config/db', () => ({
  student: {
    findUnique: jest.fn(),
  },
  supervisor: {
    findUnique: jest.fn(),
  },
  activityLog: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  placement: {
    findFirst: jest.fn(),
  }
}));

const bcrypt = require('bcrypt');

describe('API Security and Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth Flows', () => {
    it('should reject login with missing login_type', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'student@test.com', password: 'password123' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('login_type must be student or supervisor');
    });

    it('should login student successfully with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      prisma.student.findUnique.mockResolvedValue({
        student_id: 1,
        email: 'student@test.com',
        password_hash: hashedPassword,
        full_name: 'Alice Johnson',
        status: 'cleared'
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'student@test.com', password: 'password123', login_type: 'student' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.role).toBe('STUDENT');
    });
  });

  describe('RBAC Boundary Tests', () => {
    let studentToken;
    let schoolToken;

    beforeAll(() => {
      const { generateTokens } = require('../src/utils/jwt');
      studentToken = generateTokens({ id: 1, email: 'student@test.com', type: 'student', role: 'STUDENT' }).accessToken;
      schoolToken = generateTokens({ id: 2, email: 'school@test.com', type: 'supervisor', role: 'SCHOOL' }).accessToken;
    });

    it('should deny student access to supervisor route (Approve Log)', async () => {
      const res = await request(app)
        .put('/api/v1/logs/1/review')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'approved' });
      
      expect(res.statusCode).toBe(403); // Forbidden
      expect(res.body.message).toContain('Access denied');
    });

    it('should deny school supervisor access to ITF route (Verify Stipend)', async () => {
      const res = await request(app)
        .put('/api/v1/reports/final/1/verify')
        .set('Authorization', `Bearer ${schoolToken}`);
      
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Timestamp Immutability', () => {
    let studentToken;

    beforeAll(() => {
      const { generateTokens } = require('../src/utils/jwt');
      studentToken = generateTokens({ id: 1, email: 'student@test.com', type: 'student', role: 'STUDENT' }).accessToken;
    });

    it('should not allow student to set submitted_at during log creation', async () => {
      // Mock placement to pass notification check
      prisma.placement.findFirst.mockResolvedValue(null);
      
      prisma.activityLog.create.mockImplementation(({ data }) => {
        // Assert that submitted_at is not in the injected data payload
        expect(data).not.toHaveProperty('submitted_at');
        return Promise.resolve({
          activity_id: 1,
          student_id: 1,
          log_date: new Date(),
          description: 'Test log',
          submitted_at: new Date()
        });
      });

      const res = await request(app)
        .post('/api/v1/logs')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          log_date: new Date().toISOString(),
          description: 'Trying to forge submitted_at',
          submitted_at: '2020-01-01T00:00:00.000Z' // Malicious timestamp injection attempt
        });

      expect(res.statusCode).toBe(201);
      // The mock asserts that the controller stripped/ignored submitted_at
      expect(prisma.activityLog.create).toHaveBeenCalled();
      const callArgs = prisma.activityLog.create.mock.calls[0][0];
      expect(callArgs.data.submitted_at).toBeUndefined(); // Server MUST let DB handle it
    });
  });
});
