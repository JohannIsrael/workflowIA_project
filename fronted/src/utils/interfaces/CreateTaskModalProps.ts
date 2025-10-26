export interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
  editMode?: boolean;
  taskData?: {
    id?: string | number; 
    name: string;
    description: string;
    assignedTo: string;
    sprint: number;
  };
}