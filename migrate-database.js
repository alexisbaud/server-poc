const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const oldDbPath = path.join(__dirname, 'data', 'microstory.db');
const newDbPath = path.join(__dirname, 'database.sqlite');

// Vérifier si l'ancien fichier existe
if (fs.existsSync(oldDbPath)) {
  console.log('Migration de la base de données en cours...');
  
  try {
    // Copier le fichier
    fs.copyFileSync(oldDbPath, newDbPath);
    console.log(`Base de données migrée avec succès de ${oldDbPath} vers ${newDbPath}`);
    
    // Optionnel: Supprimer l'ancien fichier (décommentez si vous voulez le supprimer)
    // fs.unlinkSync(oldDbPath);
    // console.log('Ancien fichier de base de données supprimé.');
  } catch (error) {
    console.error('Erreur lors de la migration de la base de données:', error);
    process.exit(1);
  }
} else {
  console.log(`Aucune base de données à migrer: ${oldDbPath} n'existe pas.`);
  console.log(`Une nouvelle base de données sera créée à ${newDbPath} lors du démarrage de l'application.`);
} 