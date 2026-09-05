<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateCardExpenseRequest;
use App\Models\Card;
use App\Models\CardExpense;
use App\Services\CardExpenseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CardExpenseController extends Controller
{
    public function __construct(private CardExpenseService $expenseService)
    {
    }

    public function store(CreateCardExpenseRequest $request, Card $card)
    {
        Gate::authorize('view', $card);

        try {
            $expense = $this->expenseService->create($request->user(), $card, $request->validated());
            return response()->json(['message' => 'Expense recorded successfully.', 'data' => $expense], 201);
        } catch (\InvalidArgumentException $exception) {
            $payload = json_decode($exception->getMessage(), true);
            return response()->json($payload ?: ['message' => $exception->getMessage()], 422);
        }
    }

    public function index(Request $request, Card $card)
    {
        Gate::authorize('view', $card);
        $validated = $request->validate([
            'category' => ['nullable', 'string', 'max:100'],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return response()->json([
            'data' => $this->expenseService->history($card, $validated, $validated['per_page'] ?? 15),
        ]);
    }

    public function show(Request $request, Card $card, CardExpense $expense)
    {
        Gate::authorize('view', $card);
        abort_unless((int) $expense->card_id === (int) $card->id, 404);
        return response()->json(['data' => $expense]);
    }
}
