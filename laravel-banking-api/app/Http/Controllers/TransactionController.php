<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\AccountService;
use App\Services\TransactionService;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    protected TransactionService $transactionService;
    protected AccountService $accountService;

    public function __construct(
        TransactionService $transactionService,
        AccountService $accountService
    ) {
        $this->transactionService = $transactionService;
        $this->accountService = $accountService;
    }

    /**
     * Get transactions for an account.
     */
    public function index(Request $request, int $accountId)
    {
        $account = $this->accountService->getAccountByIdForUser($request->user(), $accountId);

        if (!$account) {
            return response()->json([
                'message' => 'Account not found',
            ], 404);
        }

        $transactions = $this->transactionService->getAccountTransactions($account, 50);

        return response()->json([
            'account_id' => $account->id,
            'transactions' => $transactions,
            'count' => $transactions->count(),
        ]);
    }

    /**
     * Get transaction history for the authenticated user across all accounts.
     */
    public function history(Request $request)
    {
        $transactions = Transaction::whereIn('account_id', $request->user()->accounts()->pluck('id'))
            ->latest()
            ->get();

        return response()->json([
            'data' => $transactions->map(function (Transaction $transaction) {
                return [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'amount' => (float) $transaction->amount,
                    'currency' => $transaction->account?->currency ?? 'USD',
                    'status' => $transaction->status,
                    'reference' => $transaction->reference,
                    'description' => $transaction->description,
                    'balance_after' => (float) $transaction->balance_after,
                    'metadata' => $transaction->metadata,
                    'created_at' => $transaction->created_at?->toISOString(),
                ];
            })->values(),
        ]);
    }

    /**
     * Get a transaction detail for the authenticated user.
     */
    public function showById(Request $request, int $transactionId)
    {
        $transaction = Transaction::whereIn('account_id', $request->user()->accounts()->pluck('id'))
            ->find($transactionId);

        if (!$transaction) {
            return response()->json([
                'message' => 'Transaction not found',
            ], 404);
        }

        return response()->json([
            'data' => [
                'id' => $transaction->id,
                'account_id' => $transaction->account_id,
                'type' => $transaction->type,
                'amount' => (float) $transaction->amount,
                'currency' => $transaction->account?->currency ?? 'USD',
                'status' => $transaction->status,
                'reference' => $transaction->reference,
                'description' => $transaction->description,
                'recipient_account_id' => $transaction->recipient_account_id,
                'balance_after' => (float) $transaction->balance_after,
                'metadata' => $transaction->metadata,
                'created_at' => $transaction->created_at?->toISOString(),
                'processed_at' => $transaction->processed_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Get a transaction detail by reference for the authenticated user.
     */
    public function showByReference(Request $request, string $reference)
    {
        $transaction = Transaction::where('reference', $reference)
            ->whereIn('account_id', $request->user()->accounts()->pluck('id'))
            ->first();

        if (!$transaction) {
            return response()->json([
                'message' => 'Transaction not found',
            ], 404);
        }

        return response()->json([
            'data' => [
                'id' => $transaction->id,
                'account_id' => $transaction->account_id,
                'type' => $transaction->type,
                'amount' => (float) $transaction->amount,
                'currency' => $transaction->account?->currency ?? 'USD',
                'status' => $transaction->status,
                'reference' => $transaction->reference,
                'description' => $transaction->description,
                'recipient_account_id' => $transaction->recipient_account_id,
                'balance_after' => (float) $transaction->balance_after,
                'metadata' => $transaction->metadata,
                'created_at' => $transaction->created_at?->toISOString(),
                'processed_at' => $transaction->processed_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Create a deposit transaction.
     */
    public function deposit(Request $request, int $accountId)
    {
        $account = $this->accountService->getAccountByIdForUser($request->user(), $accountId);

        if (!$account) {
            return response()->json([
                'message' => 'Account not found',
            ], 404);
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $transaction = $this->transactionService->deposit(
                $account,
                $validated['amount'],
                $validated['description'] ?? null
            );

            return response()->json([
                'message' => 'Deposit successful',
                'transaction' => $transaction,
                'new_balance' => $account->fresh()->balance,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Deposit failed',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Create a withdrawal transaction.
     */
    public function withdraw(Request $request, int $accountId)
    {
        $account = $this->accountService->getAccountByIdForUser($request->user(), $accountId);

        if (!$account) {
            return response()->json([
                'message' => 'Account not found',
            ], 404);
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $transaction = $this->transactionService->withdraw(
                $account,
                $validated['amount'],
                $validated['description'] ?? null
            );

            return response()->json([
                'message' => 'Withdrawal successful',
                'transaction' => $transaction,
                'new_balance' => $account->fresh()->balance,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Withdrawal failed',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Create a transfer transaction.
     */
    public function transfer(Request $request, int $accountId)
    {
        $fromAccount = $this->accountService->getAccountByIdForUser($request->user(), $accountId);

        if (!$fromAccount) {
            return response()->json([
                'message' => 'Account not found',
            ], 404);
        }

        $validated = $request->validate([
            'to_account_id' => ['required', 'integer', 'exists:accounts,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $toAccount = $this->accountService->getAccountByIdForUser($request->user(), $validated['to_account_id']);
        
        if ($fromAccount->id === $validated['to_account_id']) {
            return response()->json([
                'message' => 'Cannot transfer to the same account',
            ], 422);
        }

        try {
            $transaction = $this->transactionService->transfer(
                $fromAccount,
                \App\Models\Account::findOrFail($validated['to_account_id']),
                $validated['amount'],
                $validated['description'] ?? null
            );

            return response()->json([
                'message' => 'Transfer successful',
                'transaction' => $transaction,
                'new_balance' => $fromAccount->fresh()->balance,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Transfer failed',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get transaction details.
     */
    public function show(Request $request, int $accountId, string $reference)
    {
        $account = $this->accountService->getAccountByIdForUser($request->user(), $accountId);

        if (!$account) {
            return response()->json([
                'message' => 'Account not found',
            ], 404);
        }

        $transaction = $this->transactionService->getTransactionByReference($reference);

        if (!$transaction || $transaction->account_id !== $account->id) {
            return response()->json([
                'message' => 'Transaction not found',
            ], 404);
        }

        return response()->json([
            'transaction' => $transaction,
        ]);
    }
}
