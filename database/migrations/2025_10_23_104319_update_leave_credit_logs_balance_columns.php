<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('leave_credit_logs', function (Blueprint $table) {
            // Update balance columns to match the precision
            $table->decimal('balance_before', 10, 7)->change();
            $table->decimal('balance_after', 10, 7)->change();
        });
    }

    public function down(): void
    {
        Schema::table('leave_credit_logs', function (Blueprint $table) {
            $table->decimal('balance_before', 5, 2)->change();
            $table->decimal('balance_after', 5, 2)->change();
        });
    }
};