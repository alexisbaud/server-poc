const rateLimit = require('express-rate-limit');

/**
 * Configuration du limiteur de requêtes pour les routes d'authentification
 * Limite le nombre de tentatives d'authentification pour prévenir les attaques par force brute
 */
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite chaque IP à 5 requêtes par fenêtre
  standardHeaders: true, // Retourne les infos de rate limit dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Veuillez réessayer après 15 minutes.',
    error: 'too_many_requests'
  },
  skipSuccessfulRequests: true, // Ne compte pas les requêtes réussies
});

/**
 * Configuration du limiteur de requêtes global
 * Plus permissif que le limiteur d'authentification
 */
exports.globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de requêtes. Veuillez réessayer plus tard.',
    error: 'too_many_requests'
  },
}); 