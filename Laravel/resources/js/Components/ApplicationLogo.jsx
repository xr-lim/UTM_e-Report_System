export default function ApplicationLogo({ className, ...props }) {
    return (
        <img
            src="/images/logo.png"
            alt="Application Logo"
            className={className}
            {...props}
        />
    );
}
