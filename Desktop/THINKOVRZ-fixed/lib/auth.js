import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const SECRET = process.env.JWT_SECRET || 'change-me'

export function hashPassword(pw) { return bcrypt.hashSync(pw, 10) }
export function verifyPassword(pw, hash) { return bcrypt.compareSync(pw, hash) }
export function signToken(payload) { return jwt.sign(payload, SECRET, { expiresIn: '30d' }) }
export function verifyToken(token) { try { return jwt.verify(token, SECRET) } catch { return null } }

export function getTokenFromRequest(request) {
  const auth = request.headers.get('authorization') || ''
  if (auth.startsWith('Bearer ')) return auth.slice(7)
  return null
}

export function getUserFromRequest(request) {
  const token = getTokenFromRequest(request)
  if (!token) return null
  return verifyToken(token)
}

export function isAdminEmail(email) {
  if (!email) return false
  // Support comma-separated ADMIN_EMAILS (new) and legacy ADMIN_EMAIL
  const raw = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '').toLowerCase()
  const list = raw.split(',').map(s => s.trim()).filter(Boolean)
  return list.includes(email.toLowerCase())
}
