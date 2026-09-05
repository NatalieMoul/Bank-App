<?php

namespace App\Http\Controllers;

use App\Services\AccountService;
use App\Services\TransactionService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private TransactionService $transactionService,
        private AccountService $accountService
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_id' => ['required', 'integer'],
            'service' => ['required', 'string', 'in:Internet & TV,Utilities,Government Services,Mobile Top Up'],
            'provider' => ['nullable', 'string', 'max:50'],
            'reference' => ['required', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        $account = $this->accountService->getAccountByIdForUser(
            $request->user(),
            $validated['account_id']
        );

        if (!$account) {
            return response()->json(['message' => 'Account not found.'], 404);
        }

        try {
            $transaction = $this->transactionService->payment(
                $account,
                (float) $validated['amount'],
                $validated['service'],
                trim($validated['reference'])
            );

            return response()->json([
                'message' => $validated['service'] . ' payment successful.',
                'transaction' => $transaction,
                'new_balance' => $account->fresh()->balance,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage() ?: 'Payment failed.',
            ], 422);
        }
    }
}
