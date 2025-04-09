const { db } = require('../config/database');

class User {
  /**
   * Find a user by ID
   * @param {number} id - User ID
   * @returns {Object|null} - User object or null if not found
   */
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) || null;
  }
  
  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Object|null} - User object or null if not found
   */
  static findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) || null;
  }
  
  /**
   * Find a user by pseudo
   * @param {string} pseudo - User pseudo
   * @returns {Object|null} - User object or null if not found
   */
  static findByPseudo(pseudo) {
    const stmt = db.prepare('SELECT * FROM users WHERE pseudo = ?');
    return stmt.get(pseudo) || null;
  }
  
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Object} - Created user object
   */
  static create(userData) {
    const { pseudo, email, passwordHash } = userData;
    
    const stmt = db.prepare(
      'INSERT INTO users (pseudo, email, passwordHash, createdAt, postAmount) VALUES (?, ?, ?, ?, ?)'
    );
    
    const now = new Date().toISOString();
    const info = stmt.run(pseudo, email, passwordHash, now, 0);
    
    return {
      id: info.lastInsertRowid,
      pseudo,
      email,
      createdAt: now,
      postAmount: 0
    };
  }
  
  /**
   * Update a user
   * @param {number} id - User ID
   * @param {Object} userData - User data to update
   * @returns {boolean} - Success status
   */
  static update(id, userData) {
    const allowedFields = ['pseudo', 'email', 'passwordHash', 'postAmount'];
    const updates = [];
    const values = [];
    
    for (const [key, value] of Object.entries(userData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (updates.length === 0) {
      return false;
    }
    
    updates.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
    const info = stmt.run(...values);
    
    return info.changes > 0;
  }
  
  /**
   * Increment post count for a user
   * @param {number} id - User ID
   * @returns {boolean} - Success status
   */
  static incrementPostCount(id) {
    const stmt = db.prepare('UPDATE users SET postAmount = postAmount + 1, updatedAt = ? WHERE id = ?');
    const info = stmt.run(new Date().toISOString(), id);
    
    return info.changes > 0;
  }

  /**
   * Delete a user
   * @param {number} id - User ID
   * @returns {boolean} - Success status
   */
  static delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const info = stmt.run(id);
    
    return info.changes > 0;
  }
}

module.exports = User; 