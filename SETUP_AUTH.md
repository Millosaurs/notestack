# Authentication Setup Guide

This guide will help you set up the authentication system with username-based login and roles.

## System Overview

- **Authentication Method**: Username + Password (no email required)
- **Username Format**: `1ST25CSXXX` where XXX is a unique number
- **Roles**: `user`, `reps`, `admin`
- **Admin User**: `1ST25CS134`

## Creating Users

Use the Better Auth signup API to create users:

### Create Admin User (1ST25CS134)
```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "1st25cs134@notestack.local",
    "name": "Admin User",
    "username": "1ST25CS134",
    "password": "admin123"
  }'
```

### Create Regular User (1ST25CS001)
```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "1st25cs001@notestack.local",
    "name": "Test User 1",
    "username": "1ST25CS001",
    "password": "password123"
  }'
```

### Create Rep User (1ST25CS002)
```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "1st25cs002@notestack.local",
    "name": "Test Rep",
    "username": "1ST25CS002",
    "password": "password123"
  }'
```

## Setting User Roles

After creating users, update their roles using Drizzle Studio:

1. Start Drizzle Studio:
   ```bash
   bun run db:studio
   ```

2. Navigate to the `user` table

3. Find each user and update their `role` field:
   - `1ST25CS134` → role: `admin`
   - `1ST25CS001` → role: `user`
   - `1ST25CS002` → role: `reps`

## Testing the Authentication Flow

1. Make sure both servers are running:
   - Backend: `bun run dev:server` (port 3000)
   - Frontend: `bun run dev:web` (port 3001)

2. Visit http://localhost:3001

3. You should see a login modal automatically appear

4. Login with any of the created users:
   - Username: `1ST25CS134`, Password: `admin123`
   - Username: `1ST25CS001`, Password: `password123`
   - Username: `1ST25CS002`, Password: `password123`

5. After successful login, you should see:
   - User information displayed
   - Username and role shown on the page

## Troubleshooting

### Login Modal Not Appearing
- Check that the frontend is running on port 3001
- Check browser console for errors
- Verify the backend is running on port 3000

### Login Fails
- Verify the user was created successfully
- Check the username and password
- Look at network tab in browser DevTools

### Role Not Showing Correctly
- Make sure you updated the role in the database
- Try logging out and logging back in
- Check Drizzle Studio to verify the role was saved

## API Endpoints

The following oRPC endpoints are available:

- `healthCheck` - Check API status
- `isAuthenticated` - Check if user is logged in
- `getCurrentUser` - Get current user session
- `getProfile` - Get user profile (protected, requires auth)

## Development Notes

- Email field is still required by Better Auth but not used for login
- Use unique emails for each user (e.g., `username@notestack.local`)
- Passwords are hashed using Better Auth's default algorithm (scrypt)
- Sessions are stored in the database
- No signup modal is provided - users must be created via API or admin panel
