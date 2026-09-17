# StockWell — Collective Purchasing for Stokvels

StockWell is a Vue + Node/Express + MySQL application for Stokvel members to contribute to a shared group wallet, propose purchases, vote on proposals, and complete authorised group orders.

## Architecture

```text
Member contribution
        ↓
   Stokvel wallet
        ↓
 Product proposal
        ↓
    Member vote
        ↓
     Approved
        ↓
 Officer authorisation
        ↓
 Group order + delivery
```

A normal member does **not** directly spend the shared wallet from the shopping cart. The cart creates a purchase proposal; members vote; an authorised Stokvel officer completes the purchase subject to stock and wallet checks.

## Tech stack

- Frontend: Vue 3 + Vite + Vue Router + Axios
- Backend: Node.js + Express + MySQL (`mysql2`)
- Authentication: JWT + bcryptjs
- Payments: PayFast contribution flow with ITN validation
- Styling: StockWell global CSS theme with light/dark mode

## Roles

There are two role layers:

### Company/platform role

Stored in `users.role`:

- `member`
- `admin`

### Stokvel role

Stored in `stokvel_member_roles.stokvel_role`:

- `MEMBER`
- `CHAIRPERSON`
- `TREASURER`

Chairperson and Treasurer are therefore assigned to a specific Stokvel rather than being company-wide user roles.

The current application model uses **one Stokvel membership per user**.

## Main application areas

- Login / sign-up / password reset
- Home and catalogue
- Cart and group basket
- Stokvel payment/contributions
- Purchase proposals and voting
- Member dashboard
- Member delivery addresses
- Order history and tracking
- Admin dashboard
- Admin user and Stokvel management
- Analytics and administrator audit log

## Installation

### Prerequisites

- Node.js 18+
- MySQL 8+
- Git

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default: `http://localhost:5173`

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend default: `http://localhost:4040`

The frontend API service uses `VITE_API_URL` when provided; otherwise it defaults to `http://localhost:4040`.

## Database setup

The live Aiven database must **not** be rebuilt from `backend/sql/schema.sql`.

See [`backend/sql/README.md`](backend/sql/README.md) for the authoritative migration order.

The current live migration sequence is:

1. `backend/sql/integration_hardening.sql`
2. `backend/sql/stokvel_delivery_addresses.sql`
3. `backend/sql/final_hardening.sql`

The final migration is intentionally defensive: it preserves existing Stokvel officer assignments, attributes new contributions to their paying user, and refuses to add the one-Stokvel constraint if conflicting memberships already exist.

## Environment

Backend configuration is read from `backend/.env`. Use `backend/.env.example` as the variable reference and never commit real credentials, PayFast secrets, database passwords, JWT secrets, or private certificates.

For deployments behind a reverse proxy, set `TRUST_PROXY` to the correct proxy count or `true` when appropriate so PayFast source-IP validation receives the real client IP.

## Important legacy SQL

`backend/sql/schema.sql`, `backend/sql/stokvel_features.sql`, and `backend/sql/stokvel_governance_payfast.sql` are retained for historical/reference purposes. They are **not** the current live-database migration path.
