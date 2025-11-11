# User Service

User authentication and management service with role-based access control. Built with Hono.js, TypeScript, and PostgreSQL.

## Features

- 🔐 JWT-based authentication with refresh tokens
- 👤 User registration, login, and profile management
- 🔒 Role-based access control
- 📊 Database health monitoring
- 📚 **Interactive API documentation (Swagger UI)**
- 🎯 Type-safe API with Zod validation
- 🚀 Built on Bun.js runtime

## Getting Started

### Option 1: Docker (Recommended - Everything Included)

**Start everything with one command:**
```sh
docker-compose up
```

This starts:
- PostgreSQL database
- RabbitMQ message queue  
- User Service API

Server will be available at http://localhost:3000

📖 **See [DOCKER.md](./DOCKER.md) for detailed Docker usage**

### Option 2: Local Development

**Requirements:** Bun.js, PostgreSQL

```sh
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env  # Configure your DATABASE_URL

# Run migrations
bun run db:migrate

# Start development server
bun run dev
```

Server will start at http://localhost:3000

### Database Commands

```sh
# Generate migrations
bun run db:generate

# Run migrations
bun run db:migrate

# Push schema changes
bun run db:push
```

## API Documentation

### Interactive Documentation (Swagger UI)
**🎯 http://localhost:3000/api/v1/ui**

Provides an interactive interface to:
- Browse all endpoints
- View request/response schemas
- Test APIs directly in the browser
- Authenticate and try protected endpoints

### OpenAPI Specification
**📄 http://localhost:3000/api/v1/doc**

Raw OpenAPI 3.0 JSON specification for:
- Importing into API clients (Postman, Insomnia)
- Generating client SDKs
- API testing automation

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/validate` - Validate token (protected)

### User Management (Protected)
- `GET /api/v1/auth/user` - Get user data
- `PATCH /api/v1/auth/update` - Update profile
- `DELETE /api/v1/auth/delete` - Delete account
- `GET /api/v1/auth/user/preferences` - Get preferences
- `GET /api/v1/auth/user/permissions` - Get permissions

### System
- `GET /api/v1/health` - Health check

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## Project Structure

```
src/
├── app.ts                  # Main application setup
├── server.ts              # Server entry point
├── controllers/           # Request handlers
├── services/             # Business logic
├── models/               # Database & validation schemas
├── routes/               # Route definitions
├── middleware/           # Auth & other middleware
├── docs/                 # OpenAPI documentation
└── utils/                # Logging & utilities
```

## Docker Deployment

### Quick Start
```bash
docker-compose up
```

This command starts:
- ✅ PostgreSQL (port 5432)
- ✅ RabbitMQ (ports 5672, 15672)  
- ✅ User Service (port 3000)

**Access Points:**
- API: http://localhost:3000/api/v1
- Swagger UI: http://localhost:3000/api/v1/ui
- RabbitMQ Management: http://localhost:15672 (admin/admin)

**Test Endpoints:**
```bash
./test-endpoints.sh
```

📖 **See [DOCKER.md](./DOCKER.md) for complete Docker guide**

## Documentation

For detailed API documentation, see [src/docs/README.md](src/docs/README.md)
