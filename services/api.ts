
import type { User, Task, TaskUpdate, Notification, Priority, Status, Role } from '../types';
import { Role as RoleEnum, Priority as PriorityEnum, Status as StatusEnum } from '../types';

// --- MOCK DATABASE ---

const USERS: User[] = [
    { id: 1, name: 'Admin User', email: 'admin@example.com', role: RoleEnum.Admin, avatarUrl: 'https://picsum.photos/seed/admin/100' },
    { id: 2, name: 'Manager Mike', email: 'manager@example.com', role: RoleEnum.Manager, avatarUrl: 'https://picsum.photos/seed/manager/100' },
    { id: 3, name: 'Employee Emma', email: 'user@example.com', role: RoleEnum.User, avatarUrl: 'https://picsum.photos/seed/user/100' },
];

const HASHED_PASSWORDS: { [email: string]: string } = {
    'admin@example.com': 'admin123',
    'manager@example.com': 'manager123',
    'user@example.com': 'user123',
};

let TASKS: Task[] = [
    { id: 1, title: 'Quarterly Report Analysis', description: 'Analyze Q3 sales data and prepare a comprehensive report for the board meeting.', priority: PriorityEnum.High, required_till: '2024-08-15T17:00:00Z', created_by: 1, assigned_to: 2, status: StatusEnum.InProgress, created_at: '2024-07-20T10:00:00Z', updated_at: '2024-07-22T14:30:00Z' },
    { id: 2, title: 'New Feature Brainstorming Session', description: 'Organize a meeting with the development and product teams to brainstorm ideas for the next major feature release.', priority: PriorityEnum.Medium, required_till: '2024-08-05T11:00:00Z', created_by: 2, assigned_to: 3, status: StatusEnum.Open, created_at: '2024-07-21T09:00:00Z', updated_at: '2024-07-21T09:00:00Z' },
    { id: 3, title: 'Fix Login Page Bug', description: 'Users are reporting intermittent issues when trying to log in via social providers. Investigate and deploy a hotfix.', priority: PriorityEnum.Critical, required_till: '2024-07-28T23:59:00Z', created_by: 2, assigned_to: 3, status: StatusEnum.Blocked, created_at: '2024-07-22T11:00:00Z', updated_at: '2024-07-23T10:00:00Z' },
    { id: 4, title: 'Onboarding Documentation Update', description: 'Review and update the onboarding documentation for new hires in the engineering department.', priority: PriorityEnum.Low, required_till: '2024-09-01T17:00:00Z', created_by: 1, assigned_to: 1, status: StatusEnum.Completed, created_at: '2024-07-15T15:00:00Z', updated_at: '2024-07-20T18:00:00Z' },
];

let TASK_UPDATES: TaskUpdate[] = [
    { id: 1, task_id: 1, updated_by: 2, old_status: StatusEnum.Open, new_status: StatusEnum.InProgress, note: 'Started data collection and initial analysis.', created_at: '2024-07-22T14:30:00Z' },
    { id: 2, task_id: 3, updated_by: 3, old_status: StatusEnum.InProgress, new_status: StatusEnum.Blocked, note: 'Blocked due to lack of access to third-party API keys. Waiting for credentials.', created_at: '2024-07-23T10:00:00Z' },
];

let NOTIFICATIONS: Notification[] = [
    { id: 1, user_id: 3, actor_id: 2, task_id: 2, message: 'assigned you a new task: "New Feature Brainstorming Session".', is_read: true, created_at: '2024-07-21T09:01:00Z' },
    { id: 2, user_id: 2, actor_id: 1, task_id: null, message: 'requested an update on task: "Quarterly Report Analysis".', is_read: false, created_at: '2024-07-24T10:00:00Z' },
];

// --- MOCK API FUNCTIONS ---

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Authentication
export const login = async (email: string, pass: string): Promise<User> => {
    await simulateDelay(500);
    const user = USERS.find(u => u.email === email);
    // In a real app, use password_verify. Here we just compare strings.
    if (user && HASHED_PASSWORDS[email] === pass) {
        sessionStorage.setItem('currentUserId', user.id.toString());
        return user;
    }
    throw new Error('Invalid credentials');
};

export const getMe = async (): Promise<User> => {
    await simulateDelay(100);
    const userId = sessionStorage.getItem('currentUserId');
    if (userId) {
        const user = USERS.find(u => u.id === parseInt(userId, 10));
        if (user) return user;
    }
    throw new Error('Not authenticated');
};

export const logout = async (): Promise<void> => {
    await simulateDelay(100);
    sessionStorage.removeItem('currentUserId');
};

// Users
export const getUsers = async (): Promise<User[]> => {
    await simulateDelay(300);
    return USERS;
};

export const registerUser = async (name: string, email: string, role: Role, pass: string): Promise<User> => {
    await simulateDelay(500);
    if(USERS.find(u => u.email === email)) {
        throw new Error('Email already exists');
    }
    const newUser: User = {
        id: Math.max(...USERS.map(u => u.id)) + 1,
        name,
        email,
        role,
        avatarUrl: `https://picsum.photos/seed/${name}/100`
    };
    USERS.push(newUser);
    HASHED_PASSWORDS[email] = pass; // Store plain text for mock
    return newUser;
};

// Tasks
export const getTasks = async (userId: number): Promise<{ myTasks: Task[], assignedToMe: Task[] }> => {
    await simulateDelay(700);
    return {
        myTasks: TASKS.filter(t => t.created_by === userId),
        assignedToMe: TASKS.filter(t => t.assigned_to === userId),
    };
};

export const getTaskById = async (taskId: number): Promise<{ task: Task, updates: TaskUpdate[] }> => {
    await simulateDelay(400);
    const task = TASKS.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    const updates = TASK_UPDATES.filter(u => u.task_id === taskId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { task, updates };
};

export const createTask = async (data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> => {
    await simulateDelay(600);
    const newTask: Task = {
        ...data,
        id: Math.max(...TASKS.map(t => t.id)) + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    TASKS.push(newTask);

    // Create a notification for the assignee
    if (data.created_by !== data.assigned_to) {
        const creator = USERS.find(u => u.id === data.created_by)!;
        NOTIFICATIONS.push({
            id: Math.max(0, ...NOTIFICATIONS.map(n => n.id)) + 1,
            user_id: data.assigned_to,
            actor_id: data.created_by,
            task_id: newTask.id,
            message: `assigned you a new task: "${newTask.title}".`,
            is_read: false,
            created_at: new Date().toISOString(),
        });
    }
    
    return newTask;
};

export const updateTaskStatus = async (taskId: number, newStatus: Status, note: string, updatedById: number): Promise<TaskUpdate> => {
    await simulateDelay(500);
    const task = TASKS.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    
    const oldStatus = task.status;
    task.status = newStatus;
    task.updated_at = new Date().toISOString();

    const newUpdate: TaskUpdate = {
        id: Math.max(0, ...TASK_UPDATES.map(u => u.id)) + 1,
        task_id: taskId,
        updated_by: updatedById,
        old_status: oldStatus,
        new_status: newStatus,
        note,
        created_at: new Date().toISOString(),
    };
    TASK_UPDATES.push(newUpdate);

    // Notify creator if assignee updates, and vice-versa
    const userToNotifyId = task.created_by === updatedById ? task.assigned_to : task.created_by;
    if (userToNotifyId !== updatedById) {
         NOTIFICATIONS.push({
            id: Math.max(0, ...NOTIFICATIONS.map(n => n.id)) + 1,
            user_id: userToNotifyId,
            actor_id: updatedById,
            task_id: taskId,
            message: `updated the status of "${task.title}" to ${newStatus}.`,
            is_read: false,
            created_at: new Date().toISOString(),
        });
    }

    return newUpdate;
};

export const requestTaskUpdate = async (taskId: number, requesterId: number): Promise<void> => {
    await simulateDelay(300);
    const task = TASKS.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    if (task.assigned_to === requesterId) throw new Error("You can't request an update from yourself.");

    NOTIFICATIONS.push({
        id: Math.max(0, ...NOTIFICATIONS.map(n => n.id)) + 1,
        user_id: task.assigned_to,
        actor_id: requesterId,
        task_id: taskId,
        message: `requested an update on task: "${task.title}".`,
        is_read: false,
        created_at: new Date().toISOString(),
    });
};

// Notifications
export const getNotifications = async (userId: number): Promise<{ unreadCount: number, notifications: Notification[] }> => {
    await simulateDelay(200);
    const userNotifications = NOTIFICATIONS.filter(n => n.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const unreadCount = userNotifications.filter(n => !n.is_read).length;
    return { unreadCount, notifications: userNotifications.slice(0, 10) };
};

export const markNotificationsRead = async (userId: number, notificationIds: number[]): Promise<void> => {
    await simulateDelay(150);
    NOTIFICATIONS.forEach(n => {
        if (n.user_id === userId && notificationIds.includes(n.id)) {
            n.is_read = true;
        }
    });
};
