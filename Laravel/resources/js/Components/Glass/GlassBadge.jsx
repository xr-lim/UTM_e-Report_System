import React from 'react';

const TYPE_STYLES = {
    warning: {
        bg: 'bg-gradient-to-b from-orange-400 to-orange-600',
        text: 'text-white',
        shadow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_4px_rgba(249,115,22,0.4)]'
    },
    success: {
        bg: 'bg-gradient-to-b from-emerald-400 to-emerald-600',
        text: 'text-white',
        shadow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_4px_rgba(16,185,129,0.4)]'
    },
    info: {
        bg: 'bg-gradient-to-b from-blue-500 to-blue-700',
        text: 'text-white',
        shadow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_4px_rgba(59,130,246,0.4)]'
    },
    neutral: {
        bg: 'bg-gradient-to-b from-gray-400 to-gray-600',
        text: 'text-white',
        shadow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_4px_rgba(107,114,128,0.4)]'
    },
    error: {
        bg: 'bg-gradient-to-b from-rose-400 to-rose-600',
        text: 'text-white',
        shadow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_4px_rgba(244,63,94,0.4)]'
    },
    traffic: {
        bg: 'bg-gradient-to-b from-blue-500 to-blue-700',
        text: 'text-white',
        shadow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_4px_rgba(59,130,246,0.4)]'
    },
    suspicious: {
        bg: 'bg-gradient-to-b from-rose-500 to-rose-700',
        text: 'text-white',
        shadow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_4px_rgba(244,63,94,0.4)]'
    }
};

export const GlassBadge = ({ type = 'neutral', label, className = "", icon: Icon, minWidth = "min-w-[90px]" }) => {
    const style = TYPE_STYLES[type] || TYPE_STYLES.neutral;

    return (
        <span className={`
            inline-flex items-center justify-center 
            px-3 py-1.5 
            rounded-full 
            text-xs font-bold uppercase tracking-wide
            ${style.bg} ${style.text} ${style.shadow}
            ${minWidth}
            ${className}
        `}>
            {Icon && <Icon size={14} className="mr-1.5" strokeWidth={2.5} />}
            {label}
        </span>
    );
};
