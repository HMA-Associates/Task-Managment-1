import React, { useState, useCallback } from 'react';
// FIX: import useAuth from the correct file hooks/useAuth.ts
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import TaskDetail from './components/TaskDetail';
import type { AppView } from './types';

const AppContent: React.FC = () => {
    const { user } = useAuth();
    const [view, setView] = useState<AppView>({ page: 'dashboard' });

    const navigateTo = useCallback((newView: AppView) => {
        setView(newView);
    }, []);

    if (!user) {
        return <Login />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar navigateTo={navigateTo} />
            <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                {view.page === 'dashboard' && <Dashboard navigateTo={navigateTo} />}
                {view.page === 'taskDetail' && view.taskId && (
                    <TaskDetail taskId={view.taskId} navigateTo={navigateTo} />
                )}
            </main>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;