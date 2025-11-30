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

    // Auto-create self family member card
    await prisma.familyMember.create({
      data: {
        userId: user.id,
        name: user.displayName || email.split('@')[0],
        relation: 'Self',
        age: null,
        lastDoctorVisit: null
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
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        linkedFamilyId: true
      }
    });

    // Get linked user info if linkedFamilyId exists
    let linkedUser = null;
    if (user.linkedFamilyId) {
      const linked = await prisma.user.findUnique({
        where: { id: user.linkedFamilyId },
        select: {
          id: true,
          email: true,
          displayName: true
        }
      });
      linkedUser = linked;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        linkedFamilyId: user.linkedFamilyId,
        linkedUser: linkedUser
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
export const joinFamily = async (req, res, next) => {
  try {
    const { referralId } = req.body;
    const currentUserId = req.user.id;

    if (!referralId) {
      return res.status(400).json({ message: 'Referral ID is required' });
    }

    // Clean the referral ID (remove dashes and spaces if present, but keep case)
    const cleanReferralId = referralId.replace(/[-\s]/g, '');

    // Check if the referral ID exists (it should be a valid user ID)
    const targetUser = await prisma.user.findUnique({
      where: { id: cleanReferralId },
      select: { id: true, email: true, displayName: true }
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'Invalid referral ID. Please check and try again.' });
    }

    if (targetUser.id === currentUserId) {
      return res.status(400).json({ message: 'You cannot join your own family.' });
    }

    // Update current user to link to the target family
    await prisma.user.update({
      where: { id: currentUserId },
      data: { linkedFamilyId: targetUser.id }
    });

    res.json({
      success: true,
      message: `Successfully linked to ${targetUser.displayName || targetUser.email}'s family dashboard.`,
      linkedUser: {
        id: targetUser.id,
        displayName: targetUser.displayName,
        email: targetUser.email
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLinkedAccounts = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const linkedAccounts = [];

    // Get the account the current user linked to (if any)
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { linkedFamilyId: true }
    });

    if (currentUser?.linkedFamilyId) {
      const linkedTo = await prisma.user.findUnique({
        where: { id: currentUser.linkedFamilyId },
        select: {
          id: true,
          email: true,
          displayName: true
        }
      });
      if (linkedTo) {
        linkedAccounts.push({
          id: linkedTo.id,
          email: linkedTo.email,
          displayName: linkedTo.displayName,
          type: 'linked_to' // Account I linked to
        });
      }
    }

    // Get accounts that linked to the current user
    const linkedToMe = await prisma.user.findMany({
      where: { linkedFamilyId: currentUserId },
      select: {
        id: true,
        email: true,
        displayName: true
      }
    });

    linkedToMe.forEach(user => {
      linkedAccounts.push({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        type: 'linked_from' // Account that linked to me
      });
    });

    res.json({ linkedAccounts });
  } catch (error) {
    next(error);
  }
};

export const removeLinkedAccount = async (req, res, next) => {
  try {
    const { accountId } = req.body;
    const currentUserId = req.user.id;

    if (!accountId) {
      return res.status(400).json({ message: 'Account ID is required' });
    }

    // Get current user's linked family ID
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { linkedFamilyId: true }
    });

    // Check if this is an account the user linked to (can remove)
    if (currentUser?.linkedFamilyId === accountId) {
      // Remove the link by setting linkedFamilyId to null
      await prisma.user.update({
        where: { id: currentUserId },
        data: { linkedFamilyId: null }
      });

      return res.json({
        success: true,
        message: 'Successfully removed linked account'
      });
    }

    // Check if this is an account that linked to the current user
    const linkedToMe = await prisma.user.findUnique({
      where: { id: accountId },
      select: { linkedFamilyId: true }
    });

    if (linkedToMe?.linkedFamilyId === currentUserId) {
      // Remove the link from the other user's side
      // This allows the account owner to revoke access from accounts that linked to them
      await prisma.user.update({
        where: { id: accountId },
        data: { linkedFamilyId: null }
      });

      return res.json({
        success: true,
        message: 'Successfully removed linked account'
      });
    }

    return res.status(404).json({ message: 'Linked account not found' });
  } catch (error) {
    next(error);
  }
};

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

// Helper function to find or create user from Google OAuth data
const findOrCreateGoogleUser = async (email, name, googleId) => {
  let user = await prisma.user.findUnique({
    where: { email }
  });

  let isNewUser = false;
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
    isNewUser = true;
  } else {
    // Update existing user with Google ID if not set
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleId }
      });
    }
  }

  return { user, isNewUser };
};

// Helper function to create self family member card for new users
const createSelfFamilyMember = async (user, email) => {
  const existingSelfCard = await prisma.familyMember.findFirst({
    where: {
      userId: user.id,
      relation: 'Self'
    }
  });

  if (!existingSelfCard) {
    await prisma.familyMember.create({
      data: {
        userId: user.id,
        name: user.displayName || email.split('@')[0],
        relation: 'Self',
        age: null,
        lastDoctorVisit: null
      }
    });
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
    const { user, isNewUser } = await findOrCreateGoogleUser(email, name, googleId);

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

    // Auto-create self family member card for new users
    if (isNewUser) {
      await createSelfFamilyMember(user, email);
    }

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

// OAuth redirect flow: Initiate Google OAuth
export const googleOAuthInit = async (req, res, next) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ message: 'Google OAuth is not configured on the server' });
    }

    // Determine the callback URL based on environment
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    const protocol = isProduction ? 'https' : 'http';
    const host = req.get('host') || (isProduction ? 'meditrack-server-alpha.vercel.app' : 'localhost:5000');
    const callbackURL = `${protocol}://${host}/api/auth/google/callback`;

    // Create OAuth2Client with redirect configuration
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      callbackURL
    );

    // Generate the authorization URL
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Force consent screen to get refresh token
    });

    // Redirect to Google
    res.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth init error:', error);
    next(error);
  }
};

// OAuth redirect flow: Handle Google OAuth callback
export const googleOAuthCallback = async (req, res, next) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error('Google OAuth error:', error);
      const clientUrl = process.env.CLIENT_URL || 'https://meditrack-jade.vercel.app';
      return res.redirect(`${clientUrl}/auth?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      const clientUrl = process.env.CLIENT_URL || 'https://meditrack-jade.vercel.app';
      return res.redirect(`${clientUrl}/auth?error=${encodeURIComponent('No authorization code provided')}`);
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      const clientUrl = process.env.CLIENT_URL || 'https://meditrack-jade.vercel.app';
      return res.redirect(`${clientUrl}/auth?error=${encodeURIComponent('OAuth not configured')}`);
    }

    // Determine the callback URL (must match the one used in googleOAuthInit)
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    const protocol = isProduction ? 'https' : 'http';
    const host = req.get('host') || (isProduction ? 'meditrack-server-alpha.vercel.app' : 'localhost:5000');
    const callbackURL = `${protocol}://${host}/api/auth/google/callback`;

    // Create OAuth2Client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      callbackURL
    );

    // Exchange authorization code for tokens
    let tokenResponse;
    try {
      tokenResponse = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokenResponse.tokens);
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      const clientUrl = process.env.CLIENT_URL || 'https://meditrack-jade.vercel.app';
      return res.redirect(`${clientUrl}/auth?error=${encodeURIComponent('Failed to exchange authorization code')}`);
    }

    // Get user info from Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokenResponse.tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      const clientUrl = process.env.CLIENT_URL || 'https://meditrack-jade.vercel.app';
      return res.redirect(`${clientUrl}/auth?error=${encodeURIComponent('Email not provided by Google')}`);
    }

    // Find or create user
    const { user, isNewUser } = await findOrCreateGoogleUser(email, name, googleId);

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

    // Auto-create self family member card for new users
    if (isNewUser) {
      await createSelfFamilyMember(user, email);
    }

    // Redirect to frontend with tokens in URL hash (more secure than query params)
    const clientUrl = process.env.CLIENT_URL || 'https://meditrack-jade.vercel.app';
    const redirectUrl = `${clientUrl}/auth/callback#accessToken=${accessToken}&refreshToken=${refreshToken}&deviceToken=${deviceToken}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const clientUrl = process.env.CLIENT_URL || 'https://meditrack-jade.vercel.app';
    res.redirect(`${clientUrl}/auth?error=${encodeURIComponent('Authentication failed')}`);
  }
};

