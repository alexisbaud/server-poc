require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const { globalLimiter } = require('./middleware/rateLimiter');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000; // Pour rechercher une chaîne dans le code : grep -r "chaîne" .
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Protection globale contre les attaques par déni de service
app.use(globalLimiter);

// Serve static files from the audio directory
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Microstory Server API is running');
});

// Route 404 pour les requêtes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'not_found'
  });
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'server_error'
  });
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
}); 