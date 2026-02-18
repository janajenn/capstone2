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
       // database/migrations/xxxx_create_leave_balance_logs_table.php
Schema::create('leave_balance_logs', function (Blueprint $table) {
    $table->id();
    $table->string('employee_id'); // References employees.employee_id
    $table->foreignId('leave_type_id')->constrained('leave_types');
    $table->foreignId('leave_request_id')->nullable()->constrained('leave_requests');
    $table->integer('year'); // Year of the transaction
    $table->string('transaction_type'); // 'deduction', 'addition', 'initial', 'adjustment'
    $table->integer('amount'); // Positive for addition, negative for deduction
    $table->integer('balance_before');
    $table->integer('balance_after');
    $table->text('remarks')->nullable();
    $table->string('reference_type')->nullable(); // 'leave_request', 'manual_adjustment', 'yearly_allocation'
    $table->string('reference_id')->nullable(); // ID of the reference (e.g., leave_request_id)
    $table->foreignId('created_by')->nullable()->constrained('users');
    $table->timestamps();
    
    // Indexes for performance
    $table->index(['employee_id', 'leave_type_id', 'year']);
    $table->index(['leave_request_id']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_balance_logs');
    }
};
