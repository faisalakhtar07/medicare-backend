# MEDICARE Backend (Node + Express + MongoDB)

Real REST API with authentication, orders, admin dashboard, and file uploads —
runs entirely on your own laptop, no cloud account needed.

## 1. Install MongoDB Community Server (one-time, on your laptop)

Download & install: https://www.mongodb.com/try/download/community

After installing, MongoDB runs as a background service automatically on
Windows (check Services app for "MongoDB"). If it's not running, open a
terminal and run:
```bash
mongod
```
Keep that terminal open while you use the app (or let it run as a Windows service).

## 2. Install dependencies

```bash
cd medicare-backend
npm install
```

## 3. Check your .env file

A `.env` file is already included with sensible local defaults:
```
MONGO_URI=mongodb://127.0.0.1:27017/medicare
JWT_SECRET=medicare_super_secret_change_this_in_production
PORT=5000
ADMIN_EMAIL=admin@medicare.com
```
Whichever email you register with matching `ADMIN_EMAIL` automatically
becomes an admin account (can see all orders/customers).

## 4. Seed the database (500+ products, 7 doctors, 9 lab tests)

```bash
npm run seed
```
Run this once. Re-running it wipes and recreates products/doctors/lab tests
(your registered users and their orders are NOT touched).

## 5. Start the server

```bash
npm run dev
```
You should see:
```
✅ MongoDB connected: 127.0.0.1
🚀 MEDICARE API running on http://localhost:5000
```

## Key API routes

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | — | Create account |
| POST | /api/auth/login | — | Login, returns JWT token |
| GET | /api/products | — | List/search/filter products |
| POST | /api/orders | ✅ customer | Place an order |
| GET | /api/orders/mine | ✅ customer | My order history |
| GET | /api/orders | ✅ admin | **Every order from every customer** |
| GET | /api/admin/customers | ✅ admin | **Who bought what, total spend per customer** |
| POST | /api/prescriptions | ✅ customer | Upload prescription photo (multipart/form-data, field "file") |
| GET | /api/doctors, /api/labtests | — | Browse doctors & lab tests |
| POST | /api/consultations, /api/labbookings | ✅ customer | Book doctor / lab test |

## Becoming admin

1. Register normally at `/api/auth/register` using the email set in
   `ADMIN_EMAIL` in `.env` (default `admin@medicare.com`).
2. That account's JWT token will have `isAdmin: true` — use it to call the
   `/api/admin/*` and `GET /api/orders` routes to see all customer activity.

## Owner & Delivery Access (new)

Two extra secure roles now exist beyond regular customers:

- **Owner** (pharmacy business owner) — full order management, can update status and assign delivery staff.
- **Delivery** — sees only orders assigned to them, can mark Out for Delivery / Delivered.

To create either account, use `POST /api/staff/register` with an **access code** (set in `.env` as `OWNER_ACCESS_CODE` / `DELIVERY_ACCESS_CODE` — change these from the defaults before going live). Without the correct code, no staff account can be created. Regular customers can never reach owner/delivery routes — this is enforced on the backend (`requireRole` middleware), not just hidden in the UI.

## Online Payments (Razorpay, test mode — free)

1. Sign up free at https://dashboard.razorpay.com (no business verification needed for Test Mode)
2. Turn on the **Test Mode** toggle (top right of the dashboard)
3. Go to Settings → API Keys → Generate Test Key
4. Copy the Key Id and Key Secret into `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
   ```
5. Restart the server (`npm run dev`)

Until these are filled in, online payment attempts will return a clear "not configured yet" message and customers can still use Cash on Delivery.

Test Mode payments use Razorpay's dummy card/UPI details (never real money) — see https://razorpay.com/docs/payments/payments/test-card-upi-details/

## Adding real product photos later

Every product has an `image` field (just a URL string). To swap in a real
photo for any product:
```bash
curl -X PUT http://localhost:5000/api/products/<PRODUCT_ID> \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"image": "https://your-image-url.com/photo.jpg"}'
```
(A proper admin UI for this is planned in the next phase — for now this is
usable via any API client like Postman.)
