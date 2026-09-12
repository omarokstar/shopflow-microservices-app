# Build: compile TS with devDeps, then throw this stage away
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
COPY nest-cli.json tsconfig*.json ./
RUN npm ci
COPY apps ./apps
COPY libs ./libs
RUN npx nest build notification-service

# Production: copy compiled output, install prod-only deps
FROM node:20-alpine AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /usr/src/app/dist/apps/notification-service ./dist

CMD ["node", "dist/apps/notification-service/src/main.js"]
