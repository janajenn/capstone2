<?php
// database/migrations/xxxx_xx_xx_xxxxxx_create_leave_reschedule_requests_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('leave_reschedule_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('original_leave_request_id')->constrained('leave_requests')->onDelete('cascade');
            $table->integer('employee_id'); // matches your employee_id structure
            $table->json('proposed_dates');
            $table->text('reason');
            $table->enum('status', ['pending_hr', 'pending_dept_head', 'approved', 'rejected'])->default('pending_hr');
            $table->text('hr_remarks')->nullable();
            $table->text('dept_head_remarks')->nullable(); // Department Head remarks
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamp('hr_reviewed_at')->nullable();
            $table->timestamp('dept_head_reviewed_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->foreignId('hr_reviewed_by')->nullable()->constrained('users');
            $table->foreignId('dept_head_reviewed_by')->nullable()->constrained('users'); // Department Head who reviewed
            $table->foreignId('processed_by')->nullable()->constrained('users');
            $table->timestamps();

            // Indexes for better performance
            $table->index(['employee_id', 'status']);
            $table->index(['original_leave_request_id', 'status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('leave_reschedule_requests');
    }
};