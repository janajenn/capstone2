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
        Schema::create('leave_credit_logs', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('employee_id'); // FK to users/employees table
    $table->string('type'); // 'SL' or 'VL'
    $table->date('date'); // actual date of leave deducted
    $table->integer('year'); // e.g. 2025
    $table->integer('month'); // 1 to 12
    $table->decimal('points_deducted', 5, 2); // e.g. 1.00 per day
    $table->decimal('balance_after', 5, 2); // current remaining after deduction
    $table->text('remarks')->nullable();
    $table->timestamps();

    // Foreign key constraint
    $table->foreign('employee_id')->references('employee_id')->on('employees')->onDelete('cascade');
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_credit_logs');
    }
};
