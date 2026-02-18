// resources/js/Pages/WelcomePage.jsx
import React from 'react';
import { usePage } from '@inertiajs/react';

// Import theme components directly
import DefaultTheme from './Themes/Default';
import ValentinesTheme from './Themes/Valentines';
import SummerTheme from './Themes/Summer';
import FiestaTheme from './Themes/Fiesta';
import ChristmasTheme from './Themes/Christmas';
import NewYearTheme from './Themes/NewYear';
import HalloweenTheme from './Themes/Halloween';

export default function WelcomePage() {
    const { themeComponent } = usePage().props;
    
    // Create theme mapping
    const themeMap = {
        'valentines': ValentinesTheme,
        'summer': SummerTheme,
        'fiesta': FiestaTheme,
        'halloween': HalloweenTheme,
        'christmas': ChristmasTheme,
        'newyear': NewYearTheme,

    };
    
    // Get the theme component or use Default
    const ThemeComponent = themeMap[themeComponent?.toLowerCase()] || DefaultTheme;
    
    return <ThemeComponent />;
}