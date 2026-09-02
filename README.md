# StockWell - Collective Purchasing for Stokvels
Team: Butsha | Cial | Kanya | Nithaam

## Tech Stack
- Frontend: Vue.js 3 + Vite + Vue Router + Pinia + Bootstrap + Axios
- Backend: Node.js + Express + MySQL (mysql2)
- Auth: JWT + bcryptjs

## Pages Implemented (per brief)
1. Login, 2. Sign-up, 3. Home, 4. Catalogue, 5. Cart(order), 6. Payment, 7. Delivery, 8. Confirmation Popup, 9. Order History

## Folder Structure
See repo - frontend/src/views contains all 8 pages, backend/models contains customer, product, order, contribution (escrow wallet)

## Installation Requirements

### Prerequisites
- Node.js v18+ installed (node -v)
- MySQL installed and running
- Git

### 1. Clone & Install Frontend
cd frontend
npm install
# installs: vue, vue-router, pinia, axios, bootstrap, vite

### 2. Install Backend
cd ../backend
npm install
# installs: express, mysql2, cors, dotenv, bcryptjs, jsonwebtoken

### 3. Database Setup
- Create DB: CREATE DATABASE stockwell_db;
- Import: SOURCE sql/schema.sql; SOURCE sql/seed.sql;
- Copy .env.example to .env and set DB_PASSWORD

### 4. Run Both
Backend: npm run dev  -> http://localhost:5000
Frontend: npm run dev -> http://localhost:5173

API Base: http://localhost:5000/api
Frontend API service: src/services/api.js uses axios with JWT interceptor

## For Marker
- No WordPress/Wix, vanilla Vue allowed
- Dynamic content: Pinia stores + Vue reactivity
- Payment: Simulated StockWell Escrow Wallet (paymentController.js) with Ozow/Capitec/Cash-in options
- All customer, product, order stored in SQL
