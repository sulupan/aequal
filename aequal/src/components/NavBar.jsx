import React from 'react';
import { LogOut, User, Home, BarChart3 } from 'lucide-react';

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

export default NavBar;