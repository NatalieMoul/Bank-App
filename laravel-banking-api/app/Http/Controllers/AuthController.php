<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\SystemLog;
use App\Services\AuthService;
use App\Services\AccountService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected AuthService $authService;
    protected AccountService $accountService;
    protected NotificationService $notificationService;

    public function __construct(
        AuthService $authService,
        AccountService $accountService,
        NotificationService $notificationService
    ) {
        $this->authService = $authService;
        $this->accountService = $accountService;
        $this->notificationService = $notificationService;
    }

    /**
     * Register a new customer.
     */
    public function register(RegisterRequest $request)
    {
        $validated = $request->validated();

        try {
            $user = $this->authService->register($validated);

            $this->accountService->createAccount($user, 'savings');

            $this->notificationService->getOrCreateSettings($user);

            $token = $this->authService->login($user, 'mobile');
            SystemLog::record($user, 'USER_CREATED', 'success', 'New user registered', 'user', $user->id, ['email' => $user->email]);

            return response()->json([
                'message' => 'Registration successful',
                'user' => $user,
                'token' => $token,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Registration failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Login customer.
     */
    public function login(LoginRequest $request)
    {
        $validated = $request->validated();

        $credential = $validated['email'] ?? $validated['name'];

        try {
            $user = $this->authService->validateCredentials($credential, $validated['password']);
        } catch (\InvalidArgumentException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'status' => $exception->getCode() === 403
                    ? (str_contains(strtolower($exception->getMessage()), 'suspended') ? 'suspended' : 'banned')
                    : null,
            ], $exception->getCode() === 403 ? 403 : 422);
        }

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $this->authService->login($user, 'mobile');
        SystemLog::record($user, 'LOGIN', 'success', 'User logged in', 'user', $user->id, ['email' => $user->email]);

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Logout customer.
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        $user->currentAccessToken()->delete();

        SystemLog::record($user, 'LOGOUT', 'success', 'User logged out', 'user', $user->id, ['email' => $user->email]);

        return response()->json([
            'message' => 'Logout successful',
        ]);
    }

    /**
     * Get authenticated customer.
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Account not found. Please contact customer service.',
                'code' => 'ACCOUNT_NOT_FOUND',
            ], 401);
        }

        return response()->json([
            'user' => $user,
            'maintenance_mode' => \App\Services\SystemSettingsService::isMaintenanceMode()
                && ! $user->isAdmin(),
        ]);
    }

    /**
     * Update password.
     */
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        try {
            $user = $request->user();
            $this->authService->updatePassword(
                $user,
                $validated['current_password'],
                $validated['password']
            );

            SystemLog::record($user, 'PASSWORD_CHANGED', 'success', 'Password changed', 'user', $user->id, ['email' => $user->email]);

            return response()->json([
                'message' => 'Password updated successfully',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => 'Password update failed',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get all active tokens.
     */
    public function getTokens(Request $request)
    {
        $tokens = $this->authService->getActiveTokens($request->user());

        return response()->json([
            'tokens' => $tokens,
        ]);
    }
}
