<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'card_name' => ['sometimes', 'required', 'string', 'max:255'],
            'cardholder_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'daily_limit' => ['sometimes', 'required', 'numeric', 'gt:0'],
            'currency' => ['sometimes', 'required', 'string', 'size:3', 'in:USD,KHR'],
        ];
    }
}
