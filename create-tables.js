// Script simple pour créer la table posts
const db = require('better-sqlite3')('database.sqlite');

console.log('Création de la table posts...');

// Création de la table posts si elle n'existe pas
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    authorId INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    hashtags TEXT,
    ttsInstructions TEXT,
    ttsAudioUrl TEXT,
    ttsGenerated INTEGER DEFAULT 0,
    visibility TEXT DEFAULT 'public',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (authorId) REFERENCES users (id)
  )
`);

console.log('Table posts créée avec succès!');

// Vérifier que la table a bien été créée
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables dans la base de données:', tables.map(t => t.name).join(', '));

// Fermer la connexion
db.close(); 