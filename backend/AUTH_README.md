# Authentication Module Documentation

Complete JWT-based authentication system with access and refresh tokens.

## 📁 Module Structure

```
backend/src/modules/
├── auth/
│   ├── dto/
│   │   ├── register.dto.ts
│   │   ├── login.dto.ts
│   │   ├── refresh-token.dto.ts
│   │   └── auth-response.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── refresh-token.strategy.ts
│   ├── decorators/
│   │   ├── public.decorator.ts
│   │   └── current-user.decorator.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.service.spec.ts
│   └── auth.module.ts
├── users/
│   ├── users.service.ts
│   └── users.module.ts
└── refresh-token/
    ├── refresh-token.entity.ts
    ├── refresh-token.service.ts
    └── refresh-token.module.ts
```

## 🔐 Features

- **User Registration** with email validation and password hashing (bcrypt)
- **Login** with JWT access and refresh tokens
- **Token Refresh** mechanism for seamless authentication
- **Logout** with refresh token revocation
- **Logout All Devices** to revoke all user sessions
- **Global JWT Guard** with public route decorator
- **Secure Token Storage** - Refresh tokens hashed in database
- **TypeORM Integration** with SQLite (dev) and PostgreSQL (prod)
- **Comprehensive Tests** using in-memory SQLite

## 🚀 API Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors:**
- `409 Conflict` - Email already registered

---

### POST /auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials

---

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors:**
- `401 Unauthorized` - Invalid or expired refresh token

**Note:** Old refresh token is revoked after successful refresh.

---

### POST /auth/logout
Logout from current session (requires authentication).

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `204 No Content`

**Errors:**
- `400 Bad Request` - Invalid token or token mismatch
- `401 Unauthorized` - Not authenticated

---

### POST /auth/logout-all
Logout from all sessions/devices (requires authentication).

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:** `204 No Content`

**Errors:**
- `401 Unauthorized` - Not authenticated

---

## 🛡️ Security Features

### Password Hashing
- Passwords are hashed using **bcrypt** with 10 salt rounds
- Never stored in plain text

### Token Security
- **Access Token:** Short-lived (15 minutes default)
- **Refresh Token:** Long-lived (7 days default)
- Refresh tokens are **hashed** before storing in database
- Each refresh generates a new token pair
- Old refresh tokens are automatically revoked

### Route Protection
- Global JWT authentication guard
- Use `@Public()` decorator for public routes
- Use `@CurrentUser()` decorator to access authenticated user

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Database
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=money_matters
```

### Token Expiration
- **Development:** Access tokens expire in 15 minutes, refresh tokens in 7 days
- **Production:** Adjust based on security requirements

## 📝 Usage Examples

### Protecting Routes

By default, all routes are protected. Use `@Public()` for public access:

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/decorators/public.decorator';

@Controller('public')
export class PublicController {
  @Public()
  @Get()
  getPublicData() {
    return { message: 'This is public' };
  }
}
```

### Accessing Current User

```typescript
import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from './modules/auth/decorators/current-user.decorator';

@Controller('profile')
export class ProfileController {
  @Get()
  getProfile(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
```

### Manual Guard Usage

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Controller('protected')
export class ProtectedController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProtectedData() {
    return { message: 'This is protected' };
  }
}
```

## 🧪 Testing

Run the authentication tests:

```bash
npm test -- auth.service.spec
```

### Test Coverage
- User registration with validation
- Login with valid/invalid credentials
- Token refresh mechanism
- Logout single session
- Logout all sessions
- Password hashing verification
- Token storage and revocation

### In-Memory SQLite
Tests use TypeORM with in-memory SQLite for fast, isolated testing without external dependencies.

## 🗄️ Database Schema

### users table
- `id` - UUID primary key
- `email` - Unique, not null
- `passwordHash` - bcrypt hash
- `name` - User's display name
- `createdAt` - Timestamp

### refresh_tokens table
- `id` - UUID primary key
- `userId` - Foreign key to users
- `tokenHash` - bcrypt hashed refresh token
- `expiresAt` - Token expiration datetime
- `createdAt` - Timestamp

## 🔄 Token Flow

1. **Register/Login**
   - User provides credentials
   - System generates access + refresh token pair
   - Refresh token is hashed and stored in database
   - Both tokens returned to client

2. **Authenticated Request**
   - Client sends access token in Authorization header
   - JwtStrategy validates token
   - Request proceeds with user context

3. **Token Refresh**
   - Client sends refresh token
   - System validates token against database
   - Old refresh token is revoked
   - New token pair is generated and returned

4. **Logout**
   - Client sends refresh token
   - Token is revoked from database
   - Client discards both tokens

## 🚨 Error Handling

| Status Code | Error | Description |
|------------|-------|-------------|
| 400 | Bad Request | Invalid input or token mismatch |
| 401 | Unauthorized | Invalid credentials or expired token |
| 409 | Conflict | Email already exists |

## 🔐 Best Practices

1. **Store Tokens Securely**
   - Use httpOnly cookies for web apps
   - Use secure storage for mobile apps

2. **Token Rotation**
   - Refresh tokens are single-use
   - New token issued on each refresh

3. **Short Access Token Lifetime**
   - Limits exposure if token is compromised
   - Use refresh token for seamless UX

4. **Revocation Support**
   - Logout invalidates refresh tokens
   - Forced logout possible via admin action

5. **Environment-Based Configuration**
   - Different secrets for dev/prod
   - Adjust token lifetimes per environment

## 📦 Dependencies

```json
{
  "@nestjs/jwt": "^11.x",
  "@nestjs/passport": "^11.x",
  "passport": "^0.7.x",
  "passport-jwt": "^4.x",
  "bcrypt": "^5.x",
  "class-validator": "^0.14.x",
  "class-transformer": "^0.5.x"
}
```

## 🎯 Next Steps

1. Implement email verification
2. Add password reset flow
3. Implement rate limiting
4. Add 2FA support
5. Create user management endpoints
6. Add refresh token rotation policy
7. Implement account lockout after failed attempts
8. Add OAuth providers (Google, GitHub, etc.)
