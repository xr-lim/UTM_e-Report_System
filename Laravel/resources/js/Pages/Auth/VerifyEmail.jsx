import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

// Firebase Imports
import { getAuth, sendEmailVerification, signOut } from "firebase/auth";
import { app } from "@/firebaseConfig";

export default function VerifyEmail() {
    const [status, setStatus] = useState('');
    const [processing, setProcessing] = useState(false);
    
    const auth = getAuth(app);
    const user = auth.currentUser;

    const checkVerified = async () => {
        if (user) {
            // 1. FORCE Firebase to re-fetch the user data from Google servers
            await user.reload();

            // 2. Check the NEW status
            if (user.emailVerified) {
                // 3. Success! Redirect to dashboard
                router.visit(route('dashboard'));
            } else {
                // 4. Still false? Tell the user
                alert("We haven't detected the verification yet. Please try refreshing again in a few seconds.");
            }
        }
    };

    // 1. Handle Resending the Email via Firebase
    const handleResendEmail = async (e) => {
        e.preventDefault();
        
        if (user && !user.emailVerified) {
            setProcessing(true);
            try {
                await sendEmailVerification(user);
                setStatus('verification-link-sent');
            } catch (error) {
                console.error("Resend Error:", error);
                if(error.code === 'auth/too-many-requests') {
                    alert("Please wait a moment before requesting another email.");
                } else {
                    alert("Error sending email: " + error.message);
                }
            } finally {
                setProcessing(false);
            }
        } else {
            // If they are already verified but stuck on this page
            router.visit(route('dashboard'));
        }
    };

    // 2. Handle Logout via Firebase
    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            router.visit(route('login'));
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="mb-4 text-sm text-gray-600">
                Thanks for signing up! Before getting started, could you verify
                your email address by clicking on the link we just emailed to
                you? <br/><br/>
                <strong>Current Email:</strong> {user?.email}
            </div>

            {/* Success Message */}
            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    A new verification link has been sent to your email address.
                </div>
            )}

            <form onSubmit={handleResendEmail}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing || !user}>
                        {processing ? 'Sending...' : 'Resend Verification Email'}
                    </PrimaryButton>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Log Out
                    </button>
                </div>
            </form>
            
            <div className="mt-6 text-center">
                <button 
                    type="button"
                    onClick={checkVerified}
                    className="text-xs text-blue-500 hover:underline cursor-pointer"
                >
                    I have verified my email (Click to Continue)
                </button>
            </div>
        </GuestLayout>
    );
}