export default function ApplicationLogo({ className, ...props }) {
    return (
        <img
            src="/images/AppDev_NoBack.png"
            alt="Application Logo"
            className={className}
            {...props}
        />
    );
}
