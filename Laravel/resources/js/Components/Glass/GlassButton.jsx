import React from 'react';

export const GlassButton = ({ children, className = "", ...props }) => {
    return (
        <button
            className={`
                flex items-center justify-center
                transition-all duration-200 ease-in-out
                hover:bg-white/50 hover:shadow-sm
                active:scale-95
                rounded-xl
                ${className}
            `}
            {...props}
        >
            {children}
        </button>
    );
};
