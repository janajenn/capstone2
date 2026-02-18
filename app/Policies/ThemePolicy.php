<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Theme;

class ThemePolicy
{
    public function viewAny(User $user)
    {
        return $user->hasRole('hr_admin');
    }

    public function view(User $user, Theme $theme)
    {
        return $user->hasRole('hr_admin');
    }

    public function create(User $user)
    {
        return $user->hasRole('hr_admin');
    }

    public function update(User $user, Theme $theme)
    {
        return $user->hasRole('hr_admin');
    }

    public function delete(User $user, Theme $theme)
    {
        return $user->hasRole('hr_admin') && !$theme->is_default;
    }

    public function activate(User $user, Theme $theme)
    {
        return $user->hasRole('hr_admin');
    }
}