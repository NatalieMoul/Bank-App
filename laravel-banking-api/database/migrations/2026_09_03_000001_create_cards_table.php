<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained()->cascadeOnDelete();
            $table->string('card_name');
            $table->decimal('daily_limit', 15, 2);
            $table->enum('currency', ['USD', 'KHR']);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            $table->index('account_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cards');
    }
};
