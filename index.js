import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

// Serve uploaded images
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Data file paths
const DATA_DIR = join(__dirname, 'data');
const USERS_FILE = join(DATA_DIR, 'users.json');
const QR_ITEMS_FILE = join(DATA_DIR, 'qr_items.json');
const SESSIONS_FILE = join(DATA_DIR, 'sessions.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions to read/write JSON files
const readJSONFile = (filePath, defaultValue = []) => {
  try {
    if (!existsSync(filePath)) {
      writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
};

const writeJSONFile = (filePath, data) => {
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
};

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = join(__dirname, 'uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

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

    const users = readJSONFile(USERS_FILE);

    // Check if user exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'Email is already registered' });
    }

    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'Username is already taken' });
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    writeJSONFile(USERS_FILE, users);

    // Create session
    const sessionId = uuidv4();
    const sessions = readJSONFile(SESSIONS_FILE, {});
    sessions[sessionId] = user.id;
    writeJSONFile(SESSIONS_FILE, sessions);

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword, sessionId });
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

    const users = readJSONFile(USERS_FILE);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Create session
    const sessionId = uuidv4();
    const sessions = readJSONFile(SESSIONS_FILE, {});
    sessions[sessionId] = user.id;
    writeJSONFile(SESSIONS_FILE, sessions);

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword, sessionId });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  try {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
      const sessions = readJSONFile(SESSIONS_FILE, {});
      delete sessions[sessionId];
      writeJSONFile(SESSIONS_FILE, sessions);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  try {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (!sessionId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const sessions = readJSONFile(SESSIONS_FILE, {});
    const userId = sessions[sessionId];

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Invalid session' });
    }

    const users = readJSONFile(USERS_FILE);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

// ==================== QR ITEMS ROUTES ====================

// Middleware to verify authentication
const requireAuth = (req, res, next) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  if (!sessionId) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const sessions = readJSONFile(SESSIONS_FILE, {});
  const userId = sessions[sessionId];

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Invalid session' });
  }

  req.userId = userId;
  next();
};

// Get all QR items (user's items + public items)
app.get('/api/qr-items', requireAuth, (req, res) => {
  try {
    const items = readJSONFile(QR_ITEMS_FILE);
    const userItems = items.filter(item => 
      item.userId === req.userId || item.isPublic
    );
    res.json({ success: true, items: userItems });
  } catch (error) {
    console.error('Get QR items error:', error);
    res.status(500).json({ success: false, error: 'Failed to get QR items' });
  }
});

// Get public QR items only
app.get('/api/qr-items/public', (req, res) => {
  try {
    const items = readJSONFile(QR_ITEMS_FILE);
    const publicItems = items.filter(item => item.isPublic);
    res.json({ success: true, items: publicItems });
  } catch (error) {
    console.error('Get public QR items error:', error);
    res.status(500).json({ success: false, error: 'Failed to get public QR items' });
  }
});

// Get public user info (username only) by userId - no auth required
app.get('/api/users/:userId/public', (req, res) => {
  try {
    const { userId } = req.params;
    const users = readJSONFile(USERS_FILE);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Only return public info (username, id)
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username 
      } 
    });
  } catch (error) {
    console.error('Get public user info error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user info' });
  }
});

// Create QR item with image upload
app.post('/api/qr-items', requireAuth, upload.single('image'), (req, res) => {
  try {
    const { title, description, isPublic } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    let imageUrl = null;
    let imageId = null;

    if (req.file) {
      imageId = req.file.filename;
      // Get server's local IP for LAN access
      const host = req.get('host').split(':')[0];
      imageUrl = `http://${host}:${PORT}/uploads/${req.file.filename}`;
    }

    const qrItem = {
      id: uuidv4(),
      userId: req.userId,
      title,
      description: description || '',
      imageId: imageId || '',
      imageUrl: imageUrl || '',
      isPublic: isPublic === 'true' || isPublic === true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const items = readJSONFile(QR_ITEMS_FILE);
    items.push(qrItem);
    writeJSONFile(QR_ITEMS_FILE, items);

    res.json({ success: true, item: qrItem });
  } catch (error) {
    console.error('Create QR item error:', error);
    res.status(500).json({ success: false, error: 'Failed to create QR item' });
  }
});

// Update QR item
app.put('/api/qr-items/:id', requireAuth, upload.single('image'), (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isPublic } = req.body;

    const items = readJSONFile(QR_ITEMS_FILE);
    const itemIndex = items.findIndex(item => item.id === id && item.userId === req.userId);

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: 'QR item not found' });
    }

    const item = items[itemIndex];

    // Update fields
    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (isPublic !== undefined) item.isPublic = isPublic === 'true' || isPublic === true;

    // Update image if new one is uploaded
    if (req.file) {
      const host = req.get('host').split(':')[0];
      item.imageId = req.file.filename;
      item.imageUrl = `http://${host}:${PORT}/uploads/${req.file.filename}`;
    }

    item.updatedAt = new Date().toISOString();
    items[itemIndex] = item;
    writeJSONFile(QR_ITEMS_FILE, items);

    res.json({ success: true, item });
  } catch (error) {
    console.error('Update QR item error:', error);
    res.status(500).json({ success: false, error: 'Failed to update QR item' });
  }
});

// Delete QR item
app.delete('/api/qr-items/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const items = readJSONFile(QR_ITEMS_FILE);
    const itemIndex = items.findIndex(item => item.id === id && item.userId === req.userId);

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: 'QR item not found' });
    }

    items.splice(itemIndex, 1);
    writeJSONFile(QR_ITEMS_FILE, items);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete QR item error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete QR item' });
  }
});

// ==================== IMAGE ROUTES ====================

// Upload image (standalone)
app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    const host = req.get('host').split(':')[0];
    const imageUrl = `http://${host}:${PORT}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      imageId: req.file.filename,
      imageUrl
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get network interfaces
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Start server - bind to 0.0.0.0 for LAN access
app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIPAddress();
  console.log('='.repeat(50));
  console.log('🚀 QR Vault Server is running!');
  console.log('='.repeat(50));
  console.log(`📍 Local:   http://localhost:${PORT}`);
  console.log(`📍 Network: http://${localIP}:${PORT}`);
  console.log('='.repeat(50));
  console.log('Share the Network URL with devices on your LAN');
  console.log('='.repeat(50));
});
