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
    Schema::create('leave_requests', function (Blueprint $table) {
        $table->bigIncrements('id');
        $table->unsignedBigInteger('employee_id');
        $table->unsignedBigInteger('leave_type_id');
        $table->date('date_from');
        $table->date('date_to');
        $table->text('reason');
        $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
        $table->string('attachment_path')->nullable();
        $table->timestamps();

        $table->foreign('employee_id')->references('employee_id')->on('employees')->onDelete('cascade');
        $table->foreign('leave_type_id')->references('id')->on('leave_types')->onDelete('cascade');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
