<?php

namespace App\Http\Controllers;

use App\Services\AccountService;
use App\Services\TransactionService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        protected TransactionService $transactionService,
        protected AccountService $accountService
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'service' => ['required', 'string', 'max:100'],
            'reference' => ['required', 'string', 'max:100'],
        ]);

        $account = $this->accountService->getUserAccounts($request->user())->sortBy('id')->first();

        if (!$account) {
            return response()->json(['message' => 'Account not found'], 404);
        }

        try {
            $transaction = $this->transactionService->payment(
                $account,
                (float) $validated['amount'],
                $validated['service'],
                $validated['reference']
            );

            return response()->json([
                'message' => 'Payment successful',
                'transaction' => $transaction,
                'new_balance' => $account->fresh()->balance,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Payment failed',
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}
