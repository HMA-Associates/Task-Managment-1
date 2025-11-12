
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { AppView, Role } from '../types';
import { Role as RoleEnum } from '../types';
import { SparklesIcon, ChevronDownIcon, LogoutIcon, UserPlusIcon } from './icons';
import NotificationBell from './NotificationBell';
import RegisterUserModal from './RegisterUserModal';

interface NavbarProps {
    navigateTo: (view: AppView) => void;
}

const Navbar: React.FC<NavbarProps> = ({ navigateTo }) => {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [registerModalOpen, setRegisterModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <>
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center cursor-pointer" onClick={() => navigateTo({ page: 'dashboard' })}>
                            <SparklesIcon className="h-8 w-8 text-primary-600" />
                            <span className="ml-2 text-xl font-bold text-gray-800">Gemini Task Manager</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <NotificationBell navigateTo={navigateTo} />
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    <img className="h-9 w-9 rounded-full object-cover" src={user.avatarUrl} alt={user.name} />
                                    <span className="hidden sm:inline text-sm font-medium text-gray-700">{user.name}</span>
                                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                                </button>
                                {dropdownOpen && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                                        {user.role === RoleEnum.Admin && (
                                            <a
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); setRegisterModalOpen(true); setDropdownOpen(false); }}
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <UserPlusIcon className="mr-3 h-5 w-5 text-gray-500" />
                                                Register User
                                            </a>
                                        )}
                                        <a
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); logout(); }}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <LogoutIcon className="mr-3 h-5 w-5 text-gray-500" />
                                            Logout
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            {registerModalOpen && <RegisterUserModal onClose={() => setRegisterModalOpen(false)} />}
        </>
    );
};

export default Navbar;
