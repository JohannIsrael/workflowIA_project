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
import { CalendarMonth, Code, Language, Cloud } from '@mui/icons-material';
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
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
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

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    projectName: '',
    priority: 'Medium',
    frontendTech: '',
    backendTech: '',
    cloudTech: '',
    endDate: '',
    sprints: '',
    description: ''
  });
  const [aiPrompt, setAiPrompt] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateProject = () => {
    if (tabValue === 0) {
      // Creación manual
      console.log('Creando proyecto manual:', formData);
    } else {
      // Creación con IA
      console.log('Creando proyecto con IA:', aiPrompt);
    }
    onClose();
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      projectName: '',
      priority: 'Medium',
      frontendTech: '',
      backendTech: '',
      cloudTech: '',
      endDate: '',
      sprints: '',
      description: ''
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
          minHeight: '600px'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: '#333' }}>
          Crea nuevo proyecto
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Empieza creando un proyecto manualmente o impulsado por IA
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="project creation tabs">
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
            {/* Columna izquierda (4 campos) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Nombre del Proyecto"
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
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
                label="Tecnologías Frontend"
                value={formData.frontendTech}
                onChange={(e) => handleInputChange('frontendTech', e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Language />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Tecnologías Backend"
                value={formData.backendTech}
                onChange={(e) => handleInputChange('backendTech', e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Code />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Columna derecha (3 campos) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Tecnologías Cloud"
                value={formData.cloudTech}
                onChange={(e) => handleInputChange('cloudTech', e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Cloud />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Fecha de Finalización"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
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
                label="Número de Sprints"
                type="number"
                value={formData.sprints}
                onChange={(e) => handleInputChange('sprints', e.target.value)}
                variant="outlined"
              />
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Describe tu proyecto con IA
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Describe detalladamente qué tipo de proyecto quieres crear. La IA analizará tu descripción y generará automáticamente la estructura del proyecto.
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={5}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ejemplo: Quiero crear una aplicación web de e-commerce para una tienda de ropa..."
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
          onClick={handleCreateProject}
          sx={{ margin: 0 }}
        >
          {tabValue === 0 ? 'Crear Proyecto' : 'Generar con IA'}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}
