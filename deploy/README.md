# Deployment boundary

This template intentionally contains no enabled production deployment workflow.
Create a client-specific workflow only after the client repository, domains,
server path, secrets, database, email sender, media storage, and payment accounts
have been provisioned.

`hostinger/docker-compose.yml` is a starting point. Copy the matching example
environment files, replace every `example.com` value, and validate the rendered
Compose configuration before connecting a server.

Never share databases, Docker project names, volumes, credentials, or deployment
paths between client stores. A client repository must deploy only its own commit
and must verify the deployed `/health` Git SHA.
