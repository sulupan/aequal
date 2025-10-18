import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Глобальные переменные Firebase (предоставляются средой Canvas)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const useFirebaseInit = () => {
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);

    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const authentication = getAuth(app);
            setDb(firestore);
            setAuth(authentication);

            const unsubscribe = onAuthStateChanged(authentication, async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    if (!initialAuthToken) {
                        const anonUser = await signInAnonymously(authentication);
                        setUserId(anonUser.user.uid);
                    }
                }
                setIsLoading(false);
            });

            if (initialAuthToken) {
                signInWithCustomToken(authentication, initialAuthToken)
                    .catch(e => {
                        console.error("Error signing in with custom token:", e);
                        signInAnonymously(authentication).then(anonUser => setUserId(anonUser.user.uid));
                    });
            }

            return () => unsubscribe();
        } catch (error) {
            console.error("Firebase initialization failed:", error);
            setIsLoading(false);
        }
    }, []);

    return { userId, isLoading, auth, db };
};

export default useFirebaseInit;