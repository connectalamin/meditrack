import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/database.js';
import { generateTokens, generateDeviceToken, verifyRefreshToken } from '../utils/jwt.js';
import { getDeviceName } from '../utils/device.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.BCRYPT_ROUNDS || '10')
    );

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName: displayName || email.split('@')[0]
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Create device token
    const deviceToken = generateDeviceToken();
    const deviceName = getDeviceName(req.headers['user-agent']);

    await prisma.device.create({
      data: {
        userId: user.id,
        deviceToken,
        deviceName
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      },
      accessToken,
      refreshToken,
      deviceToken
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Create device
    const deviceToken = generateDeviceToken();
    const deviceName = getDeviceName(req.headers['user-agent']);

    await prisma.device.create({
      data: {
        userId: user.id,
        deviceToken,
        deviceName
      }
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      },
      accessToken,
      refreshToken,
      deviceToken
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        displayName: req.user.displayName
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDevices = async (req, res, next) => {
  try {
    const devices = await prisma.device.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        deviceName: true,
        lastActive: true,
        createdAt: true
      },
      orderBy: { lastActive: 'desc' }
    });

    res.json({ devices });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const deviceToken = req.headers['x-device-token'];
    
    if (deviceToken) {
      await prisma.device.deleteMany({
        where: {
          deviceToken,
          userId: req.user.id
        }
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// Danger: clears all data for the current user (for demo/testing).
// Keeps the user record but deletes appointments, medications, family,
// reports and devices. Health data and plans are removed via cascades.
export const clearUserData = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await prisma.$transaction([
      prisma.device.deleteMany({ where: { userId } }),
      prisma.appointment.deleteMany({ where: { userId } }),
      prisma.familyMember.deleteMany({ where: { userId } }),
      prisma.medication.deleteMany({ where: { userId } }),
      prisma.report.deleteMany({ where: { userId } }),
    ]);

    res.json({ message: 'User data cleared successfully' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Google ID token is required' });
    }

    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google OAuth is not configured on the server' });
    }

    // Verify Google ID token
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    let ticket;
    
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google' });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Create new user with Google OAuth
      user = await prisma.user.create({
        data: {
          email,
          displayName: name || email.split('@')[0],
          password: null, // No password for OAuth users
          googleId: googleId
        }
      });
    } else {
      // Update existing user with Google ID if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleId }
        });
      }
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Create device
    const deviceToken = generateDeviceToken();
    const deviceName = getDeviceName(req.headers['user-agent']);

    await prisma.device.create({
      data: {
        userId: user.id,
        deviceToken,
        deviceName
      }
    });

    res.json({
      message: 'Google login successful',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      },
      accessToken,
      refreshToken,
      deviceToken
    });
  } catch (error) {
    console.error('Google login error:', error);
    next(error);
  }
};

