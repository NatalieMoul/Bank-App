<?php

namespace App\Services;

class SystemSettingsService
{
    public static function defaults(): array
    {
        return [
            'maximum_transfer_amount' => 5000,
            'minimum_transfer_amount' => 1,
            'maintenance_mode' => false,
            'default_currency' => 'USD',
            'transaction_fee' => 0,
        ];
    }

    public static function load(): array
    {
        $path = storage_path('app/system_settings.json');
        $settings = file_exists($path) ? json_decode((string) file_get_contents($path), true) : null;

        return is_array($settings) ? array_merge(self::defaults(), $settings) : self::save(self::defaults());
    }

    public static function save(array $settings): array
    {
        $settings = array_merge(self::defaults(), $settings);
        file_put_contents(storage_path('app/system_settings.json'), json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        return $settings;
    }

    public static function isMaintenanceMode(): bool
    {
        return (bool) (self::load()['maintenance_mode'] ?? false);
    }
}
