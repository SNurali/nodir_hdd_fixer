# 🚀 HDD Fixer - Deployment Guide

## ✅ Production Deployment (Docker Compose)

### Ports
- **API:** 3004
- **Web:** 3003

---

## 📍 Access URLs (example)
```
https://hddfix.uz/v1/health
https://hddfix.uz/api/docs
https://hddfix.uz/
```

---

## 🔑 Initial Admin (via seed)
Seed creates default users. Change passwords after first login.

---

## 🛠️ Management Commands

### Start/Restart Services:
```bash
# Docker Compose (prod)
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml down
```

### Logs:
```bash
# Docker logs
docker compose -f docker-compose.prod.yml logs -f
```

### Quick Start Script:
```bash
cd /home/yoyo/nodir_hdd_fixer
./start.sh
```

---

## 🔐 Firewall Status
```
Port 80/tcp  - ALLOW (HTTP)
Port 443/tcp - ALLOW (HTTPS)
```

---

## 📁 Project Location
```
/home/yoyo/nodir_hdd_fixer/
```

### Structure:
```
├── apps/api          # NestJS Backend (port 3004)
├── apps/web          # Next.js Frontend (port 3003)
├── packages/shared   # Shared code
├── docker-compose.yml
└── start.sh          # Startup script
```

---

## ⚙️ Configuration Files

### Nginx Config:
```
/etc/nginx/sites-available/hdd-fixer
```

### Systemd Service:
```
/etc/systemd/system/hdd-fixer-api.service
```

### Environment:
```
/path/to/nodir_hdd_fixer/.env.production
/path/to/nodir_hdd_fixer/.env.prod   # generated for Docker Compose
```

---

## 🌐 Domain Setup (Optional)

To use a custom domain:

1. **Buy a domain** (e.g., hdd-fixer.uz)

2. **Add DNS A-record:**
   ```
   Type: A
   Name: @
   Value: 195.158.24.137
   TTL: 3600
   ```

3. **Update Nginx config:**
   ```bash
   sudo nano /etc/nginx/sites-available/hdd-fixer
   ```
   Change: `server_name 195.158.24.137 _;`
   To: `server_name hdd-fixer.uz www.hdd-fixer.uz;`

4. **Update .env:**
   ```env
   APP_URL=https://hdd-fixer.uz
   WEB_URL=https://hdd-fixer.uz
   NEXT_PUBLIC_API_URL=https://hdd-fixer.uz/v1
   ```

5. **Restart services:**
   ```bash
   sudo systemctl restart nginx
   sudo systemctl restart hdd-fixer-api
   ```

6. **SSL (optional):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d hdd-fixer.uz -d www.hdd-fixer.uz
   ```

---

## 🧪 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /v1/health` | Health check |
| `GET /api/docs` | Swagger documentation |
| `POST /v1/auth/login` | Login |
| `POST /v1/auth/register` | Register |
| `GET /v1/orders` | Get orders |
| `POST /v1/orders` | Create order |

---

## 📊 Database

- **PostgreSQL:** localhost:5436
- **Database:** hdd_fixer_db
- **User:** hdd_fixer
- **Password:** hdd_fixer_secret

---

## 🔄 Rebuild & Deploy Updates

```bash
cd /home/yoyo/nodir_hdd_fixer

# Pull latest changes
git pull

# Prepare .env.prod (generates JWT secrets)
./scripts/prepare-prod-env.sh

# Deploy
docker compose -f docker-compose.prod.yml up -d --build

# Restart API
sudo systemctl restart hdd-fixer-api

# Check logs
journalctl -u hdd-fixer-api -f
```

---

## 🆘 Troubleshooting

### API not responding:
```bash
sudo systemctl status hdd-fixer-api
sudo journalctl -u hdd-fixer-api -n 50
```

### Nginx errors:
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/hdd-fixer-error.log
```

### Database connection issues:
```bash
docker-compose ps
docker-compose logs postgres
```

### Port already in use:
```bash
sudo lsof -i :3004
sudo kill -9 <PID>
sudo systemctl restart hdd-fixer-api
```

---

**Deployed:** March 10, 2026
**Server:** 195.158.24.137
