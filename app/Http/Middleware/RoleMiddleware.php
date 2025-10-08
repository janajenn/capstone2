<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Usage: ->middleware('role:employee') or 'role:admin,hr'
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Debug: Log user role information
        \Log::info('RoleMiddleware check', [
            'user_id' => $user->id,
            'user_role' => $user->role,
            'required_roles' => $roles,
            'user_role_type' => gettype($user->role)
        ]);

        if (!empty($roles) && !in_array($user->role, $roles, true)) {
            \Log::warning('User role not authorized', [
                'user_id' => $user->id,
                'user_role' => $user->role,
                'required_roles' => $roles
            ]);
            abort(403, 'Unauthorized');
        }

        return $next($request);
    }
}

