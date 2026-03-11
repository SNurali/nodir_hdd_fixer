# 🚀 HDD Fixer - Deployment Guide

## ✅ Setup Complete

### Server Information
- **Public IP:** `195.158.24.137`
- **API Port:** 3004
- **Nginx Port:** 80

---

## 📍 Access URLs

### Local (on server):
```
http://localhost/v1/health
http://localhost/api/docs
http://localhost/
```

### External (from internet):
```
http://195.158.24.137/v1/health
http://195.158.24.137/api/docs
http://195.158.24.137/
```

---

## 🔑 Default Credentials
```
Email: admin@hdd-fixer.uz
Password: admin123
```

---

## 🛠️ Management Commands

### Start/Restart Services:
```bash
# API (systemd)
sudo systemctl start hdd-fixer-api
sudo systemctl stop hdd-fixer-api
sudo systemctl restart hdd-fixer-api
sudo systemctl status hdd-fixer-api

# Nginx
sudo systemctl start nginx
sudo systemctl restart nginx
sudo systemctl status nginx

# Docker (PostgreSQL, Redis)
cd /home/yoyo/nodir_hdd_fixer
docker-compose up -d
docker-compose ps
docker-compose down
```

### Logs:
```bash
# API logs
journalctl -u hdd-fixer-api -f

# Nginx logs
tail -f /var/log/nginx/hdd-fixer-access.log
tail -f /var/log/nginx/hdd-fixer-error.log

# Docker logs
docker-compose logs -f
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
/home/yoyo/nodir_hdd_fixer/.env
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

# Pull latest changes (if using git)
git pull

# Install dependencies
npm install

# Rebuild API
npm run build:api

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
