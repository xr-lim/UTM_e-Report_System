// Application Logo Component - displays the UTM Report System logo
export default function ApplicationLogo({ className = '', ...props }) {
    return (
        <img
            src="/logo.png"
            alt="UTM Report System"
            className={className}
            {...props}
        />
    );
}
