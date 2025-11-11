# Docker Deployment Guide

## Quick Start (One Command)

```bash
docker-compose up
```

That's it! The service will be available at:

- **API:** http://localhost:3000/api/v1
- **Swagger UI:** http://localhost:3000/api/v1/ui
- **OpenAPI Spec:** http://localhost:3000/api/v1/doc
- **Health Check:** http://localhost:3000/api/v1/health

**RabbitMQ Management UI:** http://localhost:15672

- Username: `admin`
- Password: `admin`

## What Gets Started

The `docker-compose up` command starts 3 services:

1. **PostgreSQL** - Database on port 5432
2. **RabbitMQ** - Message queue on ports 5672 (AMQP) and 15672 (UI)
3. **User Service** - Your API on port 3000

All services are networked together automatically.

## Commands

### Start Everything

```bash
docker-compose up
```

### Start in Background (Detached Mode)

```bash
docker-compose up -d
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f user-service
docker-compose logs -f postgres
docker-compose logs -f rabbitmq
```

### Stop Everything

```bash
docker-compose down
```

### Stop and Remove Volumes (Clean Slate)

```bash
docker-compose down -v
```

### Rebuild After Code Changes

```bash
docker-compose up --build
```

### Run Database Migrations

```bash
# Make sure services are running first
docker-compose up -d

# Run migrations
docker-compose exec user-service bun run db:migrate
```

## Database Access

### Connect to PostgreSQL

```bash
# From host machine
psql postgresql://postgres:postgres@localhost:5432/userservice

# From inside container
docker-compose exec postgres psql -U postgres -d userservice
```

### Connection String

```
postgresql://postgres:postgres@localhost:5432/userservice
```

## Environment Variables

Default environment variables are set in `docker-compose.yml`:

```yaml
DATABASE_URL: postgresql://postgres:postgres@postgres:5432/userservice
RABBITMQ_URL: amqp://admin:admin@rabbitmq:5672
JWT_SECRET: your-super-secret-jwt-key-change-in-production
```

### Override for Production

Create a `.env` file (git-ignored):

```env
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host:5432/prod-db
RABBITMQ_URL=amqps://prod-user:prod-pass@prod-rabbit:5671
JWT_SECRET=super-secure-random-string-here
```

Then use:

```bash
docker-compose --env-file .env up
```

## Development Workflow

### 1. Clone and Start

```bash
git clone <your-repo>
cd user-service
docker-compose up
```

### 2. Make Code Changes

The container will automatically restart when you rebuild:

```bash
docker-compose up --build
```

### 3. Database Operations

```bash
# Generate migration
docker-compose exec user-service bun run db:generate

# Run migration
docker-compose exec user-service bun run db:migrate
```

## Troubleshooting

### Port Already in Use

If you get "port already allocated" error:

```bash
# Check what's using the port
lsof -i :3000
lsof -i :5432
lsof -i :5672

# Kill the process or change port in docker-compose.yml
```

### Database Connection Issues

```bash
# Check if postgres is healthy
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres
```

### Service Won't Start

```bash
# Clean everything and start fresh
docker-compose down -v
docker-compose up --build
```

### View Container Logs

```bash
docker-compose logs user-service
```

## Production Deployment

For production, you should:

1. **Change default passwords** in docker-compose.yml
2. **Use environment variables** or secrets management
3. **Enable SSL/TLS** for database and RabbitMQ
4. **Set up proper networking** and firewall rules
5. **Use persistent volumes** with backups
6. **Monitor logs** and metrics

### Production docker-compose.prod.yml Example

```yaml
version: "3.8"
services:
  user-service:
    image: your-registry/user-service:latest
    environment:
      DATABASE_URL: ${DATABASE_URL}
      RABBITMQ_URL: ${RABBITMQ_URL}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    restart: always
```

## Cleanup

### Remove All Containers and Volumes

```bash
docker-compose down -v --remove-orphans
```

### Remove Images

```bash
docker-compose down --rmi all
```

### Full Cleanup (Nuclear Option)

```bash
docker-compose down -v --rmi all --remove-orphans
docker system prune -a --volumes
```

## Testing the Setup

After starting with `docker-compose up`, test the endpoints:

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Signup
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "preferences": {
      "email_enabled": true,
      "push_enabled": true,
      "language": "en"
    }
  }'

# Check RabbitMQ UI
open http://localhost:15672
```

## Network Architecture

```
┌─────────────────────────────────────────────────┐
│  Docker Network: user-service-network           │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  PostgreSQL  │  │   RabbitMQ   │            │
│  │  :5432       │  │  :5672       │            │
│  └──────┬───────┘  └──────┬───────┘            │
│         │                  │                     │
│         └────────┬─────────┘                    │
│                  │                               │
│         ┌────────▼───────┐                      │
│         │  User Service  │                      │
│         │  :3000         │                      │
│         └────────────────┘                      │
└─────────────────────────────────────────────────┘
         │
         │ Port Mapping
         ▼
  Host Machine
  localhost:3000  → User Service
  localhost:5432  → PostgreSQL
  localhost:5672  → RabbitMQ (AMQP)
  localhost:15672 → RabbitMQ (UI)
```

## Data Persistence

Your data is stored in Docker volumes:

- `postgres_data` - Database files
- `rabbitmq_data` - Queue data

These persist even when containers are stopped. To remove them:

```bash
docker-compose down -v
```
