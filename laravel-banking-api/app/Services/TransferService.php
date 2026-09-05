<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Card;
use App\Models\Notification;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TransferService
{
    protected NotificationService $notificationService;
    protected const KHR_TO_USD_RATE = 4100.0;

    public function __construct(NotificationService $notificationService)
    {
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
     * Transfer money from the authenticated customer to another account.
     */
    public function transfer(
    User $customer,
    string $toAccountNumber,
    float $amount,
    string $currency,
    ?string $description = null,
    ?int $sourceAccountId = null,
    ?int $cardId = null
): array
    {
        $senderAccountQuery = $customer->accounts()->where('status', '!=', 'closed');
        if ($sourceAccountId) {
            $senderAccountQuery->where('id', $sourceAccountId);
        }
        $senderAccount = $senderAccountQuery->orderBy('id')->first();

        if (!$senderAccount) {
            throw new \InvalidArgumentException('No active account found for this customer');
        }

        $card = null;
        if ($cardId) {
            $card = Card::where('id', $cardId)
                ->whereHas('account', function ($query) use ($customer) {
                    $query->where('user_id', $customer->id);
                })
                ->first();

            if (!$card) {
                throw new \InvalidArgumentException('Card not found.');
            }

            if (!$card->isActive()) {
                throw new \InvalidArgumentException('Card is not active.');
            }

            if ((int) $card->account_id !== (int) $senderAccount->id) {
                throw new \InvalidArgumentException('Selected card is not linked to the selected account.');
            }

        }

        $receiverAccount = Account::where('account_number', $toAccountNumber)->first();

        if (!$receiverAccount) {
            throw new \InvalidArgumentException('Recipient account not found');
        }

        if (!$receiverAccount->isActive()) {
            throw new \InvalidArgumentException('Recipient account is not active');
        }

        if ($senderAccount->id === $receiverAccount->id) {
            throw new \InvalidArgumentException('Cannot transfer to the same account');
        }

        $requestCurrency = strtoupper($currency);
        $senderCurrency = strtoupper($senderAccount->currency);
        $receiverCurrency = strtoupper($receiverAccount->currency);

        if ($card && strtoupper($card->currency) !== $senderCurrency) {
            throw new \InvalidArgumentException('Selected card currency does not match the source account currency.');
        }

        if (!in_array($requestCurrency, [$senderCurrency, $receiverCurrency], true)) {
            throw new \InvalidArgumentException('Transfer currency does not match the sender account currency');
        }

        if ($amount <= 0) {
    throw new \InvalidArgumentException('Transfer amount must be greater than 0');
}

// Get transfer limits from admin settings
$settingsPath = storage_path('app/system_settings.json');
$settings = [];

if (is_file($settingsPath)) {
    $decodedSettings = json_decode(file_get_contents($settingsPath), true);

    if (is_array($decodedSettings)) {
        $settings = $decodedSettings;
    }
}

$minimumTransfer = (float) ($settings['minimum_transfer_amount'] ?? 1);
$maximumTransfer = (float) ($settings['maximum_transfer_amount'] ?? 5000);

// Minimum transfer check
if ($minimumTransfer > 0 && $amount < $minimumTransfer) {
    throw new \InvalidArgumentException(
        'Minimum transfer amount is $' . number_format($minimumTransfer, 2) . '.'
    );
}

// Maximum transfer check
if ($maximumTransfer > 0 && $amount > $maximumTransfer) {
    throw new \InvalidArgumentException(
        'Maximum transfer amount is $' . number_format($maximumTransfer, 2) . '.'
    );
}

        $senderAmount = $amount;
        $receiverAmount = $amount;

        $senderAmount = $amount;
        $receiverAmount = $amount;

        if ($requestCurrency === $senderCurrency) {
            $receiverAmount = $this->convertAmount($amount, $senderCurrency, $receiverCurrency);
        } else {
            $senderAmount = $this->convertAmount($amount, $receiverCurrency, $senderCurrency);
            $receiverAmount = $amount;
        }

        if ($senderAccount->balance < $senderAmount) {
            throw new \InvalidArgumentException('Insufficient balance');
        }

        if (!$senderAccount->isActive()) {
            throw new \InvalidArgumentException('Account is not active');
        }

        return DB::transaction(function () use ($senderAccount, $receiverAccount, $senderAmount, $receiverAmount, $description, $currency, $customer, $requestCurrency, $senderCurrency, $receiverCurrency, $card) {
            if ($card) {
                $todayStart = now()->startOfDay();
                $todayEnd = now()->endOfDay();

                $spentFromCardExpenses = (float) $card->expenses()
                    ->whereBetween('spent_at', [$todayStart, $todayEnd])
                    ->sum('amount');

                $spentFromTransfers = (float) Transaction::where('account_id', $senderAccount->id)
                    ->where('type', 'transfer')
                    ->whereBetween('created_at', [$todayStart, $todayEnd])
                    ->where('metadata->card_id', $card->id)
                    ->sum('amount');

                $spentToday = round($spentFromCardExpenses + $spentFromTransfers, 2);
                $dailyLimit = (float) $card->daily_limit;
                $remaining = round($dailyLimit - $spentToday, 2);

                
                if (round($spentToday + $senderAmount, 2) > $dailyLimit) {
                    throw new \InvalidArgumentException(
                    'Daily spending limit exceeded. ' .
                    'Remaining today: ' .
                    number_format(max(0, $remaining), 2)
                );
                }
            }

            $senderAccount->balance = $senderAccount->balance - $senderAmount;
            $senderAccount->save();

            $receiverAccount->balance = $receiverAccount->balance + $receiverAmount;
            $receiverAccount->save();

            $senderReference = Transaction::generateReference();
            $senderTransaction = Transaction::create([
                'account_id' => $senderAccount->id,
                'type' => 'transfer',
                'amount' => $senderAmount,
                'balance_after' => $senderAccount->fresh()->balance,
                'status' => 'completed',
                'reference' => $senderReference,
                'recipient_account_id' => $receiverAccount->id,
                'description' => $description,
                'metadata' => [
                    'to_account' => $receiverAccount->account_number,
                    'sender_currency' => $senderCurrency,
                    'transfer_currency' => $requestCurrency,
                    'receiver_currency' => $receiverCurrency,
                    'currency' => $senderCurrency,
                    'amount' => $senderAmount,
                    'converted_amount' => $receiverAmount,
                    'to_currency' => $receiverCurrency,
                    'exchange_rate' => $this->exchangeRate($senderCurrency, $receiverCurrency),
                    'card_id' => $card?->id,
                ],
                'processed_at' => now(),
            ]);

            $receiverReference = Transaction::generateReference();
            $receiverTransaction = Transaction::create([
                'account_id' => $receiverAccount->id,
                'type' => 'transfer',
                'amount' => $receiverAmount,
                'balance_after' => $receiverAccount->fresh()->balance,
                'status' => 'completed',
                'reference' => $receiverReference,
                'recipient_account_id' => $senderAccount->id,
                'description' => $description,
                'metadata' => [
                    'from_account' => $senderAccount->account_number,
                    'sender_currency' => $senderCurrency,
                    'transfer_currency' => $requestCurrency,
                    'receiver_currency' => $receiverCurrency,
                    'currency' => $receiverCurrency,
                    'amount' => $receiverAmount,
                    'source_amount' => $senderAmount,
                    'exchange_rate' => $this->exchangeRate($senderCurrency, $receiverCurrency),
                ],
                'processed_at' => now(),
            ]);

            $this->notificationService->notify(
                $customer,
                'transfer',
                'Transfer sent',
                "You sent {$senderAmount} {$senderCurrency} to {$receiverAccount->account_number}.",
                [
                    'amount' => $senderAmount,
                    'currency' => $senderCurrency,
                    'to_account' => $receiverAccount->account_number,
                    'reference' => $senderReference,
                ]
            );

            $this->notificationService->notify(
                $receiverAccount->user,
                'transfer',
                'Transfer received',
                "You received {$receiverAmount} {$receiverCurrency} from {$senderAccount->account_number}.",
                [
                    'amount' => $receiverAmount,
                    'currency' => $receiverCurrency,
                    'from_account' => $senderAccount->account_number,
                    'reference' => $receiverReference,
                    'source_amount' => $senderAmount,
                    'source_currency' => $senderCurrency,
                ]
            );

            return [
                'transaction' => $senderTransaction,
                'receiver_transaction' => $receiverTransaction,
                'recipient_name' => $receiverAccount->user?->name,
                'new_balance' => $senderAccount->fresh()->balance,
            ];
        });
    }

    protected function exchangeRate(string $fromCurrency, string $toCurrency): float
    {
        if ($fromCurrency === $toCurrency) {
            return 1.0;
        }

        return $fromCurrency === 'USD'
            ? self::KHR_TO_USD_RATE
            : 1 / self::KHR_TO_USD_RATE;
    }

    /**
     * Transfer between two known accounts.
     */
    public function transferBetweenAccounts(Account $fromAccount, Account $toAccount, float $amount, ?string $description = null): array
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Transfer amount must be greater than 0');
        }

        if ($fromAccount->balance < $amount) {
            throw new \InvalidArgumentException('Insufficient balance');
        }

        $convertedAmount = $this->convertAmount($amount, $fromAccount->currency, $toAccount->currency);

        return DB::transaction(function () use ($fromAccount, $toAccount, $amount, $description, $convertedAmount) {
            $fromAccount->balance = $fromAccount->balance - $amount;
            $fromAccount->save();

            $toAccount->balance = $toAccount->balance + $convertedAmount;
            $toAccount->save();

            $senderReference = Transaction::generateReference();
            $senderTransaction = Transaction::create([
                'account_id' => $fromAccount->id,
                'type' => 'transfer',
                'amount' => $amount,
                'balance_after' => $fromAccount->fresh()->balance,
                'status' => 'completed',
                'reference' => $senderReference,
                'recipient_account_id' => $toAccount->id,
                'description' => $description,
                'metadata' => [
                    'to_account' => $toAccount->account_number,
                    'currency' => $fromAccount->currency,
                    'converted_amount' => $convertedAmount,
                    'to_currency' => $toAccount->currency,
                ],
                'processed_at' => now(),
            ]);

            $receiverReference = Transaction::generateReference();
            $receiverTransaction = Transaction::create([
                'account_id' => $toAccount->id,
                'type' => 'transfer',
                'amount' => $convertedAmount,
                'balance_after' => $toAccount->fresh()->balance,
                'status' => 'completed',
                'reference' => $receiverReference,
                'recipient_account_id' => $fromAccount->id,
                'description' => $description,
                'metadata' => [
                    'from_account' => $fromAccount->account_number,
                    'currency' => $toAccount->currency,
                    'source_amount' => $amount,
                    'source_currency' => $fromAccount->currency,
                ],
                'processed_at' => now(),
            ]);

            $this->notificationService->notify(
                $fromAccount->user,
                'transfer',
                'Transfer sent',
                "You sent {$amount} {$fromAccount->currency} to {$toAccount->account_number}.",
                [
                    'amount' => $amount,
                    'currency' => $fromAccount->currency,
                    'to_account' => $toAccount->account_number,
                    'reference' => $senderReference,
                ]
            );

            $this->notificationService->notify(
                $toAccount->user,
                'transfer',
                'Transfer received',
                "You received {$convertedAmount} {$toAccount->currency} from {$fromAccount->account_number}.",
                [
                    'amount' => $convertedAmount,
                    'currency' => $toAccount->currency,
                    'from_account' => $fromAccount->account_number,
                    'reference' => $receiverReference,
                    'source_amount' => $amount,
                    'source_currency' => $fromAccount->currency,
                ]
            );

            return [
                'transaction' => $senderTransaction,
                'receiver_transaction' => $receiverTransaction,
                'new_balance' => $fromAccount->fresh()->balance,
            ];
        });
    }
}
