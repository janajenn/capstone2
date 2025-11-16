<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('leave_donations', function (Blueprint $table) {
            $table->id();
           
            $table->unsignedBigInteger('donor_employee_id');     // Female employee
$table->unsignedBigInteger('recipient_employee_id'); // Male partner

            $table->integer('days_donated')->default(7);
            $table->string('status')->default('completed'); // completed, cancelled
            $table->text('remarks')->nullable();
            $table->timestamp('donated_at');
            $table->timestamps();

            $table->foreign('donor_employee_id')
      ->references('employee_id')->on('employees')->onDelete('cascade');

$table->foreign('recipient_employee_id')
      ->references('employee_id')->on('employees')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('leave_donations');
    }
};