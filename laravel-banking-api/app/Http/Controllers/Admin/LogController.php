<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemLog;
use Illuminate\Http\Request;

class LogController extends Controller
{
    public function index(Request $request)
    {
        $query = SystemLog::with('user');
        if ($request->filled('action')) $query->where('action', strtoupper($request->action));
        $logs = $query->latest()->paginate(20);
        return response()->json(['data' => $logs->items(), 'pagination' => ['current_page' => $logs->currentPage(), 'last_page' => $logs->lastPage(), 'per_page' => $logs->perPage(), 'total' => $logs->total()]]);
    }

    public function show(int $id)
    {
        $log = SystemLog::with('user')->find($id);
        if (! $log) return response()->json(['message' => 'Log not found'], 404);
        return response()->json(['data' => $log]);
    }
}
