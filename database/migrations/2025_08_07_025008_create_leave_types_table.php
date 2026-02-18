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
   Schema::create('leave_types', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->string('name');
    $table->string('code')->unique(); // <-- Add this
    $table->boolean('earnable')->default(false);
    $table->boolean('deductible')->default(false);
    $table->boolean('document_required')->default(false);
    $table->timestamps();
}); 
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_types');
    }
};
