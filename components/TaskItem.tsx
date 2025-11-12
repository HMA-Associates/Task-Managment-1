
import React, { useMemo } from 'react';
import type { Task, AppView, Priority, Status } from '../types';

interface TaskItemProps {
    task: Task;
    navigateTo: (view: AppView) => void;
}

const priorityColors: { [key in Priority]: string } = {
    'Low': 'bg-green-100 text-green-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'High': 'bg-orange-100 text-orange-800',
    'Critical': 'bg-red-100 text-red-800',
};

const statusColors: { [key in Status]: string } = {
    'Open': 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    'Blocked': 'bg-gray-100 text-gray-800',
    'Completed': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800',
};

const TaskItem: React.FC<TaskItemProps> = ({ task, navigateTo }) => {

    const dueDate = useMemo(() => new Date(task.required_till), [task.required_till]);
    const isOverdue = useMemo(() => dueDate < new Date() && task.status !== 'Completed' && task.status !== 'Cancelled', [dueDate, task.status]);

    return (
        <div 
            onClick={() => navigateTo({ page: 'taskDetail', taskId: task.id })}
            className="p-4 sm:p-6 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
        >
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary-600 truncate">{task.title}</p>
                <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[task.priority]}`}>
                        {task.priority}
                    </p>
                </div>
            </div>
            <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[task.status]}`}>
                        {task.status}
                    </p>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p className={isOverdue ? 'font-semibold text-red-600' : ''}>
                        Due {dueDate.toLocaleDateString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TaskItem;
