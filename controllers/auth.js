const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Clé secrète pour JWT (à déplacer dans les variables d'environnement en production)
const JWT_SECRET = 'your-secret-key-here';

/**
 * Validates an email address format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password requirements
 * @param {string} password - Password to validate
 * @returns {boolean} - True if password meets requirements
 */
const isValidPassword = (password) => {
  // Au moins 8 caractères, 1 lettre, 1 chiffre
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.register = async (req, res) => {
  try {
    const { pseudo, email, password } = req.body;
    
    // Validation des champs obligatoires
    if (!pseudo || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required: pseudo, email, password' 
      });
    }
    
    // Validation du pseudo
    if (pseudo.trim().length < 3) {
      return res.status(400).json({ 
        success: false,
        field: 'pseudo',
        message: 'Username must be at least 3 characters long' 
      });
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        success: false,
        field: 'email',
        message: 'Invalid email format' 
      });
    }
    
    // Validate password length
    if (!isValidPassword(password)) {
      return res.status(400).json({ 
        success: false,
        field: 'password',
        message: 'Password must be at least 8 characters long and contain at least one letter and one digit' 
      });
    }
    
    // Check if user already exists with this email
    const existingUser = User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        field: 'email',
        message: 'User already exists with this email' 
      });
    }
    
    // Check if pseudo is already taken
    const existingPseudo = User.findByPseudo(pseudo);
    if (existingPseudo) {
      return res.status(400).json({
        success: false,
        field: 'pseudo',
        message: 'This username is already taken'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const newUser = User.create({
      pseudo,
      email,
      passwordHash: hashedPassword,
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user data without passwordHash
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        pseudo: newUser.pseudo,
        email: newUser.email,
        createdAt: newUser.createdAt,
        postAmount: newUser.postAmount
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation des champs obligatoires
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        success: false,
        field: 'email',
        message: 'Invalid email format' 
      });
    }
    
    // Find user
    const user = User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user data without passwordHash
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email,
        createdAt: user.createdAt,
        postAmount: user.postAmount
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserProfile = (req, res) => {
  try {
    const user = User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Return user data without passwordHash
    res.json({
      success: true,
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email,
        createdAt: user.createdAt,
        postAmount: user.postAmount
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Check if an email is already registered
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email format first
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }
    
    // Check if user already exists with this email
    const existingUser = User.findByEmail(email);
    
    // Return true if user exists, false otherwise
    return res.json({
      success: true,
      exists: !!existingUser
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while checking email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Check if a pseudo is already registered
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.checkPseudoExists = async (req, res) => {
  try {
    const { pseudo } = req.body;
    
    // Validate pseudo format first
    if (!pseudo || pseudo.trim().length < 3) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid pseudo format' 
      });
    }
    
    // Check if user already exists with this pseudo
    const existingUser = User.findByPseudo(pseudo);
    
    // Return true if user exists, false otherwise
    return res.json({
      success: true,
      exists: !!existingUser
    });
  } catch (error) {
    console.error('Check pseudo error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while checking pseudo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 