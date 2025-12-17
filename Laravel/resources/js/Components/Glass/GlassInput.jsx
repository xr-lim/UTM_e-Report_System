import React from 'react';
import { Search } from 'lucide-react';

export const GlassInput = ({ value, onChange, placeholder = "Search...", className = "", ...props }) => {
    return (
        <div className={`relative group ${className}`}>
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="
                    w-full pl-10 pr-4 py-2.5 
                    bg-gray-50/50 
                    border-0 
                    rounded-2xl 
                    text-sm text-gray-700 placeholder:text-gray-400 
                    focus:ring-2 focus:ring-blue-500/20 focus:bg-white/80
                    transition-all duration-300
                    hover:bg-white/60
                "
                {...props}
            />
            <Search
                size={16}
                className="
                    absolute left-3.5 top-3 
                    text-gray-400 group-hover:text-blue-500 
                    transition-colors duration-300
                "
            />
        </div>
    );
};
