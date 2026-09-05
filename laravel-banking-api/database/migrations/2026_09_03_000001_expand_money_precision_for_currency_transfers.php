<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->decimal('balance', 18, 2)->default(0)->change();
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->decimal('amount', 18, 2)->change();
            $table->decimal('balance_after', 18, 2)->change();
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->decimal('balance', 15, 2)->default(0)->change();
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->decimal('amount', 15, 2)->change();
            $table->decimal('balance_after', 15, 2)->change();
        });
    }
};
