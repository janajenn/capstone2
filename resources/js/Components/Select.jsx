// Components/Select.jsx
import React from 'react';
import InputLabel from './InputLabel';
import InputError from './InputError';

export default function Select({ 
    id, 
    value, 
    onChange, 
    options = [], 
    className = '', 
    error,
    ...props 
}) {
    return (
        <div>
            <select
                id={id}
                value={value}
                onChange={onChange}
                className={`border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm ${className}`}
                {...props}
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <InputError message={error} className="mt-2" />}
        </div>
    );
}