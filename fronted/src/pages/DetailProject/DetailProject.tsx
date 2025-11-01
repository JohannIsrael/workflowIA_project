import './DetailProject.css'
import { useEffect, useState } from 'react';
import { getProjectTasksAPI } from '@src/apis/tasks';
import { type Task } from './../../utils/interfaces/Tasks';
import { type Project } from './../../utils/interfaces/Project';
import CreateTaskModal from '@src/components/CreateTaskModal'
import { AddCircleOutline, Speed, AutoAwesome, SaveAlt, CalendarMonth, Edit, Delete, Close } from '@mui/icons-material';
import { Box, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, CircularProgress, Backdrop, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import TaskCard from '@src/components/detailProject/TaskCard';
import { executeGeminiAction } from '@src/apis/gemini';
import { updateProjectAPI, deleteProjectAPI } from '@src/apis/projects';
import { toastSuccess, toastError, toastWarning, toastInfo } from '@src/utils/toast';



export default function DetailProject() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(location.state?.project || null);
  const [priority, setPriority] = useState(project?.priority || '1');
  const [fronttech, setFronttech] = useState(project?.fronttech || '');
  const [backtech, setBacktech] = useState(project?.backtech || '');
  const [cloudTech, setCloudTech] = useState(project?.cloudTech || '');
  const [endDate, setEndDate] = useState(project?.endDate || '');
  const [sprints, setSprints] = useState(project?.sprintsQuantity|| '' );
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState(project?.name || '');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return '';
  };

  const formatDateForAPI = (dateString: string) => {
    if (!dateString) return '';
    
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    
    return dateString;
  };

  const onDeleteSuccess = () => {
    toastWarning('Se ha eliminado la tarea correctamente.', 'Tarea eliminada');
    fetchProjectData();
  };

  const fetchProjectData = async () => {
    if (projectId) {
      try {
        const fetchedTasks = await getProjectTasksAPI(projectId);
        setTasks(fetchedTasks);
        
        if (fetchedTasks.length > 0 && fetchedTasks[0].project) {
          const projectData = fetchedTasks[0].project;
          setProject(projectData);
          setPriority(projectData.priority || '1');
          setFronttech(projectData.fronttech || '');
          setBacktech(projectData.backtech || '');
          setCloudTech(projectData.cloudTech || '');
          setEndDate(formatDateForInput(projectData.endDate || ''));
          setSprints(projectData.sprintsQuantity ? projectData.sprintsQuantity.toString() : '');
          toastSuccess('Se ha cargado el proyecto correctamente.', 'Proyecto cargado');

        }
      } catch (error) {
        console.error('Error fetching project data:', error);
        toastError('No se pudo cargar el proyecto.', 'Error al cargar');

      }
    }
  };

  useEffect(() => {
    if (project) {
      setPriority(project.priority || '1');
      setFronttech(project.fronttech || '');
      setBacktech(project.backtech || '');
      setCloudTech(project.cloudTech || '');
      setEndDate(formatDateForInput(project.endDate || ''));
      setSprints(project.sprintsQuantity ? project.sprintsQuantity.toString() : '');
      setTempProjectName(project.name || '');
    }
  }, [project]);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  

  const handlePredictTasks = async () => {
    if (!project?.name) return;
    
    setIsLoading(true);
    toastInfo('Prediecendo las tareas...', 'Prediecendo');
    try {
      await executeGeminiAction('predict', "", project.id.toString());
      toastInfo('Se ha predecido las tareas correctamente.', 'Tareas predecidas');
      await fetchProjectData();
    } catch (error) {
      toastError('No se pudo predecir las tareas.', 'Error al predecir');
      console.error('Error predicting tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimizeTasks = async () => {
    if (!project?.name) return;
    
    setIsLoading(true);
    toastInfo('Optimizando las tareas...', 'Optimizando');
    try {
      await executeGeminiAction('optimize', "", project.id.toString());
      toastInfo('Se ha optimizado las tareas correctamente.', 'Tareas optimizadas');
      await fetchProjectData();
    } catch (error) {
      toastError('No se pudo optimizar las tareas.', 'Error al optimizar');
      console.error('Error optimizing tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!projectId || !project) return;
    
    setIsLoading(true);
    try {
      const projectData = {
        name: tempProjectName,
        priority: priority,
        backtech: backtech,
        fronttech: fronttech,
        cloudTech: cloudTech,
        sprintsQuantity: Number(sprints),
        endDate: formatDateForAPI(endDate)
      };

      await updateProjectAPI(projectId, projectData);
      toastInfo('El proyecto se actualizó correctamente.', 'Proyecto actualizado');
      setIsEditingName(false);
      await fetchProjectData(); 
    } catch (error) {
      toastError('No se pudo actualizar el proyecto.', 'Error al actualizar');
      console.error('Error updating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditNameClick = () => {
    setIsEditingName(true);
    setTempProjectName(project?.name || '');
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setTempProjectName(project?.name || '');
  };

  const handleSaveName = async () => {
    if (!tempProjectName.trim()) {
      toastError('El nombre del proyecto no puede estar vacío.', 'Error');
      return;
    }
    await handleUpdateProject();
  };

  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleConfirmDelete = async () => {
    if (!projectId) return;
    
    setIsDeleting(true);
    try {
      await deleteProjectAPI(projectId);
      toastWarning('Se ha eliminado el proyecto correctamente.', 'Proyecto eliminado');
      navigate('/proyectos');
    } catch (error) {
      toastError('No se pudo eliminar el proyecto.', 'Error al eliminar');
      console.error('Error deleting project:', error);
    } finally {
      setIsDeleting(false);
      setOpenDeleteDialog(false);
    }
  };

  const handleOpenTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleTaskCreated = () => {
    toastInfo('Se ha creado la tarea correctamente.', 'Tarea creada');
    fetchProjectData();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  return (
    <div>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <div className='headerSection'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          {isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <TextField
                value={tempProjectName}
                onChange={(e) => setTempProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveName();
                  } else if (e.key === 'Escape') {
                    handleCancelEditName();
                  }
                }}
                variant="outlined"
                autoFocus
                sx={{ flex: 1 }}
                disabled={isLoading}
              />
              <IconButton 
                onClick={handleSaveName} 
                color="primary"
                disabled={isLoading}
                aria-label="guardar nombre"
              >
                <SaveAlt />
              </IconButton>
              <IconButton 
                onClick={handleCancelEditName} 
                color="default"
                disabled={isLoading}
                aria-label="cancelar edición"
              >
                <Close />
              </IconButton>
            </div>
          ) : (
            <>
              <h1 className="heroDetailProject">{project?.name || 'FlowPilot App'}</h1>
              <IconButton 
                onClick={handleEditNameClick} 
                color="primary"
                disabled={isLoading}
                aria-label="editar nombre del proyecto"
                sx={{ ml: 1 }}
              >
                <Edit />
              </IconButton>
            </>
          )}
        </div>
        <div className='headerSection__buttons'>
          <button 
            className='predictTaskButton' 
            onClick={handlePredictTasks}
            disabled={isLoading}
          >
            <AutoAwesome className='iconAdd'/>
            Predecir
          </button>
          <button 
            className='addTaskButton'
            onClick={handleOptimizeTasks}
            disabled={isLoading}
          >
            <Speed className='iconAdd'/>
            Optimizar
          </button>
        </div>
      </div>
      <div className='generalSection'>
        <div className='ProjectInfoSection'>
          <h2 className='heroProjectInfoSection'>Información del proyecto</h2>
          <Box className='editableLabels' component="form" sx={{ '& > :not(style)': { m: 1, width: '25ch' }, }} noValidate autoComplete="off">
            <FormControl fullWidth>
              <InputLabel id="priority-select-label">Prioridad</InputLabel>
              <Select
                labelId="priority-select-label"
                id="priority-select"
                label="Prioridad"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <MenuItem value={'1'}>No urgente</MenuItem>
                <MenuItem value={'2'}>Baja</MenuItem>
                <MenuItem value={'3'}>Media</MenuItem>
                <MenuItem value={'4'}>Alta</MenuItem>
                <MenuItem value={'5'}>Urgente</MenuItem>
              </Select>
            </FormControl>
            <TextField 
              id="frontend-tech" 
              label="Tecnologías de front" 
              variant="outlined"
              value={fronttech}
              onChange={(e) => setFronttech(e.target.value)}
            />
            <TextField 
              id="backend-tech" 
              label="Tecnologías de back" 
              variant="outlined"
              value={backtech}
              onChange={(e) => setBacktech(e.target.value)}
            />
            <TextField 
              id="cloud-tech" 
              label="Tecnologías de cloud" 
              variant="outlined"
              value={cloudTech}
              onChange={(e) => setCloudTech(e.target.value)}
            />
            <TextField
              id="end-date"
              label="Fecha de entrega"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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
              id="sprints" 
              label="Sprints" 
              type="number" 
              variant="outlined"
              value={sprints}
              onChange={(e) => setSprints(e.target.value)}
            />
            <button 
              className='addTaskButton' 
              type="button"
              onClick={handleUpdateProject}
              disabled={isLoading}
            >
              <SaveAlt className='iconAdd'/>
              Actualizar proyecto
            </button>
            <button 
              className='addTaskButton' 
              type="button"
              onClick={handleDeleteClick}
              disabled={isLoading}
              style={{ backgroundColor: '#d32f2f', color: 'white' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c62828'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
            >
              <Delete className='iconAdd'/>
              Eliminar proyecto
            </button>
          </Box>
        </div>
        <div>
          <section className="tasksSection">
            <div className='taskHeaderSection'>
              <h2 className="heroTasksSection">Tareas</h2>
              <button className='addTaskButton' onClick={handleOpenTaskModal}>
                <AddCircleOutline className='iconAdd'/>
                Agregar Tarea
              </button>
            </div>

            {tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={handleEditTask}
                onDelete={onDeleteSuccess} 
              />
            ))}
          </section>
        </div>
      </div>

      <CreateTaskModal 
        open={isTaskModalOpen} 
        onClose={handleCloseTaskModal}
        onTaskCreated={handleTaskCreated}
        editMode={!!editingTask}
        taskData={editingTask ? {
          id: editingTask.id,
          name: editingTask.name,
          description: editingTask.description,
          assignedTo: editingTask.assignedTo,
          sprint: editingTask.sprint
        } : undefined}
      />

      {/* Confirmation Dialog for Project Deletion */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-project-dialog-title"
        aria-describedby="delete-project-dialog-description"
      >
        <DialogTitle id="delete-project-dialog-title">
          ¿Eliminar proyecto?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-project-dialog-description">
            ¿Estás seguro de que deseas eliminar el proyecto "{project?.name}"? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={isDeleting}>
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
    </div>
  );
}