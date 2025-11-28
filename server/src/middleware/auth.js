import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify device token if provided
    const deviceToken = req.headers['x-device-token'];
    if (deviceToken) {
      const device = await prisma.device.findUnique({
        where: { deviceToken },
        include: { user: true }
      });

      if (!device || device.userId !== decoded.userId) {
        return res.status(401).json({ message: 'Invalid device token' });
      }

      // Update last active
      await prisma.device.update({
        where: { id: device.id },
        data: { lastActive: new Date() }
      });

      req.user = device.user;
      req.deviceId = device.id;
    } else {
      // Fallback: get user from token
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
    }

    req.deviceToken = deviceToken;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

