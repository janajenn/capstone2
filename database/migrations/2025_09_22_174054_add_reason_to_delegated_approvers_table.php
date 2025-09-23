<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('delegated_approvers', function (Blueprint $table) {
            $table->text('reason')->nullable()->after('end_date');
            // Change status enum to include 'ended'
            $table->enum('status', ['active', 'inactive', 'ended'])->default('active')->change();
        });
    }

    public function down()
    {
        Schema::table('delegated_approvers', function (Blueprint $table) {
            $table->dropColumn('reason');
            $table->enum('status', ['active', 'inactive'])->default('active')->change();
        });
    }
};