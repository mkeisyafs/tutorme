# TutorMe Production & Docker Deployment Guide

This document provides complete instructions for deploying **TutorMe** using Docker, Nginx, and Docker Compose.

---

## 🏗️ Architecture Overview

The production stack consists of three containerized services connected via an internal Docker bridge network:

```
[ User Browser / Client ]
            │
            ▼ (HTTP / Port 80, HTTPS / Port 443)
┌────────────────────────────────────────────────────────┐
│                   tutorme-frontend                     │
│               Nginx 1.27 Static Host                   │
│  - Serves React SPA (index.html, static assets)        │
│  - Client-side routing fallback                        │
│  - Security headers & Gzip compression                 │
│  - Reverse Proxy (/api/* -> tutorme-backend:5000)      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼ (Internal Docker Network)
┌────────────────────────────────────────────────────────┐
│                    tutorme-backend                     │
│                  Bun + ElysiaJS Server                 │
│  - REST API & OpenAPI / Swagger                        │
│  - Prisma ORM & Auth                                   │
│  - AI Service (OpenAI / Firecrawl integrations)        │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼ (Internal Database Connection)
┌────────────────────────────────────────────────────────┐
│                      tutorme-db                        │
│                  MariaDB 11 Database                   │
│  - Persistent data volume (mariadb_data)               │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart Deployment

### 1. Prerequisites
- [Docker](https://docs.docker.com/get-docker/) (v24.0+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.20+)

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your production secrets:

```bash
cp .env.example .env
```

Ensure you update:
- `DB_ROOT_PASSWORD` and `DB_PASSWORD`: Strong unique passwords.
- `JWT_SECRET`: Random high-entropy secret string.
- `AI_API_KEY`: API key for OpenAI (or compatible LLM provider).
- `FIRECRAWL_API_KEY`: Key for web crawling & research tools.

### 3. Build & Launch Containers

#### Development / Standard Stack:
```bash
docker compose up -d --build
```

#### Production Stack (with resource limits & log caps):
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## 🔍 Verification & Health Checks

### Check Container Status
```bash
docker compose ps
```

### Inspect Container Logs
```bash
# All logs
docker compose logs -f

# Backend logs only
docker compose logs -f backend

# Frontend/Nginx logs only
docker compose logs -f frontend
```

### Test API Endpoints
- **Frontend SPA**: `http://localhost/`
- **Nginx Health Check**: `http://localhost/nginx-health`
- **Backend API Health Check**: `http://localhost/api/health`
- **Swagger Documentation**: `http://localhost/api/swagger`

---

## 🔒 SSL / TLS Configuration (HTTPS)

For production deployments on public domains, set up SSL using Nginx with Certbot / Let's Encrypt:

### Option A: Certbot on Host Machine
1. Install Certbot and the Nginx plugin:
   ```bash
   sudo apt update && sudo apt install certbot python3-certbot-nginx
   ```
2. Point your domain DNS (A record) to your server IP.
3. Obtain certificate and automatically configure Nginx (if running Nginx directly on host as primary proxy) or map SSL certificates into the `frontend` container:
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com
   ```
4. Mount `/etc/letsencrypt` into `frontend` container volume in `docker-compose.yml` and update `frontend/nginx.conf` to listen on port 443 with TLS settings.

---

## 🗄️ Database Management & Maintenance

### Running Prisma Migrations Manually
The backend container runs `bunx prisma db push` automatically on startup. To run manual migrations or schema commands:

```bash
docker compose exec backend bunx prisma db push
```

### Creating Database Backups
```bash
docker compose exec db mysqldump -u tutorme -p"your_password" tutorme > backup_$(date +%Y%m%m_%H%M%S).sql
```

### Restoring Database Backup
```bash
docker compose exec -T db mysql -u tutorme -p"your_password" tutorme < backup.sql
```

---

## 🛠️ Management Commands

| Action | Command |
| :--- | :--- |
| **Start Stack** | `docker compose up -d` |
| **Stop Stack** | `docker compose down` |
| **Stop & Remove Volumes** | `docker compose down -v` |
| **Rebuild Images** | `docker compose build --no-cache` |
| **Restart Backend** | `docker compose restart backend` |
