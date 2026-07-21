# ---- Builder stage: compile TypeScript → dist/ ----
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

ARG APP_GIT_SHA=unknown
ENV APP_GIT_SHA=$APP_GIT_SHA

# Bundle server and migration script; externalize native/binary modules
RUN npm run build

# ---- Runner stage: production image (no devDependencies) ----
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ARG APP_GIT_SHA=unknown
ENV APP_GIT_SHA=$APP_GIT_SHA

# Install only production dependencies so externalized native modules are available
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/src/db/migrations ./dist/migrations

EXPOSE 4000

# Run migrations then start server — both are pre-compiled, no tsx needed
CMD ["sh", "-c", "node dist/migrate.js && node dist/run-manual-migrations.js && node dist/index.js"]
