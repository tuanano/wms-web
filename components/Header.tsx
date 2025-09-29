
import React from 'react';
import { View } from '../types';
import { ICONS } from '../constants';

interface HeaderProps {
    currentView: View;
    setCurrentView: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
    const TabButton: React.FC<{ view: View; title: string }> = ({ view, title }) => (
        <button
            onClick={() => setCurrentView(view)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                currentView === view
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
        >
            {title}
        </button>
    );

    return (
        <header className="bg-white shadow-md z-10">
            <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    {ICONS.LOGO}
                    <h1 className="text-xl font-bold text-slate-800">Cập nhật vị trí trực tiếp</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="bg-slate-100 p-1 rounded-lg flex space-x-1">
                        <TabButton view={View.BY_LOCATOR} title="Theo Vị trí" />
                        <TabButton view={View.BY_ITEM} title="Theo Hàng hóa" />
                    </div>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <span>Site:</span>
                        <button className="flex items-center font-semibold hover:text-indigo-600">
                            HCM-DC1 {ICONS.CHEVRON_DOWN}
                        </button>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                         {ICONS.USER}
                        <button className="flex items-center font-semibold hover:text-indigo-600">
                           tuan.le {ICONS.CHEVRON_DOWN}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
