
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { User, Priority, Status } from '../types';
import { Priority as PriorityEnum, Status as StatusEnum } from '../types';
import { getUsers, createTask } from '../services/api';
import { generateDescription, suggestPriority } from '../services/geminiService';
import { XIcon, SparklesIcon } from './icons';

interface CreateTaskModalProps {
    onClose: () => void;
    onTaskCreated: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose, onTaskCreated }) => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState<number | string>('');
    const [priority, setPriority] = useState<Priority>(PriorityEnum.Medium);
    const [requiredTill, setRequiredTill] = useState('');

    const [loading, setLoading] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [error, setError] = useState('');
    
    useEffect(() => {
        const fetchUsers = async () => {
            const userList = await getUsers();
            setUsers(userList);
            if (currentUser) {
                setAssignedTo(currentUser.id);
            }
        };
        fetchUsers();
    }, [currentUser]);

    const handleGenerateDescription = async () => {
        if (!title.trim()) {
            setError('Please enter a title first to generate a description.');
            return;
        }
        setError('');
        setIsSuggesting(true);
        try {
            const generatedDesc = await generateDescription(title);
            if (generatedDesc) {
                setDescription(generatedDesc);
            } else {
                setError('Could not generate a description.');
            }
        } catch (e) {
            setError('AI suggestion service is unavailable.');
        } finally {
            setIsSuggesting(false);
        }
    };
    
    const handleSuggestPriority = async () => {
        if (!title.trim() && !description.trim()) {
            setError('Please enter a title or description to suggest a priority.');
            return;
        }
        setError('');
        setIsSuggesting(true);
        try {
            const suggestedPrio = await suggestPriority(title, description);
            if (suggestedPrio) {
                setPriority(suggestedPrio);
            } else {
                setError('Could not suggest a priority.');
            }
        } catch (e) {
            setError('AI suggestion service is unavailable.');
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!currentUser || !title || !description || !assignedTo || !requiredTill) {
            setError('Please fill all required fields.');
            return;
        }
        setLoading(true);
        try {
            await createTask({
                title,
                description,
                assigned_to: Number(assignedTo),
                priority,
                required_till: new Date(requiredTill).toISOString(),
                created_by: currentUser.id,
                status: StatusEnum.Open,
            });
            onTaskCreated();
        } catch (err) {
            setError('Failed to create task.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Task</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XIcon className="h-6 w-6 text-gray-600" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                     {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                        <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                    </div>
                     <div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <button type="button" onClick={handleGenerateDescription} disabled={isSuggesting} className="inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-800 disabled:opacity-50">
                                <SparklesIcon className={`h-4 w-4 mr-1 ${isSuggesting ? 'animate-spin' : ''}`} />
                                {isSuggesting ? 'Generating...' : 'Generate with AI'}
                            </button>
                        </div>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assign To</label>
                            <select id="assignedTo" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                                <option value="" disabled>Select User</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="requiredTill" className="block text-sm font-medium text-gray-700">Due Date</label>
                            <input type="datetime-local" id="requiredTill" value={requiredTill} onChange={e => setRequiredTill(e.target.value)} required className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                             <button type="button" onClick={handleSuggestPriority} disabled={isSuggesting} className="inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-800 disabled:opacity-50">
                                <SparklesIcon className={`h-4 w-4 mr-1 ${isSuggesting ? 'animate-spin' : ''}`} />
                                {isSuggesting ? 'Suggesting...' : 'Suggest Priority'}
                            </button>
                        </div>
                        <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                           {Object.values(PriorityEnum).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end items-center pt-4 border-t space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
                            {loading ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;
