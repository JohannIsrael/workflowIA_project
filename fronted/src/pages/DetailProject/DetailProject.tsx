import './DetailProject.css'
import { useEffect, useState } from 'react';
import { getProjectTasksAPI } from '@src/apis/tasks';
import { type Task } from './../../utils/interfaces/Tasks';
import { type Project } from './../../utils/interfaces/Project';
import CreateTaskModal from '@src/components/CreateTaskModal'
import { AddCircleOutline, Speed, AutoAwesome, SaveAlt, CalendarMonth } from '@mui/icons-material';
import { Box, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, CircularProgress, Backdrop } from '@mui/material';
import { useParams, useLocation } from 'react-router-dom';
import TaskCard from '@src/components/detailProject/TaskCard';
import { executeGeminiAction } from '@src/apis/gemini';
import { updateProjectAPI } from '@src/apis/projects';


export default function DetailProject() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const [project, setProject] = useState<Project | null>(location.state?.project || null);
  const [priority, setPriority] = useState(project?.priority || '1');
  const [fronttech, setFronttech] = useState(project?.fronttech || '');
  const [backtech, setBacktech] = useState(project?.backtech || '');
  const [cloudTech, setCloudTech] = useState(project?.cloudTech || '');
  const [endDate, setEndDate] = useState(project?.endDate || '');
  const [sprints, setSprints] = useState(project?.sprintsQuantity|| '' );
  const [isLoading, setIsLoading] = useState(false);

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
    
    // Convertir de YYYY-MM-DD a DD/MM/YYYY
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    
    return dateString;
  };

  const fetchProjectData = async () => {
    if (projectId) {
      try {
        const fetchedTasks = await getProjectTasksAPI(projectId);
        setTasks(fetchedTasks);
        
        // Actualizar datos del proyecto desde la primera tarea (todas tienen el mismo project)
        if (fetchedTasks.length > 0 && fetchedTasks[0].project) {
          const projectData = fetchedTasks[0].project;
          setProject(projectData);
          setPriority(projectData.priority || '1');
          setFronttech(projectData.fronttech || '');
          setBacktech(projectData.backtech || '');
          setCloudTech(projectData.cloudTech || '');
          setEndDate(formatDateForInput(projectData.endDate || ''));
          setSprints(projectData.sprintsQuantity ? projectData.sprintsQuantity.toString() : '');
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
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
    }
  }, [project]);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const handlePredictTasks = async () => {
    if (!project?.name) return;
    
    setIsLoading(true);
    try {
      await executeGeminiAction('predict', "", project.id.toString());
      await fetchProjectData();
    } catch (error) {
      console.error('Error predicting tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimizeTasks = async () => {
    if (!project?.name) return;
    
    setIsLoading(true);
    try {
      await executeGeminiAction('optimize', "", project.id.toString());
      await fetchProjectData();
    } catch (error) {
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
        name: project.name,
        priority: priority,
        backtech: backtech,
        fronttech: fronttech,
        cloudTech: cloudTech,
        sprintsQuantity: Number(sprints),
        endDate: formatDateForAPI(endDate)
      };

      await updateProjectAPI(projectId, projectData);
      await fetchProjectData(); // Recargar datos después de actualizar
    } catch (error) {
      console.error('Error updating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleTaskCreated = () => {
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
        <h1 className="heroDetailProject">{project?.name || 'FlowPilot App'}</h1>
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
                onDelete={fetchProjectData} 
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
    </div>
  );
}