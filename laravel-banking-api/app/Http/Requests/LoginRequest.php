<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'email' => ['nullable', 'email', 'required_without:name'],
            'name' => ['nullable', 'string', 'required_without:email'],
            'password' => ['required', 'string'],
        ];
    }
}
