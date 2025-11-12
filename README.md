# User Service

User authentication and management service. Built with Bun runtime, Hono, and PostgreSQL.



## Architecture

```mermaid
graph LR
    A[User Service<br/>Bun + Hono] --> B[(PostgreSQL<br/>Database)]
    A --> C[RabbitMQ<br/>Message Queue]
    A -.->|REST API| E[API Gateway]
    
    B -.->|Health Check| A
    C -.->|Events| D[Notification System]
    E -.->|Routes Requests| A
    
    style A fill:#4a90e2,stroke:#2e5c8a,stroke-width:2px,color:#fff
    style B fill:#336791,stroke:#1a3a5c,stroke-width:2px,color:#fff
    style C fill:#ff6600,stroke:#cc5200,stroke-width:2px,color:#fff
    style D fill:#42b883,stroke:#2a7555,stroke-width:2px,color:#fff
    style E fill:#9b59b6,stroke:#7d3c98,stroke-width:2px,color:#fff
```

**Components:**
- **User Service**: REST API handling authentication, user management, and event publishing
- **PostgreSQL**: Persistent storage for users, preferences, and refresh tokens
- **RabbitMQ**: Message broker for publishing user lifecycle events to other services

## 🚀 Live Deployment

**Live API**: https://user-service-td0phq.fly.dev/api/v1

**API Documentation**:
- **Scalar API Reference**: https://user-service-td0phq.fly.dev/api/v1/reference (Recommended - Modern UI)
- **Swagger UI**: https://user-service-td0phq.fly.dev/api/v1/ui (Classic interface)
- **OpenAPI Spec**: https://user-service-td0phq.fly.dev/api/v1/doc (Raw JSON)

## Features

- 🔐 JWT-based authentication with refresh tokens
- 👤 User registration, login, and profile management
- � User preferences and permissions management
- 📊 Database and RabbitMQ health monitoring
- � Event publishing to RabbitMQ for user lifecycle events
- 🎯 Type-safe API with Zod validation
- 🚀 Built on Bun.js runtime

## Getting Started

### Option 1: Docker (Recommended - Everything Included)

**Start everything with one command:**

(for background detached mode)
```sh
docker-compose up -d
```
or 

```sh
docker-compose up 
```

This starts:

- PostgreSQL (port 5432)
- User Service API (port 3000)

 This command starts:

- API: http://localhost:3000/api/v1
- Health: http://localhost:3000/api/v1/health
- Test Endpoints: ./test-endpoints.sh
- Scalar API Reference: http://localhost:3000/api/v1/reference
- Swagger UI: http://localhost:3000/api/v1/ui
- OpenAPI Spec: http://localhost:3000/api/v1/doc


**Note:** RabbitMQ is optional and connects to an external instance in the notification system.

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





## Environment Variables

Copy the example file and update with your credentials:

```bash
cp .env.example .env
```

**Required variables:**

- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_USER` - PostgreSQL username
- `POSTGRES_PASSWORD` - PostgreSQL password
- `POSTGRES_DB` - PostgreSQL database name
- `JWT_SECRET` - Secret key for access tokens (generate with `openssl rand -base64 32`)
- `REFRESH_TOKEN_SECRET` - Secret key for refresh tokens

**Optional variables:**

- `RABBITMQ_URL` - RabbitMQ connection URL (for event publishing)
- `NODE_ENV` - Application environment (default: development)
- `PORT` - Server port (default: 3000)



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




## RabbitMQ Integration

The user-service publishes events to RabbitMQ for user lifecycle tracking.

### Published Events

All events are published to the **`user-events`** exchange (type: `topic`):

| Event               | Routing Key                | Trigger             |
| ------------------- | -------------------------- | ------------------- |
| User Created        | `user.created`             | User registers      |
| User Logged In      | `user.logged_in`           | User logs in        |
| User Updated        | `user.updated`             | Profile modified    |
| Preferences Updated | `user.preferences_updated` | Preferences changed |
| User Deleted        | `user.deleted`             | Account deleted     |

### Configuration

Update `.env` with RabbitMQ credentials:

```env
RABBITMQ_URL=amqp://admin:secretpassword@rabbitmq:5672/%2F
```

To connect to an external RabbitMQ network, uncomment the network configuration in `docker-compose.yml`:

```yaml
networks:
  - notification-system-network # Uncomment this line
```

### Event Schema Example

```json
{
  "event": "user.created",
  "userId": "user_1731369600000",
  "email": "user@example.com",
  "name": "John Doe",
  "timestamp": "2025-11-12T00:00:00.000Z"
}
```

### Health Check

RabbitMQ status is included in the health endpoint:

```bash
curl http://localhost:3000/api/v1/health | jq .rabbitmq
```

**Note**: Events use a fire-and-forget pattern. If RabbitMQ is unavailable, events are logged as errors but user operations still succeed.
