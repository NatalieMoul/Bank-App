<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'account_id' => ['nullable', 'integer'],

            // A card is required because transfers are controlled
            // by the card's daily spending limit.
            'card_id' => ['required', 'integer'],

            'to_account' => ['required', 'string'],

            'amount' => ['required', 'numeric', 'min:0.01'],

            'currency' => [
                'nullable',
                'string',
                'size:3',
                'in:USD,KHR',
                'required_without:transfer_currency',
            ],

            'transfer_currency' => [
                'nullable',
                'string',
                'size:3',
                'in:USD,KHR',
                'required_without:currency',
            ],

            'description' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }
}