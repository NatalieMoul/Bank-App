<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array { return ['id' => $this->id, 'account_id' => $this->account_id, 'recipient_account_id' => $this->recipient_account_id, 'type' => $this->type, 'amount' => (float) $this->amount, 'balance_after' => (float) $this->balance_after, 'status' => $this->status, 'reference' => $this->reference, 'description' => $this->description, 'metadata' => $this->metadata, 'created_at' => $this->created_at?->toISOString(), 'processed_at' => $this->processed_at?->toISOString()]; }
}
