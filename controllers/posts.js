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
      
      // Plus besoin de traiter les hashtags comme JSON
      // Ils sont maintenant stockés comme des chaînes simples
      
      return res.status(200).json({
        success: true,
        data: {
          posts: posts, // Désormais les posts ont directement le hashtag sous forme de chaîne
          page,
          limit,
          hasMore: posts.length === limit
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
      
      // Plus besoin de parser le hashtag comme JSON
      // Le hashtag est maintenant une simple chaîne
      
      return res.status(200).json({
        success: true,
        data: post // Le post contient déjà le hashtag sous forme de chaîne
      });
    } catch (error) {
      console.error('Error in getPostById controller:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch post',
        error: 'server_error',
        details: error.message
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
      
      // Plus besoin de parser les hashtags
      // Ils sont maintenant stockés comme des chaînes simples
      
      return res.status(200).json({
        success: true,
        data: posts // Posts avec hashtags sous forme de chaîne simple
      });
    } catch (error) {
      console.error('Error in getUserPosts controller:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user posts',
        error: 'server_error',
        details: error.message
      });
    }
  },
  
  /**
   * Crée un nouveau post
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  createPost: async (req, res) => {
    try {
      console.log('🔍 CONTROLLER - Requête de création de post reçue:', req.method, req.originalUrl);
      console.log('🔍 CONTROLLER - Corps de la requête:', JSON.stringify(req.body, null, 2));
      
      const { type, title, content, hashtags, visibility, ttsInstructions } = req.body;
      
      // Validation des données
      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Content is required',
          error: 'missing_content'
        });
      }
      
      // Déterminer le type de post s'il n'est pas spécifié
      const postType = type || 'Post A';
      
      // Traitement simple du hashtag
      let singleHashtag = null;
      
      // Extrait un seul hashtag, peu importe le format reçu
      if (hashtags) {
        if (Array.isArray(hashtags) && hashtags.length > 0) {
          // Prendre le premier du tableau
          singleHashtag = hashtags[0].toString();
        } else if (typeof hashtags === 'string') {
          // Utiliser la chaîne directement
          try {
            // Vérifier si c'est du JSON
            const parsed = JSON.parse(hashtags);
            if (Array.isArray(parsed) && parsed.length > 0) {
              singleHashtag = parsed[0].toString();
            } else {
              singleHashtag = hashtags;
            }
          } catch (e) {
            // Si ce n'est pas du JSON, utiliser tel quel
            singleHashtag = hashtags;
          }
        }
      }
      
      console.log('🔍 CONTROLLER - Hashtag unique extrait:', singleHashtag);
      
      // Créer le post
      const postData = {
        authorId: req.user.id,
        type: postType,
        title: title || null,
        content,
        hashtags: singleHashtag, // Désormais un seul hashtag
        visibility: visibility || 'public',
        ttsInstructions: ttsInstructions || null
      };
      
      console.log('🔍 CONTROLLER - Données post après traitement:', JSON.stringify(postData, null, 2));
      
      const newPost = await Post.create(postData);
      
      if (!newPost) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create post',
          error: 'creation_failed'
        });
      }
      
      // Réponse au client
      return res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: newPost
      });
    } catch (error) {
      console.error('📛 CONTROLLER - Erreur lors de la création du post:', error.message);
      console.error('📛 CONTROLLER - Stack trace:', error.stack);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create post',
        error: 'server_error',
        details: error.message
      });
    }
  },
  
  /**
   * Met à jour un post existant
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  updatePost: async (req, res) => {
    try {
      const postId = req.params.id;
      const { title, content, hashtags, visibility, ttsInstructions } = req.body;
      const userId = req.user.id; // Le middleware d'auth ajoute req.user
      
      console.log('updatePost - Request params:', { postId, userId });
      console.log('updatePost - Request body:', JSON.stringify(req.body, null, 2));
      
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
      
      // Traitement simplifié du hashtag
      let singleHashtag = null;
      
      if (hashtags) {
        if (Array.isArray(hashtags) && hashtags.length > 0) {
          // Prendre juste le premier hashtag du tableau
          singleHashtag = hashtags[0].toString();
        } else if (typeof hashtags === 'string') {
          // Utiliser la chaîne directement
          singleHashtag = hashtags;
        } else {
          // Pour tout autre type, conversion en chaîne
          singleHashtag = String(hashtags);
        }
        
        // Ajouter # si nécessaire
        if (singleHashtag && !singleHashtag.startsWith('#')) {
          singleHashtag = '#' + singleHashtag;
        }
      } else if (post.hashtags) {
        // Garder le hashtag existant si pas de nouveau hashtag fourni
        singleHashtag = post.hashtags;
      }
      
      console.log('Hashtag unique pour mise à jour:', singleHashtag);
      
      // Mettre à jour le post
      const success = await Post.update(postId, {
        title,
        content,
        hashtags: singleHashtag, // Envoyer le hashtag unique au modèle
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
      
      return res.status(200).json({
        success: true,
        data: updatedPost, // Plus besoin de traitement spécial pour les hashtags
        message: 'Post updated successfully'
      });
    } catch (error) {
      console.error('Error in updatePost controller:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json({
        success: false,
        message: 'Failed to update post',
        error: 'server_error',
        details: error.message
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
      
      // Plus besoin de parser les hashtags
      // Ils sont maintenant stockés comme des chaînes simples
      
      return res.status(200).json({
        success: true,
        data: posts
      });
    } catch (error) {
      console.error('Error in searchPosts controller:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json({
        success: false,
        message: 'Failed to search posts',
        error: 'server_error',
        details: error.message
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