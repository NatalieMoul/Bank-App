<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== DATABASE SEEDING COMPLETE ===\n\n";

echo "✓ USERS\n";
$users = \App\Models\User::select('id', 'name', 'email', 'phone', 'role', 'status')->get();
echo "Total: " . $users->count() . " users\n";
$admins = $users->where('role', 'admin');
$customers = $users->where('role', 'customer');
echo "  - Admins: " . $admins->count() . "\n";
foreach ($admins as $u) {
    echo "    #{$u->id}: {$u->name} ({$u->email}) - {$u->status}\n";
}
echo "  - Customers: " . $customers->count() . "\n";
foreach ($customers as $u) {
    echo "    #{$u->id}: {$u->name} ({$u->email}) - {$u->status}\n";
}

echo "\n✓ ACCOUNTS\n";
$accounts = \App\Models\Account::select('id', 'user_id', 'account_number', 'account_type', 'balance', 'status')->get();
echo "Total: " . $accounts->count() . " accounts\n";
$byType = $accounts->groupBy('account_type');
foreach ($byType as $type => $accts) {
    echo "  - {$type}: " . $accts->count() . " accounts\n";
}
echo "  Total Balance: \$" . number_format($accounts->sum('balance'), 2) . "\n";

echo "\n✓ TRANSACTIONS\n";
$txns = \App\Models\Transaction::select('id', 'type', 'amount', 'status')->get();
echo "Total: " . $txns->count() . " transactions\n";
$byType = $txns->groupBy('type');
foreach ($byType as $type => $trans) {
    echo "  - {$type}: " . $trans->count() . "\n";
}

echo "\n✓ NOTIFICATIONS\n";
$notifs = \App\Models\Notification::select('id', 'type', 'is_read')->get();
echo "Total: " . $notifs->count() . " notifications\n";
$unread = $notifs->where('is_read', false)->count();
$read = $notifs->where('is_read', true)->count();
echo "  - Unread: {$unread}\n";
echo "  - Read: {$read}\n";

echo "\n✓ NOTIFICATION SETTINGS\n";
$settings = \App\Models\NotificationSetting::count();
echo "Total: {$settings} settings configured\n";

echo "\n" . str_repeat("=", 60) . "\n";
echo "✓ System ready for testing!\n";
echo str_repeat("=", 60) . "\n";

echo "\n📝 TEST CREDENTIALS:\n\n";
echo "🔐 Admin Users:\n";
echo "  admin@bank.com / admin123\n";
echo "  manager@bank.com / admin123\n\n";
echo "👤 Customer Users:\n";
echo "  john@example.com / password123\n";
echo "  jane@example.com / password123\n";
echo "  robert@example.com / password123\n";
echo "  sarah@example.com / password123\n";
echo "  michael@example.com / password123\n";
echo "  suspended@example.com / password123 (status: suspended)\n";
echo "  banned@example.com / password123 (status: banned)\n";

echo "\n📋 API Documentation:\n";
echo "  Base URL: http://localhost:8000/api/v1\n";
echo "  Auth: http://localhost:8000/api/v1/auth\n";
echo "  Accounts: http://localhost:8000/api/v1/accounts\n";
echo "  Transactions: http://localhost:8000/api/v1/accounts/{id}/transactions\n";
echo "  Notifications: http://localhost:8000/api/v1/notifications\n";

