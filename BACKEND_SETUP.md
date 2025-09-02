# Backend Setup Instructions

## Current Status

The frontend is currently configured to work with a mock authentication API while the backend is being set up.

## Backend Requirements

The backend should provide the following endpoints:

### Authentication
- `POST /auth/login` - User login
  - Request: `{ "email": string, "password": string }`
  - Response: `{ "token": string, "user": User }`

- `GET /auth/profile` - Get current user profile
- `PUT /auth/profile` - Update user profile
- `PUT /auth/change-password` - Change password

### Health Check
- `GET /health` - Health check endpoint
  - Response: `"ok"` (text/plain)

## Expected Backend URL
- Development: `http://localhost:8080`
- Production: Set via `NEXT_PUBLIC_API_BASE_URL` environment variable

## Current Workaround

The frontend includes mock APIs to provide a fully functional demo while the backend is being set up:

### Mock Authentication API
- `/api/auth/login` - User login
- `/api/auth/profile` - Get user profile

### Mock Data API
- `/api/users` - Users management (list, create)
- `/api/users/[id]` - Individual user operations (get, update, delete)

### Test Accounts
- **Super Admin**: `superadmin@maintenant.com` / `Password123!`
- **Client Admin**: `admin@clienta.com` / `Password123!`
- **Project Manager**: `manager@clienta.com` / `Password123!`
- **Viewer**: `viewer@clienta.com` / `Password123!`
- **Additional test users**: Available in the Users management page

## Switching to Real Backend

When the backend is available:

1. Ensure it's running on `http://localhost:8080`
2. Update `lib/api.ts` to point back to the backend:
   ```typescript
   const API_BASE_URL = isClient 
     ? '/api/backend'  // Use Next.js proxy when in browser
     : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
   ```
3. Remove the mock API endpoints from `app/api/auth/`

## JWT Token Format

The JWT token should include these claims:
```json
{
  "sub": "user_id",
  "org_id": 1,
  "roles": ["org_admin", "project_admin", "viewer"],
  "iss": "era-inventory",
  "aud": "era-inventory-frontend",
  "exp": 1234567890,
  "iat": 1234567890
}
```
