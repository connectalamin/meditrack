# MediTrack Backend API

Express backend server with Prisma ORM, multi-device authentication, and Zod validation.

## Features

- ✅ Express REST API
- ✅ Prisma ORM with PostgreSQL
- ✅ Multi-device authentication support
- ✅ JWT token-based auth (access + refresh tokens)
- ✅ Zod input validation
- ✅ Device tracking and management
- ✅ Full CRUD operations for all entities
- ✅ Error handling middleware
- ✅ Rate limiting
- ✅ CORS configuration

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your values:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/meditrack"
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173
BCRYPT_ROUNDS=10
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 4. Start Server

```bash
# Development (with watch mode)
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/devices` - Get user devices
- `POST /api/auth/logout` - Logout (remove device)
- `POST /api/auth/refresh` - Refresh access token

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Family Members
- `GET /api/family` - Get all family members
- `POST /api/family` - Create family member
- `PUT /api/family/:id` - Update family member
- `DELETE /api/family/:id` - Delete family member

### Medications
- `GET /api/medications` - Get all medications
- `POST /api/medications` - Create medication
- `PUT /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Delete medication

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Create report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### Health Data
- `GET /api/health-data/:familyMemberId` - Get health data for member
- `POST /api/health-data/:familyMemberId` - Create health data
- `PUT /api/health-data/:familyMemberId/:id` - Update health data
- `DELETE /api/health-data/:familyMemberId/:id` - Delete health data

### Plans
- `GET /api/plans/:familyMemberId` - Get plans for member
- `POST /api/plans/:familyMemberId` - Create plan
- `PUT /api/plans/:familyMemberId/:id` - Update plan
- `DELETE /api/plans/:familyMemberId/:id` - Delete plan

## Authentication

All protected routes require:
- `Authorization: Bearer <accessToken>` header
- `x-device-token: <deviceToken>` header (optional but recommended)

## Multi-Device Support

Each login creates a unique device token. Multiple devices can be logged in simultaneously. Device tokens are tracked with:
- Device name (extracted from User-Agent)
- Last active timestamp
- Creation timestamp

## Project Structure

```
server/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   └── index.js
└── package.json
```

