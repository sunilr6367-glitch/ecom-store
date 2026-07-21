# Canonical Bug — Root Cause Investigation

## Step 1: Deployment Architecture
Based on `.github/workflows/deploy-hostinger.yml`, `deploy/hostinger/deploy.sh`, and `deploy/hostinger/docker-compose.yml`:
- Both `kvastram.com` and `odhvica.com` are served by the **SAME Next.js build and deployment**.
- The CI pipeline logs into the single VPS (`2.24.193.227`), resets the checkout, and runs `docker compose build` and `docker compose up`.
- There is only one Next.js Node process serving all traffic, mapped to `127.0.0.1:3000`, which is then likely exposed to both domains via Nginx or another reverse proxy.

## Step 2 & 3: The Contradiction & Mechanism
You asked how production can show `kvastram.com` as canonical if the repo's `.env.production` has no override and the code fallback is `https://odhvica.com`.

Here is the exact mechanism causing this bug:

1. **VPS Manual Modification**: The `.env.production` file on the VPS was likely modified manually to include `NEXT_PUBLIC_SITE_URL=https://kvastram.com`. (Since `deploy.sh` does `git reset --hard` but ignores untracked/ignored files like `.env`, this manual change persists).
2. **Docker Build Context**: During deployment, `docker-compose.yml` runs a build. The `Dockerfile` executes `COPY . .`, which copies the VPS's local `.env.production` directly into the Docker build context.
3. **Next.js Build-Time Inlining**: During `RUN npm run build`, Next.js natively loads `.env.production`. Because the variable is prefixed with `NEXT_PUBLIC_`, Next.js/Webpack **statically inlines** the value `https://kvastram.com` into the compiled javascript bundle during the build phase.
4. **The Multi-Domain Bug**: Because the value is hard-baked into the bundle at build time, the single Node.js process serves `https://kvastram.com` as the canonical URL for **every request**, regardless of whether the user visited `kvastram.com` or `odhvica.com`.

## Conclusion
The previously proposed fix (setting `NEXT_PUBLIC_SITE_URL=kvastram.com` in the repo) would indeed make things worse by hard-coding this incorrect architecture into version control, permanently breaking SEO for `odhvica.com`. 

Because a single Next.js instance is serving multiple domains, canonical URLs **cannot** rely on build-time `NEXT_PUBLIC_` variables. They must be resolved dynamically at request time using the incoming `Host` or `x-forwarded-host` headers.
