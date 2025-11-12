
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Task, AppView } from '../types';
import { Priority, Status } from '../types';
import { useAuth } from '../hooks/useAuth';
import { getTasks } from '../services/api';
import { PlusIcon, SearchIcon } from './icons';
import CreateTaskModal from './CreateTaskModal';
import TaskItem from './TaskItem';

interface DashboardProps {
    navigateTo: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ navigateTo }) => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<{ myTasks: Task[], assignedToMe: Task[] }>({ myTasks: [], assignedToMe: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    
    const [activeTab, setActiveTab] = useState<'assignedToMe' | 'myTasks'>('assignedToMe');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
    const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');

    const fetchUserTasks = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const userTasks = await getTasks(user.id);
            setTasks(userTasks);
        } catch (e) {
            setError('Failed to load tasks.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchUserTasks();
    }, [fetchUserTasks]);

    const overdueCount = useMemo(() => {
        return tasks.assignedToMe.filter(t => new Date(t.required_till) < new Date() && t.status !== Status.Completed && t.status !== Status.Cancelled).length;
    }, [tasks.assignedToMe]);

    const filteredTasks = useMemo(() => {
        let tasksToFilter = tasks[activeTab];

        if (searchTerm) {
            tasksToFilter = tasksToFilter.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (statusFilter !== 'All') {
            tasksToFilter = tasksToFilter.filter(t => t.status === statusFilter);
        }
        if (priorityFilter !== 'All') {
            tasksToFilter = tasksToFilter.filter(t => t.priority === priorityFilter);
        }
        return tasksToFilter;
    }, [tasks, activeTab, searchTerm, statusFilter, priorityFilter]);

    const onTaskCreated = () => {
        setCreateModalOpen(false);
        fetchUserTasks(); // Refresh tasks list
    };

    if (loading) return <div className="text-center p-8">Loading dashboard...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <>
            <div className="space-y-6">
                {/* Header and summary cards */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <button onClick={() => setCreateModalOpen(true)} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create Task
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                        <p className="text-sm font-medium text-gray-500 truncate">Tasks Assigned To Me</p>
                        <p className="mt-1 text-3xl font-semibold text-gray-900">{tasks.assignedToMe.length}</p>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                        <p className="text-sm font-medium text-gray-500 truncate">Tasks I've Created</p>
                        <p className="mt-1 text-3xl font-semibold text-gray-900">{tasks.myTasks.length}</p>
                    </div>
                     <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                        <p className="text-sm font-medium text-red-500 truncate">Overdue Tasks</p>
                        <p className="mt-1 text-3xl font-semibold text-red-600">{overdueCount}</p>
                    </div>
                </div>

                {/* Task list section */}
                <div className="bg-white shadow rounded-lg">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="relative w-full md:w-1/2 lg:w-1/3">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search tasks by title..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as Status | 'All')} className="text-sm rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500">
                                    <option value="All">All Statuses</option>
                                    {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as Priority | 'All')} className="text-sm rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500">
                                    <option value="All">All Priorities</option>
                                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
                                <button onClick={() => setActiveTab('assignedToMe')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'assignedToMe' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                    Assigned to Me
                                </button>
                                <button onClick={() => setActiveTab('myTasks')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'myTasks' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                    Created by Me
                                </button>
                            </nav>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {filteredTasks.length > 0 ? (
                                filteredTasks.map(task => <TaskItem key={task.id} task={task} navigateTo={navigateTo} />)
                            ) : (
                                <p className="text-center text-gray-500 py-10">No tasks match your criteria.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {isCreateModalOpen && <CreateTaskModal onClose={() => setCreateModalOpen(false)} onTaskCreated={onTaskCreated} />}
        </>
    );
};

export default Dashboard;
