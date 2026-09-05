<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateCardRequest;
use App\Http\Requests\UpdateCardRequest;
use App\Models\Card;
use App\Services\CardExpenseService;
use App\Services\CardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CardController extends Controller
{
    public function __construct(
        private CardService $cardService,
        private CardExpenseService $cardExpenseService,
    ) {
    }

    public function index(Request $request)
    {
        $cards = Card::query()
            ->whereHas('account', fn ($query) => $query->where('user_id', $request->user()->id))
            ->with('account:id,account_number,balance,currency,status')
            ->latest()
            ->get();

        return response()->json(['data' => $cards]);
    }

    public function store(CreateCardRequest $request)
    {
        Gate::authorize('create', Card::class);

        try {
            $card = $this->cardService->create($request->user(), $request->validated());
            return response()->json(['message' => 'Card created successfully.', 'data' => $card], 201);
        } catch (\InvalidArgumentException $exception) {
            return $this->businessError($exception);
        }
    }

    public function show(Request $request, Card $card)
    {
        Gate::authorize('view', $card);
        return response()->json(['data' => $card->load('account:id,account_number,balance,currency,status')]);
    }

    public function update(UpdateCardRequest $request, Card $card)
    {
        Gate::authorize('update', $card);

        try {
            return response()->json([
                'message' => 'Card updated successfully.',
                'data' => $this->cardService->update($card, $request->validated()),
            ]);
        } catch (\InvalidArgumentException $exception) {
            return $this->businessError($exception);
        }
    }

    public function updateStatus(Request $request, Card $card)
    {
        Gate::authorize('update', $card);
        $validated = $request->validate(['status' => ['required', 'in:active,inactive']]);

        return response()->json([
            'message' => 'Card status updated successfully.',
            'data' => $this->cardService->updateStatus($card, $validated['status']),
        ]);
    }

    public function destroy(Request $request, Card $card)
    {
        Gate::authorize('delete', $card);
        $card->delete();

        return response()->json(['message' => 'Card deleted successfully.']);
    }

    public function summary(Request $request, Card $card)
    {
        Gate::authorize('view', $card);
        return response()->json(['data' => $this->cardExpenseService->summary($card)]);
    }

    private function businessError(\InvalidArgumentException $exception)
    {
        $payload = json_decode($exception->getMessage(), true);
        return response()->json($payload ?: ['message' => $exception->getMessage()], 422);
    }
}
