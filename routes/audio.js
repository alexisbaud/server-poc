const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const statAsync = promisify(fs.stat);
const mkdirAsync = promisify(fs.mkdir);

// Route pour générer l'audio
router.post('/generate-audio', async (req, res) => {
  try {
    console.log('Requête de génération audio reçue:', req.body);
    const { id, content } = req.body;

    if (!id || !content) {
      return res.status(400).json({
        success: false,
        message: 'ID et content sont requis'
      });
    }
    
    // Vérification des clés API
    if (!process.env.OPENAI_API_KEY) {
      console.error('Clé API OpenAI manquante');
      return res.status(500).json({
        success: false,
        message: 'Configuration du serveur incomplète: clé OpenAI manquante'
      });
    }
    
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('Clé API ElevenLabs manquante');
      return res.status(500).json({
        success: false,
        message: 'Configuration du serveur incomplète: clé ElevenLabs manquante'
      });
    }

    // Création du dossier audio s'il n'existe pas
    const audioDir = path.join(__dirname, '..', 'audio');
    console.log('Dossier audio:', audioDir);
    try {
      await statAsync(audioDir);
      console.log('Le dossier audio existe déjà');
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('Création du dossier audio');
        await mkdirAsync(audioDir, { recursive: true });
      } else {
        console.error('Erreur lors de la vérification du dossier audio:', err);
        throw err;
      }
    }

    const audioFilePath = path.join(audioDir, `${id}.mp3`);
    console.log('Chemin du fichier audio:', audioFilePath);

    // Vérifier si le fichier existe déjà
    try {
      await statAsync(audioFilePath);
      console.log('Le fichier audio existe déjà');
      return res.json({
        success: true,
        message: 'Audio already exists.',
        file: `audio/${id}.mp3`
      });
    } catch (err) {
      // Si le fichier n'existe pas, on continue
      if (err.code !== 'ENOENT') {
        console.error('Erreur lors de la vérification du fichier audio:', err);
        throw err;
      }
      console.log('Le fichier audio n\'existe pas, génération en cours...');
    }

    console.log('Appel à l\'API OpenAI en cours...');
    // 1. Appel à OpenAI pour améliorer le texte avec des pauses
    const enhancedTextResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant qui ajoute des balises de pause pour améliorer la narration audio.'
          },
          {
            role: 'user',
            content: `${content}\n\nCi-dessus le contenu d'une histoire. Analyse-le puis insère des balises <break time="x.xs" /> pour intégrer des pauses naturelles jusqu'à 2 secondes maximum.\nIntègre ces pauses de manière naturelle pour rendre la lecture du texte la plus naturelle possible.\nOUTPUT : UNIQUEMENT LE TEXTE AVEC LES BALISES À L'INTÉRIEUR.`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Réponse OpenAI reçue');

    const enhancedText = enhancedTextResponse.data.choices[0].message.content.trim();
    console.log('Texte amélioré:', enhancedText.substring(0, 100) + '...');

    console.log('Appel à l\'API ElevenLabs en cours...');
    // 2. Appel à ElevenLabs pour générer l'audio
    const elevenLabsResponse = await axios.post(
      'https://api.elevenlabs.io/v1/text-to-speech/a5n9pJUnAhX4fn7lx3uo',
      {
        text: enhancedText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8,
          style: 0.35,
          use_speaker_boost: true,
          speed: 1.15
        }
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    console.log('Réponse ElevenLabs reçue');

    // 3. Enregistrement du fichier audio
    console.log('Enregistrement du fichier audio en cours...');
    await writeFileAsync(audioFilePath, Buffer.from(elevenLabsResponse.data));
    console.log('Fichier audio enregistré avec succès');

    // 4. Réponse au client
    res.json({
      success: true,
      file: `audio/${id}.mp3`,
      enhancedText: enhancedText
    });
  } catch (error) {
    console.error('Erreur détaillée lors de la génération audio:', error);
    if (error.response) {
      console.error('Détails de l\'erreur API:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération audio',
      error: error.message
    });
  }
});

// Route pour diffuser l'audio
router.get('/audio/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const audioFilePath = path.join(__dirname, '..', 'audio', `${id}.mp3`);

    try {
      await statAsync(audioFilePath);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          message: 'Fichier audio non trouvé'
        });
      }
      throw err;
    }

    // Configurer les headers pour le streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline'); // Empêche le téléchargement
    
    // Créer un stream de lecture et l'envoyer en réponse
    const audioStream = fs.createReadStream(audioFilePath);
    audioStream.pipe(res);
  } catch (error) {
    console.error('Erreur lors du streaming audio:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du streaming audio',
      error: error.message
    });
  }
});

// Route pour enrichir le texte avec OpenAI
router.post('/enhance-text', async (req, res) => {
  try {
    console.log('Requête d\'enrichissement de texte reçue:', req.body);
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu est requis'
      });
    }
    
    // Vérification de la clé API OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.error('Clé API OpenAI manquante');
      return res.status(500).json({
        success: false,
        message: 'Configuration du serveur incomplète: clé OpenAI manquante'
      });
    }

    console.log('Appel à l\'API OpenAI en cours...');
    // Appel à OpenAI pour améliorer le texte avec des pauses
    const enhancedTextResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant qui ajoute des balises de pause pour améliorer la narration audio.'
          },
          {
            role: 'user',
            content: `${content}\n\nLe texte ci-dessus est une histoire à lire à voix haute.\nTa mission est de l'enrichir pour offrir une expérience de lecture naturelle, fluide et rythmée, comme dans un enregistrement professionnel.\n\nObjectif :\nAjoute des balises <break time="x.xs" /> à des endroits stratégiques pour marquer des pauses naturelles dans le récit. Ces pauses doivent :\n- Refléter le rythme du texte, les changements de ton, d'ambiance ou d'émotion.\n- Aider à la compréhension de l'histoire.\n- Rendre la lecture plus immersive et humaine.\n\nContraintes :\n- N'insère aucune pause supérieure à 2.0 secondes.\n- Utilise plus de pauses courtes (0.2s à 1.0s) que de longues (1.2s à 2.0s), pour maintenir un bon rythme sans alourdir l'écoute.\n- Positionne les pauses avec finesse, notamment après les virgules, points, ou éléments forts (révélations, dialogues, émotions).\n- Si le rythme du texte le permet, tu peux ajouter quelques courtes pauses en plein milieu de phrases, pour renforcer le naturel ou souligner un mot.\n- Ne modifie aucun mot du texte d'origine : conserve le contenu tel quel.\n\nFormat attendu :\nUniquement le texte enrichi avec les balises <break time="x.xs" /> intégrées directement à l'intérieur, sans ajout d'en-tête ni de commentaire. UNIQUEMENT LE TEXTE AVEC LES BALISES À L'INTÉRIEUR.`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Réponse OpenAI reçue');

    const enhancedText = enhancedTextResponse.data.choices[0].message.content.trim();
    console.log('Texte amélioré:', enhancedText.substring(0, 100) + '...');

    // Réponse au client
    res.json({
      success: true,
      enhancedText: enhancedText
    });
  } catch (error) {
    console.error('Erreur lors de l\'enrichissement du texte:', error);
    if (error.response) {
      console.error('Détails de l\'erreur API:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enrichissement du texte',
      error: error.message
    });
  }
});

// Page HTML de test pour la génération audio
router.get('/generate-audio', (req, res) => {
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test de génération audio</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      h1 {
        color: #333;
      }
      .form-group {
        margin-bottom: 15px;
      }
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      textarea, input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
      }
      textarea {
        min-height: 150px;
      }
      button {
        background-color: #4CAF50;
        color: white;
        padding: 10px 15px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }
      button:hover {
        background-color: #45a049;
      }
      .player {
        margin-top: 20px;
        display: none;
      }
      .status {
        margin-top: 15px;
        padding: 10px;
        border-radius: 4px;
      }
      .success {
        background-color: #d4edda;
        color: #155724;
      }
      .error {
        background-color: #f8d7da;
        color: #721c24;
      }
      .enhanced-text {
        margin-top: 20px;
        padding: 15px;
        background-color: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 4px;
        white-space: pre-wrap;
        display: none;
      }
      .enhanced-text h3 {
        margin-top: 0;
      }
    </style>
  </head>
  <body>
    <h1>Test de génération audio</h1>
    <div class="form-group">
      <label for="postId">ID du post :</label>
      <input type="text" id="postId" placeholder="Entrez un identifiant unique">
    </div>
    <div class="form-group">
      <label for="postContent">Contenu du post :</label>
      <textarea id="postContent" placeholder="Entrez le texte à convertir en audio"></textarea>
    </div>
    <button id="submitBtn">Générer l'audio</button>
    
    <div id="status" class="status" style="display: none;"></div>
    
    <div id="audioPlayer" class="player">
      <h3>Lecture de l'audio</h3>
      <audio controls id="player">
        Votre navigateur ne supporte pas l'élément audio.
      </audio>
    </div>
    
    <div id="enhancedTextContainer" class="enhanced-text">
      <h3>Texte enrichi avec pauses</h3>
      <pre id="enhancedText"></pre>
    </div>
    
    <script>
      document.getElementById('submitBtn').addEventListener('click', async () => {
        const postId = document.getElementById('postId').value.trim();
        const postContent = document.getElementById('postContent').value.trim();
        
        if (!postId || !postContent) {
          showStatus('Veuillez remplir tous les champs', 'error');
          return;
        }
        
        showStatus('Génération en cours...', 'loading');
        
        try {
          const response = await fetch('/api/generate-audio', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: postId,
              content: postContent
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            showStatus('Audio généré avec succès !', 'success');
            
            // Afficher le lecteur audio
            const audioPlayer = document.getElementById('audioPlayer');
            audioPlayer.style.display = 'block';
            
            // Mettre à jour la source audio avec un timestamp pour éviter le cache
            const player = document.getElementById('player');
            player.src = \`/\${data.file}?t=\${new Date().getTime()}\`;
            
            // Afficher le texte enrichi
            if (data.enhancedText) {
              const enhancedTextContainer = document.getElementById('enhancedTextContainer');
              const enhancedTextElement = document.getElementById('enhancedText');
              enhancedTextElement.textContent = data.enhancedText;
              enhancedTextContainer.style.display = 'block';
            }
          } else {
            showStatus(\`Erreur: \${data.message}\`, 'error');
          }
        } catch (error) {
          showStatus(\`Erreur: \${error.message}\`, 'error');
        }
      });
      
      function showStatus(message, type) {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
        
        // Supprimer les classes précédentes
        statusDiv.classList.remove('success', 'error', 'loading');
        
        // Ajouter la classe appropriée
        if (type) {
          statusDiv.classList.add(type);
        }
      }
    </script>
  </body>
  </html>
  `;
  
  res.send(htmlContent);
});

// Page HTML de test pour l'enrichissement de texte
router.get('/enhance-text', (req, res) => {
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enrichissement de texte avec OpenAI</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      h1 {
        color: #333;
      }
      .form-group {
        margin-bottom: 15px;
      }
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
        min-height: 200px;
        font-family: inherit;
        font-size: 1rem;
      }
      button {
        background-color: #4285f4;
        color: white;
        padding: 10px 15px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.3s;
      }
      button:hover {
        background-color: #3367d6;
      }
      .status {
        margin-top: 15px;
        padding: 10px;
        border-radius: 4px;
      }
      .success {
        background-color: #d4edda;
        color: #155724;
      }
      .error {
        background-color: #f8d7da;
        color: #721c24;
      }
      .loading {
        background-color: #e9ecef;
        color: #495057;
      }
      .result {
        margin-top: 25px;
        padding: 20px;
        background-color: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 4px;
        white-space: pre-wrap;
        display: none;
      }
      .result h3 {
        margin-top: 0;
        color: #333;
      }
      pre {
        background: #f4f4f4;
        padding: 15px;
        border-radius: 4px;
        overflow-x: auto;
        font-family: 'Courier New', monospace;
        line-height: 1.5;
      }
      .highlight {
        background-color: #fffde7;
        padding: 2px;
        border-radius: 2px;
      }
      .controls {
        margin-bottom: 10px;
      }
      .copy-btn {
        background-color: #4CAF50;
        color: white;
        padding: 10px 15px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }
      .copy-btn:hover {
        background-color: #45a049;
      }
    </style>
  </head>
  <body>
    <h1>Enrichissement de texte avec OpenAI</h1>
    <p>Cet outil ajoute des balises &lt;break&gt; pour créer des pauses naturelles dans votre texte.</p>
    
    <div class="form-group">
      <label for="textContent">Votre texte :</label>
      <textarea id="textContent" placeholder="Entrez le texte à enrichir avec des pauses..."></textarea>
    </div>
    
    <button id="submitBtn">Enrichir le texte</button>
    
    <div id="status" class="status" style="display: none;"></div>
    
    <div id="resultContainer" class="result">
      <h3>Texte enrichi avec balises de pause</h3>
      <div class="controls">
        <button id="copyBtn" class="copy-btn">Copier le texte</button>
      </div>
      <pre id="resultText"></pre>
    </div>
    
    <script>
      document.getElementById('submitBtn').addEventListener('click', async () => {
        const textContent = document.getElementById('textContent').value.trim();
        
        if (!textContent) {
          showStatus('Veuillez entrer du texte à enrichir', 'error');
          return;
        }
        
        showStatus('Enrichissement en cours...', 'loading');
        
        try {
          const response = await fetch('/api/enhance-text', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: textContent
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            showStatus('Texte enrichi avec succès !', 'success');
            
            // Afficher le résultat
            const resultContainer = document.getElementById('resultContainer');
            const resultText = document.getElementById('resultText');
            
            // Afficher le texte brut sans interprétation HTML
            resultText.textContent = data.enhancedText;
            
            // Initialiser le bouton de copie
            const copyBtn = document.getElementById('copyBtn');
            copyBtn.addEventListener('click', () => {
              navigator.clipboard.writeText(data.enhancedText);
              copyBtn.textContent = 'Copié!';
              setTimeout(() => {
                copyBtn.textContent = 'Copier le texte';
              }, 2000);
            });
            
            resultContainer.style.display = 'block';
          } else {
            showStatus(\`Erreur: \${data.message}\`, 'error');
          }
        } catch (error) {
          showStatus(\`Erreur: \${error.message}\`, 'error');
        }
      });
      
      function showStatus(message, type) {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
        
        // Supprimer les classes précédentes
        statusDiv.classList.remove('success', 'error', 'loading');
        
        // Ajouter la classe appropriée
        if (type) {
          statusDiv.classList.add(type);
        }
      }
    </script>
  </body>
  </html>
  `;
  
  res.send(htmlContent);
});

module.exports = router; 