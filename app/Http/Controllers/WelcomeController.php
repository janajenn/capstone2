<?php
namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Theme;

class WelcomeController extends Controller
{
    public function index()
    {
        $activeTheme = Theme::getActiveTheme();
        
        // Map theme names to component names
        $themeComponentMap = [
            'valentines' => 'valentines',
            'summer' => 'summer',
            'fiesta' => 'fiesta',
            'halloween' => 'halloween',
            'christmas' => 'christmas',
            'newyear' => 'newyear',
            'new year' => 'newyear', // Handle spaces
            'default' => 'default',
        ];
        
        $themeName = $activeTheme?->name ?? 'Default';
        $themeComponent = $themeComponentMap[strtolower($themeName)] ?? 'default';

        return Inertia::render('WelcomePage', [
            'canLogin' => route('login'),
            'canRegister' => route('register'),
            'themeComponent' => $themeComponent,
        ]);
    }
}