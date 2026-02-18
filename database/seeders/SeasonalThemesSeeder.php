<?php
// database/seeders/SeasonalThemesSeeder.php
namespace Database\Seeders;

use App\Models\Theme;
use Illuminate\Database\Seeder;

class SeasonalThemesSeeder extends Seeder
{
    public function run()
    {
        $seasonalThemes = [
            [
                'name' => 'Halloween',
                'slug' => 'halloween',
                'description' => 'Spooky Halloween theme with ghosts and pumpkins',
                'config' => [
                    'backgroundColor' => '#1a1a2e',
                    'headline' => 'INTEGRATED LEAVE MANAGEMENT SYSTEM',
                    'subtext' => 'Boo! Managing leaves shouldn\'t be scary',
                    'buttonText' => 'Get Started',
                    'buttonColor' => '#f97316',
                    'imageUrl' => '',
                    'textColor' => '#f97316',
                ],
                'is_active' => false,
            ],
            [
                'name' => 'Christmas',
                'slug' => 'christmas',
                'description' => 'Festive Christmas theme with snow and ornaments',
                'config' => [
                    'backgroundColor' => '#0c4a6e',
                    'headline' => 'INTEGRATED LEAVE MANAGEMENT SYSTEM',
                    'subtext' => 'Season\'s Greetings! May your holidays be filled with joy',
                    'buttonText' => 'Get Started',
                    'buttonColor' => '#dc2626',
                    'imageUrl' => '',
                    'textColor' => '#dc2626',
                ],
                'is_active' => false,
            ],
            [
                'name' => 'New Year',
                'slug' => 'new-year',
                'description' => 'Celebratory New Year theme with fireworks',
                'config' => [
                    'backgroundColor' => '#0f172a',
                    'headline' => 'INTEGRATED LEAVE MANAGEMENT SYSTEM',
                    'subtext' => 'Cheers to new beginnings! Start the year right',
                    'buttonText' => 'Start New Year Right',
                    'buttonColor' => '#fbbf24',
                    'imageUrl' => '',
                    'textColor' => '#fbbf24',
                ],
                'is_active' => false,
            ],
        ];

        foreach ($seasonalThemes as $theme) {
            // Check if theme already exists
            if (!Theme::where('slug', $theme['slug'])->exists()) {
                Theme::create($theme);
                $this->command->info("Seasonal theme '{$theme['name']}' created.");
            } else {
                $this->command->warn("Seasonal theme '{$theme['name']}' already exists.");
            }
        }
    }
}