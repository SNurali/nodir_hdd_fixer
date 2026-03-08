# Deployment Guide for Repair Service Management System

This guide outlines the steps needed to deploy the NestJS API and Next.js Web applications to a production server using Docker Compose.

## Prerequisites

Ensure the target server has the following installed:
- [Docker](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Git (or another way to copy files to the server)

## 1. Clone the Repository

First, obtain the source code on your production server:

```bash
git clone <your-repo-url> nodir_hdd_fixer
cd nodir_hdd_fixer
```

## 2. Set Up Environment Variables

Create a production `.env.prod` file in the root directory:

```bash
cp .env.example .env.prod
```

Edit `.env.prod` to ensure it contains secure, production-ready values. **Crucially**, make sure:
- `DB_HOST=postgres`
- `REDIS_HOST=redis`
- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/v1` (If using a domain, set this to your API's public URL)
- JWT Secrets and secure passwords should be safely generated and assigned.
- Change `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` to match. 

The `docker-compose.prod.yml` file is configured to pick up both inline configuration defaults and values from `.env.prod`.

## 3. Build and Start the Application

You can spin up the entire application stack using Docker Compose. Since our stack relies on multi-stage `Dockerfile` configurations in root contexts, `docker-compose.prod.yml` takes care of this.

```bash
# Build the Docker images and start in detached mode
docker compose -f docker-compose.prod.yml up -d --build
```

**What this does:**
1. Starts the `postgres` and `redis` services.
2. Waits for databases to become healthy.
3. Builds and starts the NestJS `api` service (exposed on port `3004`).
4. Builds and starts the Next.js `web` service (exposed on port `3003`).

You can check logs for standard output:
```bash
docker compose -f docker-compose.prod.yml logs -f
```

## 4. Run Database Migrations and Seed Database

Since the NestJS backend handles database migrations, you can execute them directly within the running `api` container.

```bash
docker exec -it hdd_fixer_api_prod sh -c "cd apps/api && npm run migration:run"
```

If you have a database seed script, you can run it via:
```bash
docker exec -it hdd_fixer_api_prod sh -c "cd apps/api && npm run seed"
```

## 5. Setting Up a Reverse Proxy (Optional, Recommend for Production)

For true production deployments using a domain, it's highly recommended to place Nginx or Caddy in front of your Web and API services to handle SSL (HTTPS) and route traffic smoothly.

### Nginx Example
Install `nginx` and `certbot` for Let's Encrypt SSL certificates.
Create your server blocks pointing to:
- `app.yourdomain.com` -> `http://localhost:3003`
- `api.yourdomain.com` -> `http://localhost:3004`

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Once running and exposed naturally natively, you have completed the deployment process!

## Troubleshooting
- **API 502 Bad Request**: Check if API started properly (`docker compose -f docker-compose.prod.yml logs api`).
- **Database Connection Error**: Verify `DB_HOST=postgres` in `.env.prod`.
- **CORS Errors**: Ensure that the `CORS_ORIGINS` in your NestJS API `.env.prod` allows the public custom URL of your frontend.
