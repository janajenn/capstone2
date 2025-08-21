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
    Schema::create('leave_approvals', function (Blueprint $table) {
        $table->bigIncrements('approval_id');
        $table->unsignedBigInteger('leave_id');
        $table->unsignedBigInteger('approved_by');
        $table->enum('role', ['hr', 'dept_head', 'admin']);
        $table->enum('status', ['pending', 'approved', 'rejected']);
        $table->text('remarks')->nullable();
        $table->timestamp('approved_at')->nullable();
        $table->string('signature_image')->nullable();
        $table->text('comments')->nullable();
        $table->timestamps();

        $table->foreign('leave_id')->references('id')->on('leave_requests')->onDelete('cascade');
        $table->foreign('approved_by')->references('id')->on('users')->onDelete('cascade');
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_approvals');
    }
};
