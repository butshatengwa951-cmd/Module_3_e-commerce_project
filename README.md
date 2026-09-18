# StockWell

> **Collective purchasing and Stokvel management platform**

StockWell is a full-stack e-commerce application built for Stokvels. It allows members to contribute money to a shared wallet, browse products, compare supplier prices, build a group basket, submit purchase proposals, vote on purchases, and manage deliveries and orders.

---

## Table of Contents

- [Project Overview](#project-overview)
- [How StockWell Works](#how-stockwell-works)
- [Checkout and Group Proposal Flow](#checkout-and-group-proposal-flow)
- [Key Features](#key-features)
- [Roles](#roles)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Payment Flow](#payment-flow)
- [API Structure](#api-structure)
- [Testing](#testing)
- [Responsive Design](#responsive-design)
- [Security](#security)
- [Development Workflow](#development-workflow)

---

## Project Overview

StockWell combines **e-commerce, Stokvel governance and group payments** into one application.

The main purchasing workflow is:

```text
Member
   |
   v
Browse Catalogue
   |
   v
Add Products to Cart
   |
   v
Create Purchase Proposal
   |
   v
Members Vote
   |
   v
Proposal Approved
   |
   v
Authorised Stokvel Officer
   |
   +---- Check Wallet
   +---- Check Stock
   |
   v
Confirm Group Order
   |
   v
Delivery & Tracking
```

Contributions are handled separately through the PayFast payment flow described in the **Payment Flow** section.

---

## How StockWell Works

### 1. Members contribute

Members can make contributions through PayFast checkout. When PayFast confirms the transaction, StockWell updates the shared Stokvel wallet and records the contribution.

### 2. Members shop

Members browse the product catalogue, view product images, compare supplier prices, and add products to the group basket.

### 3. Members propose purchases

The cart feeds into the purchase-proposal system. An ordinary member does not directly spend the shared Stokvel wallet from the cart.

### 4. Members vote

Members review proposals and vote on whether the group should make the purchase.

### 5. Approved purchases are processed

Once a proposal is approved, the authorised Stokvel workflow checks the wallet, stock and order requirements before the group order is processed.

### 6. Orders are fulfilled

Orders can then move through delivery, tracking and order-history functionality.

---

## Checkout and Group Proposal Flow

StockWell separates **shopping** from **spending the shared Stokvel wallet**. A member can build a cart and request a group purchase, but the purchase only moves forward after the Stokvel proposal and approval process.

### Product checkout flow

```text
Member browses catalogue
        |
        v
Selects a product
        |
        v
Chooses supplier / available price
        |
        v
Adds product to cart
        |
        v
Reviews cart
        |
        v
Continues to group proposal
        |
        v
Creates purchase proposal
```

At checkout, the member reviews the selected products, quantities, supplier pricing and total before submitting the purchase as a group proposal. The cart therefore becomes the starting point for the Stokvel approval process rather than immediately spending shared funds.

### Adding a group proposal

When a member wants the Stokvel to purchase the items in the cart:

1. The member adds the required products to the cart.
2. The member reviews quantities, supplier prices and the total.
3. The member starts the group purchase/proposal process.
4. StockWell creates the proposal in **VOTING** status.
5. The proposal has a voting deadline of 48 hours.
6. The proposal is made available to the Stokvel members for review and voting.

### How the voting system works

The voting system uses a **strict majority of the current Stokvel membership**.

A proposal requires **more than half of all current Stokvel members to vote APPROVE** before the Chairperson can approve it. The calculation is:

```text
Required approval votes = floor(total members / 2) + 1
```

Examples:

| Stokvel members | Minimum APPROVE votes |
|---:|---:|
| 3 | 2 |
| 4 | 3 |
| 5 | 3 |
| 6 | 4 |
| 7 | 4 |
| 10 | 6 |

The proposal must also have **more APPROVE votes than REJECT votes**. A normal member cannot perform the Chairperson approval action, and a Chairperson cannot approve a proposal unless the required majority has been reached.

Each member can cast one vote per proposal. If a member changes their vote while voting is open, the existing vote is updated rather than creating another vote for that member.

### Who does what?

```text
MEMBER
  |
  +--> Add products to cart
  |
  +--> Create purchase proposal
  |
  +--> Review / vote APPROVE or REJECT
  |
  v
MAJORITY REACHED
  |
  v
CHAIRPERSON
  |
  +--> Formally approves proposal
  |
  v
APPROVED
  |
  v
TREASURER
  |
  +--> Authorises purchase
  +--> Checks wallet balance
  +--> Checks product stock
  +--> Releases group wallet funds
  |
  v
ORDERED
  |
  v
Delivery & order tracking
```

### Approving a group proposal

The governance chain is deliberately separated:

1. **Any Stokvel member** can create a purchase proposal from the group basket.
2. **Stokvel members** review the proposal and vote APPROVE or REJECT.
3. The proposal must obtain a **strict majority of the current Stokvel membership** before it can be approved.
4. The **Chairperson** then performs the formal proposal approval.
5. The proposal changes from **VOTING** to **APPROVED**.
6. The **Treasurer** then authorises the approved purchase.
7. The Treasurer must be a different person from the Chairperson.
8. During authorisation, StockWell checks product stock and the Stokvel wallet balance.
9. If those checks pass, the order is created, the wallet is debited, stock is reduced, delivery records are created, and the proposal changes to **ORDERED**.

This means the process is not simply **cart -> checkout -> payment**. It is a governed group-purchasing workflow:

**Cart -> Proposal -> Member Voting -> Majority -> Chairperson Approval -> Treasurer Authorisation -> Wallet/Stock Checks -> Order -> Delivery.**

The proposal process therefore provides a governance step between **adding products to the cart** and **using the shared Stokvel funds**.

---

## Key Features

### Member Features

- Registration, login and logout
- Password reset
- Persisted authentication sessions
- Product catalogue and search
- Product filtering
- Product images
- Shopping cart / group basket
- Supplier-price comparison
- Stokvel contributions
- PayFast contribution checkout
- Shared Stokvel wallet
- Contribution history
- Purchase proposals
- Member voting
- Group decision workflow
- Member dashboard
- Profile management
- Delivery address management
- Order history
- Reorder functionality
- Delivery tracking
- Suggestions and feedback

### Admin Features

- Protected admin dashboard
- Company-wide operational overview
- User management
- Stokvel management
- Product and catalogue management
- Supplier-price management
- Company-wide order management
- Delivery management
- Suggestions review
- Admin profile
- Administrator audit log

---

## Roles

StockWell has two separate role systems.

### Platform Role

Stored in `users.role`.

| Role | Purpose |
|---|---|
| `member` | Normal StockWell user |
| `admin` | Company-wide administration |

### Stokvel Role

Stored in `stokvel_member_roles.stokvel_role`.

| Role | Purpose |
|---|---|
| `MEMBER` | Standard Stokvel member |
| `CHAIRPERSON` | Stokvel leadership and approval responsibilities |
| `TREASURER` | Stokvel financial responsibilities |

The platform `admin` role and the Stokvel roles are separate. The current application model uses **one Stokvel membership per user**.

---

## Technology Stack

### Frontend

- Vue 3
- Vite
- Vue Router
- Pinia
- Axios
- Bootstrap
- Shared responsive/mobile styling
- Light/dark interface styling

### Backend

- Node.js
- Express 5
- MySQL 8+
- mysql2
- JWT authentication
- bcryptjs
- Nodemailer
- REST API

### Payments

- PayFast Sandbox / PayFast checkout
- PayFast ITN notifications
- Source-IP verification
- Signature verification
- PayFast validation
- Merchant and amount validation
- Idempotent wallet crediting

---

## Project Structure

```text
Module_3_e-commerce_project/
|
+-- frontend/
|   +-- src/
|   |   +-- components/
|   |   +-- router/
|   |   +-- services/
|   |   +-- stores/
|   |   +-- views/
|   |   +-- assets/
|   |       +-- styles/
|   +-- package.json
|
+-- backend/
|   +-- config/
|   +-- controllers/
|   +-- middleware/
|   +-- models/
|   +-- routes/
|   +-- scripts/
|   +-- sql/
|   +-- utils/
|   +-- server.js
|   +-- package.json
|
+-- README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- MySQL 8+
- Git

### Clone the repository

```bash
git clone https://github.com/butshatengwa951-cmd/Module_3_e-commerce_project.git
cd Module_3_e-commerce_project
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend development server:

`http://localhost:5173`

### Backend

Open a second terminal:

```bash
cd backend
npm install
npm run dev
```

Backend development server:

`http://localhost:4040`

The frontend API service uses `VITE_API_URL` when configured. Otherwise it uses the local backend at `http://localhost:4040`.

---

## Environment Configuration

Create:

```text
backend/.env
```

Do **not** commit real credentials, database passwords, JWT secrets, PayFast credentials or private certificates.

### Database

```text
DB_HOST
DB_USER
DB_PASSWORD
DB_NAME
DB_PORT
DB_SSL
DB_SSL_CA_PATH
DB_CONNECTION_LIMIT
DB_CONNECT_TIMEOUT
```

### Server

```text
PORT
FRONTEND_URL
TRUST_PROXY
```

### PayFast

Configure the required PayFast merchant and integration values in `backend/.env` for sandbox or production use.

For Aiven/MySQL SSL deployments, configure `DB_SSL=true` and provide the required CA certificate. If the API is behind a trusted reverse proxy, configure `TRUST_PROXY` correctly so source-IP validation works as intended.

---

## Database Setup

The live Aiven database must **not** be rebuilt using old destructive bootstrap SQL.

Use:

```text
backend/sql/README.md
```

as the authoritative migration guide.

The current integrated migration order is:

1. `integration_hardening.sql`
2. `stokvel_delivery_addresses.sql`
3. `final_hardening.sql`
4. `auth_sessions.sql`

Always check the migration documentation before applying additional SQL files to an existing database.

---

## Payment Flow

StockWell uses **PayFast** for Stokvel contributions.

A successful payment is not treated as complete just because the member reaches a PayFast success page. The backend waits for and validates the PayFast **ITN (Instant Transaction Notification)** before changing the group's financial records.

### Payment lifecycle

```text
Member enters contribution amount
             |
             v
StockWell creates payment record
             |
             v
Unique m_payment_id generated
             |
             v
Member redirected to PayFast
             |
             v
PayFast processes payment
             |
             v
PayFast sends ITN
POST /api/payment/payfast/notify
             |
             v
StockWell validates notification
             |
             +---- Source IP
             +---- Signature
             +---- PayFast validation
             +---- Merchant ID
             +---- Payment amount
             |
             v
Transaction confirmed COMPLETE
             |
             +-------------------+
             |                   |
             v                   v
       Credit wallet      Record contribution
             |                   |
             +---------+---------+
                       |
                       v
                Wallet transaction
```

### Payment lifecycle explained

1. The authenticated member enters a contribution amount.
2. StockWell creates a PayFast payment record with a unique `m_payment_id`.
3. The member is redirected to PayFast checkout.
4. PayFast processes the payment.
5. PayFast sends an ITN to `POST /api/payment/payfast/notify`.
6. StockWell verifies the source IP, signature, PayFast validation result, merchant ID and payment amount.
7. Only a confirmed `COMPLETE` payment is allowed to credit the Stokvel wallet.
8. StockWell records the wallet transaction and contribution.
9. Duplicate ITNs are handled idempotently so the wallet is not credited twice.

The ITN endpoint must remain publicly reachable by PayFast, so it must **not** be protected by the normal JWT authentication middleware.

StockWell does not store card details locally.

---

## API Structure

| Area | Endpoint |
|---|---|
| Authentication | `/api/auth` |
| Stokvels | `/api/stokvels` |
| Stokvel features | `/api/stokvel-features` |
| Proposals | `/api/stokvel-proposals` |
| Addresses | `/api/stokvel-addresses` |
| Users | `/api/users` |
| Products | `/api/products` |
| Cart | `/api/cart` |
| Orders | `/api/orders` |
| Reorders | `/api/reorder` |
| Payments | `/api/payment` |
| Administration | `/api/admin` |
| Suggestions | `/api/suggestions` |

### Health endpoints

```text
GET /
GET /health
```

---

## Testing

Run backend tests from the `backend` directory:

```bash
npm test
npm run test:auth
npm run test:governance
```

When testing PayFast, verify the complete flow:

- PayFast reports the payment successfully.
- The StockWell ITN is received.
- The payment is marked correctly.
- The Stokvel wallet is credited.
- The contribution is recorded.
- A duplicate notification does not create another wallet credit.

---

## Responsive Design

StockWell includes shared responsive styling across the application.

The responsive work covers:

- Mobile navigation
- Catalogue layouts
- Product images
- Shopping cart
- Dashboards
- Forms
- Tables and cards
- Admin pages
- Smaller-screen spacing and controls

Product images are styled consistently so catalogue products also display correctly in views such as the cart and other product screens.

---

## Security

StockWell applies several security measures:

- Passwords are hashed with bcryptjs.
- JWT authentication protects authenticated API operations.
- Refresh sessions are persisted.
- Admin endpoints require the admin role.
- PayFast ITNs are independently validated.
- Payment processing is idempotent.
- Card details are not stored by StockWell.
- Database credentials and payment secrets are stored in environment variables.
- Production deployments should use HTTPS.
- Database SSL should be enabled where required.
- Reverse-proxy configuration must be correct for PayFast IP validation.

---

## Development Workflow

The repository contains multiple development branches.

For integrated application changes:

1. Work on the agreed integration branch.
2. Test frontend and backend changes together.
3. Verify database migrations before applying them.
4. Test payment and wallet changes end-to-end.
5. Confirm mobile/responsive behaviour.
6. Commit the completed change.
7. Promote verified work to `main`.

---

## Current Limitations & Future Development

StockWell currently does **not** provide a user-facing function for members to create or add a new Stokvel from the application. The current system operates with the existing Stokvel membership data configured in the database.

A complete **Create Stokvel / Join Stokvel** workflow is planned for **future development**. This could include creating a new Stokvel, setting up its initial details, assigning Stokvel roles, and allowing members to join or be invited through the application.

This limitation does not prevent the existing Stokvel shopping, proposal, voting, wallet, payment, order and administration workflows from operating with the configured Stokvel data.

---

## Important Database Warning

Do **not** use superseded destructive SQL from older branches to rebuild the live Aiven database.

The current database migration path and schema guidance are documented in:

```text
backend/sql/README.md
```

---

## Project Status

StockWell is an integrated full-stack coursework project combining:

**E-commerce + Stokvel Governance + Shared Wallet + PayFast Payments + Orders + Delivery + Administration**
