<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateCardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'account_id' => ['required', 'integer', 'exists:accounts,id'],
            'card_name' => ['required', 'string', 'max:255'],
            'cardholder_name' => ['nullable', 'string', 'max:255'],
            'daily_limit' => ['required', 'numeric', 'gt:0'],
            'currency' => ['required', 'string', 'size:3', 'in:USD,KHR'],
        ];
    }
}
