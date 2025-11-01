import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Backdrop,
  CircularProgress
} from '@mui/material';
import { Person, Speed } from '@mui/icons-material';
import CustomButton from '@src/components/CustomButton';
import { createTaskAPI, updateTaskAPI } from '@src/apis/tasks';
import { useParams } from 'react-router-dom';
import { type CreateTaskModalProps } from '@src/utils/interfaces/CreateTaskModalProps';
import { toastInfo, toastError } from '@src/utils/toast';


interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function CreateTaskModal({ 
  open, 
  onClose, 
  onTaskCreated,
  editMode = false, 
  taskData 
}: CreateTaskModalProps) {
  const [tabValue, setTabValue] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const { projectId } = useParams<{ projectId: string }>();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assignedTo: '',
    sprint: 1,
  });
  const [aiPrompt, setAiPrompt] = useState('');

  // Actualizar formData cuando taskData cambie
  useEffect(() => {
    if (taskData) {
      setFormData({
        name: taskData.name || '',
        description: taskData.description || '',
        assignedTo: taskData.assignedTo || '',
        sprint: taskData.sprint || 1,
      });
    }
  }, [taskData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateTask = async () => {
    if (!projectId) {
      console.error('No project ID found');
      return;
    }

    setIsSending(true);
    try {
      if (tabValue === 0) {
        // Creación/Edición manual
        const taskPayload = {
          ...formData,
          sprint: Number(formData.sprint),
          projectId: projectId
        };

        if (editMode && taskData?.id) {
          // TODO: Implementar updateTaskAPI cuando esté disponible
          await updateTaskAPI(taskData.id.toString(), taskPayload);
        } else {
          await createTaskAPI(taskPayload);
        }
        
        if (onTaskCreated) {
          onTaskCreated();
        }
      } else {
        // Creación con IA (si se implementa en el futuro)
        console.log('Creando tarea con IA:', aiPrompt);
      }
      handleClose();
    } catch (error) {
      toastError('No se pudo guardar la tarea. Inténtalo de nuevo.', 'Error');
      console.error('Error creating/updating task:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      name: '',
      description: '',
      assignedTo: '',
      sprint: 1,
    });
    setAiPrompt('');
    setTabValue(0);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '500px'
        }
      }}
    >
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isSending}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: '#333' }}>
          {editMode ? 'Editar Tarea' : 'Nueva Tarea'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {editMode ? 'Modifica los detalles de la tarea' : 'Crea una nueva tarea para el proyecto'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="task creation tabs">
            <Tab label="Creación manual" />
           {/* <Tab label="Creación impulsada por IA" /> */} 
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              md: '1fr 1fr' 
            }, 
            gap: 3 
          }}>
            {/* Columna izquierda */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Nombre de la Tarea"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                variant="outlined"
                required
              />

              <TextField
                fullWidth
                label="Asignado a"
                value={formData.assignedTo}
                onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                variant="outlined"
                placeholder="Ej: Backend Dev, Frontend Dev, etc."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Sprint"
                type="number"
                value={formData.sprint}
                onChange={(e) => handleInputChange('sprint', parseInt(e.target.value) || 1)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Speed />
                    </InputAdornment>
                  ),
                  inputProps: { min: 1 }
                }}
              />
            </Box>

            {/* Columna derecha */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Descripción de la Tarea"
                multiline
                rows={8}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                variant="outlined"
                placeholder="Describe los detalles, requisitos y objetivos de la tarea..."
              />
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Describe tu tarea con IA
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Describe detalladamente qué tipo de tarea quieres crear. La IA analizará tu descripción y generará automáticamente la estructura de la tarea.
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={5}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ejemplo: Crear una funcionalidad de autenticación de usuarios que incluya registro, login, recuperación de contraseña y validación de email..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f8f9fa',
                },
              }}
            />
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <CustomButton
          variant="outlined"
          onClick={handleClose}
          sx={{ margin: 0 }}
        >
          Cancelar
        </CustomButton>
        <CustomButton
          variant="primary"
          onClick={handleCreateTask}
          disabled={isSending || !formData.name}
          sx={{ margin: 0 }}
        >
          {tabValue === 0 ? (editMode ? 'Actualizar Tarea' : 'Crear Tarea') : 'Generar con IA'}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}