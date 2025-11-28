# Troubleshooting Guide

## 500 Internal Server Error on Login

### Issue Found
The login endpoint was returning 500 errors because `JWT_SECRET` and `JWT_REFRESH_SECRET` were missing from the `.env` file.

### Solution Applied
1. Created `setup-env.js` script to automatically generate and add missing JWT secrets
2. Updated error handling to provide better error messages
3. Added validation checks in auth controller

### Steps to Fix

1. **Run the setup script** (if not already done):
   ```bash
   cd server
   node setup-env.js
   ```

2. **Restart your server**:
   - Stop the current server (Ctrl+C)
   - Start it again: `npm run server`

3. **Verify setup**:
   ```bash
   node check-setup.js
   ```

4. **Test login**:
   ```bash
   node test-auth.js
   ```

### Common Issues

#### Server not picking up new environment variables
- **Solution**: Restart the server after updating `.env` file
- Environment variables are loaded when the process starts

#### Database connection errors
- Check `DATABASE_URL` in `.env`
- Ensure database is running
- Run `npm run prisma:generate` and `npm run prisma:migrate`

#### Prisma Client not generated
- Run: `npm run prisma:generate`
- This creates the Prisma Client from your schema

#### Missing migrations
- Run: `npm run prisma:migrate`
- This creates the database tables

### Testing Commands

```bash
# Check environment setup
node check-setup.js

# Test JWT generation
node test-jwt.js

# Test login endpoint (requires server to be running)
node test-auth.js
```

### Required Environment Variables

Make sure your `.env` file has:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `CLIENT_URL` - Frontend URL (default: http://localhost:5173)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `BCRYPT_ROUNDS` - Password hashing rounds (default: 10)

