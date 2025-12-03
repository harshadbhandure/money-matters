# Authentication API Test Examples

## Using cURL

### 1. Register a new user
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `accessToken` and `refreshToken` from the response.

### 3. Access Protected Route
```bash
curl http://localhost:3000/protected-route \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Refresh Token
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 5. Logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 6. Logout All Sessions
```bash
curl -X POST http://localhost:3000/auth/logout-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Using HTTPie

### Register
```bash
http POST http://localhost:3000/auth/register \
  email=test@example.com \
  password=password123 \
  name="Test User"
```

### Login
```bash
http POST http://localhost:3000/auth/login \
  email=test@example.com \
  password=password123
```

### Protected Route
```bash
http GET http://localhost:3000/protected-route \
  "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Using Postman

1. Create a new collection "Auth API"
2. Set base URL: `http://localhost:3000`

### Environment Variables
Create environment with:
- `baseUrl`: http://localhost:3000
- `accessToken`: (will be set automatically)
- `refreshToken`: (will be set automatically)

### Scripts

**Login Request - Tests Tab:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("accessToken", response.accessToken);
    pm.environment.set("refreshToken", response.refreshToken);
}
```

**Protected Routes - Authorization Tab:**
- Type: Bearer Token
- Token: `{{accessToken}}`

## Testing Flow

1. **Register** → Get tokens
2. **Login** → Get new tokens
3. **Access Protected Route** → Use access token
4. **Wait 15+ minutes** → Access token expires
5. **Try Protected Route** → Should fail (401)
6. **Refresh Token** → Get new token pair
7. **Access Protected Route** → Should work
8. **Logout** → Invalidate refresh token
9. **Try Refresh** → Should fail (401)

## Expected Responses

### Success Response (200/201)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

### Error Response (400/401/409)
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid credentials"
}
```
