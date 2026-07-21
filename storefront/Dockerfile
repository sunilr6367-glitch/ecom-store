FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# NEXT_PUBLIC_* vars must be baked in at build time for client-side code.
# Pass via docker-compose build.args or --build-arg on the CLI.
ARG NEXT_PUBLIC_API_URL="http://localhost:4000"
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID=""
ARG APP_GIT_SHA="unknown"
ENV NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}"
ENV NEXT_PUBLIC_RAZORPAY_KEY_ID="${NEXT_PUBLIC_RAZORPAY_KEY_ID}"
ENV APP_GIT_SHA="${APP_GIT_SHA}"

RUN npm run build

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ARG APP_GIT_SHA=unknown
ENV APP_GIT_SHA=$APP_GIT_SHA

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
