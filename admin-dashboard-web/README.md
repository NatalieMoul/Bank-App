# Bank Admin Dashboard

A React web app for managing your Laravel banking API — users, transactions,
reports, system logs, and settings. Separate project from your mobile app,
but talks to the **same** Laravel API.

## Setup

1. Make sure your Laravel API is running (`php artisan serve`, usually at
   `http://localhost:8000`).
2. Install dependencies:
   ```
   cd admin-dashboard-web
   npm install
   ```
3. Check `src/api.js` — `BASE_URL` should point at your running Laravel API
   (`http://localhost:8000/api/v1` by default).
4. Run it:
   ```
   npm run dev
   ```
5. Open the URL it prints (usually `http://localhost:5173`).

## Logging in

This only works with a user whose `role` is `admin` in your database — a
normal customer account (like the ones your mobile app creates) will be
rejected with "This login is for administrators only."

To create an admin account, either:
- Check `database/seeders/UserSeeder.php` in your Laravel project — it may
  already create one.
- Or manually update a user's role in your database:
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
  ```

## Pages

- **Users** — list every user, edit their status (active/suspended/banned)
  or role (customer/admin), or delete an account.
- **Transactions** — every deposit/withdrawal/transfer system-wide, with
  filters for status and type, and pagination.
- **Reports** — summary stat cards for users, balances, and transactions.
- **Logs** — the system audit trail (logins, password changes, user
  creation, etc.), filterable by action, with pagination.
- **Settings** — system-wide config: transfer limits, transaction fee,
  default currency, maintenance mode.

## Notes

- This is a separate project from `bank-app-mobile` — they don't share code,
  only the same backend API.
- Auth uses the same Sanctum token system as the mobile app, just stored in
  the browser's `localStorage` instead of `AsyncStorage`.
- No build tooling beyond Vite + React + React Router — kept intentionally
  simple, no UI component library.
