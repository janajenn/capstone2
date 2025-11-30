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
        Schema::table('leave_donations', function (Blueprint $table) {
            // Change status default to pending_hr
            $table->string('status')->default('pending_hr')->change();
            
            // Add HR approval fields
            $table->text('hr_remarks')->nullable()->after('remarks');
            $table->unsignedBigInteger('hr_approved_by')->nullable()->after('hr_remarks');
            $table->timestamp('hr_approved_at')->nullable()->after('hr_approved_by');
            
            // Make donated_at nullable (will be set when HR approves)
            $table->timestamp('donated_at')->nullable()->change();
            
            // Add foreign key constraint
            $table->foreign('hr_approved_by')
                  ->references('id')
                  ->on('users')
                  ->onDelete('set null');
            
            // Add index for better performance
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_donations', function (Blueprint $table) {
            // Remove indexes first
            $table->dropIndex(['status']);
            $table->dropIndex(['created_at']);
            
            // Drop foreign key
            $table->dropForeign(['hr_approved_by']);
            
            // Remove added columns
            $table->dropColumn(['hr_remarks', 'hr_approved_by', 'hr_approved_at']);
            
            // Revert status default
            $table->string('status')->default('completed')->change();
            
            // Revert donated_at to not nullable
            $table->timestamp('donated_at')->nullable(false)->change();
        });
    }
};