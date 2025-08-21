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
    Schema::create('credit_conversions', function (Blueprint $table) {
        $table->bigIncrements('conversion_id');
        $table->unsignedBigInteger('employee_id');
        $table->enum('leave_type', ['SL', 'VL']);
        $table->decimal('credits_requested', 5, 2);
        $table->decimal('equivalent_cash', 8, 2);
        $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
        $table->timestamp('submitted_at');
        $table->timestamps();

        $table->foreign('employee_id')->references('employee_id')->on('employees')->onDelete('cascade');
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_conversions');
    }
};
