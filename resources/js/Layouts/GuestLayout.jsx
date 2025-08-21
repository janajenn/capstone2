import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function Guest({ children }) {
    return (
        <div className="min-h-screen w-full bg-gray-100">
            <div className="pt-8 flex justify-center">

            </div>
            <div className="w-full h-full">
                {children}
            </div>
        </div>
    );
}
