<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('employee_monthly_recordings', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id'); // matches employees.employee_id
            $table->integer('year');
            $table->integer('month'); // 1–12
            $table->decimal('total_lates', 8, 3)->default(0);
            $table->decimal('vl_earned', 8, 3)->nullable();
            $table->decimal('vl_used', 8, 3)->default(0);
            $table->decimal('vl_balance', 8, 3)->nullable();
            $table->decimal('sl_earned', 8, 3)->nullable();
            $table->decimal('sl_used', 8, 3)->default(0);
            $table->decimal('sl_balance', 8, 3)->nullable();
            $table->decimal('total_vl_sl', 8, 3)->nullable(); // vl_balance + sl_balance
            $table->text('remarks')->nullable();
            $table->json('inclusive_dates')->nullable(); // leave entries in the month
            $table->timestamps();

            $table->unique(['employee_id', 'year', 'month']);
            $table->index(['employee_id', 'year']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('employee_monthly_recordings');
    }
};