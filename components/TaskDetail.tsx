
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { AppView, Task, TaskUpdate, User, Status } from '../types';
import { Status as StatusEnum } from '../types';
import { getTaskById, getUsers, updateTaskStatus, requestTaskUpdate } from '../services/api';
import { suggestUpdateNote } from '../services/geminiService';
import { ArrowLeftIcon, SparklesIcon, PaperAirplaneIcon } from './icons';

interface TaskDetailProps {
    taskId: number;
    navigateTo: (view: AppView) => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId, navigateTo }) => {
    const { user: currentUser } = useAuth();
    const [task, setTask] = useState<Task | null>(null);
    const [updates, setUpdates] = useState<TaskUpdate[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newStatus, setNewStatus] = useState<Status>(StatusEnum.Open);
    const [updateNote, setUpdateNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [{ task, updates }, allUsers] = await Promise.all([
                getTaskById(taskId),
                getUsers()
            ]);
            setTask(task);
            setUpdates(updates);
            setUsers(allUsers);
            setNewStatus(task.status);
        } catch (e) {
            setError('Failed to load task details.');
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getUserName = (id: number) => users.find(u => u.id === id)?.name || 'Unknown User';
    
    const handleStatusUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!task || !currentUser || !updateNote.trim()) {
            setNotification({ type: 'error', message: 'Update note cannot be empty.' });
            return;
        }
        setIsSubmitting(true);
        setNotification(null);
        try {
            await updateTaskStatus(taskId, newStatus, updateNote, currentUser.id);
            setNotification({ type: 'success', message: 'Status updated successfully!' });
            setUpdateNote('');
            await fetchData();
        } catch (err) {
            setNotification({ type: 'error', message: 'Failed to update status.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSuggestNote = async () => {
        if (!task) return;
        setIsSuggesting(true);
        setNotification(null);
        try {
            const suggestion = await suggestUpdateNote(task.title, task.status, newStatus);
            if (suggestion) {
                setUpdateNote(suggestion);
            } else {
                 setNotification({ type: 'error', message: 'Could not generate a suggestion.' });
            }
        } catch (err) {
             setNotification({ type: 'error', message: 'AI suggestion service is unavailable.' });
        } finally {
            setIsSuggesting(false);
        }
    };
    
    const handleRequestUpdate = async () => {
        if (!task || !currentUser) return;
        setNotification(null);
        try {
            await requestTaskUpdate(task.id, currentUser.id);
            setNotification({ type: 'success', message: 'Update request sent!' });
        } catch (err) {
            setNotification({ type: 'error', message: err instanceof Error ? err.message : 'Failed to send request.' });
        }
    };

    if (loading) return <div className="text-center p-8">Loading task details...</div>;
    if (error || !task) return <div className="text-center p-8 text-red-500">{error || 'Task not found.'}</div>;

    const creator = getUserName(task.created_by);
    const assignee = getUserName(task.assigned_to);

    return (
        <div className="space-y-8">
            <button onClick={() => navigateTo({ page: 'dashboard' })} className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
            </button>
            
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                    <p className="mt-2 text-gray-600">{task.description}</p>
                </div>
                <div className="border-t border-gray-200 px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <dt className="font-medium text-gray-500">Status</dt>
                        <dd className="mt-1 text-gray-900">{task.status}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-gray-500">Priority</dt>
                        <dd className="mt-1 text-gray-900">{task.priority}</dd>
                    </div>
                     <div>
                        <dt className="font-medium text-gray-500">Due Date</dt>
                        <dd className="mt-1 text-gray-900">{new Date(task.required_till).toLocaleString()}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-gray-500">Assignee</dt>
                        <dd className="mt-1 text-gray-900">{assignee}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-gray-500">Created By</dt>
                        <dd className="mt-1 text-gray-900">{creator}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-gray-500">Created At</dt>
                        <dd className="mt-1 text-gray-900">{new Date(task.created_at).toLocaleString()}</dd>
                    </div>
                </div>
                 { currentUser?.id !== task.assigned_to &&
                    <div className="px-6 py-4 border-t border-gray-200">
                        <button onClick={handleRequestUpdate} className="text-sm font-medium text-primary-600 hover:text-primary-800">Request Update</button>
                    </div>
                }
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Update Form */}
                <div className="md:col-span-1">
                    <div className="bg-white shadow-lg rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900">Post an Update</h2>
                        <form onSubmit={handleStatusUpdate} className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">New Status</label>
                                <select id="status" value={newStatus} onChange={e => setNewStatus(e.target.value as Status)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                                    {Object.values(StatusEnum).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="note" className="block text-sm font-medium text-gray-700">Update Note (required)</label>
                                <div className="mt-1 relative">
                                    <textarea id="note" value={updateNote} onChange={e => setUpdateNote(e.target.value)} rows={4} required className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                                     <button type="button" onClick={handleSuggestNote} disabled={isSuggesting} className="absolute bottom-2 right-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
                                        <SparklesIcon className={`h-4 w-4 mr-1 ${isSuggesting ? 'animate-spin' : ''}`} />
                                        {isSuggesting ? 'Thinking...' : 'Suggest'}
                                    </button>
                                </div>
                            </div>
                            {notification && (
                                <div className={`p-3 rounded-md text-sm ${notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {notification.message}
                                </div>
                            )}
                            <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
                                {isSubmitting ? 'Submitting...' : 'Post Update'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Update History */}
                <div className="md:col-span-2">
                     <div className="bg-white shadow-lg rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900">Update History</h2>
                        <ul className="mt-4 space-y-4">
                            {updates.length > 0 ? updates.map(update => (
                                <li key={update.id}>
                                    <div className="flex space-x-3">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-medium">{getUserName(update.updated_by)}</h3>
                                                <p className="text-sm text-gray-500">{new Date(update.created_at).toLocaleString()}</p>
                                            </div>
                                            <p className="text-sm text-gray-500">{update.note}</p>
                                            {update.old_status && <p className="text-xs text-gray-400">Status changed from <span className="font-semibold">{update.old_status}</span> to <span className="font-semibold">{update.new_status}</span></p>}
                                        </div>
                                    </div>
                                </li>
                            )) : (
                                <p className="text-sm text-gray-500">No updates have been posted for this task yet.</p>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetail;
