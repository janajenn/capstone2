<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_recalls', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('leave_request_id');
            $table->unsignedBigInteger('employee_id');
            $table->date('approved_leave_date');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('approved');
            $table->unsignedBigInteger('approved_by_admin')->nullable();
            $table->text('reason');
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('leave_request_id')
                  ->references('id')
                  ->on('leave_requests')
                  ->onDelete('cascade');
                  
            $table->foreign('employee_id')
                  ->references('employee_id')
                  ->on('employees')
                  ->onDelete('cascade');
                  
            $table->foreign('approved_by_admin')
                  ->references('id')
                  ->on('users')
                  ->onDelete('set null');

            // Indexes for better performance
            $table->index(['employee_id', 'status']);
            $table->index(['leave_request_id']);
            $table->index(['approved_by_admin']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_recalls');
    }
};