import React from 'react';
import { ChatbotTest } from './ChatbotTest'; // Assuming ChatbotTest is a separate component
import { LessonContent } from './LessonContent'; // Assuming LessonContent is a separate component

const LessonScreenEars = ({ lesson, saveResult }) => {
    return (
        <div className="p-8 pt-20 max-w-6xl mx-auto">
            <h2 className="text-4xl font-extrabold text-blue-700 mb-6 border-b pb-2">{lesson.title}</h2>
            
            {/* Lesson Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Text & Sign Language Video */}
                <LessonContent lesson={lesson} />
                
                {/* Test Area */}
                <ChatbotTest lesson={lesson} saveResult={saveResult} />
            </div>
        </div>
    );
};

export default LessonScreenEars;