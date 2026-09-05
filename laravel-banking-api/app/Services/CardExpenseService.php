<?php

namespace App\Services;

use App\Models\Card;
use App\Models\CardExpense;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CardExpenseService
{
    public function __construct(private NotificationService $notificationService)
    {
    }

    public function create(User $user, Card $card, array $attributes): CardExpense
    {
        if ((int) $card->account->user_id !== (int) $user->id) {
            throw new \InvalidArgumentException('Card not found.');
        }

        if (!$card->isActive()) {
            throw new \InvalidArgumentException('Card is not active.');
        }

        $currency = strtoupper($attributes['currency']);
        if ($currency !== strtoupper($card->currency)) {
            throw new \InvalidArgumentException('Expense currency must match the card currency.');
        }

        $amount = round((float) $attributes['amount'], 2);
        $spentAt = now();

        return DB::transaction(function () use ($user, $card, $attributes, $currency, $amount, $spentAt) {
            $account = $card->account()->lockForUpdate()->first();
            $spentToday = (float) $card->expenses()
                ->whereBetween('spent_at', [$spentAt->copy()->startOfDay(), $spentAt->copy()->endOfDay()])
                ->sum('amount');
            $remaining = round((float) $card->daily_limit - $spentToday, 2);

            if (round($spentToday + $amount, 2) > (float) $card->daily_limit) {
                throw new \InvalidArgumentException(json_encode([
                    'message' => 'Daily spending limit exceeded.',
                    'daily_limit' => (float) $card->daily_limit,
                    'spent_today' => $spentToday,
                    'remaining_today' => $remaining,
                    'requested_amount' => $amount,
                ]));
            }

            if (!$account->isActive()) {
                throw new \InvalidArgumentException('Linked account is not active.');
            }

            if ((float) $account->balance < $amount) {
                throw new \InvalidArgumentException(json_encode([
                    'message' => 'Insufficient account balance.',
                    'balance' => (float) $account->balance,
                    'requested_amount' => $amount,
                ]));
            }

            $account->decrement('balance', $amount);
            $expense = $card->expenses()->create([
                'amount' => $amount,
                'currency' => $currency,
                'category' => $attributes['category'] ?? null,
                'merchant' => $attributes['merchant'] ?? null,
                'description' => $attributes['description'] ?? null,
                'spent_at' => $spentAt,
            ]);

            $transaction = Transaction::create([
                'account_id' => $account->id,
                'type' => 'card_expense',
                'amount' => $amount,
                'balance_after' => $account->fresh()->balance,
                'status' => 'completed',
                'reference' => Transaction::generateReference(),
                'description' => $expense->description ?? $expense->merchant ?? 'Card Expense',
                'metadata' => [
                    'card_id' => $card->id,
                    'card_expense_id' => $expense->id,
                    'currency' => $currency,
                    'merchant' => $expense->merchant,
                    'category' => $expense->category,
                ],
                'processed_at' => now(),
            ]);

            if ($this->notificationService->shouldNotifyTransaction($user)) {
                $merchant = $expense->merchant ? " at {$expense->merchant}" : '';
                $this->notificationService->notify(
                    $user,
                    'transaction',
                    'Card Expense',
                    "You spent {$amount} {$currency}{$merchant}.",
                    ['card_id' => $card->id, 'card_expense_id' => $expense->id, 'transaction_id' => $transaction->id]
                );
            }

            return $expense->fresh();
        });
    }

    public function history(Card $card, array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = $card->expenses()->latest('spent_at');

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }
        if (!empty($filters['date'])) {
            $query->whereDate('spent_at', $filters['date']);
        }
        if (!empty($filters['from'])) {
            $query->whereDate('spent_at', '>=', $filters['from']);
        }
        if (!empty($filters['to'])) {
            $query->whereDate('spent_at', '<=', $filters['to']);
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function summary(Card $card): array
    {
        $spentToday = (float) $card->expenses()
            ->whereDate('spent_at', today())
            ->sum('amount');
        $dailyLimit = (float) $card->daily_limit;
        $remaining = max(0, round($dailyLimit - $spentToday, 2));

        return [
            'card' => ['id' => $card->id, 'name' => $card->card_name, 'status' => $card->status],
            'daily_limit' => $dailyLimit,
            'spent_today' => $spentToday,
            'remaining_today' => $remaining,
            'currency' => $card->currency,
            'percentage_used' => $dailyLimit > 0 ? round(min(100, ($spentToday / $dailyLimit) * 100), 2) : 0,
        ];
    }
}
