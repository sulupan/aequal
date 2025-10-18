import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import NavBar from './components/NavBar';
import ModeButton from './components/ModeButton';
import ProgressScreen from './components/ProgressScreen';
import LessonScreenEars from './components/LessonScreenEars';
import LessonScreenEyes from './components/LessonScreenEyes';
import { LESSON_MOCKS } from './data/lessonMocks'; // Assuming lesson mocks are stored in a separate file

const firebaseConfig = {
    // Your Firebase configuration here
};

const App = () => {
    const [userId, setUserId] = useState(null);
    const [view, setView] = useState('home'); // home, lessonEars, lessonEyes, progress
    const [currentLesson, setCurrentLesson] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const auth = getAuth();
    const db = getFirestore(initializeApp(firebaseConfig));

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                signInAnonymously(auth).then((anonUser) => {
                    setUserId(anonUser.user.uid);
                });
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [auth]);

    const handleSignOut = () => {
        signOut(auth).then(() => {
            setUserId(null);
            setView('home');
        });
    };

    const startLesson = (mode) => {
        const lesson = LESSON_MOCKS[mode];
        setCurrentLesson(lesson);
        setView(mode === 'ears' ? 'lessonEars' : 'lessonEyes');
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <NavBar view={view} setView={setView} onSignOut={handleSignOut} userId={userId} />
            {view === 'home' && (
                <div>
                    <h1>Select your learning mode</h1>
                    <ModeButton title="Ears Mode" onClick={() => startLesson('ears')} />
                    <ModeButton title="Eyes Mode" onClick={() => startLesson('eyes')} />
                </div>
            )}
            {view === 'lessonEars' && currentLesson && <LessonScreenEars lesson={currentLesson} />}
            {view === 'lessonEyes' && currentLesson && <LessonScreenEyes lesson={currentLesson} />}
            {view === 'progress' && <ProgressScreen userId={userId} />}
        </div>
    );
};

export default App;