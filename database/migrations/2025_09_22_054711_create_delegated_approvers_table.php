<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('delegated_approvers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_admin_id')->constrained('users');
            $table->foreignId('to_admin_id')->constrained('users');
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            
            $table->index(['from_admin_id', 'status']);
            $table->index(['to_admin_id', 'status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('delegated_approvers');
    }
};