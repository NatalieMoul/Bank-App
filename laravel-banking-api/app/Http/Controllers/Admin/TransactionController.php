<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::with('account', 'recipientAccount');
        foreach (['status', 'type'] as $filter) if ($request->filled($filter)) $query->where($filter, $request->$filter);
        if ($request->filled('from')) $query->whereDate('created_at', '>=', $request->from);
        if ($request->filled('to')) $query->whereDate('created_at', '<=', $request->to);
        if ($request->filled('month')) {
            $year = (int) $request->input('year', now()->year);
            $month = (int) $request->input('month');
            if ($month >= 1 && $month <= 12) {
                $query->whereYear('created_at', $year)->whereMonth('created_at', $month);
            }
        }
        $direction = $request->input('sort', 'desc') === 'asc' ? 'asc' : 'desc';
        $transactions = $query->orderBy('created_at', $direction)->orderBy('id', $direction)->paginate(20);
        return response()->json(['data' => $transactions->items(), 'pagination' => ['current_page' => $transactions->currentPage(), 'last_page' => $transactions->lastPage(), 'per_page' => $transactions->perPage(), 'total' => $transactions->total()]]);
    }

    public function show(int $id)
    {
        $transaction = Transaction::with('account', 'recipientAccount')->find($id);
        if (! $transaction) return response()->json(['message' => 'Transaction not found'], 404);
        return response()->json(['data' => $transaction]);
    }
}
