<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            $table->text('card_number')->nullable()->after('card_name');
            $table->string('card_number_hash', 64)->nullable()->unique()->after('card_number');
            $table->string('last_four', 4)->nullable()->after('card_number_hash');
            $table->string('cardholder_name')->nullable()->after('last_four');
            $table->unsignedTinyInteger('expiration_month')->nullable()->after('cardholder_name');
            $table->unsignedSmallInteger('expiration_year')->nullable()->after('expiration_month');
        });
    }

    public function down(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            $table->dropUnique(['card_number_hash']);
            $table->dropColumn([
                'card_number',
                'card_number_hash',
                'last_four',
                'cardholder_name',
                'expiration_month',
                'expiration_year',
            ]);
        });
    }
};
