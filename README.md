# Kvastram Commerce Template

Reusable ecommerce platform containing a Next.js storefront, Next.js admin panel,
and Hono/PostgreSQL backend.

## Applications

| Application | Local URL | Directory |
| --- | --- | --- |
| Storefront | `http://localhost:3100` | `storefront/` |
| Admin | `http://localhost:3101` | `admin/` |
| API | `http://localhost:4100` | `backend/` |

## Start a client project

1. Create a new private repository from this template.
2. Copy each `.env.example` to its local or production counterpart.
3. Replace every `example.com` value and configure the client identity variables.
4. Create an independent database, media store, email sender, payment accounts, and
   deployment target. Never reuse another client's credentials or volumes.
5. Run `npm run setup`, then start each application with the root `dev:*` commands.

## Root commands

```text
npm run setup
npm run dev:backend
npm run dev:storefront
npm run dev:admin
npm run lint
npm run test
npm run build
```

Production deployment is intentionally disabled. Read `deploy/README.md` before
creating a client-specific workflow.

## White-label contract

Client identity must be supplied through environment files. Application source must
not contain a previous client's name, domain, email, media namespace, or credentials.
Run `npm run audit:white-label` before every client fork and template merge.

The audit intentionally excludes immutable historical database migrations. Fresh
clients use a new database, run migrations, and then apply reviewed client settings
and content. Legal seed data is blocked until `STORE_NAME`, `SUPPORT_EMAIL`, and
`ALLOW_TEMPLATE_LEGAL_SEED=true` are explicitly supplied after client review.

Store identity, contacts, currency, payment logo, API URL, and social links are
environment-backed. Catalog, homepage campaigns, navigation, editorial copy, legal
pages, and merchandising content belong in the admin/CMS. Client-specific visual
work remains in storefront tokens and components.
