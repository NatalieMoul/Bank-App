<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notification_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('email_transactions')->default(true);
            $table->boolean('email_security_alerts')->default(true);
            $table->boolean('email_promotions')->default(false);
            $table->boolean('sms_transactions')->default(false);
            $table->boolean('sms_security_alerts')->default(true);
            $table->boolean('in_app_notifications')->default(true);
            $table->timestamps();
            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_settings');
    }
};
