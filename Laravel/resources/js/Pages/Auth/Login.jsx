import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/firebaseConfig";

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset, setError } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = async (e) => {
        e.preventDefault();
        const auth = getAuth(app);
        const db = getFirestore(app); // Connect to database

        try {
            // --- GATE 1: Check Credentials ---
            const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;

            // --- GATE 2: Check Email Verification ---
            if (!user.emailVerified) {
                await auth.signOut();
                setError('email', 'Your email address is not verified.');
                return;
            }

            // --- GATE 3: Check "Admin" Role ---
            // 1. Find the user's document in Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userDocRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();

                // 2. Check if the role is EXACTLY 'admin'
                if (userData.role !== 'admin') {
                    // FAIL: Valid login, but wrong role
                    console.warn("Access Denied: User role is", userData.role);
                   
                    await auth.signOut(); // Kick them out
                    setError('email', 'Access Denied: Admins only.');
                    return;
                }
            } else {
                // Document doesn't exist (Rare error)
                await auth.signOut();
                setError('email', 'Account error: Profile not found.');
                return;
            }

            // --- SUCCESS ---
            console.log("Admin Login successful");
            router.visit(route('dashboard'));

        } catch (error) {
            console.error("Login Error:", error.code);
            // ... (Your existing error handling switch case) ...
            setError('email', 'Login failed: ' + error.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const auth = getAuth(app);
            const provider = new GoogleAuthProvider();

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Google ID token
            const token = await user.getIdToken();

            console.log("Google User:", user);
            console.log("Token:", token);

            alert(`Welcome ${user.displayName}! (Google login successful)`);
            router.visit(route('dashboard'));
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            alert("Failed to sign in with Google.");
        }
    };

    return (
        <GuestLayout>
            <Head title="Log in" />
            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <h1 className="text-2xl font-bold mb-6 text-center">Log in</h1>
           
            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <InputLabel htmlFor="password" value="Password" />

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                <div>
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600">
                            Remember me
                        </span>
                    </label>
                </div>

                <PrimaryButton className="mt-4 w-full justify-center" disabled={processing}>
                    Log In
                </PrimaryButton>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
                <div className="flex-grow h-px bg-gray-300"></div>
                <span className="px-3 text-gray-500">or</span>
                <div className="flex-grow h-px bg-gray-300"></div>
            </div>

            {/* Google Log In button */}
            <button type="button" onClick={handleGoogleLogin} className="flex items-center justify-center w-full py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-2"/>
                Log in with Google
            </button>

            <div className="text-center mt-6 text-sm">
                New user?{" "}
                <Link href={route('register')} className="text-blue-600 hover:underline">
                    Create an account
                </Link>
            </div>
        </GuestLayout>
    );
}
