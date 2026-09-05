<?php

namespace App\Http\Middleware;

use App\Services\SystemSettingsService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckMaintenanceMode
{
    /**
     * Blocks access to banking services while maintenance mode is on.
     * Users can still log in and stay logged in — this only stops them
     * from performing actions (transfers, deposits, cards, etc). Admins
     * are always allowed through so they can manage the system and turn
     * maintenance mode back off.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! SystemSettingsService::isMaintenanceMode()) {
            return $next($request);
        }

        // Reads (GET/HEAD) stay open so users can still log in, restore their
        // session, and view their dashboard/balance. Only actions that change
        // something (transfers, deposits, card changes, etc) are blocked.
        if ($request->isMethod('GET') || $request->isMethod('HEAD')) {
            return $next($request);
        }

        $user = $request->user();
        if ($user?->isAdmin()) {
            return $next($request);
        }

        return response()->json([
            'message' => 'The app is currently under maintenance. Services are temporarily unavailable, please try again later.',
            'maintenance' => true,
        ], 503);
    }
}
