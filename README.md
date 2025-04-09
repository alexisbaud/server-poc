# Microstory Server

A Node.js Express server for the Microstory application.

## Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Configure environment variables:
   - Rename `.env.example` to `.env` (or create a new `.env` file)
   - Update the values as needed, especially the `JWT_SECRET`

3. Migrate database (if needed):
```bash
npm run migrate
# or
yarn migrate
```

4. Start the server:
```bash
# Development mode (with auto-reload)
npm run dev
# or
yarn dev

# Production mode
npm start
# or
yarn start
```

## API Endpoints

All API responses follow a standard format:

**Success Response Format:**
```json
{
  "success": true,
  "user": { ... },  // ou autres données
  "token": "..."    // si applicable
}
```

**Error Response Format:**
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "error": "error_code",
  "field": "field_name" // optionnel, indique le champ en erreur
}
```

### Authentication

- **POST /api/auth/register** - Register a new user
  - Body:
    ```json
    {
      "email": "user@example.com",
      "password": "password123",
      "pseudo": "username"
    }
    ```
  - Note: le email doit être unique, le mot de passe doit contenir au moins 8 caractères, et le pseudo au moins 3 caractères
  - Success Response (201):
    ```json
    {
      "success": true,
      "user": {
        "id": 1,
        "pseudo": "username",
        "email": "user@example.com",
        "createdAt": "2023-04-01T12:00:00Z",
        "postAmount": 0
      },
      "token": "jwt_token_here"
    }
    ```

- **POST /api/auth/login** - Login user
  - Body:
    ```json
    {
      "email": "user@example.com",
      "password": "password123"
    }
    ```
  - Success Response (200):
    ```json
    {
      "success": true,
      "user": {
        "id": 1,
        "pseudo": "username",
        "email": "user@example.com",
        "createdAt": "2023-04-01T12:00:00Z",
        "postAmount": 0
      },
      "token": "jwt_token_here"
    }
    ```

- **GET /api/auth/profile** - Get current user profile (requires authentication)
  - Headers: `Authorization: Bearer jwt_token_here`
  - Success Response (200):
    ```json
    {
      "success": true,
      "user": {
        "id": 1,
        "pseudo": "username",
        "email": "user@example.com",
        "createdAt": "2023-04-01T12:00:00Z",
        "postAmount": 0
      }
    }
    ```

### Rate Limiting

Pour protéger contre les attaques par déni de service, l'API implémente une limitation de requêtes:

- **Routes d'authentification**: limité à 5 tentatives échouées par 15 minutes par adresse IP
- **Routes globales**: limité à 100 requêtes par 5 minutes par adresse IP

## File Structure
- `server.js` - Main application file
- `config/` - Configuration files
  - `database.js` - SQLite database configuration
- `routes/` - API routes
- `controllers/` - Request handlers
- `models/` - Data models
- `middleware/` - Custom middleware
  - `auth.js` - Authentication middleware
  - `rateLimiter.js` - Rate limiting middleware
- `audio/` - TTS audio files directory
- `database.sqlite` - SQLite database file

## Security Notes

- Passwords are hashed using bcrypt
- Authentication uses JWT tokens with 24h expiration
- Input validation on all routes
- Rate limiting to prevent brute force attacks

## Error Codes

- `invalid_token`: Le token JWT fourni est invalide
- `expired_token`: Le token JWT a expiré
- `too_many_requests`: Trop de requêtes ont été effectuées dans un court laps de temps
- `not_found`: La ressource demandée n'existe pas
- `server_error`: Erreur interne du serveur