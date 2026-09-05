<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ===== ADMIN USERS =====
        
        // Create admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@bank.com',
            'phone' => '5550000001',
            'address' => '999 Bank Plaza, New York, NY 10001',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Create another admin
        User::create([
            'name' => 'Manager Admin',
            'email' => 'manager@bank.com',
            'phone' => '5550000002',
            'address' => '999 Bank Plaza, New York, NY 10001',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // ===== CUSTOMER USERS =====
        
        // Create test customer 1
        User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '1234567890',
            'address' => '123 Main St, New York, NY 10001',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Create test customer 2
        User::create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'phone' => '0987654321',
            'address' => '456 Oak Ave, Los Angeles, CA 90001',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Create test customer 3
        User::create([
            'name' => 'Robert Johnson',
            'email' => 'robert@example.com',
            'phone' => '5551234567',
            'address' => '789 Pine Rd, Chicago, IL 60601',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Create test customer 4
        User::create([
            'name' => 'Sarah Williams',
            'email' => 'sarah@example.com',
            'phone' => '5559876543',
            'address' => '321 Elm St, Houston, TX 77001',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Create test customer 5
        User::create([
            'name' => 'Michael Brown',
            'email' => 'michael@example.com',
            'phone' => '5555551234',
            'address' => '654 Maple Dr, Phoenix, AZ 85001',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Create suspended customer
        User::create([
            'name' => 'Suspended User',
            'email' => 'suspended@example.com',
            'phone' => '5555551235',
            'address' => '123 Suspend St',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'status' => 'suspended',
            'email_verified_at' => now(),
        ]);

        // Create banned customer
        User::create([
            'name' => 'Banned User',
            'email' => 'banned@example.com',
            'phone' => '5555551236',
            'address' => '456 Ban Ave',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'status' => 'banned',
            'email_verified_at' => now(),
        ]);
    }
}
