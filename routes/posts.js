const express = require('express');
const router = express.Router();
const PostController = require('../controllers/posts');
const { verifyToken } = require('../middleware/auth');

/**
 * @route   GET /api/posts
 * @desc    Récupère tous les posts publics (fil d'actualité)
 * @access  Public
 */
router.get('/', (req, res) => {
  return PostController.getPosts(req, res);
});

/**
 * @route   POST /api/posts
 * @desc    Crée un nouveau post
 * @access  Private
 */
router.post('/', verifyToken, (req, res) => {
  return PostController.createPost(req, res);
});

/**
 * @route   GET /api/posts/search
 * @desc    Recherche des posts par mots-clés
 * @access  Public
 */
router.get('/search', (req, res) => {
  return PostController.searchPosts(req, res);
});

/**
 * @route   GET /api/posts/user/me
 * @desc    Récupère tous les posts de l'utilisateur connecté
 * @access  Private
 */
router.get('/user/me', verifyToken, (req, res) => {
  return PostController.getUserPosts(req, res);
});

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Récupère tous les posts d'un utilisateur spécifique
 * @access  Public
 */
router.get('/user/:userId', (req, res) => {
  return PostController.getUserPosts(req, res);
});

/**
 * @route   GET /api/posts/:id
 * @desc    Récupère un post spécifique par son ID
 * @access  Public
 */
router.get('/:id', (req, res) => {
  return PostController.getPostById(req, res);
});

/**
 * @route   PUT /api/posts/:id
 * @desc    Met à jour un post existant
 * @access  Private (propriétaire du post uniquement)
 */
router.put('/:id', verifyToken, (req, res) => {
  return PostController.updatePost(req, res);
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Supprime un post
 * @access  Private (propriétaire du post uniquement)
 */
router.delete('/:id', verifyToken, (req, res) => {
  return PostController.deletePost(req, res);
});

/**
 * @route   PUT /api/posts/:id/audio
 * @desc    Met à jour l'URL audio d'un post
 * @access  Private (middleware d'auth)
 */
router.put('/:id/audio', verifyToken, (req, res) => {
  return PostController.updatePostAudio(req, res);
});

module.exports = router; 