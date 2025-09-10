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
        Schema::table('leave_credit_logs', function (Blueprint $table) {
            // Add balance_before column before balance_after for clarity
            $table->decimal('balance_before', 5, 2)->after('points_deducted');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_credit_logs', function (Blueprint $table) {
            $table->dropColumn('balance_before');
        });
    }
};
