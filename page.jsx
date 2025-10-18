import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, collection, query, where, addDoc, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { LogOut, Eye, Ear, User, Home, BarChart3, GraduationCap, Mic, CheckCircle } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Регистрация компонентов Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Глобальные переменные Firebase (предоставляются средой Canvas)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Mock Data for Lessons
const LESSON_MOCKS = {
    'ears': {
        title: "Урок 1: Как выражать эмоции",
        content: "Эмоции — это то, что мы чувствуем внутри. Например, радость (😊) или грусть (😞). Важно показывать, что ты чувствуешь, чтобы тебя поняли. Смотри видео с сурдопереводчиком, чтобы узнать, как показывать эти эмоции жестами.",
        video: "Видео с сурдопереводчиком о 5 основных эмоциях. (URL заменен заглушкой)",
        testType: 'chatbot' // 'chatbot' or 'quiz'
    },
    'eyes': {
        title: "Урок 1: География: Путешествие по миру",
        content: "Сегодня мы отправимся в звуковое путешествие по планете. Слушай внимательно описание континентов и столиц. После урока ИИ задаст тебе вопросы.",
        audio: "Аудиофайл с описанием 5 континентов. (URL заменен заглушкой)",
        testType: 'conversational'
    }
};

// Конфигурация Gemini
const GEMINI_API_KEY = "AIzaSyDYxSmvaBCOVQ9B-JARNn9AMzcU5aRIvc4"; // ВСТАВЬТЕ ВАШ API-КЛЮЧ GEMINI ЗДЕСЬ
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025"; 

// --- 1. FIREBASE SETUP AND HOOKS ---

// Хранит состояние Firebase (db, auth, userId)
let db, auth;

const useFirebaseInit = () => {
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            auth = getAuth(app);
            // Optional: setLogLevel('Debug'); // Раскомментируйте для отладки

            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    // Если токена нет, входим анонимно
                    if (!initialAuthToken) {
                        const anonUser = await signInAnonymously(auth);
                        setUserId(anonUser.user.uid);
                    }
                }
                setIsLoading(false);
            });

            // Попытка входа с кастомным токеном, если он есть
            if (initialAuthToken) {
                signInWithCustomToken(auth, initialAuthToken)
                    .catch(e => {
                        console.error("Error signing in with custom token:", e);
                        signInAnonymously(auth).then(anonUser => setUserId(anonUser.user.uid));
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

// --- 2. DATA MANAGEMENT HOOKS ---

const useProgressData = (userId) => {
    const [progress, setProgress] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (!db || !userId) {
            setProgress([]);
            setIsDataLoading(false);
            return;
        }

        const progressColRef = collection(db, `/artifacts/${appId}/users/${userId}/progress`);
        
        // Запрос: сортировка по времени для диаграммы
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
    }, [userId]);

    return { progress, isDataLoading };
};

// --- 3. FIREBASE AUTH COMPONENTS ---

const AuthScreen = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
                alert("Регистрация успешна! Выполняется вход.");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onLoginSuccess();
        } catch (e) {
            console.error("Auth error:", e);
            setError(e.message.includes('auth/weak-password') ? "Пароль слишком короткий (минимум 6 символов)." : "Ошибка: Неверный Email или пароль.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border-t-4 border-blue-500">
                <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-6">
                    {isRegistering ? "Регистрация" : "Вход"}
                </h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg text-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg text-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                    {error && <p className="text-red-500 font-medium text-center">{error}</p>}
                    <button
                        type="submit"
                        className="w-full py-4 px-4 bg-blue-600 text-white font-bold text-xl rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? "Загрузка..." : (isRegistering ? "Зарегистрироваться" : "Войти")}
                    </button>
                </form>
                <button
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="w-full mt-4 text-blue-600 hover:text-blue-800 text-lg font-medium transition duration-200"
                >
                    {isRegistering ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
                </button>
            </div>
        </div>
    );
};

// --- 4. NAVIGATION AND SHELL COMPONENTS ---

const ModeButton = ({ icon: Icon, title, description, color, onClick }) => (
    <div
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-8 m-4 rounded-3xl shadow-xl cursor-pointer transition-transform duration-300 hover:scale-[1.02] 
                    ${color === 'blue' ? 'bg-blue-100 hover:bg-blue-200 border-blue-600' : 'bg-green-100 hover:bg-green-200 border-green-600'} border-b-8`}
        role="button"
        aria-label={title}
    >
        <Icon className={`w-16 h-16 ${color === 'blue' ? 'text-blue-600' : 'text-green-600'} mb-4`} />
        <h2 className="text-3xl font-extrabold text-gray-800 mb-2">{title}</h2>
        <p className="text-lg text-gray-600 text-center max-w-xs">{description}</p>
    </div>
);

const NavBar = ({ view, setView, onSignOut, userId }) => (
    <nav className="flex justify-between items-center p-4 bg-white shadow-lg fixed top-0 left-0 right-0 z-10">
        <h1 className="text-2xl font-bold text-blue-700">StudyBuddy</h1>
        <div className="flex space-x-4">
            <NavButton icon={Home} label="Главная" current={view === 'home'} onClick={() => setView('home')} />
            <NavButton icon={BarChart3} label="Прогресс" current={view === 'progress'} onClick={() => setView('progress')} />
            <button
                onClick={onSignOut}
                className="flex items-center p-3 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition"
                aria-label="Выйти"
            >
                <LogOut className="w-6 h-6 mr-2" />
                <span className="font-medium">Выйти</span>
            </button>
        </div>
        <div className="text-sm text-gray-500 hidden md:block" title="ID пользователя">
            <User className="inline-block w-4 h-4 mr-1"/>ID: {userId.substring(0, 8)}...
        </div>
    </nav>
);

const NavButton = ({ icon: Icon, label, current, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center p-3 rounded-xl transition 
            ${current ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        aria-current={current ? 'page' : undefined}
    >
        <Icon className="w-6 h-6 mr-2" />
        <span className="font-medium">{label}</span>
    </button>
);

// --- 5. PROGRESS SCREEN (CHARTS) ---

const ProgressScreen = ({ userId, progress, isDataLoading }) => {
    
    // Подготовка данных для диаграммы
    const chartData = useMemo(() => {
        const last10 = progress.slice(0, 10).reverse(); // Последние 10 результатов, в хронологическом порядке
        
        return {
            labels: last10.map((item, index) => `${item.lessonTitle || 'Урок ' + (index + 1)} (${item.mode === 'ears' ? 'У' : 'Г'})`),
            datasets: [
                {
                    label: 'Оценка (из 100)',
                    data: last10.map(item => Math.round(item.score * 100)),
                    backgroundColor: last10.map(item => item.mode === 'eyes' ? 'rgba(75, 192, 192, 0.8)' : 'rgba(153, 102, 255, 0.8)'),
                    borderColor: last10.map(item => item.mode === 'eyes' ? 'rgb(75, 192, 192)' : 'rgb(153, 102, 255)'),
                    borderWidth: 1,
                },
            ],
        };
    }, [progress]);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { font: { size: 14 } }
            },
            title: {
                display: true,
                text: 'Ваш прогресс: Последние 10 тестов',
                font: { size: 18 }
            },
            tooltip: {
                titleFont: { size: 16 },
                bodyFont: { size: 14 }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: { display: true, text: 'Оценка (%)', font: { size: 16 } },
                ticks: { font: { size: 14 } }
            },
            x: {
                ticks: { font: { size: 12 }, autoSkip: false, maxRotation: 45, minRotation: 45 }
            }
        }
    };

    if (isDataLoading) return <div className="text-center text-xl mt-8">Загрузка данных о прогрессе...</div>;

    return (
        <div className="p-8 pt-20 max-w-6xl mx-auto">
            <h2 className="text-4xl font-extrabold text-gray-800 mb-6 border-b pb-2">Мой Прогресс</h2>
            <p className="text-lg mb-8 text-gray-600">
                Здесь вы можете увидеть свои оценки и следить за успехами.
            </p>

            {progress.length === 0 ? (
                <div className="text-center p-10 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-2xl font-bold text-yellow-800">Нет данных для отображения.</p>
                    <p className="text-lg text-yellow-700 mt-2">Пройдите несколько уроков и тестов, чтобы увидеть свой прогресс!</p>
                </div>
            ) : (
                <>
                    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                        <Bar options={chartOptions} data={chartData} />
                    </div>

                    <h3 className="text-3xl font-bold text-gray-700 mb-4">Детализация результатов</h3>
                    <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Режим</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Урок</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Оценка ИИ (%)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Комментарий ИИ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {progress.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${item.mode === 'ears' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                {item.mode === 'ears' ? 'Уши' : 'Глаза'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.lessonTitle}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">{Math.round(item.score * 100)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={item.aiGradeComment}>{item.aiGradeComment}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

// --- 6. AI INTERACTION UTILITY ---

// Асинхронная функция для вызова Gemini API
const callGeminiApi = async (messages, systemInstruction) => {
    if (!GEMINI_API_KEY) {
        throw new Error("API Key is missing. Please set GEMINI_API_KEY.");
    }
    
    // Структурирование истории для API
    const contents = messages.map(msg => ({ 
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    const payload = {
        contents: contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    // Реализация экспоненциальной задержки для устойчивости
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                // В случае ошибки 429 или 5xx, пробуем снова
                if (response.status === 429 || response.status >= 500) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                    continue; 
                }
                const errorBody = await response.json();
                throw new Error(`API error: ${response.status} - ${errorBody.error.message}`);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text;
            
        } catch (error) {
            if (attempt === 2) throw error; // Бросаем ошибку после последней попытки
            // Silent retry
        }
    }
    throw new Error("Failed to get response from Gemini after multiple retries.");
};


// --- 7. LESSON SCREEN - EARS MODE (Hearing Impairment) ---

const ChatbotTest = ({ lesson, saveResult }) => {
    const CHATBOT_PROMPT = `Ты — дружелюбный преподаватель для слабослышащих студентов. Обсуди с учеником тему: "${lesson.title}". Задавай один короткий, простой вопрос за раз по материалу урока. В конце разговора (после 3-4 вопросов) сделай краткое резюме об успехе ученика, оцени его понимание от 0 до 100 и предоставь одно предложение обратной связи. Формат ответа должен быть JSON.`;
    
    // Структура для получения оценки ИИ в формате JSON
    const AI_GRADE_SCHEMA = {
        type: "OBJECT",
        properties: {
            "score": { "type": "NUMBER", "description": "Оценка понимания от 0.0 до 1.0 (например, 0.85)." },
            "comment": { "type": "STRING", "description": "Краткий комментарий для студента." }
        },
        "propertyOrdering": ["score", "comment"]
    };

    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Отлично, начнем наш тест! Задавай мне любые вопросы по материалу урока." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    // Функция вызова API с JSON-схемой
    const callGeminiApiJson = useCallback(async (currentMessages) => {
        if (!GEMINI_API_KEY) {
            throw new Error("API Key is missing. Please set GEMINI_API_KEY.");
        }
        
        const contents = currentMessages.map(msg => ({ 
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const payload = {
            contents: contents,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: AI_GRADE_SCHEMA,
            },
            systemInstruction: { parts: [{ text: CHATBOT_PROMPT + " Теперь, если это конец разговора, предоставь только JSON с оценкой." }] },
        };

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (jsonText) {
            try {
                return JSON.parse(jsonText);
            } catch (e) {
                console.error("JSON parsing error:", e, "Raw response:", jsonText);
                return { score: 0.5, comment: "Ошибка ИИ при оценке. Попробуйте еще раз." };
            }
        }
        throw new Error("Failed to get structured JSON response from Gemini.");
    }, [CHATBOT_PROMPT, AI_GRADE_SCHEMA]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading || isFinished) return;

        const newMessages = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            // Если это третье сообщение от пользователя, просим ИИ оценить
            const isEvaluationTime = newMessages.filter(m => m.role === 'user').length >= 3;
            
            let responseText;
            if (isEvaluationTime) {
                const grade = await callGeminiApiJson(newMessages);
                saveResult(lesson.title, grade.score, grade.comment, 'ears');
                responseText = `✅ Тест завершен. Ваша оценка: ${Math.round(grade.score * 100)}%. Комментарий: ${grade.comment}`;
                setIsFinished(true);
            } else {
                responseText = await callGeminiApi(newMessages, CHATBOT_PROMPT);
            }
            
            setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Произошла ошибка ИИ: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-[60vh] flex flex-col">
            <h3 className="text-2xl font-bold mb-4 flex items-center text-blue-700"><GraduationCap className="w-6 h-6 mr-2" /> Чат-Тест: {lesson.title}</h3>
            <div className="flex-grow overflow-y-auto space-y-4 p-2 custom-scroll">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-lg p-3 rounded-xl shadow-md ${
                            msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'
                        } text-lg`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="text-center text-gray-500 text-lg">ИИ думает...</div>
                )}
            </div>
            <form onSubmit={handleSend} className="mt-4 flex space-x-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isFinished ? "Тест завершен" : "Ваш ответ..."}
                    className="flex-grow p-4 border border-gray-300 rounded-xl text-lg disabled:bg-gray-50"
                    disabled={loading || isFinished}
                />
                <button
                    type="submit"
                    className="p-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50"
                    disabled={loading || isFinished}
                >
                    {isFinished ? <CheckCircle className="w-6 h-6" /> : "Отправить"}
                </button>
            </form>
        </div>
    );
};

const LessonScreenEars = ({ lesson, saveResult }) => (
    <div className="p-8 pt-20 max-w-6xl mx-auto">
        <h2 className="text-4xl font-extrabold text-blue-700 mb-6 border-b pb-2">{lesson.title}</h2>
        
        {/* Lesson Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Text & Sign Language Video */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
                <h3 className="text-3xl font-bold mb-4 text-gray-800">Материалы Урока</h3>
                <p className="text-xl text-gray-700 mb-6">{lesson.content}</p>
                <div className="aspect-video bg-gray-200 flex items-center justify-center rounded-lg">
                    <p className="text-xl text-gray-600 font-medium">Видео с сурдопереводчиком (заглушка)</p>
                </div>
            </div>

            {/* Test Area */}
            <ChatbotTest lesson={lesson} saveResult={saveResult} />
        </div>
    </div>
);

// --- 8. LESSON SCREEN - EYES MODE (Vision Impairment) ---

const ConversationalTest = ({ lesson, saveResult }) => {
    const GRADE_PROMPT = `Оцени, насколько хорошо следующий текст отражает понимание темы "${lesson.title}". Оцени от 0 до 100 и дай один короткий комментарий. Текст студента: "{STUDENT_ANSWER}"`;
    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGrade = async () => {
        if (!answer.trim() || loading || result) return;

        setLoading(true);
        setResult(null);

        // Имитация получения оценки от ИИ
        try {
            const systemPrompt = "Ты — строгий, но справедливый ИИ-преподаватель. Твоя задача — оценить ответ студента в JSON формате.";
            const userQuery = GRADE_PROMPT.replace('{STUDENT_ANSWER}', answer);
            
            // Структура для получения оценки ИИ в формате JSON
            const AI_GRADE_SCHEMA = {
                type: "OBJECT",
                properties: {
                    "score": { "type": "NUMBER", "description": "Оценка понимания от 0.0 до 1.0 (например, 0.85)." },
                    "comment": { "type": "STRING", "description": "Краткий комментарий для студента." }
                },
                "propertyOrdering": ["score", "comment"]
            };

            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: AI_GRADE_SCHEMA,
                },
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };
            
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const apiResult = await response.json();
            const jsonText = apiResult.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (jsonText) {
                const grade = JSON.parse(jsonText);
                setResult(grade);
                saveResult(lesson.title, grade.score, grade.comment, 'eyes');
            } else {
                 throw new Error("Не удалось получить структурированный ответ.");
            }

        } catch (error) {
            console.error("AI Grading Error:", error);
            setResult({ score: 0, comment: "Ошибка: не удалось связаться с ИИ. Проверьте API Key." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-2xl font-bold mb-4 flex items-center text-green-700"><Mic className="w-6 h-6 mr-2" /> Разговорный Тест (Симуляция)</h3>
            <p className="text-xl mb-4 text-gray-700">
                **Инструкция:** Расскажите ИИ своими словами, о чем был урок. Это имитирует голосовой ввод для оценки.
            </p>
            <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Введите здесь ваш ответ голосом или текстом (для симуляции)..."
                rows="6"
                className="w-full p-4 border border-gray-300 rounded-lg text-xl resize-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                disabled={loading || !!result}
                aria-label="Поле для ответа"
            />
            
            <button
                onClick={handleGrade}
                className="w-full mt-4 py-4 px-4 bg-green-600 text-white font-bold text-xl rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50"
                disabled={loading || !!result || !answer.trim()}
            >
                {loading ? "ИИ Оценивает..." : "Отправить на Оценку ИИ"}
            </button>
            
            {result && (
                <div className={`mt-6 p-4 rounded-xl shadow-inner ${result.score > 0.7 ? 'bg-lime-100 border-l-4 border-lime-600' : 'bg-red-100 border-l-4 border-red-600'}`}>
                    <p className="text-2xl font-bold mb-2">Оценка: {Math.round(result.score * 100)}%</p>
                    <p className="text-xl">**Комментарий ИИ:** {result.comment}</p>
                    <button 
                        onClick={() => setResult(null)}
                        className="mt-3 text-green-600 hover:text-green-800 font-medium"
                    >
                        Сбросить
                    </button>
                </div>
            )}
        </div>
    );
};

const LessonScreenEyes = ({ lesson, saveResult }) => {
    // Имитация аудиоплеера
    const [isPlaying, setIsPlaying] = useState(false);
    
    return (
        <div className="p-8 pt-20 max-w-6xl mx-auto">
            <h2 className="text-4xl font-extrabold text-green-700 mb-6 border-b pb-2">{lesson.title}</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Lesson Content Area */}
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
                    <h3 className="text-3xl font-bold mb-4 text-gray-800">Аудио Урок</h3>
                    <p className="text-xl text-gray-700 mb-6">
                        {lesson.content}
                    </p>
                    <div className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg border">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="p-4 rounded-full bg-green-600 text-white hover:bg-green-700 transition font-bold text-2xl"
                            aria-label={isPlaying ? "Пауза аудио" : "Воспроизвести аудио"}
                        >
                            {isPlaying ? '⏸️' : '▶️'}
                        </button>
                        <p className="text-2xl text-gray-800 font-medium">
                            {isPlaying ? "Аудио воспроизводится..." : "Нажмите ▶️ для начала прослушивания"}
                        </p>
                    </div>
                </div>

                {/* Test Area */}
                <ConversationalTest lesson={lesson} saveResult={saveResult} />
            </div>
        </div>
    );
};

// --- 9. MAIN APP COMPONENT ---

const App = () => {
    const { userId, isLoading, auth, db } = useFirebaseInit();
    const { progress, isDataLoading } = useProgressData(userId);
    const [view, setView] = useState('home'); // home, lessonEars, lessonEyes, progress
    const [currentLesson, setCurrentLesson] = useState(null);

    // Обработка выхода
    const handleSignOut = () => {
        if (auth) {
            signOut(auth).then(() => {
                // После выхода, принудительный анонимный вход для сохранения сессии
                signInAnonymously(auth); 
            });
        }
    };
    
    // Переход на страницу урока
    const startLesson = (mode) => {
        const lesson = LESSON_MOCKS[mode];
        setCurrentLesson(lesson);
        setView(mode === 'ears' ? 'lessonEars' : 'lessonEyes');
    };

    // Сохранение результата теста
    const saveTestResult = async (lessonTitle, score, aiGradeComment, mode) => {
        if (!db || !userId) {
            console.error("Firestore not ready.");
            alert("Ошибка сохранения: База данных недоступна.");
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
            alert(`Результат сохранен! Оценка: ${Math.round(score * 100)}%`);
            setView('progress'); // Переход на страницу прогресса после сохранения
        } catch (e) {
            console.error("Error saving document:", e);
            alert("Ошибка при сохранении результата. См. консоль.");
        }
    };


    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center text-3xl font-bold bg-gray-100">Инициализация...</div>;
    }

    if (!userId) {
        return <AuthScreen onLoginSuccess={() => setView('home')} />;
    }

    // Главная страница
    if (view === 'home') {
        return (
            <div className="min-h-screen bg-gray-100">
                <NavBar view={view} setView={setView} onSignOut={handleSignOut} userId={userId} />
                <div className="pt-24 flex flex-col items-center justify-center p-8">
                    <h2 className="text-5xl font-extrabold text-gray-800 mb-12 text-center">Выберите ваш режим обучения</h2>
                    <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-12">
                        <ModeButton
                            icon={Ear}
                            title="Режим УШИ"
                            description="Для студентов с нарушениями слуха. Видео с сурдопереводом и текстовые тесты."
                            color="blue"
                            onClick={() => startLesson('ears')}
                        />
                        <ModeButton
                            icon={Eye}
                            title="Режим ГЛАЗА"
                            description="Для студентов с нарушениями зрения. Аудио уроки и разговорный ИИ-тест."
                            color="green"
                            onClick={() => startLesson('eyes')}
                        />
                    </div>
                    <div className="mt-12 text-center p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                        <p className="text-lg text-yellow-800">
                            **Внимание:** В этом прототипе используется **Gemini API**. Вставьте ваш API-ключ в файл (переменная `GEMINI_API_KEY`) для работы чат-бота и оценки.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    // Страницы уроков
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

    // Страница прогресса
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
