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
        Schema::create('leave_request_details', function (Blueprint $table) {
            $table->bigIncrements('id'); // Primary key
            
            $table->unsignedBigInteger('leave_request_id'); // FK to leave_requests.id
            
            $table->string('field_name'); // e.g. 'illness_type', 'vacation_location', 'study_purpose'
            $table->text('field_value')->nullable(); // e.g. 'In Hospital', 'Abroad', 'Board Exam'
            
            $table->timestamps();
            
            // Foreign key constraint
            $table->foreign('leave_request_id')
                  ->references('id')
                  ->on('leave_requests')
                  ->onDelete('cascade');
        });   
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_request_details');
    }
};
