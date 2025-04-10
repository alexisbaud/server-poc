const db = require('better-sqlite3')('database.sqlite');
const { v4: uuidv4 } = require('uuid');

/**
 * Modèle pour les posts.
 * Implémente les méthodes pour créer, récupérer, mettre à jour et supprimer des posts.
 */
const Post = {
  /**
   * Récupère tous les posts publics triés par date (du plus récent au plus ancien)
   * @param {number} page - Numéro de page pour la pagination
   * @param {number} limit - Nombre de posts par page
   * @returns {Array} Posts récupérés
   */
  getAllPublic: (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    
    try {
      const stmt = db.prepare(`
        SELECT p.*, u.pseudo as authorName
        FROM posts p
        JOIN users u ON p.authorId = u.id
        WHERE p.visibility = 'public'
        ORDER BY p.createdAt DESC
        LIMIT ? OFFSET ?
      `);
      
      return stmt.all(limit, offset);
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw new Error('Failed to fetch posts');
    }
  },
  
  /**
   * Récupère un post par son ID
   * @param {number} id - ID du post
   * @returns {Object} Post récupéré
   */
  getById: (id) => {
    try {
      const stmt = db.prepare(`
        SELECT p.*, u.pseudo as authorName
        FROM posts p
        JOIN users u ON p.authorId = u.id
        WHERE p.id = ?
      `);
      
      return stmt.get(id);
    } catch (error) {
      console.error(`Error fetching post ${id}:`, error);
      throw new Error('Failed to fetch post');
    }
  },
  
  /**
   * Récupère tous les posts d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Array} Posts de l'utilisateur
   */
  getByUser: (userId) => {
    try {
      const stmt = db.prepare(`
        SELECT p.*, u.pseudo as authorName
        FROM posts p
        JOIN users u ON p.authorId = u.id
        WHERE p.authorId = ?
        ORDER BY p.createdAt DESC
      `);
      
      return stmt.all(userId);
    } catch (error) {
      console.error(`Error fetching posts for user ${userId}:`, error);
      throw new Error('Failed to fetch user posts');
    }
  },
  
  /**
   * Crée un nouveau post
   * @param {Object} postData - Données du post
   * @returns {Object|null} Le post créé ou null en cas d'échec
   */
  create: (postData) => {
    try {
      const { authorId, type, title, content, hashtags, visibility, ttsInstructions } = postData;
      
      console.log('🔍 MODEL - Création d\'un post avec les données:', JSON.stringify(postData, null, 2));
      
      // Validation des données
      if (!authorId || !type || !content) {
        console.error('📛 MODEL - Données invalides pour la création d\'un post:', { authorId, type, content });
        throw new Error('Missing required fields: authorId, type, content');
      }
      
      // Traitement du hashtag unique (plus de tableau/JSON)
      let singleHashtag = null;
      
      // Si hashtags existe dans les données, on prend juste le premier ou la chaîne directement
      if (hashtags) {
        if (Array.isArray(hashtags) && hashtags.length > 0) {
          // Prendre juste le premier hashtag du tableau
          singleHashtag = hashtags[0].toString();
        } else if (typeof hashtags === 'string') {
          // Prendre la chaîne directement
          singleHashtag = hashtags;
        } else {
          // Pour tout autre type, conversion en chaîne
          singleHashtag = String(hashtags);
        }
        
        // Ajouter # si nécessaire
        if (singleHashtag && !singleHashtag.startsWith('#')) {
          singleHashtag = '#' + singleHashtag;
        }
      }
      
      console.log('🔍 MODEL - Hashtag unique:', singleHashtag);
      
      const now = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO posts (authorId, type, title, content, hashtags, ttsInstructions, visibility, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // Exécution de la requête
      const result = stmt.run(
        authorId, 
        type, 
        title === undefined ? null : title, 
        content, 
        singleHashtag, // Désormais une simple chaîne
        ttsInstructions === undefined ? null : ttsInstructions, 
        visibility || 'public', 
        now, 
        now
      );
      
      console.log('🔍 MODEL - Résultat de l\'insertion:', result);
      
      if (result.changes === 0) {
        console.error('📛 MODEL - Échec de l\'insertion du post');
        return null;
      }
      
      const newPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);
      console.log('🔍 MODEL - Nouveau post créé:', JSON.stringify(newPost, null, 2));
      
      return newPost;
    } catch (error) {
      console.error('📛 MODEL - Erreur lors de la création du post:', error.message);
      console.error('📛 MODEL - Stack trace:', error.stack);
      throw new Error(`Failed to create post: ${error.message}`);
    }
  },
  
  /**
   * Met à jour un post existant
   * @param {number} id - ID du post à mettre à jour
   * @param {Object} postData - Nouvelles données du post
   * @returns {boolean} Succès de l'opération
   */
  update: (id, postData) => {
    try {
      const { title, content, hashtags, visibility, ttsInstructions } = postData;
      
      // Préparation du hashtag unique (comme dans create)
      let singleHashtag = null;
      
      if (hashtags) {
        if (Array.isArray(hashtags) && hashtags.length > 0) {
          singleHashtag = hashtags[0].toString();
        } else if (typeof hashtags === 'string') {
          singleHashtag = hashtags;
        } else {
          singleHashtag = String(hashtags);
        }
        
        // Ajouter # si nécessaire
        if (singleHashtag && !singleHashtag.startsWith('#')) {
          singleHashtag = '#' + singleHashtag;
        }
      }
      
      console.log('🔍 MODEL - Hashtag pour update:', singleHashtag);
      
      const stmt = db.prepare(`
        UPDATE posts
        SET title = ?, content = ?, hashtags = ?, visibility = ?, 
            ttsInstructions = ?, updatedAt = datetime('now')
        WHERE id = ?
      `);
      
      const result = stmt.run(
        title || null,
        content,
        singleHashtag, // Utiliser le hashtag comme chaîne simple
        visibility || 'public',
        ttsInstructions || null,
        id
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error(`Error updating post ${id}:`, error);
      throw new Error('Failed to update post');
    }
  },
  
  /**
   * Supprime un post
   * @param {number} id - ID du post à supprimer
   * @returns {boolean} Succès de l'opération
   */
  delete: (id) => {
    try {
      const stmt = db.prepare('DELETE FROM posts WHERE id = ?');
      const result = stmt.run(id);
      
      return result.changes > 0;
    } catch (error) {
      console.error(`Error deleting post ${id}:`, error);
      throw new Error('Failed to delete post');
    }
  },
  
  /**
   * Met à jour l'état de génération TTS d'un post
   * @param {number} id - ID du post
   * @param {string} audioUrl - URL de l'audio généré
   * @returns {boolean} Succès de l'opération
   */
  updateTtsStatus: (id, audioUrl) => {
    try {
      const stmt = db.prepare(`
        UPDATE posts
        SET ttsAudioUrl = ?, ttsGenerated = true, updatedAt = datetime('now')
        WHERE id = ?
      `);
      
      const result = stmt.run(audioUrl, id);
      return result.changes > 0;
    } catch (error) {
      console.error(`Error updating TTS status for post ${id}:`, error);
      throw new Error('Failed to update TTS status');
    }
  },
  
  /**
   * Recherche de posts par mots clés ou hashtags
   * @param {string} query - Terme de recherche
   * @param {number} limit - Limite de résultats
   * @returns {Array} Posts correspondants à la recherche
   */
  search: (query, limit = 20) => {
    try {
      // Cette implémentation simplifiée recherche dans le contenu, titre et hashtags
      const stmt = db.prepare(`
        SELECT p.*, u.pseudo as authorName
        FROM posts p
        JOIN users u ON p.authorId = u.id
        WHERE (
          p.content LIKE ? OR 
          p.title LIKE ? OR
          p.hashtags LIKE ?
        )
        AND p.visibility = 'public'
        ORDER BY p.createdAt DESC
        LIMIT ?
      `);
      
      const searchPattern = `%${query}%`;
      return stmt.all(searchPattern, searchPattern, searchPattern, limit);
    } catch (error) {
      console.error(`Error searching posts with query "${query}":`, error);
      throw new Error('Failed to search posts');
    }
  }
};

module.exports = Post; 