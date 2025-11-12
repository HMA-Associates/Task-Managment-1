
export enum Role {
  Admin = 'admin',
  Manager = 'manager',
  User = 'user',
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
}

export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export enum Status {
  Open = 'Open',
  InProgress = 'In Progress',
  Blocked = 'Blocked',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  required_till: string;
  created_by: number;
  assigned_to: number;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface TaskUpdate {
  id: number;
  task_id: number;
  updated_by: number;
  old_status: Status | null;
  new_status: Status;
  note: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  actor_id: number;
  task_id: number | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AppView {
    page: 'dashboard' | 'taskDetail';
    taskId?: number | null;
}
