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
- Anonymous authentication with account merging

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

Create a `.env` file in your project root, following the `.env.example` file.

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

Anonymous authentication:
POST /auth/signup/anonymous - Create anonymous account
POST /auth/signup/merge - Merge anonymous account with regular account (protected)

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

### Anonymous authentication flow

1. Create an anonymous account:

```typescript
POST / auth / signup / anonymous;
// Response includes access_token and refresh_token
```

2. Use the account with the provided tokens

3. When ready, merge with a regular account:

```typescript
POST /auth/signup/merge
Headers: {
  Authorization: "Bearer <access_token>"
}
Body: {
  "email": "user@example.com",
  "password": "newpassword"
}
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
- Validates anonymous account ownership during merging

# Google Authentication Setup

This document explains how to set up Google OAuth authentication for the SEO AI Pal application.

## Setup Steps

### 1. Configure OAuth Consent Screen

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "OAuth consent screen"
4. Select the appropriate user type:
   - "External" for production use (available to any Google user)
   - "Internal" for testing (only available to users in your organization)
5. Fill in the required application information:
   - App name
   - User support email: Your support email address
   - Developer contact information: Your contact email

### 2. Create OAuth Credentials

1. Navigate to "Create OAuth client ID"
2. Click "Create Credentials" and select "OAuth client ID"
3. Select "Web application" as the application type
4. Add a name for your OAuth client
5. Add authorized JavaScript origins:
   - `https://example.com` (production)
   - `https://beta.example.com` (beta)
   - `http://localhost:3000` (development)
6. Add authorized redirect URIs:
   - `https://api.example.com/auth/google/callback` (production)
   - `https://api.beta.example.com/auth/google/callback` (beta)
   - `http://localhost:3000/auth/google/callback` (development)
7. Click "Create"
8. Note your Client ID and Client Secret

### 3. Configure Environment Variables

Add the following environment variables to your `.env` file:

```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://example.com/auth/google/callback
GOOGLE_AUTHENTICATED_REDIRECT_URL=https://example.com/authenticated
GOOGLE_ERROR_REDIRECT_URL=https://example.com

```

### 4. MongoDB Integration

The Google authentication implementation uses MongoDB for:

1. **User Management**: Users who authenticate with Google are stored in the same user collection as regular users.
2. **OAuth State Management**: To prevent CSRF attacks, a state parameter is used in the OAuth flow. These states are stored in MongoDB with automatic expiration using TTL indexes.
3. **Refresh Token Management**: Refresh tokens are encrypted and stored in the user document.

The implementation includes:

- Automatic cleanup of expired OAuth states via MongoDB TTL indexes
- User profile data synchronization (name and profile picture)

### 5. Test the Integration

1. Start your backend server
2. Navigate to `http://localhost:8080/auth/google` (or your deployed URL)
3. You should be redirected to Google's login page
4. After successful authentication, you'll be redirected back to your frontend application

## How It Works

1. When a user clicks "Login with Google", they are redirected to `/auth/google`
2. The server generates a state parameter and stores it in MongoDB
3. The server redirects to Google's authentication page with the state parameter
4. After authentication, Google redirects back to `/auth/google/callback` with a code and the state parameter
5. The server verifies the state parameter by checking it against MongoDB
6. The server exchanges the code for tokens from Google
7. The server retrieves the user's profile information from Google
8. The server creates or retrieves the user from the database
9. The server generates JWT tokens and sets authentication cookies
10. The user is redirected to the frontend application, now authenticated

## Troubleshooting

### Error 400: redirect_uri_mismatch

If you encounter the error "Error 400: redirect_uri_mismatch" during authentication, it means the redirect URI used in your application doesn't match any of the authorized redirect URIs configured in your Google Cloud Console.

To fix this issue:

1. Check your environment variables:

   - Verify that `GOOGLE_REDIRECT_URI` in your `.env` file exactly matches one of the URIs you added to the authorized redirect URIs in Google Cloud Console
   - If `GOOGLE_REDIRECT_URI` is not set, check the default value in your code (typically `http://localhost:8080/auth/google/callback` for development)

2. Check your Google Cloud Console configuration:

   - Go to Google Cloud Console > APIs & Services > Credentials
   - Edit your OAuth 2.0 Client ID
   - Ensure the redirect URI used by your application is listed in the "Authorized redirect URIs" section
   - Remember that URIs are case-sensitive and must match exactly (including http/https, trailing slashes, etc.)

3. Common issues:

   - Mismatched protocols (http vs https)
   - Different ports (8080 vs 3000)
   - Missing or extra path segments (/auth/google/callback vs /auth/google)
   - Typos or case differences

4. Debug steps:

   - Add a console.log statement in your code to print the exact redirect URI being used:
     ```javascript
     console.log("Using redirect URI:", GOOGLE_REDIRECT_URI);
     ```
   - Compare this with the URIs configured in Google Cloud Console

5. After making changes:
   - Save your changes in Google Cloud Console
   - Restart your application to apply any environment variable changes
   - Try the authentication flow again

## Security Considerations

- The implementation uses state parameters stored in MongoDB to prevent CSRF attacks
- MongoDB's TTL index automatically removes expired OAuth states
- Refresh tokens are encrypted before storage
- All sensitive data is transmitted over HTTPS in production
- Cookies are set with appropriate security flags based on the environment
- User passwords for Google-authenticated users are randomly generated and securely hashed
