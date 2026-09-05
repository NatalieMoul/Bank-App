<?php

namespace Database\Seeders;

use App\Models\Card;
use App\Models\CardExpense;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CardSeeder extends Seeder
{
    public function run(): void
    {
        User::where('role', 'customer')
            ->where('status', 'active')
            ->with(['accounts' => fn ($query) => $query->where('status', 'active')->orderBy('id')])
            ->get()
            ->each(function (User $user): void {
                $account = $user->accounts->first();

                if (!$account || strtoupper($account->currency) !== 'USD') {
                    return;
                }

                DB::transaction(function () use ($account, $user): void {
                    $card = Card::updateOrCreate(
                        ['account_id' => $account->id, 'card_name' => 'Daily Expenses'],
                        [
                            'daily_limit' => 100,
                            'currency' => 'USD',
                            'status' => 'active',
                        ]
                    );

                    if (!$card->card_number) {
                        $cardNumber = Card::generateCardNumber();
                        $card->update([
                            'card_number' => $cardNumber,
                            'card_number_hash' => hash('sha256', $cardNumber),
                            'last_four' => substr($cardNumber, -4),
                            'cardholder_name' => $user->name,
                            'expiration_month' => now()->month,
                            'expiration_year' => now()->addYears(3)->year,
                        ]);
                    }

                    $seedExpenses = [
                        ['amount' => 12.50, 'category' => 'food', 'merchant' => 'Lucky Coffee', 'description' => 'Breakfast', 'spent_at' => now()->startOfDay()->addHours(8)],
                        ['amount' => 8.00, 'category' => 'transport', 'merchant' => 'City Transit', 'description' => 'Morning commute', 'spent_at' => now()->startOfDay()->addHours(9)],
                    ];

                    foreach ($seedExpenses as $seedExpense) {
                        $expense = $card->expenses()->firstOrCreate(
                            [
                                'merchant' => $seedExpense['merchant'],
                                'spent_at' => $seedExpense['spent_at'],
                            ],
                            [
                                'amount' => $seedExpense['amount'],
                                'currency' => 'USD',
                                'category' => $seedExpense['category'],
                                'description' => $seedExpense['description'],
                            ]
                        );

                        if (!$expense->wasRecentlyCreated) {
                            continue;
                        }

                        $account->decrement('balance', $expense->amount);
                        Transaction::create([
                            'account_id' => $account->id,
                            'type' => 'card_expense',
                            'amount' => $expense->amount,
                            'balance_after' => $account->fresh()->balance,
                            'status' => 'completed',
                            'reference' => Transaction::generateReference(),
                            'description' => $expense->description,
                            'metadata' => [
                                'card_id' => $card->id,
                                'card_expense_id' => $expense->id,
                                'currency' => 'USD',
                                'merchant' => $expense->merchant,
                                'category' => $expense->category,
                            ],
                            'processed_at' => now(),
                        ]);
                    }
                });
            });
    }
}
