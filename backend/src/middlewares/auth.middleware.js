const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database with role
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { role: true }
      });

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Not authorized, user not found'
        });
      }

      if (user.deletedAt) {
        return res.status(401).json({
          status: 'error',
          message: 'User account has been deactivated'
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized, no token provided'
    });
  }
};

module.exports = { protect };
