<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccountResource extends JsonResource
{
    public function toArray(Request $request): array { return ['id' => $this->id, 'account_number' => $this->account_number, 'account_type' => $this->account_type, 'balance' => (float) $this->balance, 'currency' => $this->currency, 'status' => $this->status, 'opened_at' => $this->opened_at?->toISOString(), 'closed_at' => $this->closed_at?->toISOString()]; }
}
