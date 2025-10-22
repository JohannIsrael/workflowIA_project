import React from 'react'
import { IconButton } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

export type Task = {
  id: number;
  name: string;
  description: string;
  assignedTo: string;
  sprint: number;
};

type Props = {
  task: Task;
};

export default function TaskCard({ task }: Props) {
  return (
    <div className="taskCard" aria-labelledby={`task-${task.id}-title`}>
        <div>
            <h3 className='heroTaskCard' id={`task-${task.id}-title`}>{task.name}</h3>
            <h4 className='idTaskCard'>ID: {task.id}</h4>
            <p className='descriptionTaskCard'>{task.description}</p>
            <p className='assignedTaskCard'><strong>Assigned to:</strong> {task.assignedTo}</p>{' '}
            <p className='sprintTaskCard'><strong>Sprint:</strong> {task.sprint}</p>
        </div>
        <div className="taskCard__icons">
            <IconButton aria-label="edit">
                <Edit />
            </IconButton>
            <IconButton aria-label="delete">
                <Delete />
            </IconButton>
        </div>
    </div>
  );
}