# Authme

A TypeScript library for JWT authentication with MongoDB and Express.js. It provides a complete authentication system including local authentication, Google OAuth, password reset, and JWT token management.

## Installation

```bash
npm install @tapeo/authme
```

## Features

- JWT authentication
- MongoDB integration
- Express.js middleware
- Local authentication
- Google OAuth
- Password reset system
- Email verification
- Refresh token management
- TypeScript support
- Secure cookie handling
- CORS configuration

## Usage

### Basic setup

```typescript
import express from "express";
import { start } from "auth-mongo-express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Initialize the auth system
start(app, {
  port: 3000,
  host: "localhost",
  useHttps: false, // Set to true for HTTPS
});
```

### Path Resolution Configuration

To properly resolve the package's internal paths, configure your project:

1. Install required dependency:

```bash
npm install --save-dev tsconfig-paths
```

2. Update your start script in `package.json`:

```json
{
  "scripts": {
    "start": "nodemon -r tsconfig-paths/register app.ts"
  }
}
```

3. Add or update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["node_modules/@tapeo/authme/dist/*"]
    },
    "esModuleInterop": true,
    "module": "commonjs",
    "target": "es6"
  }
}
```

### Environment variables

Create a `.env` file in your project root:

```env
# Environment
ENV="development"

# MongoDB
MONGO_URI="your-mongodb-connection-string"

# JWT
ACCESS_TOKEN_SECRET="your-access-token-secret"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
ENCRYPTION_KEY="your-encryption-key"

# Email settings
EMAIL_FROM="your-email@example.com"
EMAIL_SUBJECT="Password Reset Request"
EMAIL_NAME="Your App Name"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:8080/auth/google/callback"
GOOGLE_AUTHENTICATED_REDIRECT_URL="http://localhost:3000/authenticated"
GOOGLE_ERROR_REDIRECT_URL="http://localhost:3000"

# Development
DEV_SERVER_HTTPS=false
```

#### Generate a new encryption key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Available endpoints

```
Authentication:
POST /auth/login - Login user
POST /auth/logout - Logout user
POST /auth/signup - Register new user
POST /auth/refresh-token - Refresh access token

Email verification:
POST /auth/send-email-verification - Send verification email
POST /auth/signup/with-verification - Register with email verification

Password management:
POST /auth/password/forgot - Request password reset
GET /auth/password/reset/:token - Verify reset token
POST /auth/password/update - Update password

User management:
GET /user - Get current user info (protected)
DELETE /user - Delete current user (protected)

Google OAuth:
GET /auth/google - Initiate Google OAuth flow
GET /auth/google/callback - Google OAuth callback
```

## Local development

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with your configuration

4. Start development server:

```bash
npm run dev
```

## API testing

An Insomnia collection is included in the repository to help you test all the available endpoints. Import the `insomnia-collection.json` file into Insomnia to get started with testing the API.

## Dependencies

- express: ^4.18.0
- mongoose: ^8.7.1
- jsonwebtoken: ^9.0.2
- bcrypt: ^5.1.1
- cookie-parser: ^1.4.6
- cors: ^2.8.5
- nodemailer: ^6.10.0
- dotenv: ^16.0.0

## Security considerations

- Uses secure HTTP-only cookies for token storage
- Implements refresh token rotation
- Encrypts sensitive data before storage
- Supports HTTPS
- Implements CORS protection
- Uses MongoDB's TTL indexes for automatic token cleanup
- Implements rate limiting for sensitive operations
- Securely handles password reset flows
