import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

// Custom hook to manage user progress data
const useProgressData = (userId, db) => {
    const [progress, setProgress] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (!db || !userId) {
            setProgress([]);
            setIsDataLoading(false);
            return;
        }

        const progressColRef = collection(db, `/artifacts/${appId}/users/${userId}/progress`);
        const q = query(progressColRef, orderBy("timestamp", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProgress(data);
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error fetching progress data:", error);
            setIsDataLoading(false);
        });

        return () => unsubscribe();
    }, [userId, db]);

    return { progress, isDataLoading };
};

export default useProgressData;