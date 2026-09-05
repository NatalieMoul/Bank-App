<?php

namespace App\Services;

use App\Models\Account;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class AccountService
{
    /**
     * Create a new account for a user.
     */
    public function createAccount(User $user, string $accountType = 'savings', string $currency = 'USD'): Account
    {
        return Account::create([
            'user_id' => $user->id,
            'account_number' => Account::generateAccountNumber(),
            'account_type' => $accountType,
            'status' => 'active',
            'currency' => $currency,
            'balance' => 0,
        ]);
    }

    /**
     * Get all accounts for a user.
     */
    public function getUserAccounts(User $user): Collection
    {
        return $user->accounts()->where('status', '!=', 'closed')->get();
    }

    /**
     * Get account by ID with authorization check.
     */
    public function getAccountByIdForUser(User $user, int $accountId): ?Account
    {
        return $user->accounts()
            ->where('id', $accountId)
            ->where('status', '!=', 'closed')
            ->first();
    }

    /**
     * Update account balance.
     */
    public function updateBalance(Account $account, float $amount): bool
    {
        return $account->update(['balance' => $account->balance + $amount]);
    }

    /**
     * Deposit money into account.
     */
    public function deposit(Account $account, float $amount, string $description = null): bool
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Deposit amount must be greater than 0');
        }

        if (!$account->isActive()) {
            throw new \InvalidArgumentException('Account is not active');
        }

        return $this->updateBalance($account, $amount);
    }

    /**
     * Withdraw money from account.
     */
    public function withdraw(Account $account, float $amount, string $description = null): bool
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Withdrawal amount must be greater than 0');
        }

        if ($account->balance < $amount) {
            throw new \InvalidArgumentException('Insufficient balance');
        }

        if (!$account->isActive()) {
            throw new \InvalidArgumentException('Account is not active');
        }

        return $this->updateBalance($account, -$amount);
    }

    /**
     * Freeze an account.
     */
    public function freezeAccount(Account $account, string $reason = null): bool
    {
        return $account->update(['status' => 'frozen']);
    }

    /**
     * Unfreeze an account.
     */
    public function unfreezeAccount(Account $account): bool
    {
        return $account->update(['status' => 'active']);
    }

    /**
     * Close an account.
     */
    public function closeAccount(Account $account): bool
    {
        if ($account->balance != 0) {
            throw new \InvalidArgumentException('Account balance must be zero before closing');
        }

        return $account->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);
    }
}
