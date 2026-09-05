<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    /**
     * Register a new user (customer only).
     */
    public function register(array $data): User
    {
        return User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'password' => Hash::make($data['password']),
            'role' => 'customer',
            'status' => 'active',
        ]);
    }

    /**
     * Authenticate a user and return a token.
     */
    public function login(User $user, string $deviceName = 'default'): string
    {
        return $user->createToken($deviceName)->plainTextToken;
    }

    /**
     * Logout a user (revoke all tokens).
     */
    public function logout(User $user): void
    {
        $user->tokens()->delete();
    }

    /**
     * Logout a user from a specific device.
     */
    public function logoutFromDevice(User $user, string $tokenId): bool
    {
        return $user->tokens()
            ->where('id', $tokenId)
            ->delete() > 0;
    }

    /**
     * Get all active tokens for a user.
     */
    public function getActiveTokens(User $user)
    {
        return $user->tokens()->get();
    }

    /**
     * Check if credentials are valid.
     */
    public function validateCredentials(string $credential, string $password): ?User
    {
        $user = User::where('email', $credential)
            ->orWhere('name', $credential)
            ->first();

        if ($user && Hash::check($password, $user->password)) {
            if ($user->status === 'suspended') {
                throw new \InvalidArgumentException('Your account is suspended. Please contact support.', 403);
            }

            if ($user->status === 'banned') {
                throw new \InvalidArgumentException('Your account has been banned. Please contact support.', 403);
            }
            
            return $user;
        }

        return null;
    }

    /**
     * Update user password.
     */
    public function updatePassword(User $user, string $currentPassword, string $newPassword): bool
    {
        if (!Hash::check($currentPassword, $user->password)) {
            throw new \InvalidArgumentException('Current password is incorrect');
        }

        return $user->update(['password' => Hash::make($newPassword)]);
    }
}
