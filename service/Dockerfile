# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies (cached layer)
COPY package.json package-lock.json* ./
RUN npm ci

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source & build TypeScript
COPY . .
RUN npm run build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Copy only what's needed to run
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/prisma ./prisma

# Render uses PORT 10000 by default; the app reads process.env.PORT
ENV PORT=10000
EXPOSE 10000

CMD ["npm", "run", "start"]
