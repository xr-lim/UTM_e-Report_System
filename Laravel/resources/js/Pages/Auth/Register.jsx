import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import GuestLayout from "@/Layouts/GuestLayout";

import { Head, Link, useForm, router } from "@inertiajs/react";

import { getAuth, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { app } from "@/firebaseConfig";

export default function Register() {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const { data, setData, processing, errors } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: '',
    });

    const handleGoogleRegister = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Save/update Firestore user document using the Firebase UID
            await setDoc(doc(db, 'users', user.uid), {
            name: user.displayName || null,
            email: user.email || null,
            role: 'admin',
            created_at: serverTimestamp(),
            }, { merge: true });

            // Use Inertia router to navigate (keeps SPA behavior)
            router.visit(route('dashboard'));
        } catch (error) {
            console.error('Google Register Error:', error);
            alert('Google registration failed: ' + (error.message || error.code));
        }
    };


    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const userCred = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );

            const user = userCred.user;

            await sendEmailVerification(user);

            await updateProfile(userCred.user, {
                displayName: data.name,
            });

            // Save to Firestore
            await setDoc(doc(db, "users", user.uid), {
                name: data.name,
                email: data.email,
                role: "admin",
                created_at: serverTimestamp(),
            });

            router.visit(route('verify-email'));

        } catch (err) {
            console.error("FULL ERROR OBJECT:", err);
            
            if (err.code === 'auth/email-already-in-use') {
                try {
                    const userCred = await signInWithEmailAndPassword(auth, data.email, data.password);
                    const user = userCred.user;

                    if (!user.emailVerified) {
                        // CONDITION A: Account exists, but NOT verified.
                        // Action: Resend email and remind them.
                        await sendEmailVerification(user);
                        
                        alert("This email is already registered but NOT verified. We have resent the verification email.");
                        router.visit(route('verify-email'));
                    } else {
                        // CONDITION B: Account exists and IS verified.
                        alert("This email is already registered. Please log in.");
                        router.visit(route('login'));
                    }

                } catch (loginErr) {
                    // CONDITION C: Account exists, but the password they typed NOW 
                    // doesn't match the old password. We can't help them here.
                    alert("This email is already registered. Please log in.");
                    router.visit(route('login'));
                }
            } else if (err.code === 'permission-denied') {
                alert("Database Error: Firestore rules blocked saving user data.");
            } else {
                alert("Registration failed: " + err.message);
            }
        }
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <h1 className="text-2xl font-bold mb-6 text-center">Create an account</h1>

            <form onSubmit={handleRegister} className="space-y-4">
                {/* Name */}
                <div>
                    <InputLabel htmlFor="name" value="Name" />
                    <TextInput
                        id="name"
                        type="text"
                        value={data.name}
                        className="w-full mt-1"
                        onChange={(e) => setData("name", e.target.value)}
                    />
                    <InputError message={errors.name} />
                </div>

                {/* Email */}
                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        value={data.email}
                        className="w-full mt-1"
                        onChange={(e) => setData("email", e.target.value)}
                    />
                    <InputError message={errors.email} />
                </div>

                {/* Password */}
                <div>
                    <InputLabel htmlFor="password" value="Password" />
                    <TextInput
                        id="password"
                        type="password"
                        value={data.password}
                        className="w-full mt-1"
                        onChange={(e) => setData("password", e.target.value)}
                    />
                    <InputError message={errors.password} />
                </div>

                {/* Password Confirmation */}
                <div className="mt-4">
                    <InputLabel htmlFor="password_confirmation" value="Confirm Password" />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                    />

                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <PrimaryButton className="w-full justify-center" disabled={processing}>
                    Create Account
                </PrimaryButton>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="px-3 text-gray-500 text-sm">or</span>
                <div className="flex-1 h-px bg-gray-300" />
            </div>

            {/* Google Sign In */}
            <button
                type="button"
                onClick={handleGoogleRegister}
                className="flex items-center justify-center w-full py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
                <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="w-5 h-5 mr-2"
                />
                Continue with Google
            </button>

            <p className="text-center mt-6 text-sm">
                Already have an account?{" "}
                <Link href={route("login")} className="text-blue-600 hover:underline">
                    Log in
                </Link>
            </p>
        </GuestLayout>
    );
}
