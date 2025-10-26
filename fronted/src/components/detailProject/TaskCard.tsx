import React, { useState } from 'react';
import { IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { type Task } from './../../utils/interfaces/Tasks';
import { deleteTaskAPI } from '@src/apis/tasks';

type Props = {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: () => void;
};

export default function TaskCard({ task, onEdit, onDelete }: Props) {
  const [openDialog, setOpenDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(task);
    }
  };

  const handleDeleteClick = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTaskAPI(task.id);
      if (onDelete) {
        onDelete();
      }
      setOpenDialog(false);
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="taskCard" aria-labelledby={`task-${task.id}-title`}>
        <div>
          <h3 className='heroTaskCard' id={`task-${task.id}-title`}>{task.name}</h3>
          <h4 className='idTaskCard'>ID: {task.id}</h4>
          <p className='descriptionTaskCard'>{task.description}</p>
          <p className='assignedTaskCard'><strong>Assigned to:</strong> {task.assignedTo}</p>
          <p className='sprintTaskCard'><strong>Sprint:</strong> {task.sprint}</p>
        </div>
        <div className="taskCard__icons">
          <IconButton aria-label="edit" onClick={handleEdit}>
            <Edit />
          </IconButton>
          <IconButton aria-label="delete" onClick={handleDeleteClick}>
            <Delete />
          </IconButton>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          ¿Eliminar tarea?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            ¿Estás seguro de que deseas eliminar la tarea "{task.name}"? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            autoFocus
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}