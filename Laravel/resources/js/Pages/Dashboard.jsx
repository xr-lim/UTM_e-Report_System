import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useEffect } from 'react';

export default function Dashboard() {
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is logged in, check verification
                if (!user.emailVerified) {
                    alert("You are not verified yet! Please check your email.");
                    
                    // Kick them out
                    signOut(auth).then(() => {
                        router.visit(route('verify-email')); // Or '/verify-email'
                    });
                }
            } else {
                // No user found (not logged in at all)
                alert("Please log in to access the dashboard.");
                router.visit(route('login'));
            }
        });

        // Cleanup listener when leaving page
        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        // 1. Tell Firebase to kill the session
        signOut(auth).then(() => {
            console.log("User signed out from Firebase");
            
            // 2. Redirect the user to the login page
            router.visit('/login'); 
        }).catch((error) => {
            console.error("Logout error", error);
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            You're logged in!
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
