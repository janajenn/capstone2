<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   // In the migration
public function up()
{
    Schema::table('leave_requests', function (Blueprint $table) {
        $table->json('reschedule_history')->nullable();
        $table->timestamp('rescheduled_at')->nullable();
    });
}

public function down()
{
    Schema::table('leave_requests', function (Blueprint $table) {
        $table->dropColumn(['reschedule_history', 'rescheduled_at']);
    });
}
};
