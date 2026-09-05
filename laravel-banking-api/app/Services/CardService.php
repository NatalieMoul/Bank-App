<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Card;
use App\Models\User;

class CardService
{
    public function create(User $user, array $attributes): Card
    {
        $account = $user->accounts()->find($attributes['account_id']);

        if (!$account) {
            throw new \InvalidArgumentException('Account not found.');
        }

        if (!$account->isActive()) {
            throw new \InvalidArgumentException('Account is not active.');
        }

        $currency = strtoupper($attributes['currency']);
        if ($currency !== strtoupper($account->currency)) {
            throw new \InvalidArgumentException('Card currency must match the account currency.');
        }

        $cardNumber = Card::generateCardNumber();

        return $account->cards()->create([
            'card_name' => $attributes['card_name'],
            'card_number' => $cardNumber,
            'card_number_hash' => hash('sha256', $cardNumber),
            'last_four' => substr($cardNumber, -4),
            'cardholder_name' => $attributes['cardholder_name'] ?? $user->name,
            'expiration_month' => now()->month,
            'expiration_year' => now()->addYears(3)->year,
            'daily_limit' => $attributes['daily_limit'],
            'balance' => 0,
            'currency' => $currency,
            'status' => 'active',
        ]);
    }

    public function update(Card $card, array $attributes): Card
    {
        if (isset($attributes['currency'])) {
            $currency = strtoupper($attributes['currency']);
            if ($currency !== strtoupper($card->account->currency)) {
                throw new \InvalidArgumentException('Card currency must match the account currency.');
            }
            $attributes['currency'] = $currency;
        }

        $card->update($attributes);
        return $card->fresh();
    }

    public function updateStatus(Card $card, string $status): Card
    {
        $card->update(['status' => $status]);
        return $card->fresh();
    }

    public function ownedBy(User $user, Card $card): bool
    {
        return (int) $card->account->user_id === (int) $user->id;
    }
}
