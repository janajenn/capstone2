<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('employee_monthly_recording_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('recording_id');
            $table->string('field');                // e.g., 'vl_used'
            $table->decimal('old_value', 8, 3)->nullable();
            $table->decimal('new_value', 8, 3)->nullable();
            $table->unsignedBigInteger('user_id')->nullable(); // who made the change
            $table->timestamps();

            $table->foreign('recording_id')
                  ->references('id')
                  ->on('employee_monthly_recordings')
                  ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('employee_monthly_recording_logs');
    }
};