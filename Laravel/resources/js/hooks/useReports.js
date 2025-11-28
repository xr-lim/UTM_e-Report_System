import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, orderBy } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

// Hook to fetch reports
export function useReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            try {
                const reportsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setReports(reportsData);
                setLoading(false);
            } catch (err) {
                console.error("Error processing reports:", err);
                setError(err);
                setLoading(false);
            }
        }, (err) => {
            console.error("Error fetching reports:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { reports, loading, error };
}

// Hook to update report
export function useUpdateReport() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const updateReport = async (id, data) => {
        setLoading(true);
        try {
            const reportRef = doc(db, 'reports', id);
            await updateDoc(reportRef, {
                ...data,
                updatedAt: new Date().toISOString()
            });
            setLoading(false);
            return true;
        } catch (err) {
            console.error("Error updating report:", err);
            setError(err);
            setLoading(false);
            return false;
        }
    };

    return { updateReport, loading, error };
}

// Hook to calculate stats
export function useReportStats(reports) {
    const [stats, setStats] = useState({
        total: 0,
        received: 0,
        processed: 0,
        verified: 0
    });

    useEffect(() => {
        if (reports) {
            const newStats = {
                total: reports.length,
                received: reports.filter(r => r.status === 'Received').length,
                processed: reports.filter(r => r.status === 'Processed').length,
                verified: reports.filter(r => r.status === 'Verified').length
            };
            setStats(newStats);
        }
    }, [reports]);

    return stats;
}

// Hook to add new report (for testing)
export function useAddReport() {
    const addReport = async (data) => {
        try {
            await addDoc(collection(db, 'reports'), {
                ...data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error("Error adding report:", error);
            return false;
        }
    };
    return { addReport };
}
