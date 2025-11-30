import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import GlobalLoading from './Components/GlobalLoading';

const appName = import.meta.env.VITE_APP_NAME || 'Opol Leave Portal';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        // Create root only once
        if (!el._reactRoot) {
            el._reactRoot = createRoot(el);
        }
        
        el._reactRoot.render(
            <>
                <GlobalLoading />
                <App {...props} />
            </>
        );
    },
    progress: {
        color: '#ffff',
    },
});