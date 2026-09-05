<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Transaction;

class TransactionService
{
    protected AccountService $accountService;
    protected NotificationService $notificationService;
    protected const KHR_TO_USD_RATE = 4100.0;

    public function __construct(AccountService $accountService, NotificationService $notificationService)
    {
        $this->accountService = $accountService;
        $this->notificationService = $notificationService;
    }

    protected function convertAmount(float $amount, string $fromCurrency, string $toCurrency): float
    {
        $fromCurrency = strtoupper($fromCurrency);
        $toCurrency = strtoupper($toCurrency);

        if ($fromCurrency === $toCurrency) {
            return $amount;
        }

        if ($fromCurrency === 'USD' && $toCurrency === 'KHR') {
            return round($amount * self::KHR_TO_USD_RATE, 2);
        }

        if ($fromCurrency === 'KHR' && $toCurrency === 'USD') {
            return round($amount / self::KHR_TO_USD_RATE, 2);
        }

        throw new \InvalidArgumentException('Unsupported currency conversion');
    }

    /**
     * Create a deposit transaction.
     */
    public function deposit(Account $account, float $amount, string $description = null): Transaction
    {
        $reference = Transaction::generateReference();

        try {
            $this->accountService->deposit($account, $amount, $description);

            $transaction = Transaction::create([
                'account_id' => $account->id,
                'type' => 'deposit',
                'amount' => $amount,
                'balance_after' => $account->fresh()->balance,
                'status' => 'completed',
                'reference' => $reference,
                'description' => $description,
                'processed_at' => now(),
            ]);

            return $transaction;
        } catch (\Exception $e) {
            Transaction::create([
                'account_id' => $account->id,
                'type' => 'deposit',
                'amount' => $amount,
                'balance_after' => $account->balance,
                'status' => 'failed',
                'reference' => $reference,
                'description' => $description,
            ]);

            throw $e;
        }
    }

    /**
     * Create a withdrawal transaction.
     */
    public function withdraw(Account $account, float $amount, string $description = null): Transaction
    {
        $reference = Transaction::generateReference();

        try {
            $this->accountService->withdraw($account, $amount, $description);

            $transaction = Transaction::create([
                'account_id' => $account->id,
                'type' => 'withdrawal',
                'amount' => $amount,
                'balance_after' => $account->fresh()->balance,
                'status' => 'completed',
                'reference' => $reference,
                'description' => $description,
                'processed_at' => now(),
            ]);

            return $transaction;
        } catch (\Exception $e) {
            Transaction::create([
                'account_id' => $account->id,
                'type' => 'withdrawal',
                'amount' => $amount,
                'balance_after' => $account->balance,
                'status' => 'failed',
                'reference' => $reference,
                'description' => $description,
            ]);

            throw $e;
        }
    }

    /**
     * Create a transfer between two accounts.
     */
    public function transfer(Account $fromAccount, Account $toAccount, float $amount, string $description = null): Transaction
    {
        $reference = Transaction::generateReference();

        try {
            $senderAmount = $amount;
            $receiverAmount = $amount;

            if ($fromAccount->currency !== $toAccount->currency) {
                $receiverAmount = $this->convertAmount($amount, $fromAccount->currency, $toAccount->currency);
            }

            $this->accountService->withdraw($fromAccount, $senderAmount);
            $this->accountService->deposit($toAccount, $receiverAmount);

            $transaction = Transaction::create([
                'account_id' => $fromAccount->id,
                'type' => 'transfer',
                'amount' => $senderAmount,
                'balance_after' => $fromAccount->fresh()->balance,
                'status' => 'completed',
                'reference' => $reference,
                'recipient_account_id' => $toAccount->id,
                'description' => $description,
                'processed_at' => now(),
            ]);

            return $transaction;
        } catch (\Exception $e) {
            Transaction::create([
                'account_id' => $fromAccount->id,
                'type' => 'transfer',
                'amount' => $amount,
                'balance_after' => $fromAccount->balance,
                'status' => 'failed',
                'reference' => $reference,
                'recipient_account_id' => $toAccount->id,
                'description' => $description,
            ]);

            throw $e;
        }
    }

    /**
     * Create a bill/service payment transaction.
     */
    public function payment(Account $account, float $amount, string $service, string $reference): Transaction
    {
        $transactionReference = Transaction::generateReference();

        try {
            $this->accountService->withdraw($account, $amount, $service . ' payment');

            $transaction = Transaction::create([
                'account_id' => $account->id,
                'type' => 'payment',
                'amount' => $amount,
                'balance_after' => $account->fresh()->balance,
                'status' => 'completed',
                'reference' => $transactionReference,
                'description' => $service . ' payment - ' . $reference,
                'metadata' => [
                    'service' => $service,
                    'payment_reference' => $reference,
                ],
                'processed_at' => now(),
            ]);

            $user = $account->user;
            if ($user && $this->notificationService->shouldNotifyTransaction($user)) {
                $this->notificationService->notify(
                    $user,
                    'payment',
                    'Payment successful',
                    $service . ' payment of ' . number_format($amount, 2) . ' was completed.',
                    [
                        'transaction_id' => $transaction->id,
                        'service' => $service,
                        'payment_reference' => $reference,
                        'amount' => $amount,
                    ]
                );
            }

            return $transaction;
        } catch (\Exception $e) {
            Transaction::create([
                'account_id' => $account->id,
                'type' => 'payment',
                'amount' => $amount,
                'balance_after' => $account->balance,
                'status' => 'failed',
                'reference' => $transactionReference,
                'description' => $service . ' payment - ' . $reference,
                'metadata' => [
                    'service' => $service,
                    'payment_reference' => $reference,
                ],
            ]);

            throw $e;
        }
    }

    /**
     * Get transactions for an account.
     */
    public function getAccountTransactions(Account $account, int $limit = 50)
    {
        return $account->transactions()
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Get a specific transaction by reference.
     */
    public function getTransactionByReference(string $reference): ?Transaction
    {
        return Transaction::where('reference', $reference)->first();
    }
}
