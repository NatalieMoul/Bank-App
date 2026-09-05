<?php

use App\Models\Account;
use App\Models\Card;
use App\Models\CardExpense;
use App\Models\Notification;
use App\Models\NotificationSetting;
use App\Models\Transaction;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Support\Carbon;
use Mockery;

function cardUser(array $attributes = []): User
{
    return User::factory()->create(array_merge([
        'phone' => fake()->unique()->numerify('##########'),
        'role' => 'customer',
        'status' => 'active',
    ], $attributes));
}

function cardAccount(User $user, array $attributes = []): Account
{
    return Account::create(array_merge([
        'user_id' => $user->id,
        'account_number' => Account::generateAccountNumber(),
        'account_type' => 'checking',
        'balance' => 100,
        'currency' => 'USD',
        'status' => 'active',
    ], $attributes));
}

function cardFor(Account $account, array $attributes = []): Card
{
    return Card::create(array_merge([
        'account_id' => $account->id,
        'card_name' => 'Daily Expenses',
        'daily_limit' => 20,
        'currency' => $account->currency,
        'status' => 'active',
    ], $attributes));
}

test('user can create and view their own card but cannot use another account', function () {
    $user = cardUser();
    $account = cardAccount($user);
    $otherAccount = cardAccount(cardUser());

    $response = $this->actingAs($user, 'sanctum')->postJson('/api/cards', [
        'account_id' => $account->id,
        'card_name' => 'Daily Expenses',
        'daily_limit' => 20,
        'currency' => 'USD',
    ]);

    $response->assertCreated()->assertJsonPath('data.account_id', $account->id);
    $this->actingAs($user, 'sanctum')->getJson('/api/cards/' . $response->json('data.id'))->assertOk();

    $this->actingAs($user, 'sanctum')->postJson('/api/cards', [
        'account_id' => $otherAccount->id,
        'card_name' => 'Forbidden',
        'daily_limit' => 20,
        'currency' => 'USD',
    ])->assertStatus(422)->assertJsonPath('message', 'Account not found.');
});

test('user cannot view or use another users card', function () {
    $owner = cardUser();
    $card = cardFor(cardAccount($owner));
    $user = cardUser();

    $this->actingAs($user, 'sanctum')->getJson('/api/cards/' . $card->id)->assertForbidden();
    $this->actingAs($user, 'sanctum')->postJson('/api/cards/' . $card->id . '/expenses', [
        'amount' => 5,
        'currency' => 'USD',
    ])->assertForbidden();
});

test('expense deducts account, creates transaction and notification', function () {
    $user = cardUser();
    $account = cardAccount($user, ['balance' => 100]);
    $card = cardFor($account);

    $response = $this->actingAs($user, 'sanctum')->postJson('/api/cards/' . $card->id . '/expenses', [
        'amount' => 5.50,
        'currency' => 'USD',
        'category' => 'food',
        'merchant' => 'Lucky Coffee',
        'description' => 'Lunch',
    ]);

    $response->assertCreated()->assertJsonPath('message', 'Expense recorded successfully.');
    expect((float) $account->fresh()->balance)->toBe(94.5)
        ->and(CardExpense::where('card_id', $card->id)->count())->toBe(1)
        ->and(Transaction::where('account_id', $account->id)->where('type', 'card_expense')->count())->toBe(1)
        ->and(Notification::where('user_id', $user->id)->where('title', 'Card Expense')->count())->toBe(1);
});

test('daily limit and account balance are enforced', function () {
    $user = cardUser();
    $account = cardAccount($user, ['balance' => 10]);
    $card = cardFor($account, ['daily_limit' => 20]);
    CardExpense::create(['card_id' => $card->id, 'amount' => 12, 'currency' => 'USD', 'spent_at' => now()]);

    $this->actingAs($user, 'sanctum')->postJson('/api/cards/' . $card->id . '/expenses', [
        'amount' => 9,
        'currency' => 'USD',
    ])->assertStatus(422)->assertJsonPath('message', 'Daily spending limit exceeded.')
        ->assertJsonPath('spent_today', 12);

    $card->update(['daily_limit' => 100]);
    $this->actingAs($user, 'sanctum')->postJson('/api/cards/' . $card->id . '/expenses', [
        'amount' => 20,
        'currency' => 'USD',
    ])->assertStatus(422)->assertJsonPath('message', 'Insufficient account balance.')
        ->assertJsonPath('balance', 10);

    expect((float) $account->fresh()->balance)->toBe(10.0)
        ->and(CardExpense::where('card_id', $card->id)->count())->toBe(1);
});

test('inactive card rejects expenses and summary resets by date', function () {
    $user = cardUser();
    $account = cardAccount($user);
    $card = cardFor($account, ['status' => 'inactive']);

    $this->actingAs($user, 'sanctum')->postJson('/api/cards/' . $card->id . '/expenses', [
        'amount' => 5,
        'currency' => 'USD',
    ])->assertStatus(422)->assertJsonPath('message', 'Card is not active.');

    $card->update(['status' => 'active']);
    Carbon::setTestNow('2026-09-03 12:00:00');
    CardExpense::create(['card_id' => $card->id, 'amount' => 12.50, 'currency' => 'USD', 'spent_at' => now()]);
    $this->actingAs($user, 'sanctum')->getJson('/api/cards/' . $card->id . '/summary')
        ->assertOk()->assertJsonPath('data.spent_today', 12.5)->assertJsonPath('data.remaining_today', 7.5);

    Carbon::setTestNow('2026-09-04 12:00:00');
    $this->actingAs($user, 'sanctum')->getJson('/api/cards/' . $card->id . '/summary')
        ->assertOk()->assertJsonPath('data.spent_today', 0)->assertJsonPath('data.remaining_today', 20);
    Carbon::setTestNow();
});

test('expense rollback leaves balance and records unchanged when notification fails', function () {
    $user = cardUser();
    $account = cardAccount($user);
    $card = cardFor($account);
    NotificationSetting::create(['user_id' => $user->id, 'email_transactions' => true, 'email_security_alerts' => true, 'email_promotions' => false, 'sms_transactions' => false, 'sms_security_alerts' => false, 'in_app_notifications' => true]);

    $notificationService = Mockery::mock(NotificationService::class);
    $notificationService->shouldReceive('shouldNotifyTransaction')->once()->andReturn(true);
    $notificationService->shouldReceive('notify')->once()->andThrow(new RuntimeException('notification failed'));
    app()->instance(NotificationService::class, $notificationService);

    $this->actingAs($user, 'sanctum')->postJson('/api/cards/' . $card->id . '/expenses', [
        'amount' => 5,
        'currency' => 'USD',
    ])->assertServerError();

    expect((float) $account->fresh()->balance)->toBe(100.0)
        ->and(CardExpense::where('card_id', $card->id)->count())->toBe(0)
        ->and(Transaction::where('account_id', $account->id)->where('type', 'card_expense')->count())->toBe(0);
});

afterEach(function () {
    Carbon::setTestNow();
});
