<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('card_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('card_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->enum('currency', ['USD', 'KHR']);
            $table->string('category')->nullable();
            $table->string('merchant')->nullable();
            $table->text('description')->nullable();
            $table->timestamp('spent_at')->useCurrent();
            $table->timestamps();
            $table->index(['card_id', 'spent_at']);
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('card_expenses');
    }
};
