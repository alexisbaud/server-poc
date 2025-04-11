// Charger les variables d'environnement en premier
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Vérification des variables d'environnement critiques
const requiredEnvVars = ['OPENAI_API_KEY', 'ELEVENLABS_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`ERREUR: Variables d'environnement manquantes: ${missingEnvVars.join(', ')}`);
  console.error(`Assurez-vous que le fichier .env contient les variables requises.`);
  // Continuer l'exécution malgré les variables manquantes pour le débogage
}

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const audioRoutes = require('./routes/audio');
const { globalLimiter } = require('./middleware/rateLimiter');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000; // Pour rechercher une chaîne dans le code : grep -r "chaîne" .
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Middleware
// Configuration CORS améliorée
const corsOptions = {
  origin: '*', // Autoriser toutes les origines
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  credentials: true,
  maxAge: 86400 // Cache preflight pour 24 heures
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Protection globale contre les attaques par déni de service
app.use(globalLimiter);

// Serve static files from the audio directory
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api', audioRoutes);

// Ajout d'un endpoint /api pour les tests de connexion
// Note: Cette route a été déplacée après le montage des routes d'audio pour éviter les conflits
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    version: '1.0.0'
  });
});

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