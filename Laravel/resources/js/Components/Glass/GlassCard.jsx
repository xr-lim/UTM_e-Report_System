export const GlassCard = ({ children, className = "" }) => {
    return (
        <div className={`
            bg-white 
            border border-gray-200 
            rounded-2xl 
            ${className}
        `}>
            {children}
        </div>
    );
};
