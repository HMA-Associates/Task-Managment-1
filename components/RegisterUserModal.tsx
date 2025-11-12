
import React, { useState } from 'react';
import type { Role } from '../types';
import { Role as RoleEnum } from '../types';
import { registerUser } from '../services/api';
import { XIcon } from './icons';

interface RegisterUserModalProps {
    onClose: () => void;
}

const RegisterUserModal: React.FC<RegisterUserModalProps> = ({ onClose }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>(RoleEnum.User);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const newUser = await registerUser(name, email, role, password);
            setSuccess(`Successfully registered user: ${newUser.name}`);
            setName('');
            setEmail('');
            setPassword('');
            setRole(RoleEnum.User);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to register user.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Register New User</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XIcon className="h-6 w-6 text-gray-600" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
                    {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{success}</p>}
                    <div>
                        <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" id="reg-name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                    </div>
                     <div>
                        <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input type="email" id="reg-email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                    </div>
                     <div>
                        <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" id="reg-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="reg-role" className="block text-sm font-medium text-gray-700">Role</label>
                        <select id="reg-role" value={role} onChange={(e) => setRole(e.target.value as Role)} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                            {Object.values(RoleEnum).map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end items-center pt-4 border-t space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
                            {loading ? 'Registering...' : 'Register User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterUserModal;
