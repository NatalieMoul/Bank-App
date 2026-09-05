<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['account_id', 'card_name', 'card_number', 'card_number_hash', 'last_four', 'cardholder_name', 'expiration_month', 'expiration_year', 'daily_limit', 'balance', 'currency', 'status'])]
class Card extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_id',
        'card_name',
        'card_number',
        'card_number_hash',
        'last_four',
        'cardholder_name',
        'expiration_month',
        'expiration_year',
        'daily_limit',
        'balance',
        'currency',
        'status',
    ];

    protected $casts = [
        'card_number' => 'encrypted',
        'daily_limit' => 'decimal:2',
        'balance' => 'decimal:2',
    ];

    protected $hidden = [
        'card_number',
        'card_number_hash',
    ];

    protected $appends = ['masked_card_number'];

    public function getMaskedCardNumberAttribute(): ?string
    {
        return $this->last_four ? '**** **** **** ' . $this->last_four : null;
    }

    public static function generateCardNumber(): string
    {
        do {
            $digits = '4';
            for ($index = 0; $index < 14; $index++) {
                $digits .= (string) random_int(0, 9);
            }
            $checkDigit = 0;
            $reversed = strrev($digits);
            for ($index = 0; $index < strlen($reversed); $index++) {
                $digit = (int) $reversed[$index];
                if ($index % 2 === 0) {
                    $digit *= 2;
                    $digit = $digit > 9 ? $digit - 9 : $digit;
                }
                $checkDigit += $digit;
            }
            $number = $digits . ((10 - ($checkDigit % 10)) % 10);
        } while (self::where('card_number_hash', hash('sha256', $number))->exists());

        return $number;
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(CardExpense::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
