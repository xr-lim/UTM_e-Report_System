import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { getFirestore, collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { app } from "@/firebaseConfig";
import { ChevronRight, Star } from 'lucide-react';
import { GlassCard } from '@/Components/Glass/GlassCard';
import { GlassBadge } from '@/Components/Glass/GlassBadge';

const db = getFirestore(app);

export default function FeedbackList() {
    const [feedback, setFeedback] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Listening to the "feedback" collection ordered by createdAt
        const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setFeedback(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <AuthenticatedLayout>
            <Head title="User Feedback List" />
            <div className="py-12 min-h-screen bg-[#F4F6F9]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">User Feedback List</h2>
                    
                    <GlassCard className="overflow-hidden shadow-none border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-black/5 text-[11px] uppercase tracking-widest font-semibold text-gray-400 bg-gray-50/50">
                                        <th className="px-8 py-4">Type</th>
                                        <th className="px-6 py-4">Rating</th>
                                        <th className="px-6 py-4">Subject</th>
                                        <th className="px-6 py-4">User Email</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-8 py-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50/50 bg-white">
                                    {isLoading ? (
                                        <tr><td colSpan="6" className="py-10 text-center text-gray-500">Loading...</td></tr>
                                    ) : feedback.map((item) => (
                                        <tr 
                                            key={item.id} 
                                            onClick={() => router.visit(route('feedback.view', item.id))}
                                            className="group hover:bg-blue-50/30 transition-colors cursor-pointer"
                                        >
                                            <td className="px-8 py-5">
                                                <GlassBadge 
                                                    type={item.type === 'Bug Report' ? 'error' : 'neutral'} 
                                                    label={item.type || 'General'} 
                                                />
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                                                    {item.rating || 0} <Star size={14} fill="currentColor" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-medium text-gray-900 truncate max-w-xs">{item.subject}</td>
                                            <td className="px-6 py-5 text-gray-600">{item.userEmail}</td>
                                            <td className="px-6 py-5 text-gray-500 text-sm font-mono">
                                                {item.createdAt?.toDate().toLocaleDateString('en-GB')}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors ml-auto" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}