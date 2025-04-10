const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT token
 * Adds the entire decoded payload to req.user and userId for backward compatibility
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateToken = (req, res, next) => {
  // Get auth header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required',
      error: 'Missing authorization header'
    });
  }
  
  // Check if token format is valid (Bearer TOKEN)
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token format',
      error: 'Authorization header must be in format: Bearer [token]'
    });
  }
  
  const token = parts[1];
  
  try {
    // Verify token and decode payload
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'] // Explicitement spécifier l'algorithme attendu
    });
    
    console.log('🔍 DEBUG AUTH - Token payload:', JSON.stringify(payload, null, 2));
    console.log('🔍 DEBUG AUTH - User ID in token:', payload.id, 'type:', typeof payload.id);
    
    // Vérifier que le payload contient les informations attendues
    if (!payload.id) {
      throw new Error('Invalid token payload');
    }
    
    // Add complete payload to request object
    req.user = payload;
    
    // Also add userId for backward compatibility
    req.userId = payload.id;
    
    // Conversion explicite de l'ID en nombre
    if (typeof req.user.id === 'string') {
      req.user.id = parseInt(req.user.id, 10);
      console.log('🔍 DEBUG AUTH - Converted string ID to number:', req.user.id, 'type:', typeof req.user.id);
    }
    
    next();
  } catch (error) {
    console.error('🔍 DEBUG AUTH - Token authentication error:', error.message);
    
    // Gestion différenciée des erreurs
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired',
        error: 'expired_token'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
        error: 'invalid_token'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'authentication_error'
    });
  }
};

// Exporter à la fois authenticateToken et verifyToken (alias)
exports.authenticateToken = authenticateToken;
exports.verifyToken = authenticateToken; // Alias pour compatibilité 