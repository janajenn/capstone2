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
    Schema::create('biometric_logs', function (Blueprint $table) {
        $table->bigIncrements('log_id');
        $table->unsignedBigInteger('biometric_id');
        $table->date('date');
        $table->time('time_in')->nullable();
        $table->time('time_out')->nullable();
        $table->integer('late_minutes')->nullable();
        $table->string('import_batch');
        $table->timestamps();


    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('biometric_logs');
    }
};
