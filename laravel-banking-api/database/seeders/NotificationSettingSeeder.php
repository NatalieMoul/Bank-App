<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\NotificationSetting;
use Illuminate\Database\Seeder;

class NotificationSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Only create notification settings for customer users
        $customers = User::where('role', 'customer')->get();

        foreach ($customers as $user) {
            NotificationSetting::create([
                'user_id' => $user->id,
                'email_transactions' => rand(0, 1) ? true : false,
                'email_security_alerts' => true, // Always on for security
                'email_promotions' => rand(0, 1) ? true : false,
                'sms_transactions' => rand(0, 1) ? true : false,
                'sms_security_alerts' => true, // Always on for security
                'in_app_notifications' => true, // Always on
            ]);
        }
    }
}
