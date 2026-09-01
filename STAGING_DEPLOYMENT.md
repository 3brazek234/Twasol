# Staging Deployment Guide

To deploy the backend, database, and Redis to a staging VPS (like Hetzner, DigitalOcean, or AWS EC2), follow these steps:

1. **Provision a Server**: Ubuntu 22.04 LTS (minimum 2GB RAM recommended).
2. **Install Docker & Docker Compose**:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo apt install -y docker-compose
   ```
3. **Clone the Repository**:
   ```bash
   git clone <your-repo-url> /opt/wakeel
   cd /opt/wakeel
   ```
4. **Set up Environment Variables**:
   Create a `.env` file in the root directory (or inside the `service` directory depending on how you build):
   ```env
   NODE_ENV=production
   PORT=3000
   DATABASE_URL="postgresql://postgres:postgres@postgres:5432/lawyer_marketplace"
   REDIS_URL="redis://redis:6379"
   JWT_SECRET="your-secure-secret-here"
   JWT_REFRESH_SECRET="your-secure-refresh-secret-here"
   
   # Cloudflare R2 Credentials
   R2_ACCOUNT_ID="your-r2-account-id"
   R2_ACCESS_KEY_ID="your-access-key"
   R2_SECRET_ACCESS_KEY="your-secret-key"
   R2_BUCKET_NAME="wakeel-staging"
   ```
5. **Update `docker-compose.yml` for Staging**:
   Currently, your `docker-compose.yml` is set up for local development (mounting volumes and using `NODE_ENV=development`). 
   Create a `docker-compose.prod.yml` or modify the existing one to:
   - Remove the `volumes: - ./service:/app` mapping for the `app` service so it uses the built Docker image.
   - Change `NODE_ENV: production`.
   - Add a command to run Prisma migrations automatically on startup: `command: sh -c "npx prisma db push --accept-data-loss && npm run start"`.

6. **Start the Stack**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

Your backend API and WebSocket server will now be listening on port 3000. Use a reverse proxy like Nginx or Caddy to expose it via HTTPS.
