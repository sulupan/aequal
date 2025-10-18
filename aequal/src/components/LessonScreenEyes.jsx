import React, { useState } from 'react';
import { Mic } from 'lucide-react';

const ConversationalTest = ({ lesson, saveResult }) => {
    const GRADE_PROMPT = `Оцени, насколько хорошо следующий текст отражает понимание темы "${lesson.title}". Оцени от 0 до 100 и дай один короткий комментарий. Текст студента: "{STUDENT_ANSWER}"`;
    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGrade = async () => {
        if (!answer.trim() || loading || result) return;

        setLoading(true);
        setResult(null);

        try {
            const systemPrompt = "Ты — строгий, но справедливый ИИ-преподаватель. Твоя задача — оценить ответ студента в JSON формате.";
            const userQuery = GRADE_PROMPT.replace('{STUDENT_ANSWER}', answer);
            
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
    return (
        <div className="p-8 pt-20 max-w-6xl mx-auto">
            <h2 className="text-4xl font-extrabold text-green-700 mb-6 border-b pb-2">{lesson.title}</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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

                <ConversationalTest lesson={lesson} saveResult={saveResult} />
            </div>
        </div>
    );
};

export default LessonScreenEyes;