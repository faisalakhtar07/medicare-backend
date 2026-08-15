import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' })
    }
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    if (!user) return res.status(401).json({ message: 'User not found' })
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, invalid token' })
  }
}

export function adminOnly(req, res, next) {
  if (!req.user?.isAdmin && req.user?.role !== 'owner') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

// Restricts a route to specific roles, e.g. requireRole('owner') or requireRole('owner', 'delivery').
// This is the API-level authorization check — the frontend route guard alone is not enough.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this resource' })
    }
    if (req.user.active === false) {
      return res.status(403).json({ message: 'This account has been deactivated' })
    }
    next()
  }
}

export function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}
