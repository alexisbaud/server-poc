# Documentation API MicroStory

## Informations Générales

- **URL de base**: `http://localhost:3000` (en développement)
- **Format de réponse**: JSON
- **Authentification**: JWT (JSON Web Token)

## Sécurité

Toutes les routes protégées nécessitent un token JWT valide, qui doit être fourni dans l'en-tête HTTP comme suit:

```
Authorization: Bearer <token>
```

Les tokens sont obtenus lors de l'inscription ou de la connexion et expirent après 24 heures.

## Routes d'Authentification

### Vérifier l'existence d'un email

- **URL**: `/api/auth/check-email`
- **Méthode**: `POST`
- **Protection rate-limit**: Oui
- **Corps de la requête**:
  ```json
  {
    "email": "utilisateur@exemple.com"
  }
  ```
- **Réponse réussie**:
  ```json
  {
    "success": true,
    "exists": true|false
  }
  ```
- **Codes d'erreur**:
  - `400`: Paramètres invalides
  - `429`: Trop de requêtes
  - `500`: Erreur serveur

### Vérifier l'existence d'un pseudo

- **URL**: `/api/auth/check-pseudo`
- **Méthode**: `POST`
- **Protection rate-limit**: Oui
- **Corps de la requête**:
  ```json
  {
    "pseudo": "utilisateur123"
  }
  ```
- **Réponse réussie**:
  ```json
  {
    "success": true,
    "exists": true|false
  }
  ```
- **Codes d'erreur**:
  - `400`: Paramètres invalides
  - `429`: Trop de requêtes
  - `500`: Erreur serveur

### Inscription

- **URL**: `/api/auth/register`
- **Méthode**: `POST`
- **Protection rate-limit**: Oui
- **Corps de la requête**:
  ```json
  {
    "pseudo": "utilisateur123",
    "email": "utilisateur@exemple.com",
    "password": "motDePasse123"
  }
  ```
- **Validation**:
  - Le pseudo doit avoir au moins 3 caractères
  - L'email doit être valide
  - Le mot de passe doit avoir au moins 8 caractères, contenir au moins une lettre et un chiffre
- **Réponse réussie** (201):
  ```json
  {
    "success": true,
    "token": "jwt_token",
    "user": {
      "id": 1,
      "pseudo": "utilisateur123",
      "email": "utilisateur@exemple.com",
      "createdAt": "2023-04-09T14:28:00.000Z",
      "postAmount": 0
    }
  }
  ```
- **Codes d'erreur**:
  - `400`: Champs manquants ou validation échouée
  - `429`: Trop de requêtes
  - `500`: Erreur serveur

### Connexion

- **URL**: `/api/auth/login`
- **Méthode**: `POST`
- **Protection rate-limit**: Oui
- **Corps de la requête**:
  ```json
  {
    "email": "utilisateur@exemple.com",
    "password": "motDePasse123"
  }
  ```
- **Réponse réussie**:
  ```json
  {
    "success": true,
    "token": "jwt_token",
    "user": {
      "id": 1,
      "pseudo": "utilisateur123",
      "email": "utilisateur@exemple.com",
      "createdAt": "2023-04-09T14:28:00.000Z",
      "postAmount": 5
    }
  }
  ```
- **Codes d'erreur**:
  - `400`: Champs manquants
  - `401`: Identifiants invalides
  - `429`: Trop de requêtes
  - `500`: Erreur serveur

### Profil utilisateur

- **URL**: `/api/auth/profile`
- **Méthode**: `GET`
- **Authentification**: Requise
- **Réponse réussie**:
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "pseudo": "utilisateur123",
      "email": "utilisateur@exemple.com",
      "createdAt": "2023-04-09T14:28:00.000Z",
      "postAmount": 5
    }
  }
  ```
- **Codes d'erreur**:
  - `401`: Non authentifié
  - `404`: Utilisateur non trouvé
  - `500`: Erreur serveur

## Routes des Posts

### Récupérer tous les posts publics

- **URL**: `/api/posts`
- **Méthode**: `GET`
- **Paramètres de requête**:
  - `page`: Numéro de page (défaut: 1)
  - `limit`: Nombre de posts par page (défaut: 10, max: 50)
- **Réponse réussie**:
  ```json
  {
    "success": true,
    "data": {
      "posts": [
        {
          "id": 1,
          "authorId": 1,
          "authorPseudo": "utilisateur123",
          "type": "Post A",
          "title": "Titre du post",
          "content": "Contenu du post...",
          "hashtags": ["histoire", "fiction"],
          "visibility": "public",
          "createdAt": "2023-04-09T14:28:00.000Z",
          "updatedAt": "2023-04-09T14:28:00.000Z"
        }
      ],
      "page": 1,
      "limit": 10,
      "hasMore": true
    }
  }
  ```
- **Codes d'erreur**:
  - `400`: Paramètres de pagination invalides
  - `500`: Erreur serveur

### Recherche de posts

- **URL**: `/api/posts/search`
- **Méthode**: `GET`
- **Paramètres de requête**:
  - `q`: Termes de recherche
  - `page`: Numéro de page (défaut: 1)
  - `limit`: Nombre de posts par page (défaut: 10, max: 50)
- **Réponse réussie**:
  ```json
  {
    "success": true,
    "data": {
      "posts": [
        {
          "id": 1,
          "authorId": 1,
          "authorPseudo": "utilisateur123",
          "type": "Post A",
          "title": "Titre du post",
          "content": "Contenu du post...",
          "hashtags": ["histoire", "fiction"],
          "visibility": "public",
          "createdAt": "2023-04-09T14:28:00.000Z",
          "updatedAt": "2023-04-09T14:28:00.000Z"
        }
      ],
      "page": 1,
      "limit": 10,
      "hasMore": false
    }
  }
  ```
- **Codes d'erreur**:
  - `400`: Paramètres de pagination invalides
  - `500`: Erreur serveur

### Récupérer les posts de l'utilisateur connecté

- **URL**: `/api/posts/user/me`
- **Méthode**: `GET`
- **Authentification**: Requise
- **Réponse réussie**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "authorId": 1,
        "authorPseudo": "utilisateur123",
        "type": "Post A",
        "title": "Titre du post",
        "content": "Contenu du post...",
        "hashtags": ["histoire", "fiction"],
        "visibility": "public",
        "createdAt": "2023-04-09T14:28:00.000Z",
        "updatedAt": "2023-04-09T14:28:00.000Z"
      }
    ]
  }
  ```
- **Codes d'erreur**:
  - `401`: Non authentifié
  - `500`: Erreur serveur

### Récupérer les posts d'un utilisateur spécifique

- **URL**: `/api/posts/user/:userId`
- **Méthode**: `GET`
- **Paramètres URL**:
  - `userId`: ID de l'utilisateur
- **Réponse réussie**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "authorId": 1,
        "authorPseudo": "utilisateur123",
        "type": "Post A",
        "title": "Titre du post",
        "content": "Contenu du post...",
        "hashtags": ["histoire", "fiction"],
        "visibility": "public",
        "createdAt": "2023-04-09T14:28:00.000Z",
        "updatedAt": "2023-04-09T14:28:00.000Z"
      }
    ]
  }
  ```
- **Codes d'erreur**:
  - `404`: Utilisateur non trouvé
  - `500`: Erreur serveur

### Récupérer un post spécifique

- **URL**: `/api/posts/:id`
- **Méthode**: `GET`
- **Paramètres URL**:
  - `id`: ID du post
- **Réponse réussie**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "authorId": 1,
      "authorPseudo": "utilisateur123",
      "type": "Post A",
      "title": "Titre du post",
      "content": "Contenu du post...",
      "hashtags": ["histoire", "fiction"],
      "visibility": "public",
      "createdAt": "2023-04-09T14:28:00.000Z",
      "updatedAt": "2023-04-09T14:28:00.000Z"
    }
  }
  ```
- **Codes d'erreur**:
  - `400`: ID manquant
  - `404`: Post non trouvé
  - `500`: Erreur serveur

### Créer un nouveau post

- **URL**: `/api/posts`
- **Méthode**: `POST`
- **Authentification**: Requise
- **Corps de la requête**:
  ```json
  {
    "type": "Post A",
    "title": "Titre du post",
    "content": "Contenu du post...",
    "hashtags": ["histoire", "fiction"],
    "visibility": "public",
    "ttsInstructions": "Instructions pour la synthèse vocale"
  }
  ```
- **Notes**:
  - `type`: Si non spécifié, il sera déterminé automatiquement selon la longueur du contenu
  - `visibility`: "public" (défaut) ou "private"
- **Réponse réussie** (201):
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "authorId": 1,
      "authorPseudo": "utilisateur123",
      "type": "Post A",
      "title": "Titre du post",
      "content": "Contenu du post...",
      "hashtags": ["histoire", "fiction"],
      "visibility": "public",
      "createdAt": "2023-04-09T14:28:00.000Z",
      "updatedAt": "2023-04-09T14:28:00.000Z"
    }
  }
  ```
- **Codes d'erreur**:
  - `400`: Contenu manquant ou invalide
  - `401`: Non authentifié
  - `500`: Erreur serveur

### Mettre à jour un post

- **URL**: `/api/posts/:id`
- **Méthode**: `PUT`
- **Authentification**: Requise
- **Paramètres URL**:
  - `id`: ID du post
- **Corps de la requête**:
  ```json
  {
    "title": "Titre modifié",
    "content": "Contenu modifié...",
    "hashtags": ["histoire", "fiction", "nouveau"],
    "visibility": "private",
    "ttsInstructions": "Instructions modifiées"
  }
  ```
- **Réponse réussie**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "authorId": 1,
      "authorPseudo": "utilisateur123",
      "type": "Post A",
      "title": "Titre modifié",
      "content": "Contenu modifié...",
      "hashtags": ["histoire", "fiction", "nouveau"],
      "visibility": "private",
      "createdAt": "2023-04-09T14:28:00.000Z",
      "updatedAt": "2023-04-09T15:30:00.000Z"
    },
    "message": "Post updated successfully"
  }
  ```
- **Codes d'erreur**:
  - `400`: Contenu invalide
  - `401`: Non authentifié
  - `403`: Non autorisé (pas le propriétaire du post)
  - `404`: Post non trouvé
  - `500`: Erreur serveur

### Supprimer un post

- **URL**: `/api/posts/:id`
- **Méthode**: `DELETE`
- **Authentification**: Requise
- **Paramètres URL**:
  - `id`: ID du post
- **Réponse réussie**:
  ```json
  {
    "success": true,
    "message": "Post deleted successfully"
  }
  ```
- **Codes d'erreur**:
  - `401`: Non authentifié
  - `403`: Non autorisé (pas le propriétaire du post)
  - `404`: Post non trouvé
  - `500`: Erreur serveur

## Ressources statiques

### Fichiers audio

Les fichiers audio générés pour les posts sont accessibles via l'URL:

```
/audio/<filename>
```

## Codes de statut HTTP

- `200`: Requête réussie
- `201`: Ressource créée avec succès
- `400`: Requête mal formée ou paramètres invalides
- `401`: Authentification requise
- `403`: Accès interdit (pas les permissions nécessaires)
- `404`: Ressource non trouvée
- `429`: Trop de requêtes (rate limiting)
- `500`: Erreur serveur interne

## Format des erreurs

Toutes les erreurs suivent le format standard:

```json
{
  "success": false,
  "message": "Description de l'erreur",
  "error": "code_erreur"
}
``` 