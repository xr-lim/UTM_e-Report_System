import { Link, Head } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#f3f4f6]">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-40">
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                </div>

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                <div className="w-full max-w-md px-8 py-12 bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 flex flex-col items-center z-10 animate-fade-in-up mx-4">
                    {/* Logo - Smaller Size */}
                    <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
                        <ApplicationLogo className="h-20 w-auto drop-shadow-md" />
                    </div>


                    {/* Get Started Button */}
                    <Link
                        href={route('login')}
                        className="group relative inline-flex items-center justify-center w-full px-8 py-3.5 text-base font-bold text-white transition-all duration-200 bg-gradient-to-r from-red-800 to-red-600 rounded-xl shadow-lg hover:shadow-red-500/40 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                    >
                        <span className="relative z-10 flex items-center justify-center w-full">
                            Get Started
                            <svg
                                className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                            </svg>
                        </span>
                    </Link>

                    {/* Footer / Copyright */}
                    <div className="mt-8 text-[10px] text-gray-400 font-medium tracking-widest uppercase">
                        Universiti Teknologi Malaysia
                    </div>
                </div>

                {/* Custom Animation Styles */}
                <style>{`
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translate3d(0, 20px, 0); }
                        to { opacity: 1; transform: translate3d(0, 0, 0); }
                    }
                    @keyframes blob {
                        0% { transform: translate(0px, 0px) scale(1); }
                        33% { transform: translate(30px, -50px) scale(1.1); }
                        66% { transform: translate(-20px, 20px) scale(0.9); }
                        100% { transform: translate(0px, 0px) scale(1); }
                    }
                    .animate-fade-in-up {
                        animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                    }
                    .animate-blob {
                        animation: blob 7s infinite;
                    }
                    .animation-delay-2000 {
                        animation-delay: 2s;
                    }
                    .animation-delay-4000 {
                        animation-delay: 4s;
                    }
                `}</style>
            </div>
        </>
    );
}
