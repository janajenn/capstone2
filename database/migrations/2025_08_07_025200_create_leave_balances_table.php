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
    Schema::create('leave_balances', function (Blueprint $table) {
        $table->bigIncrements('id');
        $table->unsignedBigInteger('employee_id');
        $table->enum('leave_type', ['SL', 'VL']);
        $table->year('year');
        $table->decimal('total_earned', 5, 2);
        $table->decimal('total_used', 5, 2);
        $table->decimal('balance', 5, 2);
        $table->text('remarks')->nullable();
        $table->timestamps();

        $table->foreign('employee_id')->references('employee_id')->on('employees')->onDelete('cascade');
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_balances');
    }
};
