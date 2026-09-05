# 🏦 Bank App

Bank App is a full-stack banking system consisting of a mobile banking application, Laravel REST API backend, and web-based admin dashboard.

The system allows customers to manage their bank accounts, cards, transfers, payments, and transactions through the mobile application, while administrators can manage users, accounts, cards, transactions, and system settings through the admin dashboard.

## Features

### 📱 Customer Mobile App

- User registration and login
- Secure authentication
- View bank accounts
- View account balances
- Manage bank cards
- Add additional cards
- Freeze and unfreeze cards
- Delete cards
- Set card daily spending limits
- Transfer money between accounts
- View transaction history
- Mobile top-up
- Service payments
- Account status checking
- Maintenance mode notifications

### 🖥️ Admin Dashboard

- Admin login
- User management
- View customer accounts
- Manage customer cards
- View transactions
- Suspend user accounts
- Ban user accounts
- Delete user accounts
- Manage system settings
- Configure transfer limits
- Monitor banking activities

### 💳 Banking Features

- Account-based balance management
- Card-linked transactions
- Daily card spending limits
- Transfer validation
- Insufficient balance validation
- Transaction records
- Multiple customer accounts
- Multiple cards per account

## Technology

### Mobile Application

- React Native
- Expo
- JavaScript

### Admin Dashboard

- React
- Vite
- JavaScript

### Backend

- Laravel
- PHP
- Laravel Sanctum
- REST API

### Database

- MySQL

## Project Structure

```text
Bank App/
│
├── bank-app-mobile/
│   └── React Native / Expo Mobile App
│
├── laravel-banking-api/
│   └── Laravel REST API Backend
│
├── admin-dashboard-web/
│   └── React / Vite Admin Dashboard
│
├── package.json
├── package-lock.json
└── README.md