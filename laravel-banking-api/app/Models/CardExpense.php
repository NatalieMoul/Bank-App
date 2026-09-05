<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['card_id', 'amount', 'currency', 'category', 'merchant', 'description', 'spent_at'])]
class CardExpense extends Model
{
    use HasFactory;

    protected $fillable = [
        'card_id',
        'amount',
        'currency',
        'category',
        'merchant',
        'description',
        'spent_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'spent_at' => 'datetime',
    ];

    public function card(): BelongsTo
    {
        return $this->belongsTo(Card::class);
    }
}
