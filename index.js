import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { connectDB } from './config/database.js';
import { upload, cloudinary } from './config/cloudinary.js';
import { User } from './models/User.js';
import { QRItem } from './models/QRItem.js';
import { Session } from './models/Session.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
await connectDB();

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || username.length < 3) {
      return res.status(400).json({ success: false, error: 'Username must be at least 3 characters' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ success: false, error: 'Email is already registered' });
    }

    const existingUsername = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    if (existingUsername) {
      return res.status(400).json({ success: false, error: 'Username is already taken' });
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash
    });

    await user.save();

    // Create session
    const sessionId = uuidv4();
    const session = new Session({
      _id: sessionId,
      userId: user._id.toString()
    });
    await session.save();

    // Return user without password hash
    const userResponse = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    };

    res.json({ success: true, user: userResponse, sessionId });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Create session
    const sessionId = uuidv4();
    const session = new Session({
      _id: sessionId,
      userId: user._id.toString()
    });
    await session.save();

    const userResponse = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    };

    res.json({ success: true, user: userResponse, sessionId });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
      await Session.deleteOne({ _id: sessionId });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (!sessionId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(401).json({ success: false, error: 'Invalid session' });
    }

    const user = await User.findById(session.userId);

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const userResponse = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    };

    res.json({ success: true, user: userResponse });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

// ==================== QR ITEMS ROUTES ====================

// Middleware to verify authentication
const requireAuth = async (req, res, next) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  if (!sessionId) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const session = await Session.findById(sessionId);

  if (!session) {
    return res.status(401).json({ success: false, error: 'Invalid session' });
  }

  req.userId = session.userId;
  next();
};

// Get all QR items (user's items + public items)
app.get('/api/qr-items', requireAuth, async (req, res) => {
  try {
    const items = await QRItem.find({
      $or: [
        { userId: req.userId },
        { isPublic: true }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, items });
  } catch (error) {
    console.error('Get QR items error:', error);
    res.status(500).json({ success: false, error: 'Failed to get QR items' });
  }
});

// Get public QR items only
app.get('/api/qr-items/public', async (req, res) => {
  try {
    const items = await QRItem.find({ isPublic: true }).sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (error) {
    console.error('Get public QR items error:', error);
    res.status(500).json({ success: false, error: 'Failed to get public QR items' });
  }
});

// Get public user info (username only) by userId - no auth required
app.get('/api/users/:userId/public', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Only return public info (username, id)
    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username
      }
    });
  } catch (error) {
    console.error('Get public user info error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user info' });
  }
});

// Create QR item with image upload to Cloudinary
app.post('/api/qr-items', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, isPublic } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    let imageUrl = '';
    let imageId = '';

    if (req.file) {
      imageUrl = req.file.path; // Cloudinary URL
      imageId = req.file.filename; // Cloudinary public_id
    }

    const qrItem = new QRItem({
      userId: req.userId,
      title,
      description: description || '',
      imageId,
      imageUrl,
      isPublic: isPublic === 'true' || isPublic === true
    });

    await qrItem.save();

    res.json({ success: true, item: qrItem });
  } catch (error) {
    console.error('Create QR item error:', error);
    res.status(500).json({ success: false, error: 'Failed to create QR item' });
  }
});

// Update QR item
app.put('/api/qr-items/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isPublic } = req.body;

    const item = await QRItem.findOne({ _id: id, userId: req.userId });

    if (!item) {
      return res.status(404).json({ success: false, error: 'QR item not found' });
    }

    // Update fields
    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (isPublic !== undefined) item.isPublic = isPublic === 'true' || isPublic === true;

    // Update image if new one is uploaded
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (item.imageId) {
        try {
          await cloudinary.uploader.destroy(item.imageId);
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }

      item.imageId = req.file.filename;
      item.imageUrl = req.file.path;
    }

    item.updatedAt = new Date();
    await item.save();

    res.json({ success: true, item });
  } catch (error) {
    console.error('Update QR item error:', error);
    res.status(500).json({ success: false, error: 'Failed to update QR item' });
  }
});

// Delete QR item
app.delete('/api/qr-items/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await QRItem.findOne({ _id: id, userId: req.userId });

    if (!item) {
      return res.status(404).json({ success: false, error: 'QR item not found' });
    }

    // Delete image from Cloudinary if exists
    if (item.imageId) {
      try {
        await cloudinary.uploader.destroy(item.imageId);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }

    await QRItem.deleteOne({ _id: id });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete QR item error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete QR item' });
  }
});

// ==================== IMAGE ROUTES ====================

// Upload image (standalone) to Cloudinary
app.post('/api/upload', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    res.json({
      success: true,
      imageId: req.file.filename,
      imageUrl: req.file.path
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'MongoDB',
    storage: 'Cloudinary'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 QR Vault Server is running!');
  console.log('='.repeat(50));
  console.log(`📍 Port: ${PORT}`);
  console.log(`💾 Database: MongoDB`);
  console.log(`☁️  Storage: Cloudinary`);
  console.log('='.repeat(50));
});
