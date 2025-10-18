import React, { useState } from 'react';
import { useFirebaseInit } from './hooks/useFirebaseInit';
import { useProgressData } from './hooks/useProgressData';
import NavBar from './components/NavBar';
import ProgressScreen from './components/ProgressScreen';
import LessonScreenEars from './components/LessonScreenEars';
import LessonScreenEyes from './components/LessonScreenEyes';
import AuthScreen from './components/AuthScreen';

const App = () => {
    const { userId, isLoading, auth } = useFirebaseInit();
    const { progress, isDataLoading } = useProgressData(userId);
    const [view, setView] = useState('home'); // home, lessonEars, lessonEyes, progress
    const [currentLesson, setCurrentLesson] = useState(null);

    const handleSignOut = () => {
        if (auth) {
            signOut(auth).then(() => {
                // After sign out, force anonymous sign in to maintain session
                signInAnonymously(auth); 
            });
        }
    };

    const startLesson = (mode) => {
        const lesson = LESSON_MOCKS[mode];
        setCurrentLesson(lesson);
        setView(mode === 'ears' ? 'lessonEars' : 'lessonEyes');
    };

    const saveTestResult = async (lessonTitle, score, aiGradeComment, mode) => {
        if (!db || !userId) {
            console.error("Firestore not ready.");
            alert("Error saving: Database unavailable.");
            return;
        }

        try {
            const progressColRef = collection(db, `/artifacts/${appId}/users/${userId}/progress`);
            await addDoc(progressColRef, {
                lessonTitle,
                score,
                aiGradeComment,
                mode,
                timestamp: serverTimestamp() 
            });
            alert(`Result saved! Score: ${Math.round(score * 100)}%`);
            setView('progress'); // Navigate to progress page after saving
        } catch (e) {
            console.error("Error saving document:", e);
            alert("Error saving result. See console.");
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center text-3xl font-bold bg-gray-100">Initializing...</div>;
    }

    if (!userId) {
        return <AuthScreen onLoginSuccess={() => setView('home')} />;
    }

    if (view === 'home') {
        return (
            <div className="min-h-screen bg-gray-100">
                <NavBar view={view} setView={setView} onSignOut={handleSignOut} userId={userId} />
                <div className="pt-24 flex flex-col items-center justify-center p-8">
                    <h2 className="text-5xl font-extrabold text-gray-800 mb-12 text-center">Choose your learning mode</h2>
                    <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-12">
                        <ModeButton
                            icon={Ear}
                            title="Ears Mode"
                            description="For students with hearing impairments. Video with sign language and text tests."
                            color="blue"
                            onClick={() => startLesson('ears')}
                        />
                        <ModeButton
                            icon={Eye}
                            title="Eyes Mode"
                            description="For students with vision impairments. Audio lessons and conversational AI tests."
                            color="green"
                            onClick={() => startLesson('eyes')}
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'lessonEars' && currentLesson) {
        return (
            <div className="min-h-screen bg-gray-100">
                <NavBar view={view} setView={setView} onSignOut={handleSignOut} userId={userId} />
                <LessonScreenEars lesson={currentLesson} saveResult={saveTestResult} />
            </div>
        );
    }

    if (view === 'lessonEyes' && currentLesson) {
        return (
            <div className="min-h-screen bg-gray-100">
                <NavBar view={view} setView={setView} onSignOut={handleSignOut} userId={userId} />
                <LessonScreenEyes lesson={currentLesson} saveResult={saveTestResult} />
            </div>
        );
    }

    if (view === 'progress') {
        return (
            <div className="min-h-screen bg-gray-100">
                <NavBar view={view} setView={setView} onSignOut={handleSignOut} userId={userId} />
                <ProgressScreen userId={userId} progress={progress} isDataLoading={isDataLoading} />
            </div>
        );
    }

    return null; // Fallback
};

export default App;