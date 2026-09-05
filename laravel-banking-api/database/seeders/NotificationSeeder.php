<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Notification;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Only create notifications for customer users
        $customers = User::where('role', 'customer')->get();
        $types = ['transaction', 'account_status', 'security_alert', 'promotion'];

        foreach ($customers as $user) {
            // Create 5-20 notifications per user
            $notificationCount = rand(5, 20);

            for ($i = 0; $i < $notificationCount; $i++) {
                $type = $types[array_rand($types)];
                $isRead = rand(0, 100) > 40; // 60% read, 40% unread

                Notification::create([
                    'user_id' => $user->id,
                    'type' => $type,
                    'title' => $this->getTitle($type),
                    'message' => $this->getMessage($type),
                    'data' => $this->getData($type),
                    'is_read' => $isRead,
                    'read_at' => $isRead ? now()->subDays(rand(0, 30)) : null,
                    'created_at' => now()->subDays(rand(0, 60))->subHours(rand(0, 23)),
                ]);
            }
        }
    }

    /**
     * Get notification title based on type.
     */
    private function getTitle(string $type): string
    {
        $titles = [
            'transaction' => [
                'Transaction Completed',
                'Deposit Received',
                'Withdrawal Processed',
                'Transfer Successful',
                'Payment Received',
            ],
            'account_status' => [
                'Account Update',
                'Balance Alert',
                'Account Maintenance',
                'Service Update',
                'Important Account Notice',
            ],
            'security_alert' => [
                'New Login Detected',
                'Unusual Activity',
                'Security Update',
                'Device Connected',
                'Password Changed',
            ],
            'promotion' => [
                'Special Offer',
                'Limited Time Deal',
                'Exclusive Promotion',
                'You Are Eligible',
                'Reward Available',
            ],
        ];

        return $titles[$type][array_rand($titles[$type])];
    }

    /**
     * Get notification message based on type.
     */
    private function getMessage(string $type): string
    {
        $messages = [
            'transaction' => [
                'Your transaction has been successfully completed.',
                'A deposit of $' . rand(100, 1000) . ' has been received in your account.',
                'A withdrawal of $' . rand(50, 500) . ' has been processed.',
                'Your transfer has been successfully completed.',
                'You have received a payment. Please check your account for details.',
            ],
            'account_status' => [
                'Your account information has been updated.',
                'Your account balance is below the minimum threshold.',
                'Scheduled account maintenance will occur tonight.',
                'A new service is now available for your account.',
                'Please review important updates regarding your account.',
            ],
            'security_alert' => [
                'A new login to your account was detected from a new device.',
                'Unusual activity has been detected on your account.',
                'Your security settings have been updated.',
                'A new device has been connected to your account.',
                'Your password was recently changed.',
            ],
            'promotion' => [
                'You are eligible for a special promotion. Click to learn more.',
                'Limited time offer: Save 20% on your next transfer.',
                'Get a bonus when you refer a friend.',
                'Earn rewards on every transaction.',
                'Exclusive deals available for premium members.',
            ],
        ];

        return $messages[$type][array_rand($messages[$type])];
    }

    /**
     * Get notification data based on type.
     */
    private function getData(string $type): array
    {
        return [
            'type' => $type,
            'category' => $type,
            'timestamp' => now()->timestamp,
            'action_url' => '/notifications/' . rand(1, 1000),
            'priority' => $type === 'security_alert' ? 'high' : 'normal',
        ];
    }
}
