const Post = require('../models/Post');

/**
 * Contrôleur pour les posts.
 * Gère les requêtes liées aux posts.
 */
const PostController = {
  /**
   * Récupère tous les posts publics pour le fil d'actualité
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  getPosts: (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      // Vérifier que les paramètres sont valides
      if (page < 1 || limit < 1 || limit > 50) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters',
          error: 'invalid_parameters'
        });
      }
      
      const posts = Post.getAllPublic(page, limit);
      
      // Formater les hashtags (stockés sous forme de JSON dans la base)
      const formattedPosts = posts.map(post => ({
        ...post,
        hashtags: post.hashtags ? JSON.parse(post.hashtags) : []
      }));
      
      return res.status(200).json({
        success: true,
        data: {
          posts: formattedPosts,
          page,
          limit,
          hasMore: formattedPosts.length === limit
        }
      });
    } catch (error) {
      console.error('Error in getPosts controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch posts',
        error: 'server_error'
      });
    }
  },
  
  /**
   * Récupère un post spécifique par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  getPostById: (req, res) => {
    try {
      const postId = req.params.id;
      
      if (!postId) {
        return res.status(400).json({
          success: false,
          message: 'Post ID is required',
          error: 'missing_id'
        });
      }
      
      const post = Post.getById(postId);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
          error: 'not_found'
        });
      }
      
      // Formater les hashtags
      post.hashtags = post.hashtags ? JSON.parse(post.hashtags) : [];
      
      return res.status(200).json({
        success: true,
        data: post
      });
    } catch (error) {
      console.error('Error in getPostById controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch post',
        error: 'server_error'
      });
    }
  },
  
  /**
   * Récupère tous les posts d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  getUserPosts: (req, res) => {
    try {
      const userId = req.params.userId || req.user.id; // Le middleware d'auth ajoute req.user
      
      const posts = Post.getByUser(userId);
      
      // Formater les hashtags
      const formattedPosts = posts.map(post => ({
        ...post,
        hashtags: post.hashtags ? JSON.parse(post.hashtags) : []
      }));
      
      return res.status(200).json({
        success: true,
        data: formattedPosts
      });
    } catch (error) {
      console.error('Error in getUserPosts controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user posts',
        error: 'server_error'
      });
    }
  },
  
  /**
   * Crée un nouveau post
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  createPost: (req, res) => {
    try {
      const { type, title, content, hashtags, visibility, ttsInstructions } = req.body;
      const authorId = req.user.id; // Le middleware d'auth ajoute req.user
      
      // Validation basique
      if (!content || content.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Content is required',
          error: 'missing_content'
        });
      }
      
      // Déterminer automatiquement le type de post si non spécifié
      let postType = type;
      if (!postType) {
        const wordCount = content.split(/\s+/).length;
        postType = wordCount >= 60 ? 'Post B' : 'Post A';
      }
      
      // Créer le post
      const postData = {
        authorId,
        type: postType,
        title,
        content,
        hashtags,
        visibility: visibility || 'public',
        ttsInstructions
      };
      
      const newPost = Post.create(postData);
      
      return res.status(201).json({
        success: true,
        data: newPost
      });
    } catch (error) {
      console.error('Error in createPost controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create post',
        error: 'server_error'
      });
    }
  },
  
  /**
   * Met à jour un post existant
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  updatePost: (req, res) => {
    try {
      const postId = req.params.id;
      const { title, content, hashtags, visibility, ttsInstructions } = req.body;
      const userId = req.user.id; // Le middleware d'auth ajoute req.user
      
      // Vérifier que le post existe
      const post = Post.getById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
          error: 'not_found'
        });
      }
      
      // Vérifier que l'utilisateur est l'auteur du post
      if (post.authorId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this post',
          error: 'unauthorized'
        });
      }
      
      // Validation basique
      if (content !== undefined && content.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Content cannot be empty',
          error: 'invalid_content'
        });
      }
      
      // Mettre à jour le post
      const success = Post.update(postId, {
        title,
        content,
        hashtags,
        visibility,
        ttsInstructions
      });
      
      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update post',
          error: 'update_failed'
        });
      }
      
      // Récupérer le post mis à jour
      const updatedPost = Post.getById(postId);
      updatedPost.hashtags = updatedPost.hashtags ? JSON.parse(updatedPost.hashtags) : [];
      
      return res.status(200).json({
        success: true,
        data: updatedPost,
        message: 'Post updated successfully'
      });
    } catch (error) {
      console.error('Error in updatePost controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update post',
        error: 'server_error'
      });
    }
  },
  
  /**
   * Supprime un post
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  deletePost: (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user.id; // Le middleware d'auth ajoute req.user
      
      // Vérifier que le post existe
      const post = Post.getById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
          error: 'not_found'
        });
      }
      
      // Vérifier que l'utilisateur est l'auteur du post
      if (post.authorId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this post',
          error: 'unauthorized'
        });
      }
      
      // Supprimer le post
      const success = Post.delete(postId);
      
      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete post',
          error: 'delete_failed'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      console.error('Error in deletePost controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete post',
        error: 'server_error'
      });
    }
  },
  
  /**
   * Recherche des posts par mots-clés
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  searchPosts: (req, res) => {
    try {
      const query = req.query.q;
      
      if (!query || query.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
          error: 'missing_query'
        });
      }
      
      const limit = parseInt(req.query.limit) || 20;
      const posts = Post.search(query, limit);
      
      // Formater les hashtags
      const formattedPosts = posts.map(post => ({
        ...post,
        hashtags: post.hashtags ? JSON.parse(post.hashtags) : []
      }));
      
      return res.status(200).json({
        success: true,
        data: formattedPosts
      });
    } catch (error) {
      console.error('Error in searchPosts controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to search posts',
        error: 'server_error'
      });
    }
  }
};

// Vérification de débogage pour s'assurer que toutes les méthodes sont bien définies
console.log('PostController methods:', {
  getPosts: typeof PostController.getPosts,
  getPostById: typeof PostController.getPostById,
  getUserPosts: typeof PostController.getUserPosts,
  createPost: typeof PostController.createPost,
  updatePost: typeof PostController.updatePost,
  deletePost: typeof PostController.deletePost,
  searchPosts: typeof PostController.searchPosts
});

module.exports = PostController; 