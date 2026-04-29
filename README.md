# InvoicePro — MERN Tax Invoice Generator

Full-stack invoice app: **React (Vite) + Tailwind** frontend, **Node.js + Express** API, **MongoDB** with **JWT** auth, **bcrypt** passwords, and **PDF** export styled like a professional Indian **Tax Invoice** (TAX INVOICE title, company block, Bill To, line table, bank + UPI QR, GST summary, amount in words, terms).

## Prerequisites

- **Node.js** 18+
- **MongoDB** running locally or a connection string (e.g. MongoDB Atlas)

## 1. Database

Start MongoDB (local example):

```bash
# Windows (if installed as service, it may already be running)
# Or use MongoDB Compass / Atlas and copy your URI
```

## 2. Backend

```bash
cd backend
copy .env.example .env
# Edit .env: set MONGODB_URI, JWT_SECRET
npm install
npm run dev
```

The API runs at **http://localhost:5000** (`GET /api/health` to verify).

### API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register `{ name, email, password }` |
| POST | `/api/auth/login` | Login `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | Current user (Bearer token) |
| PUT | `/api/user` | Update profile; multipart: `name`, `company` (JSON string), `logo` file |
| GET/POST/PUT/DELETE | `/api/clients` | CRUD clients |
| GET | `/api/invoices/summary` | Dashboard stats + monthly aggregates |
| GET/POST/PUT/DELETE | `/api/invoices` | CRUD invoices |
| GET | `/api/invoices/:id/pdf` | **Download tax invoice PDF** (auth) |
| POST | `/api/invoices/:id/email` | Email PDF: `{ to?, subject?, text? }` (requires SMTP in `.env`) |
| POST | `/api/invoices/:id/paid` | Mark paid: `{ "paid": true }` or `{ "paid": false }` |

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — Vite proxies `/api` and `/uploads` to the backend.

## 4. Environment (backend `.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Default `5000` |
| `MONGODB_URI` | e.g. `mongodb://127.0.0.1:27017/invoice_app` |
| `JWT_SECRET` | Long random string for signing tokens |
| `CLIENT_URL` | e.g. `http://localhost:5173` (CORS) |
| `SMTP_*` | Optional — for “Email invoice to client” |

## Demo login (optional)

The app does **not** ship with built-in credentials. After MongoDB is working, you can create a fixed dev user:

```bash
cd backend
npm run seed
```

Then sign in at the app with:

- **Email:** `demo@invoicepro.local`
- **Password:** `DemoPass123!`

(Or use **Register** with any email you like.)

## 5. First run

1. Register a user in the app, or run `npm run seed` (see above).
2. **Settings** — set company name, GSTIN, address, bank, UPI (for PDF QR), upload logo.
3. **Clients** — add a client.
4. **Invoices** → create invoice, then **Download PDF**.

### Sample JSON (create invoice, direct API)

```http
POST /api/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "clientId": "<MongoDB ObjectId>",
  "dueDate": "2024-04-27T00:00:00.000Z",
  "invoiceDate": "2024-04-12T00:00:00.000Z",
  "placeOfSupply": "27-MAHARASHTRA",
  "taxMode": "intra",
  "sacCode": "9954",
  "items": [
    { "name": "Google Cloud Platform Integration", "rate": 200000, "quantity": 1.5 }
  ],
  "amountPaid": 0
}
```

## Project layout

- `backend/src` — `config`, `models`, `controllers`, `routes`, `middleware`, `services` (PDF, email), `utils`
- `backend/uploads` — uploaded logos (auto-created, gitignored)
- `frontend/src` — `pages`, `components`, `context`, `api`

## Notes

- PDF uses **#005596** for “TAX INVOICE” and total box border; **Inter**-style look via PDF built-ins (Helvetica).
- Indian **number formatting** (en-IN) and **amount in words** (lakh/crore) on PDF.
- **GST**: intra-state = CGST + SGST (default 9% + 9% on taxable); inter-state = IGST.
