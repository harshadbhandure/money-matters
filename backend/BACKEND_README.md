# Backend - Splitwise-like App

NestJS backend with TypeORM for a minimal expense sharing application.

## Project Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── user/
│   │   │   ├── user.entity.ts
│   │   │   └── user.module.ts
│   │   ├── group/
│   │   │   ├── group.entity.ts
│   │   │   └── group.module.ts
│   │   ├── expense/
│   │   │   ├── expense.entity.ts
│   │   │   └── expense.module.ts
│   │   └── expense-split/
│   │       ├── expense-split.entity.ts
│   │       └── expense-split.module.ts
│   ├── migrations/
│   │   └── 1700000000000-InitialSchema.ts
│   ├── config/
│   │   └── database.config.ts
│   ├── ormconfig.ts
│   ├── app.module.ts
│   └── main.ts
├── .env.example
└── package.json
```

## Database Schema

### Entities

**User**
- id (uuid, primary key)
- email (unique)
- passwordHash
- name
- createdAt
- Relations: groups (ManyToMany), createdGroups (OneToMany), expenses (OneToMany)

**Group**
- id (uuid, primary key)
- name
- createdBy (User, ManyToOne)
- createdAt
- Relations: members (ManyToMany with User), expenses (OneToMany)

**Expense**
- id (uuid, primary key)
- group (Group, ManyToOne)
- paidBy (User, ManyToOne)
- amount (decimal)
- description
- date
- createdAt
- Relations: splits (OneToMany)

**ExpenseSplit**
- id (uuid, primary key)
- expense (Expense, ManyToOne)
- user (User, ManyToOne)
- share (decimal)
- paid (boolean)

## Environment Configuration

### Development (SQLite)
No configuration needed. The app uses `sqlite.db` in the project root by default.

### Production (PostgreSQL)
Create a `.env` file based on `.env.example`:

```env
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=money_matters
DB_SSL=false
```

## Installation

```bash
npm install
```

## Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

## Database Migrations

### Run Migrations
```bash
npm run migration:run
```

### Revert Last Migration
```bash
npm run migration:revert
```

### Generate New Migration
```bash
npm run migration:generate -- src/migrations/MigrationName
```

### Create Empty Migration
```bash
npm run migration:create -- src/migrations/MigrationName
```

### Synchronize Schema (Development Only)
```bash
npm run schema:sync
```

### Drop Schema
```bash
npm run schema:drop
```

## ORM Configuration

The app uses `ormconfig.ts` which automatically switches between:
- **SQLite** for development (`NODE_ENV !== 'production'`)
- **PostgreSQL** for production (`NODE_ENV === 'production'`)

### Key Features:
- Auto-discovery of entities in `modules/**/*.entity.ts`
- Auto-discovery of migrations in `migrations/*.ts`
- Synchronize enabled for SQLite (auto-creates tables)
- Synchronize disabled for PostgreSQL (use migrations)

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Endpoints

Default endpoint available at `http://localhost:3000`:
- GET `/` - Returns "Hello World!"

CORS is enabled for `http://localhost:4200` (Angular frontend).

## Development Notes

1. **SQLite Database**: The `sqlite.db` file is created automatically on first run
2. **Entity Changes**: With SQLite, schema changes are automatically synced
3. **Production**: Always use migrations for PostgreSQL, never enable synchronize
4. **UUIDs**: All primary keys use UUID v4 for better distribution

## Next Steps

1. Implement authentication (JWT, Passport)
2. Create services and controllers for each module
3. Add DTOs for request/response validation
4. Implement business logic for expense splitting
5. Add settlement calculation algorithms
6. Create API documentation with Swagger
