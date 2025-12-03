---
applyTo: '**'
---

# Money Matters - Splitwise Clone Project

## Project Overview
This is a full-stack expense sharing application (similar to Splitwise) that allows groups of people to split expenses equally and track who owes whom. The application enables users to create groups, add expenses, and automatically calculate fair splits among group members.

## Tech Stack
- **Frontend**: Angular 19.2.9 with TypeScript
- **Backend**: NestJS with TypeScript
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: TypeORM
- **Authentication**: JWT-based auth with access & refresh tokens

## Architecture

### Backend Structure
The backend follows NestJS modular architecture with the following core modules:

#### 1. **User Module** ([`backend/src/modules/user/`](backend/src/modules/user/))
- Manages user accounts and profiles
- Entity: [`User`](backend/src/modules/user/user.entity.ts)
  - Properties: `id`, `email`, `passwordHash`, `name`, `createdAt`
  - Relations: Can belong to multiple groups, create groups, add expenses

#### 2. **Group Module** ([`backend/src/modules/group/`](backend/src/modules/group/))
- Manages expense sharing groups
- Entity: [`Group`](backend/src/modules/group/group.entity.ts)
  - Properties: `id`, `name`, `createdById`, `createdAt`
  - Relations: Has many members (Users), has many expenses, created by a user

#### 3. **Expense Module** ([`backend/src/modules/expense/`](backend/src/modules/expense/))
- Tracks expenses paid by group members
- Entity: [`Expense`](backend/src/modules/expense/expense.entity.ts)
  - Properties: `id`, `groupId`, `paidById`, `amount`, `description`, `date`, `createdAt`
  - Relations: Belongs to a group, paid by a user, has many splits

#### 4. **Expense Split Module** ([`backend/src/modules/expense-split/`](backend/src/modules/expense-split/))
- Handles individual share calculations for each expense
- Entity: [`ExpenseSplit`](backend/src/modules/expense-split/expense-split.entity.ts)
  - Properties: `id`, `expenseId`, `userId`, `share`, `paid`
  - Relations: Belongs to an expense, belongs to a user
  - Purpose: Tracks how much each person owes for a specific expense

#### 5. **Auth Module** ([`backend/src/modules/auth/`](backend/src/modules/auth/))
- Complete JWT authentication system
- Features: Register, login, token refresh, logout, logout all devices
- Security: Bcrypt password hashing, JWT access & refresh tokens
- See [`AUTH_README.md`](backend/AUTH_README.md) for detailed documentation

## Core Workflow

### 1. User Registration & Authentication
```
User registers → Password hashed → JWT tokens issued → User can access protected routes
```

### 2. Group Creation
```
Authenticated user creates group → User becomes group creator → Other users invited to join
```

### 3. Expense Sharing
```
User adds expense to group → Expense amount divided equally → ExpenseSplit records created for each member → Each member sees their share
```

### 4. Settlement Tracking
```
Member marks their split as paid → System tracks payment status → Group can see who has paid and who owes
```

## Database Schema

### Entity Relationships
```
User (1) ──creates──> (M) Group
User (M) ←──members──> (M) Group (many-to-many via group_members table)
Group (1) ──has──> (M) Expense
User (1) ──pays──> (M) Expense
Expense (1) ──splits──> (M) ExpenseSplit
User (1) ──owes──> (M) ExpenseSplit
```

### Key Tables
- **users**: User accounts with authentication
- **groups**: Expense sharing groups
- **group_members**: Junction table for group membership
- **expenses**: Individual expenses paid by users
- **expense_splits**: How each expense is divided among members
- **refresh_tokens**: Secure token storage for authentication

## Frontend Structure
- **Components**: Angular components for UI
- **Services**: HTTP services for backend API communication (see [`ApiService`](frontend/src/app/services/api.service.ts))
- **Routes**: Configured in [`app.routes.ts`](frontend/src/app/app.routes.ts)
- **Configuration**: CORS enabled for http://localhost:4200

## Development Guidelines

### When Creating New Features:

1. **Entity-First Approach**
   - Define TypeORM entities in respective module folders
   - Use UUID for primary keys
   - Establish proper relationships with decorators (@ManyToOne, @OneToMany, etc.)

2. **Module Structure**
   - Each feature has its own module folder
   - Include: entity, service, controller, module files, DTOs
   - Export necessary components through module

3. **Authentication**
   - All routes protected by default via global [`JwtAuthGuard`](backend/src/modules/auth/guards/jwt-auth.guard.ts)
   - Use `@Public()` decorator for public routes
   - Use `@CurrentUser()` decorator to access authenticated user

4. **Validation**
   - Use class-validator decorators in DTOs
   - Global validation pipe enabled in [`main.ts`](backend/src/main.ts)

5. **Database**
   - Development: SQLite with auto-sync enabled
   - Production: PostgreSQL with migrations (see [`ormconfig.ts`](backend/src/ormconfig.ts))
   - Use migrations for schema changes in production

### API Development
- Follow RESTful conventions
- Use proper HTTP status codes
- Implement proper error handling
- Document endpoints in controller files

### Testing
- Unit tests: Jest framework
- E2E tests: Supertest
- Test files: `*.spec.ts` for unit, `*.e2e-spec.ts` for E2E
- Auth module has comprehensive test coverage (see [`auth.service.spec.ts`](backend/src/modules/auth/auth.service.spec.ts))

## Environment Configuration

### Backend
```env
NODE_ENV=development|production
DB_HOST=localhost
DB_PORT=5432|3306
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=money_matters
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
```

### Frontend
- API endpoint: http://localhost:3000 (configured in [`ApiService`](frontend/src/app/services/api.service.ts))
- Dev server: http://localhost:4200

## Key Features to Implement

### Core Features (Splitwise Minimal)
- ✅ User authentication (register, login, logout)
- ✅ JWT token management with refresh
- ✅ Database schema with all entities
- ✅ ORM configuration for SQLite/PostgreSQL
- 🔲 Group creation and management
- 🔲 Adding members to groups
- 🔲 Creating expenses
- 🔲 Automatic equal split calculation
- 🔲 Marking expenses as paid
- 🔲 Viewing group balances
- 🔲 Settlement suggestions

### Future Enhancements
- Custom split ratios (not just equal)
- Expense categories
- Currency support
- Settlement history
- Group statistics
- Email notifications
- Mobile responsive design

## Code Style & Conventions

### TypeScript
- Use strict typing
- Avoid `any` type where possible
- Use interfaces for data structures
- Use decorators for metadata

### NestJS
- Use dependency injection
- Follow module-based architecture
- Use DTOs for request validation
- Use entities for database models

### Angular
- Use standalone components (Angular 19+)
- Use services for business logic
- Use RxJS for async operations
- Follow Angular style guide

## Important Files to Reference

### Backend Documentation
- [`AUTH_README.md`](backend/AUTH_README.md) - Authentication system documentation
- [`API_TESTING.md`](backend/API_TESTING.md) - API testing examples
- [`BACKEND_README.md`](backend/BACKEND_README.md) - Backend overview
- [`IMPLEMENTATION_SUMMARY.md`](backend/IMPLEMENTATION_SUMMARY.md) - Implementation details

### Configuration Files
- [`ormconfig.ts`](backend/src/ormconfig.ts) - Database configuration
- [`app.module.ts`](backend/src/app.module.ts) - Main application module
- [`main.ts`](backend/src/main.ts) - Application entry point

### Migration Files
- [`InitialSchema.ts`](backend/src/migrations/1700000000000-InitialSchema.ts) - Database schema migration

## Common Commands

### Development
```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend
npm run start:dev

# Start backend only (watch mode)
cd backend && npm run start:dev

# Start frontend only
cd frontend && npm start
```

### Testing
```bash
# Backend tests
cd backend && npm test

# Auth service tests
npm test -- auth.service.spec

# E2E tests
npm run test:e2e
```

### Database
```bash
# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert

# Generate migration
npm run migration:generate -- src/migrations/MigrationName
```

## Security Considerations

1. **Passwords**: Hashed with bcrypt (10 rounds)
2. **JWT Tokens**: Short-lived access tokens (15 min), long-lived refresh tokens (7 days)
3. **Token Storage**: Refresh tokens hashed in database
4. **CORS**: Configured for frontend origin only
5. **Validation**: Global validation pipe prevents invalid data
6. **Authorization**: JWT guard protects all routes by default

## When Working on This Project

### For Backend Development:
1. Check existing entities in [`backend/src/modules/`](../../backend/src/modules/)
2. Follow the module pattern (entity → service → controller → module)
3. Use TypeORM decorators for relationships
4. Implement proper error handling
5. Write tests for new services

### For Frontend Development:
1. Create services to consume backend APIs
2. Use Angular HttpClient for HTTP requests
3. Handle authentication tokens in requests
4. Implement proper error handling
5. Follow Angular best practices

### For Database Changes:
1. Modify entities in respective modules
2. Generate migrations for production
3. Test with SQLite in development
4. Verify with PostgreSQL before production

## Project Context
This is a minimal expense splitting application where:
- Users create groups with friends/roommates
- Members add expenses to the group
- System automatically calculates equal splits
- Members can see who owes what
- Settlements are tracked when debts are paid

The focus is on simplicity and core functionality, providing a foundation that can be extended with more advanced features later.