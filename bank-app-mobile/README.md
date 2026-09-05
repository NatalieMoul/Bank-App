# Bank App (React Native / Expo)

A mobile banking app with login/register, balance display, and
deposit/withdraw/transfer — built with Expo so it runs straight in
your browser (fastest way to test) and can later run as a real
installed app on Android/iOS with the same code.

## Features
- Login / Register (demo login: username `demo`, password `password123`)
- Dashboard with balance and transaction history
- Deposit, Withdraw, Transfer (to another account by account number)
- Data persists via AsyncStorage (works on web, iOS, and Android)

## Setup

1. Make sure you have Node.js installed, then install the Expo CLI
   tooling (no global install needed — `npx` handles it):
   ```
   cd bank-app-mobile
   npm install
   ```
2. Run it in the browser (fastest option):
   ```
   npm run web
   ```
   This opens the app at `http://localhost:19006` (or similar) and
   behaves like a mobile app in your browser window.
3. To test on your actual phone instead, install the **Expo Go** app
   from the App Store / Play Store, then run:
   ```
   npm start
   ```
   and scan the QR code that appears in the terminal.

The app discovers the current computer address automatically. Start the API
so it is reachable from Expo Go on the local network:

```
cd ../laravel-banking-api
php artisan serve --host=0.0.0.0 --port=8000
```

When changing Wi-Fi, stop and restart both Expo and the API so they pick up
the new network connection. The phone and computer must be on the same Wi-Fi.

## Project structure
- **`App.js`** — navigation setup (switches between Login and
  Dashboard/Transact screens based on whether someone's logged in).
- **`src/services/BankService.js`** — the "backend": login/register
  and deposit/withdraw/transfer logic, persisted with AsyncStorage.
- **`src/context/AuthContext.js`** — shares the current account and
  transaction list across screens via React Context, so every screen
  stays in sync without prop-drilling.
- **`src/screens/LoginScreen.js`** — login and registration form.
- **`src/screens/DashboardScreen.js`** — balance + transaction history.
- **`src/screens/TransactionsScreen.js`** — tabbed deposit/withdraw/transfer form.

## Later: turning this into an installable app
When you're ready to go beyond `expo start --web`, Expo's build
service (`eas build`) can package this same code into a real `.apk`
(Android) or submit it to the App Store (iOS) — no code changes
needed, since the whole app is already written in React Native
rather than web-only React.

## Ideas to extend it
- Add a second demo account to test transfers between two users
- Add biometric login (`expo-local-authentication`)
- Add push notifications for transaction alerts
- Replace AsyncStorage with a real backend (Node/Express + database)
