<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('attendance_corrections', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('employee_id')->unsigned();
            $table->bigInteger('department_id')->unsigned();
            $table->date('attendance_date');
            $table->text('explanation');
            $table->string('proof_image', 255)->nullable();
            $table->enum('status', ['Pending', 'Reviewed', 'Approved', 'Rejected'])->default('Pending');
            $table->bigInteger('reviewed_by')->unsigned()->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->bigInteger('approved_by')->unsigned()->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('employee_id')->references('employee_id')->on('employees')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index('employee_id');
            $table->index('attendance_date');
            $table->index('status');
        });
    }

    public function down()
    {
        Schema::dropIfExists('attendance_corrections');
    }
};