<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $accounts = Account::all();

        foreach ($accounts as $account) {
            // Create 5-15 transactions per account
            $transactionCount = rand(5, 15);

            for ($i = 0; $i < $transactionCount; $i++) {
                $type = $this->getRandomType();
                $amount = rand(10, 500) + rand(0, 99) / 100;

                // Ensure sufficient balance for withdrawal
                if ($type === 'withdrawal' && $account->balance < $amount) {
                    $amount = $account->balance / 2;
                }

                $status = rand(0, 100) > 10 ? 'completed' : (rand(0, 1) ? 'pending' : 'failed');

                Transaction::create([
                    'account_id' => $account->id,
                    'type' => $type,
                    'amount' => $amount,
                    'balance_after' => $account->balance,
                    'status' => $status,
                    'reference' => 'TRX' . strtoupper(uniqid()) . time(),
                    'description' => $this->getRandomDescription($type),
                    'recipient_account_id' => $type === 'transfer' ? $this->getRandomRecipientAccount($account) : null,
                    'processed_at' => $status === 'completed' ? now()->subDays(rand(0, 90)) : null,
                    'created_at' => now()->subDays(rand(0, 90))->subHours(rand(0, 23)),
                ]);
            }
        }
    }

    /**
     * Get a random transaction type.
     */
    private function getRandomType(): string
    {
        $types = ['deposit', 'withdrawal', 'transfer', 'payment'];
        return $types[array_rand($types)];
    }

    /**
     * Get a random description based on transaction type.
     */
    private function getRandomDescription(string $type): string
    {
        $descriptions = [
            'deposit' => [
                'Salary deposit',
                'Direct deposit',
                'Paycheck',
                'Refund',
                'Cash deposit',
                'Transfer from another account',
            ],
            'withdrawal' => [
                'ATM withdrawal',
                'Cash withdrawal',
                'Debit card purchase',
                'Online purchase',
                'Bill payment',
                'Cash out',
            ],
            'transfer' => [
                'Transfer to savings',
                'Transfer to checking',
                'Payment to friend',
                'Bill payment transfer',
                'Account transfer',
            ],
            'payment' => [
                'Utility bill payment',
                'Credit card payment',
                'Loan payment',
                'Insurance payment',
                'Online payment',
            ],
        ];

        return $descriptions[$type][array_rand($descriptions[$type])];
    }

    /**
     * Get a random recipient account for transfer.
     */
    private function getRandomRecipientAccount($excludeAccount): ?int
    {
        $randomAccount = Account::where('id', '!=', $excludeAccount->id)
            ->inRandomOrder()
            ->first();

        return $randomAccount?->id;
    }
}
