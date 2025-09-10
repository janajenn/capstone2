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
            $table->id();
            $table->unsignedBigInteger('employee_id');   // FK -> employees
            $table->unsignedBigInteger('leave_type_id'); // FK -> leave_types
            $table->integer('year'); // e.g. 2025
            $table->integer('total_earned')->default(0); // default_days allocated
            $table->integer('total_used')->default(0);   // used days
            $table->integer('balance')->default(0);      // remaining
            $table->timestamps();
        
            // Foreign keys
            $table->foreign('employee_id')
                  ->references('employee_id')
                  ->on('employees')
                  ->onDelete('cascade');
        
            $table->foreign('leave_type_id')
                  ->references('id')
                  ->on('leave_types')
                  ->onDelete('cascade');
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
