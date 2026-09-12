# shopflow-microservices-app

ShopFlow is a **microservices**-based e-commerce backend — five independent services, each owning one piece of the business: authentication, products, orders, and notifications. The whole thing runs on [NestJS](https://nestjs.com/), communicates over TCP and RabbitMQ, and spins up with a single Docker Compose command.

It's a learning project, but it's structured the way a real team would actually split a growing backend apart. Not a todo-list app. Not a single Express file. A real multi-service system with real trade-offs.

---

## What's inside

Five services, each doing exactly one job:

| Service | What it does |
|---|---|
| **api-gateway** | The only door to the outside world. Handles HTTP, checks JWTs, enforces roles, then forwards the request to the right service. |
| **auth-service** | Registers users, hashes passwords, issues JWTs. Nothing else. |
| **product-service** | Manages the product catalog and stock levels. |
| **order-service** | Creates orders. Calls product-service to reserve stock, then fires an event so other services can react. |
| **notification-service** | Listens for `order.created` events and sends a confirmation email. |

Each service has its own Postgres database. They don't share tables. They don't share connections. If you want data from another service, you ask it nicely over the network.

---

## How services talk to each other

There are two communication styles at play, and the choice between them is intentional:

**Synchronous (TCP)** — used when you genuinely need an answer before you can continue. The API gateway talks to auth, product, and order services this way. When a user logs in, you need to know if their credentials are valid *right now* before you can respond.

**Asynchronous (RabbitMQ)** — used when the work can happen in the background. After an order is saved, order-service publishes an `order.created` event and moves on. Notification-service picks it up a moment later and sends the email. Order-service has no idea notification-service even exists — and that's the point. You could add an analytics service or a fraud-check service that also listens to the same event, and nothing else would change.

Placing an order actually uses both patterns at once: a synchronous stock check (must succeed before the order is confirmed) followed by an asynchronous event (email delivery shouldn't be able to crash your checkout).

---

## Getting started

### The easy way — Docker Compose

You need Docker installed. That's it.

```bash
git clone <this-repo>
cd shopflow-microservices-app
docker compose up --build
```

This starts everything: three Postgres databases, RabbitMQ, MailHog (a local email inbox for testing), and all five services.

Once it's up:

- **API** → http://localhost:3000
- **Swagger docs** → http://localhost:3000/api/docs
- **RabbitMQ UI** → http://localhost:15672 (login: `guest` / `guest`)
- **MailHog inbox** → http://localhost:8025 (see confirmation emails land here)

---

### The dev way — running services individually

If you're actively changing code and don't want to rebuild Docker images on every change:

```bash
npm install
cp .env.example .env
```

Start just the infrastructure with Docker (databases, RabbitMQ, MailHog):

```bash
docker compose up auth-db product-db order-db rabbitmq mailhog
```

Then start each service in its own terminal (they all run in watch mode, so they reload on file changes):

```bash
npm run start:auth
npm run start:product
npm run start:order
npm run start:notification
npm run start:gateway
```

---

## Try it end to end

Once everything is running, paste these `curl` commands in order:

```bash
# 1. Create an account
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password123","fullName":"Your Name"}'

# 2. Log in — copy the accessToken from the response
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password123"}'

# 3. Create a product (admin only — see note below)
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":1200,"stock":10}'

# 4. Place an order
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"<product-id>","quantity":1}]}'
```

> **Creating products requires the admin role.** For local testing, promote your user directly in the database:
> ```sql
> UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
> ```
> Connect to `auth-db` on port `5433` with your Postgres client of choice.

After you place an order, watch the notification-service logs — you'll see it pick up the event. Then open MailHog at http://localhost:8025 and the confirmation email will be sitting there.

---

## Project structure

```
shopflow-microservices-app/
├── apps/
│   ├── api-gateway/          ← public HTTP entry point
│   ├── auth-service/         ← user accounts & JWTs
│   ├── product-service/      ← catalog & stock
│   ├── order-service/        ← order creation & events
│   └── notification-service/ ← email confirmations
├── libs/
│   └── common/               ← shared guards, DTOs, decorators, filters
├── test/                     ← end-to-end tests
├── docker-compose.yml
└── package.json
```

The `libs/common` folder is where things like `JwtAuthGuard`, `RolesGuard`, and the logging interceptor live. They're shared across services so you don't duplicate them.

---

## Authentication & roles

- Passwords are hashed with `bcrypt` before they're stored. Never plaintext.
- Login returns a short-lived **access token** (15 min) and a longer-lived **refresh token** (7 days).
- Every protected route on the gateway runs `JwtAuthGuard` first — if the token is invalid or missing, the request stops there and never reaches any service.
- Admin-only routes (like creating products) also run `RolesGuard`, which reads the role out of the JWT payload.

The order of guards in `@UseGuards(JwtAuthGuard, RolesGuard)` matters: auth runs first, role check runs second.

---

## Running tests

```bash
npm test              # unit tests — fast, no database needed
npm run test:cov      # unit tests with a coverage report
npm run test:e2e      # full end-to-end tests (requires Docker services to be running)
```

Unit tests mock the database layer entirely — they test business logic without touching Postgres. The e2e tests spin up the real gateway module and fire actual HTTP requests, so they need the backing services running.

---

## Environment variables

Copy `.env.example` to `.env` and adjust as needed for local development. When using Docker Compose, environment variables are set directly in `docker-compose.yml` and the `.env` file is only needed when running services outside of Docker.

Key variables:

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Signs and verifies all JWTs — change this before any real deployment |
| `RABBITMQ_URL` | Connection string for RabbitMQ |
| `SMTP_*` | Email settings (defaults to MailHog for local dev) |
| `*_DB_*` | Per-service Postgres connection details |

---

## Known limitations

This is a portfolio/learning project, not a production system. Here's what's intentionally simplified:

- **No distributed tracing** — there are correlation IDs in the logs, which is the foundation, but no OpenTelemetry yet.
- **No dead-letter queue** — if RabbitMQ is unavailable when order-service tries to publish an event, the event is lost. A real system would use the outbox pattern.
- **TypeORM `synchronize: true`** — fine for a demo, but a production service would use versioned migrations.
- **No circuit breaker** — if a downstream service is slow or down, the gateway will wait. A real system would add timeouts and fallbacks.


---

## Tech stack

- [NestJS](https://nestjs.com/) — framework for all services
- [TypeORM](https://typeorm.io/) + [PostgreSQL](https://www.postgresql.org/) — data persistence
- [RabbitMQ](https://www.rabbitmq.com/) — async messaging

- [JWT](https://jwt.io/) — stateless authentication
- [Nodemailer](https://nodemailer.com/) + [MailHog](https://github.com/mailhog/MailHog) — email (local dev)
- [Docker](https://www.docker.com/) + Docker Compose — containerization and orchestration
- [Jest](https://jestjs.io/) + [Supertest](https://github.com/ladjs/supertest) — testing

