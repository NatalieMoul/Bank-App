<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;

class ReportService
{
    public function transactionSummary(Request $request): array
    {
        $query = Transaction::query();
        if ($request->filled('from')) $query->whereDate('created_at', '>=', $request->from);
        if ($request->filled('to')) $query->whereDate('created_at', '<=', $request->to);
        $transactions = $query->get();
        return ['total_transactions' => $transactions->count(), 'total_amount' => (float) $transactions->sum('amount'), 'completed' => $transactions->where('status', 'completed')->count(), 'failed' => $transactions->where('status', 'failed')->count(), 'pending' => $transactions->where('status', 'pending')->count()];
    }


    public function spendingReport(Request $request): array
    {
        $query = Transaction::query()
            ->join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->join('users', 'accounts.user_id', '=', 'users.id')
            ->where('transactions.status', 'completed')
            ->where(function ($q) {
                $q->whereIn('transactions.type', ['withdrawal', 'card_expense'])
                  ->orWhere(function ($transfer) {
                      $transfer->where('transactions.type', 'transfer')
                          ->whereNotNull('transactions.metadata->to_account');
                  });
            });

        if ($request->filled('from')) $query->whereDate('transactions.created_at', '>=', $request->from);
        if ($request->filled('to')) $query->whereDate('transactions.created_at', '<=', $request->to);

        $rows = $query
            ->selectRaw('users.id as user_id, users.name, users.email, SUM(transactions.amount) as total_spending, COUNT(transactions.id) as transaction_count')
            ->groupBy('users.id', 'users.name', 'users.email')
            ->orderByDesc('total_spending')
            ->get();

        return [
            'data' => $rows->map(fn ($row) => [
                'user_id' => (int) $row->user_id,
                'name' => $row->name,
                'email' => $row->email,
                'total_spending' => (float) $row->total_spending,
                'transaction_count' => (int) $row->transaction_count,
            ])->values()->all(),
        ];
    }

    public function userSummary(): array
    {
        return ['total_users' => User::count(), 'active_users' => User::where('status', 'active')->count(), 'customers' => User::where('role', 'customer')->count(), 'admins' => User::where('role', 'admin')->count()];
    }

    public function balanceSummary(): array
    {
        return ['total_balance' => (float) Account::sum('balance'), 'accounts' => Account::count()];
    }
}
