<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('attendance_logs_raw', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->date('work_date');
            $table->time('schedule_start')->nullable();
            $table->time('schedule_end')->nullable();
            $table->datetime('time_in')->nullable();
            $table->datetime('time_out')->nullable();
            $table->time('break_start')->nullable();
            $table->time('break_end')->nullable();
            $table->integer('hrs_worked_minutes')->default(0);
            $table->integer('late_minutes')->default(0);
            $table->text('remarks')->nullable();
            $table->boolean('absent')->default(false);
            $table->json('raw_row')->nullable(); // Store the exact imported row data
            $table->text('import_batch')->nullable(); // Track which import this came from
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('employee_id')->references('employee_id')->on('employees')->onDelete('cascade');
            
            // Indexes for better performance
            $table->index(['employee_id', 'work_date']);
            $table->index('work_date');


        });
    }

    public function down()
    {
        Schema::dropIfExists('attendance_logs_raw');
    }
};