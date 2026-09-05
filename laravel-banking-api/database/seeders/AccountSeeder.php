<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Account;
use Illuminate\Database\Seeder;

class AccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Only create accounts for customer users
        $customers = User::where('role', 'customer')->get();

        foreach ($customers as $user) {
            // Create a savings account
            Account::create([
                'user_id' => $user->id,
                'account_number' => 'ACC' . strtoupper(uniqid()),
                'account_type' => 'savings',
                'balance' => rand(1000, 50000) + rand(0, 99) / 100,
                'status' => 'active',
                'currency' => 'USD',
                'opened_at' => now()->subMonths(rand(1, 24)),
            ]);

            // Create a checking account
            Account::create([
                'user_id' => $user->id,
                'account_number' => 'ACC' . strtoupper(uniqid()),
                'account_type' => 'checking',
                'balance' => rand(500, 10000) + rand(0, 99) / 100,
                'status' => 'active',
                'currency' => 'USD',
                'opened_at' => now()->subMonths(rand(1, 24)),
            ]);

            // Create a business account for some users
            if (rand(0, 1)) {
                Account::create([
                    'user_id' => $user->id,
                    'account_number' => 'ACC' . strtoupper(uniqid()),
                    'account_type' => 'business',
                    'balance' => rand(10000, 100000) + rand(0, 99) / 100,
                    'status' => 'active',
                    'currency' => 'USD',
                    'opened_at' => now()->subMonths(rand(3, 36)),
                ]);
            }
        }
    }
}
