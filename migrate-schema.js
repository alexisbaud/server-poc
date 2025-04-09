const Database = require('better-sqlite3');
const path = require('path');

console.log('Début de la migration du schéma de la base de données...');

// Chemin de la base de données
const dbPath = path.join(__dirname, 'database.sqlite');

try {
  // Connexion à la base de données
  const db = new Database(dbPath);
  
  // Activer le mode foreign keys et les transactions
  db.pragma('foreign_keys = OFF');
  
  // Démarrer une transaction
  db.prepare('BEGIN TRANSACTION').run();
  
  try {
    console.log('Création de la nouvelle table users2...');
    
    // Créer une nouvelle table avec la structure correcte
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pseudo TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT,
        postAmount INTEGER DEFAULT 0
      )
    `).run();
    
    // Transférer les données de l'ancienne table vers la nouvelle
    console.log('Transfert des données existantes...');
    db.prepare(`
      INSERT INTO users2 (id, pseudo, email, passwordHash, createdAt, updatedAt, postAmount)
      SELECT id, username, email, password, created_at, updated_at, 0 
      FROM users
    `).run();
    
    // Supprimer l'ancienne table
    console.log('Suppression de l\'ancienne table...');
    db.prepare('DROP TABLE users').run();
    
    // Renommer la nouvelle table
    console.log('Renommage de la nouvelle table...');
    db.prepare('ALTER TABLE users2 RENAME TO users').run();
    
    // Valider la transaction
    db.prepare('COMMIT').run();
    console.log('Migration du schéma terminée avec succès !');
    
  } catch (err) {
    // En cas d'erreur, annuler la transaction
    db.prepare('ROLLBACK').run();
    throw err;
  } finally {
    // Fermer la connexion à la base de données
    db.close();
  }
  
} catch (error) {
  console.error('Erreur lors de la migration du schéma:', error);
  process.exit(1);
} 