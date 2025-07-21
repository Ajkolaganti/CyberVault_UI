const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: '10mb' }));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'your-supabase-jwt-secret';

// In-memory user store (replace with actual database in production)
const users = new Map();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to verify Supabase token (optional)
const verifySupabaseToken = (req, res, next) => {
  const supabaseToken = req.headers['x-supabase-token'];
  
  if (supabaseToken) {
    jwt.verify(supabaseToken, SUPABASE_JWT_SECRET, (err, decoded) => {
      if (!err) {
        req.supabaseUser = decoded;
      }
    });
  }
  
  next();
};

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Auth endpoints
app.post('/api/v1/auth/register', authLimiter, verifySupabaseToken, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    if (users.has(email)) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user = {
      id: userId,
      email,
      name: name || email.split('@')[0],
      role: 'user',
      createdAt: new Date().toISOString(),
      isActive: true
    };

    users.set(email, { ...user, hashedPassword });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data and token
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/v1/auth/login', authLimiter, verifySupabaseToken, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const userData = users.get(email);
    if (!userData) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!userData.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.hashedPassword);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: userData.id, 
        email: userData.email, 
        role: userData.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    userData.lastLogin = new Date().toISOString();

    // Return user data and token
    res.json({
      message: 'Login successful',
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/v1/auth/logout', authenticateToken, (req, res) => {
  // In a real application, you might want to blacklist the token
  res.json({ message: 'Logout successful' });
});

app.get('/api/v1/auth/me', authenticateToken, (req, res) => {
  try {
    const userData = users.get(req.user.email);
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/v1/auth/reset-password', authLimiter, (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // In a real application, you would send a reset email
  console.log(`Password reset requested for: ${email}`);
  
  res.json({ message: 'Password reset email sent' });
});

// Credentials endpoints
app.post('/api/v1/credentials', authenticateToken, (req, res) => {
  try {
    const { name, type, username, password, environment } = req.body;

    // Validate input
    if (!name || !type || !username || !password || !environment) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create credential
    const credentialId = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const credential = {
      id: credentialId,
      name,
      type,
      username,
      environment,
      status: 'active',
      lastAccessed: new Date().toISOString(),
      createdBy: req.user.id,
      createdAt: new Date().toISOString()
    };

    // In production, encrypt the password before storing
    console.log(`Credential created: ${name} for user: ${req.user.email}`);

    res.status(201).json({
      message: 'Credential created successfully',
      id: credentialId,
      ...credential
    });

  } catch (error) {
    console.error('Create credential error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/v1/credentials', authenticateToken, (req, res) => {
  // Return mock credentials for development
  const mockCredentials = [
    {
      id: 'cred_1',
      name: 'Production Database',
      type: 'database',
      username: 'admin',
      environment: 'production',
      status: 'active',
      lastAccessed: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: 'cred_2',
      name: 'AWS API Key',
      type: 'api',
      username: 'aws-user',
      environment: 'production',
      status: 'active',
      lastAccessed: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    }
  ];

  res.json(mockCredentials);
});

// Default route
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'CyberVault API',
    version: '1.0.0',
    description: 'Privileged Access Management API',
    endpoints: {
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        logout: 'POST /api/v1/auth/logout',
        me: 'GET /api/v1/auth/me',
        resetPassword: 'POST /api/v1/auth/reset-password'
      },
      credentials: {
        create: 'POST /api/v1/credentials',
        list: 'GET /api/v1/credentials'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 CyberVault API server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/v1`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
