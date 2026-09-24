process.env.JWT_SECRET = 't';
const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const { auth, requireRole } = require('../src/middleware'), { hasSeats } = require('../src/seats');
const mockRes = () => { const r = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); return r; };

test('bcrypt hash verifies only the right password', async () => {
  const h = await bcrypt.hash('secret1', 4);
  expect(await bcrypt.compare('secret1', h)).toBe(true);
  expect(await bcrypt.compare('wrong', h)).toBe(false);
});
test('auth returns 401 when token is missing', () => {
  const res = mockRes(); auth({ headers: {} }, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(401);
});
test('auth accepts a valid token and sets req.user', () => {
  const next = jest.fn(), req = { headers: { authorization: 'Bearer ' + jwt.sign({ id: 1, role: 'student' }, 't') } };
  auth(req, mockRes(), next);
  expect(next).toHaveBeenCalled(); expect(req.user.id).toBe(1);
});
test('requireRole blocks a student from admin routes', () => {
  const res = mockRes(); requireRole('admin')({ user: { role: 'student' } }, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(403);
});
test('hasSeats is false when the event is full', () => {
  expect(hasSeats(2, 1)).toBe(true); expect(hasSeats(2, 2)).toBe(false);
});
