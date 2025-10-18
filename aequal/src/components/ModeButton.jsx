import React from 'react';

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

export default ModeButton;