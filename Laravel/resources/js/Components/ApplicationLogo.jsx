export default function ApplicationLogo({ className, ...props }) {
    return (
        <img
            src="/images/logo.jpg"
            alt="Application Logo"
            className={className}
            {...props}
        />
    );
}
