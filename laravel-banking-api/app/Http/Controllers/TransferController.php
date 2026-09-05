<?php

namespace App\Http\Controllers;

use App\Http\Requests\TransferRequest;
use App\Services\TransferService;
use Illuminate\Http\Request;

class TransferController extends Controller
{
    protected TransferService $transferService;

    public function __construct(TransferService $transferService)
    {
        $this->transferService = $transferService;
    }

    /**
     * Create a transfer from the authenticated customer's account
     * using a selected active card.
     */
    public function store(TransferRequest $request)
    {
        $validated = $request->validated();

        try {
            $result = $this->transferService->transfer(
                $request->user(),
                $validated['to_account'],
                (float) $validated['amount'],
                strtoupper(
                    $validated['transfer_currency']
                    ?? $validated['currency']
                ),
                $validated['description'] ?? null,
                $validated['account_id'] ?? null,
                $validated['card_id']
            );

            return response()->json([
                'message' => 'Transfer successful',
                'data' => $result,
            ], 201);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Transfer failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}