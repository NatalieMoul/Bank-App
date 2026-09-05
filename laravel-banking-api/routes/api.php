<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NotificationSettingController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\Admin\LogController as AdminLogController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Admin\TransactionController as AdminTransactionController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\PaymentController;

Route::prefix('v1')->group(function () {

    // Authentication Routes 
    Route::prefix('auth')->group(function () {
        // Public routes
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);

        // Protected routes
        Route::middleware(['auth:sanctum', 'account.active'])->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/update-password', [AuthController::class, 'updatePassword']);
            Route::get('/tokens', [AuthController::class, 'getTokens']);
        });
    });

    // Protected Routes (Require Authentication) 
    Route::middleware(['auth:sanctum', 'account.active', 'maintenance'])->group(function () {

        // Primary Account Routes 
        Route::get('/account', [AccountController::class, 'showPrimary']);
        Route::put('/account', [AccountController::class, 'updatePrimary']);
        Route::get('/account/balance', [AccountController::class, 'getPrimaryBalance']);

        // Account Routes 
        Route::prefix('accounts')->group(function () {
            Route::get('/', [AccountController::class, 'index']); 
            Route::post('/', [AccountController::class, 'store']); 
            Route::get('{accountId}', [AccountController::class, 'show']);
            Route::get('{accountId}/balance', [AccountController::class, 'getBalance']); 
            Route::post('{accountId}/freeze', [AccountController::class, 'freeze']);
            Route::post('{accountId}/unfreeze', [AccountController::class, 'unfreeze']);
            Route::post('{accountId}/close', [AccountController::class, 'close']);
        });

        // Transfer Routes 
        Route::post('/transfers', [TransferController::class, 'store']);

        // Payment Routes
        Route::post('/payments', [PaymentController::class, 'store']);

        // Global Transaction Routes 
        Route::get('/transactions', [TransactionController::class, 'history']);
        Route::get('/transactions/reference/{reference}', [TransactionController::class, 'showByReference']);
        Route::get('/transactions/{transactionId}', [TransactionController::class, 'showById']);

        // Transaction Routes 
        Route::prefix('accounts/{accountId}/transactions')->group(function () {
            Route::get('/', [TransactionController::class, 'index']);
            Route::post('/deposit', [TransactionController::class, 'deposit']); // Deposit
            Route::post('/withdraw', [TransactionController::class, 'withdraw']); // Withdraw
            Route::post('/transfer', [TransactionController::class, 'transfer']); // Transfer
            Route::get('{reference}', [TransactionController::class, 'show']); // Get transaction details
        });

        // Notification Routes 
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::prefix('notifications')->group(function () {
            Route::get('/unread', [NotificationController::class, 'unread']); // Get unread notifications
            Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']); // Mark all as read
            Route::delete('{notificationId}', [NotificationController::class, 'destroy']); // Delete notification
        });
        Route::get('/notifications/{notificationId}', [NotificationController::class, 'show']);
        Route::patch('/notifications/{notificationId}/read', [NotificationController::class, 'markAsRead']);

        // Notification Settings
        Route::get('/notification-settings', [NotificationSettingController::class, 'show']);
        Route::put('/notification-settings', [NotificationSettingController::class, 'update']);

        // Daily Expense Card Routes
        Route::get('/cards', [\App\Http\Controllers\CardController::class, 'index']);
        Route::post('/cards', [\App\Http\Controllers\CardController::class, 'store']);
        Route::get('/cards/{card}/expenses', [\App\Http\Controllers\CardExpenseController::class, 'index']);
        Route::post('/cards/{card}/expenses', [\App\Http\Controllers\CardExpenseController::class, 'store']);
        Route::get('/cards/{card}/summary', [\App\Http\Controllers\CardController::class, 'summary']);
        Route::get('/cards/{card}/expenses/{expense}', [\App\Http\Controllers\CardExpenseController::class, 'show']);
        Route::get('/cards/{card}', [\App\Http\Controllers\CardController::class, 'show']);
        Route::put('/cards/{card}', [\App\Http\Controllers\CardController::class, 'update']);
        Route::patch('/cards/{card}/status', [\App\Http\Controllers\CardController::class, 'updateStatus']);
        Route::delete('/cards/{card}', [\App\Http\Controllers\CardController::class, 'destroy']);

        // Admin Routes 
        Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
            Route::get('/users', [AdminUserController::class, 'index']);
            Route::get('/users/{id}', [AdminUserController::class, 'show']);
            Route::patch('/users/{id}', [AdminUserController::class, 'update']);
            Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);

            Route::get('/transactions', [AdminTransactionController::class, 'index']);
            Route::get('/transactions/{id}', [AdminTransactionController::class, 'show']);

            Route::get('/settings', [AdminSettingController::class, 'index']);
            Route::put('/settings', [AdminSettingController::class, 'update']);

            Route::get('/logs', [AdminLogController::class, 'index']);
            Route::get('/logs/{id}', [AdminLogController::class, 'show']);

            Route::get('/reports/transactions', [AdminReportController::class, 'transactions']);
            Route::get('/reports/users', [AdminReportController::class, 'users']);
            Route::get('/reports/balance', [AdminReportController::class, 'balance']);
            Route::get('/reports/spending', [AdminReportController::class, 'spending']);

        });

    });

});

// Backward-compatible unversioned aliases for the card API.
Route::middleware(['auth:sanctum', 'account.active', 'maintenance'])->group(function () {
    Route::get('/cards', [\App\Http\Controllers\CardController::class, 'index']);
    Route::post('/cards', [\App\Http\Controllers\CardController::class, 'store']);
    Route::get('/cards/{card}/expenses', [\App\Http\Controllers\CardExpenseController::class, 'index']);
    Route::post('/cards/{card}/expenses', [\App\Http\Controllers\CardExpenseController::class, 'store']);
    Route::get('/cards/{card}/summary', [\App\Http\Controllers\CardController::class, 'summary']);
    Route::get('/cards/{card}/expenses/{expense}', [\App\Http\Controllers\CardExpenseController::class, 'show']);
    Route::get('/cards/{card}', [\App\Http\Controllers\CardController::class, 'show']);
    Route::put('/cards/{card}', [\App\Http\Controllers\CardController::class, 'update']);
    Route::patch('/cards/{card}/status', [\App\Http\Controllers\CardController::class, 'updateStatus']);
    Route::delete('/cards/{card}', [\App\Http\Controllers\CardController::class, 'destroy']);
});

