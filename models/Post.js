const db = require('better-sqlite3')('database.sqlite');

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
   * @param {Object} postData - Données du post à créer
   * @returns {Object} Post créé
   */
  create: (postData) => {
    try {
      const { authorId, type, title, content, hashtags, visibility, ttsInstructions } = postData;
      
      const stmt = db.prepare(`
        INSERT INTO posts (
          authorId, type, title, content, hashtags, 
          ttsInstructions, ttsGenerated, createdAt, updatedAt, visibility
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?)
      `);
      
      const hashtagsString = JSON.stringify(hashtags || []);
      const result = stmt.run(
        authorId, 
        type, 
        title || null, 
        content, 
        hashtagsString,
        ttsInstructions || null, 
        false, 
        visibility || 'public'
      );
      
      if (result.changes > 0) {
        return { 
          id: result.lastInsertRowid, 
          ...postData, 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        throw new Error('Failed to insert post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create post');
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
      
      const stmt = db.prepare(`
        UPDATE posts
        SET title = ?, content = ?, hashtags = ?, visibility = ?, 
            ttsInstructions = ?, updatedAt = datetime('now')
        WHERE id = ?
      `);
      
      const hashtagsString = JSON.stringify(hashtags || []);
      const result = stmt.run(
        title || null,
        content,
        hashtagsString,
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