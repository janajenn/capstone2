<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the existing table
        Schema::dropIfExists('credit_conversions');

        // Create the new table with multi-level approval structure
        Schema::create('credit_conversions', function (Blueprint $table) {
            $table->bigIncrements('conversion_id');
            
            // Basic conversion information
            $table->unsignedBigInteger('employee_id');
            $table->enum('leave_type', ['SL', 'VL']);
            $table->decimal('credits_requested', 5, 2);
            $table->decimal('equivalent_cash', 10, 2);
            
            // Multi-level approval status
            $table->enum('status', ['pending', 'hr_approved', 'dept_head_approved', 'admin_approved', 'rejected'])->default('pending');
            $table->timestamp('submitted_at');
            
            // HR Approval
            $table->unsignedBigInteger('hr_approved_by')->nullable();
            $table->timestamp('hr_approved_at')->nullable();
            $table->text('hr_remarks')->nullable();
            
            // Department Head Approval
            $table->unsignedBigInteger('dept_head_approved_by')->nullable();
            $table->timestamp('dept_head_approved_at')->nullable();
            $table->text('dept_head_remarks')->nullable();
            
            // Admin Approval (Final)
            $table->unsignedBigInteger('admin_approved_by')->nullable();
            $table->timestamp('admin_approved_at')->nullable();
            $table->text('admin_remarks')->nullable();
            
            // Employee remarks
            $table->text('employee_remarks')->nullable();
            
            $table->timestamps();

            // Foreign keys
            $table->foreign('employee_id')->references('employee_id')->on('employees')->onDelete('cascade');
            $table->foreign('hr_approved_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('dept_head_approved_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('admin_approved_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_conversions');
        
        // Optionally recreate the old structure if needed for rollback
        Schema::create('credit_conversions', function (Blueprint $table) {
            $table->bigIncrements('conversion_id');
            $table->unsignedBigInteger('employee_id');
            $table->enum('leave_type', ['SL', 'VL']);
            $table->decimal('credits_requested', 5, 2);
            $table->decimal('equivalent_cash', 10, 2);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamp('submitted_at');
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->foreign('employee_id')->references('employee_id')->on('employees')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
        });
    }
};