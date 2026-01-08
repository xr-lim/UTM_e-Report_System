import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/firebaseConfig";
import { ArrowLeft, User, Mail, Calendar, MessageSquare, Star } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';

const db = getFirestore(app);

export default function FeedbackDetail({ feedbackId }) {
    const [item, setItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            const docRef = doc(db, "feedback", feedbackId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setItem({
                    id: docSnap.id,
                    ...data,
                    // Handle Reference to get ID string
                    userId: data.userRef ? data.userRef.id : (data.userId || 'N/A'),
                    fullDate: data.createdAt?.toDate().toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })
                });
            }
            setIsLoading(false);
        };
        fetchDetail();
    }, [feedbackId]);

    if (isLoading) return <div className="p-20 text-center text-blue-600 font-medium">Loading feedback...</div>;
    if (!item) return <div className="p-20 text-center text-red-500 font-bold">Feedback not found.</div>;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Feedback Details</h2>
                    <PrimaryButton onClick={() => router.visit(route('feedbacks.index'))} className="bg-gray-500 hover:bg-gray-600">
                        <ArrowLeft size={16} className="mr-2" /> Back to list
                    </PrimaryButton>
                </div>
            }
        >
            <Head title={`Feedback: ${item.subject}`} />
            <div className="py-12">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                                    {item.type}
                                </span>
                                <h1 className="text-2xl font-bold text-gray-900 mt-3">{item.subject}</h1>
                                <div className="flex items-center gap-1 mt-2 text-amber-500">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={18} fill={i < (item.rating || 0) ? "currentColor" : "none"} stroke="currentColor" />
                                    ))}
                                    <span className="text-gray-400 text-sm ml-2">({item.rating}/5 Rating)</span>
                                </div>
                            </div>
                            <div className="text-right text-sm text-gray-400 font-medium flex items-center gap-2">
                                <Calendar size={14} /> {item.fullDate}
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                    <MessageSquare size={14} /> Message Content
                                </h4>
                                <div className="bg-blue-50/30 border border-blue-100 p-6 rounded-2xl text-gray-800 text-lg leading-relaxed whitespace-pre-wrap italic">
                                    "{item.message}"
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 rounded-xl text-gray-500"><Mail size={20} /></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">User Email</p>
                                        <p className="text-sm font-semibold text-gray-900">{item.userEmail}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 rounded-xl text-gray-500"><User size={20} /></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Reporter UID</p>
                                        <p className="text-xs font-mono text-gray-600">{item.userId}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}