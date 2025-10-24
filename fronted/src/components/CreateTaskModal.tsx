import React, { useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import { CalendarMonth, Person, Assignment, Speed } from '@mui/icons-material';
import CustomButton from '@src/components/CustomButton';

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

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  editMode?: boolean;
  taskData?: {
    id?: number;
    name: string;
    description: string;
    assignedTo: string;
    sprint: number;
    priority: string;
    dueDate: string;
  };
}

export default function CreateTaskModal({ open, onClose, editMode = false, taskData }: CreateTaskModalProps) {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: taskData?.name || '',
    description: taskData?.description || '',
    assignedTo: taskData?.assignedTo || '',
    sprint: taskData?.sprint || 1,
    priority: taskData?.priority || 'Medium',
    dueDate: taskData?.dueDate || ''
  });
  const [aiPrompt, setAiPrompt] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateTask = () => {
    if (tabValue === 0) {
      // Creación manual
      console.log(editMode ? 'Editando tarea:' : 'Creando tarea:', formData);
    } else {
      // Creación con IA
      console.log('Creando tarea con IA:', aiPrompt);
    }
    onClose();
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      name: '',
      description: '',
      assignedTo: '',
      sprint: 1,
      priority: 'Medium',
      dueDate: ''
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
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: '#333' }}>
          {editMode ? 'Editar Tarea' : 'Nueva Tarea'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {editMode ? 'Modifica los detalles de la tarea' : 'Empieza creando una tarea manualmente o impulsada por IA'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="task creation tabs">
            <Tab label="Creación manual" />
            <Tab label="Creación impulsada por IA" />
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
              />

              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  label="Prioridad"
                >
                  <MenuItem value="Low">Baja</MenuItem>
                  <MenuItem value="Medium">Media</MenuItem>
                  <MenuItem value="High">Alta</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Asignado a"
                value={formData.assignedTo}
                onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                variant="outlined"
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
                }}
              />
            </Box>

            {/* Columna derecha */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Fecha de Vencimiento"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end" style={{ pointerEvents: 'none' }}>
                      <CalendarMonth />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Descripción de la Tarea"
                multiline
                rows={6}
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
              placeholder="Ejemplo: Crear una funcionalidad de autenticación de usuarios que incluya registro, login, recuperación de contraseña y validación de email. Debe usar JWT para tokens y tener validación de seguridad..."
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
          sx={{ margin: 0 }}
        >
          {tabValue === 0 ? (editMode ? 'Actualizar Tarea' : 'Crear Tarea') : 'Generar con IA'}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}
