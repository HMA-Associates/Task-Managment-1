
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Notification, AppView } from '../types';
import { getNotifications, markNotificationsRead, getUsers } from '../services/api';
import { BellIcon } from './icons';

const NOTIFICATION_POLL_INTERVAL = 12000; // 12 seconds

interface NotificationBellProps {
    navigateTo: (view: AppView) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ navigateTo }) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [actors, setActors] = useState<Map<number, string>>(new Map());
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchActors = useCallback(async (notifs: Notification[]) => {
        const actorIds = new Set(notifs.map(n => n.actor_id));
        const newActors = new Map(actors);
        let needsUpdate = false;
        
        const idsToFetch: number[] = [];
        actorIds.forEach(id => {
            if(!newActors.has(id)) idsToFetch.push(id);
        });

        if (idsToFetch.length > 0) {
            const users = await getUsers();
            users.forEach(u => {
                 if (idsToFetch.includes(u.id)) {
                    newActors.set(u.id, u.name);
                    needsUpdate = true;
                 }
            });
        }
        
        if (needsUpdate) {
            setActors(newActors);
        }
    }, [actors]);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const { unreadCount, notifications: newNotifications } = await getNotifications(user.id);
            setUnreadCount(unreadCount);
            setNotifications(newNotifications);
            await fetchActors(newNotifications);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    }, [user, fetchActors]);

    useEffect(() => {
        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, NOTIFICATION_POLL_INTERVAL);
        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const handleBellClick = async () => {
        if (!isOpen) {
            setIsOpen(true);
            if (unreadCount > 0 && user) {
                const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
                try {
                    await markNotificationsRead(user.id, unreadIds);
                    setUnreadCount(0); // Optimistically update UI
                    setNotifications(prev => prev.map(n => ({...n, is_read: true})))
                } catch(e) {
                    console.error("Failed to mark notifications as read", e);
                }
            }
        } else {
            setIsOpen(false);
        }
    };

    const handleNotificationClick = (notif: Notification) => {
        setIsOpen(false);
        if (notif.task_id) {
            navigateTo({ page: 'taskDetail', taskId: notif.task_id });
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={handleBellClick} className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:outline-none">
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white text-xs text-white flex items-center justify-center">
                        <span className="sr-only">{unreadCount}</span>
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                        <div className="px-4 py-2 border-b">
                            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                        </div>
                        <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <li key={notif.id} onClick={() => handleNotificationClick(notif)} className={`p-4 hover:bg-gray-50 ${notif.task_id ? 'cursor-pointer' : ''}`}>
                                        <p className="text-sm text-gray-700">
                                            <span className="font-semibold">{actors.get(notif.actor_id) || 'Someone'}</span> {notif.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                                    </li>
                                ))
                            ) : (
                                <li className="p-4 text-sm text-gray-500 text-center">No notifications yet.</li>
                            )}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
