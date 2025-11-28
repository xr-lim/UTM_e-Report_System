import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";

export default function Dashboard() {
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
