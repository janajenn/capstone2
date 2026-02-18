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
        Schema::table('leave_donations', function (Blueprint $table) {
            $table->decimal('donor_balance_before', 8, 2)
                  ->nullable()
                  ->after('days_donated'); // places column after 'days_donated'

            $table->decimal('donor_balance_after', 8, 2)
                  ->nullable()
                  ->after('donor_balance_before');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_donations', function (Blueprint $table) {
            $table->dropColumn(['donor_balance_before', 'donor_balance_after']);
        });
    }
};