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
    Schema::create('employees', function (Blueprint $table) {
        $table->bigIncrements('employee_id');
        $table->string('firstname');
        $table->string('middlename');
        $table->string('lastname');
        $table->enum('gender', ['male', 'female', 'other']);
        $table->date('date_of_birth');
        $table->string('position');
        $table->unsignedBigInteger('department_id');
        $table->enum('status', ['active', 'inactive']);
        $table->string('contact_number');
        $table->text('address');
        $table->string('civil_status');
        $table->unsignedBigInteger('biometric_id')->nullable();
        $table->decimal('monthly_salary', 10, 2)->nullable();
        $table->decimal('daily_rate', 10, 2)->nullable();
        $table->timestamps();

        $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
