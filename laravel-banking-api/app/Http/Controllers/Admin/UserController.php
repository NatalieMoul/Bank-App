<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('accounts')->latest()->get()->map(fn (User $user) => $this->formatUser($user));

        return response()->json(['data' => $users, 'count' => $users->count()]);
    }

    public function show(int $id)
    {
        $user = User::with('accounts')->find($id);
        if (! $user) return response()->json(['message' => 'User not found'], 404);

        return response()->json(['data' => $this->formatUser($user, true)]);
    }

    public function update(Request $request, int $id)
    {
        $user = User::find($id);
        if (! $user) return response()->json(['message' => 'User not found'], 404);

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'], 'email' => ['nullable', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'phone' => ['nullable', 'string', 'max:20', 'unique:users,phone,'.$user->id], 'status' => ['nullable', 'in:active,inactive,suspended,banned'],
            'role' => ['nullable', 'in:customer,admin'],
        ]);
        $user->fill(array_filter($validated, fn ($value) => $value !== null))->save();

        return response()->json(['message' => 'User updated', 'data' => $this->formatUser($user)]);
    }

    public function destroy(int $id)
    {
        $user = User::find($id);
        if (! $user) return response()->json(['message' => 'User not found'], 404);
        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }

    private function formatUser(User $user, bool $detailed = false): array
    {
        $account = $user->accounts
            ->where('status', '!=', 'closed')
            ->sortBy('id')
            ->first();
        return array_filter([
            'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
            'phone' => $detailed ? $user->phone : null, 'role' => $detailed ? $user->role : null,
            'account' => $account?->account_number, 'balance' => $account ? (float) $account->balance : 0.0,
            'currency' => $account?->currency ?? 'USD',
            'status' => $user->status, 'created_at' => $user->created_at?->toISOString(),
        ], fn ($value) => $value !== null);
    }
}
