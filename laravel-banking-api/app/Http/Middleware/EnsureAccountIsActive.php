<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->status === 'suspended') {
            return response()->json([
                'message' => 'Your account is suspended. Please contact support.',
                'status' => 'suspended',
            ], 403);
        }

        if ($user?->status === 'banned') {
            return response()->json([
                'message' => 'Your account has been banned. Please contact support.',
                'status' => 'banned',
            ], 403);
        }

        return $next($request);
    }
}