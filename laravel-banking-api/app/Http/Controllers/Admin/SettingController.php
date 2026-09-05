<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemLog;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index() { return response()->json(['data' => $this->load()]); }

    // Customer-facing endpoint used by the mobile app.
    // Only non-sensitive transfer settings are exposed.
    public function mobile()
    {
        $settings = $this->load();

        return response()->json([
            'data' => [
                'minimum_transfer_amount' => (float) $settings['minimum_transfer_amount'],
                'maximum_transfer_amount' => (float) $settings['maximum_transfer_amount'],
                'transaction_fee' => (float) $settings['transaction_fee'],
                'default_currency' => $settings['default_currency'],
                'maintenance_mode' => (bool) $settings['maintenance_mode'],
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate(['maximum_transfer_amount' => ['nullable', 'numeric', 'min:0'], 'minimum_transfer_amount' => ['nullable', 'numeric', 'min:0'], 'maintenance_mode' => ['nullable', 'boolean'], 'default_currency' => ['nullable', 'string', 'max:10'], 'transaction_fee' => ['nullable', 'numeric', 'min:0']]);
        $settings = $this->save(array_merge($this->load(), $validated));
        SystemLog::record($request->user(), 'USER_UPDATED', 'success', 'System settings updated', 'system', null, ['settings' => $settings]);
        return response()->json(['message' => 'Settings updated successfully', 'data' => $settings]);
    }

    private function defaults(): array { return ['maximum_transfer_amount' => 5000, 'minimum_transfer_amount' => 1, 'maintenance_mode' => false, 'default_currency' => 'USD', 'transaction_fee' => 0]; }
    private function load(): array
    {
        $path = storage_path('app/system_settings.json');
        $settings = file_exists($path) ? json_decode((string) file_get_contents($path), true) : null;
        return is_array($settings) ? array_merge($this->defaults(), $settings) : $this->save($this->defaults());
    }
    private function save(array $settings): array
    {
        $settings = array_merge($this->defaults(), $settings);
        file_put_contents(storage_path('app/system_settings.json'), json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        return $settings;
    }
}
