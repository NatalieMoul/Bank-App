<?php

use App\Models\Account;
use App\Models\Notification;
use App\Models\SystemLog;
use App\Models\Transaction;
use App\Models\User;

it('allows a customer to transfer money between accounts', function () {
    $user = User::factory()->create([
        'phone' => '100000001',
        'role' => 'customer',
        'status' => 'active',
    ]);

    $senderAccount = Account::create([
        'user_id' => $user->id,
        'account_number' => '100000001',
        'account_type' => 'checking',
        'balance' => 500.00,
        'status' => 'active',
        'currency' => 'USD',
    ]);

    $receiverUser = User::factory()->create([
        'phone' => '100000002',
        'role' => 'customer',
        'status' => 'active',
    ]);

    $receiverAccount = Account::create([
        'user_id' => $receiverUser->id,
        'account_number' => '100000002',
        'account_type' => 'checking',
        'balance' => 250.00,
        'status' => 'active',
        'currency' => 'USD',
    ]);

    $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/transfers', [
        'to_account' => '100000002',
        'amount' => 100,
        'currency' => 'USD',
        'description' => 'Payment',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('message', 'Transfer successful')
        ->assertJsonPath('data.new_balance', '400.00');

    $senderAccount->refresh();
    $receiverAccount->refresh();

    expect($senderAccount->balance)->toBe('400.00')
        ->and($receiverAccount->balance)->toBe('350.00')
        ->and(Transaction::where('account_id', $senderAccount->id)->where('type', 'transfer')->count())->toBe(1)
        ->and(Notification::where('user_id', $user->id)->where('type', 'transfer')->count())->toBeGreaterThan(0)
        ->and(Notification::where('user_id', $receiverUser->id)->where('type', 'transfer')->count())->toBeGreaterThan(0);
});

it('allows a customer to transfer between USD and KHR using the 4100 KHR = 1 USD conversion rate', function () {
    $user = User::factory()->create([
        'phone' => '100000003',
        'role' => 'customer',
        'status' => 'active',
    ]);

    $senderAccount = Account::create([
        'user_id' => $user->id,
        'account_number' => '100000003',
        'account_type' => 'checking',
        'balance' => 100.00,
        'status' => 'active',
        'currency' => 'USD',
    ]);

    $receiverUser = User::factory()->create([
        'phone' => '100000004',
        'role' => 'customer',
        'status' => 'active',
    ]);

    $receiverAccount = Account::create([
        'user_id' => $receiverUser->id,
        'account_number' => '100000004',
        'account_type' => 'checking',
        'balance' => 0.00,
        'status' => 'active',
        'currency' => 'KHR',
    ]);

    $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/transfers', [
        'to_account' => '100000004',
        'amount' => 2,
        'currency' => 'USD',
        'description' => 'KHR conversion',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('message', 'Transfer successful')
        ->assertJsonPath('data.new_balance', '98.00');

    $senderAccount->refresh();
    $receiverAccount->refresh();

    expect($senderAccount->balance)->toBe('98.00')
        ->and((string) $receiverAccount->balance)->toBe('8200.00')
        ->and((string) Transaction::where('account_id', $receiverAccount->id)->where('type', 'transfer')->first()->amount)->toBe('8200.00');
});

it('debits the sender currency when the transfer amount is requested in the receiver currency', function () {
    $user = User::factory()->create(['phone' => '100000006', 'role' => 'customer', 'status' => 'active']);
    $senderAccount = Account::create([
        'user_id' => $user->id,
        'account_number' => '100000006',
        'account_type' => 'checking',
        'balance' => 50000,
        'status' => 'active',
        'currency' => 'KHR',
    ]);

    $receiverUser = User::factory()->create(['phone' => '100000007', 'role' => 'customer', 'status' => 'active']);
    $receiverAccount = Account::create([
        'user_id' => $receiverUser->id,
        'account_number' => '100000007',
        'account_type' => 'checking',
        'balance' => 0,
        'status' => 'active',
        'currency' => 'USD',
    ]);

    $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/transfers', [
        'to_account' => '100000007',
        'amount' => 10,
        'transfer_currency' => 'USD',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.transaction.metadata.sender_currency', 'KHR')
        ->assertJsonPath('data.transaction.metadata.transfer_currency', 'USD')
        ->assertJsonPath('data.transaction.metadata.receiver_currency', 'USD');

    $senderAccount->refresh();
    $receiverAccount->refresh();

    expect($senderAccount->balance)->toBe('9000.00')
        ->and($receiverAccount->balance)->toBe('10.00');
});

it('rejects a transfer when the sender cannot cover the amount', function () {
    $user = User::factory()->create([
        'phone' => '100000005',
        'role' => 'customer',
        'status' => 'active',
    ]);

    $senderAccount = Account::create([
        'user_id' => $user->id,
        'account_number' => '100000003',
        'account_type' => 'checking',
        'balance' => 50.00,
        'status' => 'active',
        'currency' => 'USD',
    ]);

    $receiverUser = User::factory()->create([
        'phone' => '100000004',
        'role' => 'customer',
        'status' => 'active',
    ]);

    $receiverAccount = Account::create([
        'user_id' => $receiverUser->id,
        'account_number' => '100000004',
        'account_type' => 'checking',
        'balance' => 250.00,
        'status' => 'active',
        'currency' => 'USD',
    ]);

    $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/transfers', [
        'to_account' => '100000004',
        'amount' => 100,
        'currency' => 'USD',
        'description' => 'Payment',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('message', 'Insufficient balance');

    $senderAccount->refresh();
    $receiverAccount->refresh();

    expect($senderAccount->balance)->toBe('50.00')
        ->and($receiverAccount->balance)->toBe('250.00')
        ->and(Transaction::where('type', 'transfer')->count())->toBe(0);
});

it('lists the authenticated user transaction history and returns details for a transaction', function () {
    $user = User::factory()->create([
        'phone' => '100000005',
        'role' => 'customer',
        'status' => 'active',
    ]);

    $account = Account::create([
        'user_id' => $user->id,
        'account_number' => '100000005',
        'account_type' => 'checking',
        'balance' => 500.00,
        'status' => 'active',
        'currency' => 'USD',
    ]);

    $transaction = Transaction::create([
        'account_id' => $account->id,
        'type' => 'transfer',
        'amount' => 100.00,
        'balance_after' => 400.00,
        'status' => 'completed',
        'reference' => 'TXN-20260821-001',
        'description' => 'Payment',
        'processed_at' => now(),
    ]);

    $listResponse = $this->actingAs($user, 'sanctum')->getJson('/api/v1/transactions?page=1');
    $listResponse->assertStatus(200)
        ->assertJsonPath('data.0.type', 'transfer')
        ->assertJsonPath('data.0.currency', 'USD')
        ->assertJsonPath('data.0.status', 'completed');

    $detailResponse = $this->actingAs($user, 'sanctum')->getJson('/api/v1/transactions/' . $transaction->id);
    $detailResponse->assertStatus(200)
        ->assertJsonPath('data.id', $transaction->id)
        ->assertJsonPath('data.reference', 'TXN-20260821-001');
});

it('registers a customer, logs in, and exposes the account summary endpoints', function () {
    $registerResponse = $this->postJson('/api/v1/auth/register', [
        'name' => 'Sopanha',
        'email' => 'sopanha@gmail.com',
        'phone' => '012345678',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $registerResponse->assertStatus(201)
        ->assertJsonPath('message', 'Registration successful')
        ->assertJsonPath('user.email', 'sopanha@gmail.com')
        ->assertJsonStructure(['message', 'user', 'token']);

    $token = $registerResponse->json('token');

    $meResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/auth/me');
    $meResponse->assertStatus(200)
        ->assertJsonPath('user.email', 'sopanha@gmail.com');

    $accountResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/account');
    $accountResponse->assertStatus(200)
        ->assertJsonPath('currency', 'USD')
        ->assertJsonPath('status', 'active');

    $balanceResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/account/balance');
    $balanceResponse->assertStatus(200)
        ->assertJsonPath('currency', 'USD')
        ->assertJsonPath('balance', 0);
});

it('returns notifications and supports notification settings', function () {
    $user = User::factory()->create([
        'phone' => '100000006',
        'role' => 'customer',
        'status' => 'active',
    ]);

    $notification = \App\Models\Notification::create([
        'user_id' => $user->id,
        'type' => 'transaction',
        'title' => 'Transfer Successful',
        'message' => 'Your transfer of $100 was successful.',
        'data' => ['amount' => 100, 'currency' => 'USD'],
        'is_read' => false,
    ]);

    $listResponse = $this->actingAs($user, 'sanctum')->getJson('/api/v1/notifications');
    $listResponse->assertStatus(200)
        ->assertJsonPath('data.0.title', 'Transfer Successful')
        ->assertJsonPath('data.0.type', 'transaction');

    $detailResponse = $this->actingAs($user, 'sanctum')->getJson('/api/v1/notifications/' . $notification->id);
    $detailResponse->assertStatus(200)
        ->assertJsonPath('data.id', $notification->id)
        ->assertJsonPath('data.message', 'Your transfer of $100 was successful.');

    $markReadResponse = $this->actingAs($user, 'sanctum')->patchJson('/api/v1/notifications/' . $notification->id . '/read');
    $markReadResponse->assertStatus(200)
        ->assertJsonPath('data.is_read', true);

    $settingsResponse = $this->actingAs($user, 'sanctum')->getJson('/api/v1/notification-settings');
    $settingsResponse->assertStatus(200)
        ->assertJsonPath('data.transaction_notifications', true)
        ->assertJsonPath('data.login_notifications', true)
        ->assertJsonPath('data.security_notifications', true);

    $updateSettingsResponse = $this->actingAs($user, 'sanctum')->putJson('/api/v1/notification-settings', [
        'transaction_notifications' => false,
        'login_notifications' => true,
        'security_notifications' => true,
    ]);
    $updateSettingsResponse->assertStatus(200)
        ->assertJsonPath('data.transaction_notifications', false);
});

it('allows an admin to list user accounts', function () {
    $admin = User::factory()->create([
        'phone' => '100000007',
        'role' => 'admin',
        'status' => 'active',
    ]);

    $customer = User::factory()->create([
        'phone' => '100000008',
        'role' => 'customer',
        'status' => 'active',
    ]);

    Account::create([
        'user_id' => $customer->id,
        'account_number' => '100000008',
        'account_type' => 'checking',
        'balance' => 250.00,
        'status' => 'active',
        'currency' => 'USD',
    ]);

    $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/users');

    $response->assertStatus(200)
        ->assertJsonFragment([
            'email' => $customer->email,
            'account' => '100000008',
        ]);
});

it('returns system settings and logs for the admin dashboard', function () {
    $settingsPath = storage_path('app/system_settings.json');
    if (file_exists($settingsPath)) {
        unlink($settingsPath);
    }

    $admin = User::factory()->create([
        'phone' => '100000009',
        'role' => 'admin',
        'status' => 'active',
    ]);

    $customer = User::factory()->create([
        'phone' => '100000010',
        'role' => 'customer',
        'status' => 'active',
    ]);

    $forbiddenResponse = $this->actingAs($customer, 'sanctum')->getJson('/api/v1/admin/users');
    $forbiddenResponse->assertStatus(403);

    $settingsResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/settings');
    $settingsResponse->assertStatus(200)
        ->assertJsonPath('data.maximum_transfer_amount', 5000)
        ->assertJsonPath('data.default_currency', 'USD');

    $updateResponse = $this->actingAs($admin, 'sanctum')->putJson('/api/v1/admin/settings', [
        'maximum_transfer_amount' => 10000,
        'minimum_transfer_amount' => 10,
        'maintenance_mode' => false,
        'default_currency' => 'USD',
        'transaction_fee' => 1.5,
    ]);

    $updateResponse->assertStatus(200)
        ->assertJsonPath('data.maximum_transfer_amount', 10000)
        ->assertJsonPath('data.transaction_fee', 1.5);

    $log = SystemLog::create([
        'user_id' => $admin->id,
        'action' => 'LOGIN',
        'entity_type' => 'user',
        'entity_id' => $admin->id,
        'status' => 'success',
        'description' => 'Admin logged in',
    ]);

    $logListResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/logs');
    $logListResponse->assertStatus(200)
        ->assertJsonFragment([
            'action' => 'LOGIN',
            'description' => 'Admin logged in',
        ]);

    $logDetailResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/logs/' . $log->id);
    $logDetailResponse->assertStatus(200)
        ->assertJsonPath('data.id', $log->id)
        ->assertJsonPath('data.action', 'LOGIN');
});
