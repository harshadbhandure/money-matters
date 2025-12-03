# Money Matters - Full Stack Application

A full-stack web application with Angular frontend and NestJS backend.

## Project Structure

```
money-matters/
├── frontend/          # Angular 19.2.9 application
├── backend/           # NestJS application
├── package.json       # Root package.json with scripts
└── README.md          # This file
```

## Prerequisites

- Node.js (v22.19.0 or compatible)
- npm (v10.9.3 or compatible)
- Angular CLI 19.2.9

## Getting Started

### Installation

Install dependencies for both frontend and backend:

```cmd
npm run install:all
```

Or install them separately:

```cmd
npm run frontend:install
npm run backend:install
```

### Development

#### Start Both Applications

Start both frontend and backend in separate command prompts:

```cmd
npm run start:dev
```

This will open two command prompt windows:
- Frontend: http://localhost:4200
- Backend: http://localhost:3000

#### Start Applications Separately

**Frontend:**
```cmd
npm run frontend:start
```
The Angular app will run on http://localhost:4200

**Backend:**
```cmd
npm run backend:start:dev
```
The NestJS API will run on http://localhost:3000

### Build

Build both applications for production:

```cmd
npm run build:all
```

Or build them separately:

```cmd
npm run frontend:build
npm run backend:build
```

### Testing

**Frontend Tests:**
```cmd
npm run frontend:test
```

**Backend Tests:**
```cmd
npm run backend:test
```

## Available Scripts

### Root Level Scripts

- `npm run install:all` - Install dependencies for both frontend and backend
- `npm run start:dev` - Start both applications in development mode (separate windows)
- `npm run build:all` - Build both applications for production

### Frontend Scripts

- `npm run frontend:install` - Install frontend dependencies
- `npm run frontend:start` - Start Angular development server
- `npm run frontend:build` - Build Angular application
- `npm run frontend:test` - Run Angular tests

### Backend Scripts

- `npm run backend:install` - Install backend dependencies
- `npm run backend:start` - Start NestJS application
- `npm run backend:start:dev` - Start NestJS in watch mode
- `npm run backend:build` - Build NestJS application
- `npm run backend:test` - Run NestJS tests

## Frontend (Angular)

The frontend is built with Angular 19.2.9 and includes:
- Routing enabled
- CSS for styling
- TypeScript support

Navigate to `frontend/` directory for more details.

## Backend (NestJS)

The backend is built with NestJS and includes:
- RESTful API structure
- TypeScript support
- Testing setup with Jest

Navigate to `backend/` directory for more details.

## Configuration

### Frontend Configuration

The Angular app is configured to run on port 4200 by default. You can modify this in `frontend/angular.json`.

### Backend Configuration

The NestJS app is configured to run on port 3000 by default. You can modify this in `backend/src/main.ts`.

To enable CORS for frontend-backend communication, update `backend/src/main.ts`:

```typescript
app.enableCors({
  origin: 'http://localhost:4200',
  credentials: true,
});
```

## Next Steps

1. Configure environment variables for both applications
2. Set up database connections in the backend
3. Create API endpoints in NestJS
4. Create Angular services to consume the API
5. Implement authentication and authorization
6. Add shared models/interfaces between frontend and backend

## Troubleshooting

### PowerShell Execution Policy Issues

If you encounter execution policy issues with npm/npx commands, use `cmd /c` prefix or run commands directly in Command Prompt instead of PowerShell.

### Port Already in Use

If ports 3000 or 4200 are already in use, you can change them:
- Frontend: Modify `frontend/angular.json` or use `ng serve --port <PORT>`
- Backend: Modify `backend/src/main.ts`

## License

ISC
