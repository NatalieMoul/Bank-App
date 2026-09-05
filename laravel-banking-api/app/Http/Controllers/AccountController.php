<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\AccountService;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    protected AccountService $accountService;

    public function __construct(AccountService $accountService)
    {
        $this->accountService = $accountService;
    }

    /**
     * Get all accounts for authenticated user.
     */
    public function index(Request $request)
    {
        $accounts = $this->accountService->getUserAccounts($request->user());

        return response()->json([
            'accounts' => $accounts,
            'count' => $accounts->count(),
        ]);
    }

    /**
     * Create a new account.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_type' => ['required', 'in:savings,checking,business'],
            'currency' => ['nullable', 'string', 'size:3'],
        ]);

        try {
            $account = $this->accountService->createAccount(
                $request->user(),
                $validated['account_type'],
                $validated['currency'] ?? 'USD'
            );

            return response()->json([
                'message' => 'Account created successfully',
                'account' => $account,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create account',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get the primary/default account for the authenticated user.
     */
    public function showPrimary(Request $request)
    {
        $account = $request->user()->accounts()
            ->where('status', '!=', 'closed')
            ->orderBy('id')
            ->first();

        if (!$account) {
            return response()->json([
                'message' => 'Account not found',
            ], 404);
        }

        return response()->json([
            'account_number' => $account->account_number,
            'account_type' => $account->account_type,
            'balance' => (float) $account->balance,
            'currency' => $account->currency,
            'status' => $account->status,
        ]);
    }

    /**
     * Update the primary/default account for the authenticated user.
     */
    public function updatePrimary(Request $request)
    {
        $account = $request->user()->accounts()
            ->where('status', '!=', 'closed')
            ->orderBy('id')
            ->first();

        if (!$account) {
            return response()->json([
                'message' => 'Account not found',
            ], 404);
        }

        $validated = $request->validate([
            'account_type' => ['nullable', 'in:savings,checking,business'],
            'currency' => ['nullable', 'string', 'size:3'],
            'status' => ['nullable', 'in:active,frozen,closed'],
        ]);

        $account->fill(array_filter($validated, fn ($value) => $value !== null));
        $account->save();

        return response()->json([
            'account_number' => $account->account_number,
            'account_type' => $account->account_type,
            'balance' => (float) $account->balance,
            'currency' => $account->currency,
            'status' => $account->status,
        ]);
    }

    /**
     * Get a specific account.
     */
    public function show(Request $request, int $accountId)
    {
        $account = $this->accountService->getAccountByIdForUser($request->user(), $accountId);

        if (!$account) {
            return response()->json([
                'message' => 'Account not found',
            ], 404);
        }

        return response()->json([
            'account' => $account,
        ]);
    }

    /**
     * Get account balance for the primary/default account.
     */
    public function getPrimaryBalance(Request $request)
    {
        $account = $request->user()->accounts()
            ->where('status', '!=', 'closed')
            ->orderBy('id')
            ->first();

        if (!$account) {
            return response()->json([
                'message' => 'Account not found',
            ], 404);
        }

        return response()->json([
            'account_number' => $account->account_number,
            'balance' => (float) $account->balance,
            'currency' => $account->currency,
        ]);
    }

    /**
     * Get account balance.
     */
    public function getBalance(Request $request, int $accountId)
    {
        $account = $this->accountService->getAccountByIdForUser($request->user(), $accountId);

        if (!$account) {
            return response()->json([
                'message' => 'Account not found',
            ], 404);
        }

        return response()->json([
            'account_number' => $account->account_number,
            'balance' => $account->balance,
            'currency' => $account->currency,
            'status' => $account->status,
        ]);
    }

    /**
     * Freeze an account.
     */
    public function freeze(Request $request, int $accountId)
    {
        $account = $this->accountService->getAccountByIdForUser($request->user(), $accountId);

        if (!$account) {
            return response()->json([
                'message' => 'Account not found',
            ], 404);
        }

        try {
            $this->accountService->freezeAccount($account);

            return response()->json([
                'message' => 'Account frozen successfully',
                'account' => $account,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to freeze account',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Unfreeze an account.
     */
    public function unfreeze(Request $request, int $accountId)
    {
        $account = $this->accountService->getAccountByIdForUser($request->user(), $accountId);

        if (!$account) {
            return response()->json([
                'message' => 'Account not found',
            ], 404);
        }

        try {
            $this->accountService->unfreezeAccount($account);

            return response()->json([
                'message' => 'Account unfrozen successfully',
                'account' => $account,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to unfreeze account',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Close an account.
     */
    public function close(Request $request, int $accountId)
    {
        $account = $this->accountService->getAccountByIdForUser($request->user(), $accountId);

        if (!$account) {
            return response()->json([
                'message' => 'Account not found',
            ], 404);
        }

        try {
            $this->accountService->closeAccount($account);

            return response()->json([
                'message' => 'Account closed successfully',
                'account' => $account,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to close account',
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}
