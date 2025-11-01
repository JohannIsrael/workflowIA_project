import { Box, Typography, Grid, CircularProgress } from '@mui/material';
import { Add, FolderOpen } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import ProjectCard from '@src/components/ProjectCard';
import CustomButton from '@src/components/CustomButton';
import CreateProjectModal from '@src/components/CreateProjectModal';
import { getProjectsAPI } from '@src/apis/projects';
import { type Project } from './../../utils/interfaces/Project';
import { toastSuccess } from '@src/utils/toast';


export default function Proyectos() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Limpiar errores previos
      const data = await getProjectsAPI();
      // Asegurarse de que siempre sea un array
      if (Array.isArray(data)) {
        setProjects(data);
      } else {
        setProjects([]);
      }
    } catch (err: any) {
      // Solo mostrar error si no es un error de "no encontrado" o si es un error de red real
      // Si la respuesta es 404 o similar, tratar como array vacío
      if (err?.response?.status === 404 || (err?.response?.status >= 400 && err?.response?.status < 500)) {
        // Errores 4xx (excepto algunos específicos) pueden significar que no hay proyectos
        setProjects([]);
        setError(null);
      } else {
        // Solo mostrar error para errores de red o servidor (5xx)
        console.error('Error fetching projects:', err);
        setError('Error fetching projects');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const onSuccessProjectCreated = useCallback(() => {
    toastSuccess('Se ha creado el proyecto correctamente.', 'Proyecto creado');
    fetchProjects();
  }, [fetchProjects]);

  const handleProjectClick = (project: Project) => {
    navigate(`/detalle-proyecto/${project.id}`, { 
      state: { project } 
    });
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#333' }}>
          Mis Proyectos
        </Typography>
        <CustomButton
          variant="primary"
          startIcon={<Add />}
          onClick={handleOpenModal}
          sx={{ margin: 0 }}
        >
          Nuevo Proyecto
        </CustomButton>
      </Box>

      {projects.length === 0 ? (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '400px',
            p: 4
          }}
        >
          <FolderOpen 
            sx={{ 
              fontSize: 64, 
              color: '#ccc',
              mb: 2
            }} 
          />
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#999',
              fontWeight: 500,
              mb: 1
            }}
          >
            No hay proyectos aún
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#bbb',
              textAlign: 'center',
              maxWidth: '400px',
              mb: 3
            }}
          >
            Comienza creando tu primer proyecto haciendo clic en el botón "Nuevo Proyecto"
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Box 
                onClick={() => handleProjectClick(project)}
                sx={{ cursor: 'pointer' }}
              >
                <ProjectCard
                  name={project.name}
                  priority={project.priority}
                  endDate={project.endDate}
                  backtech={project.backtech}
                  fronttech={project.fronttech}
                  cloudTech={project.cloudTech}
                  sprints={project.sprints}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      <CreateProjectModal 
        open={isModalOpen} 
        onClose={handleCloseModal} 
        onProjectCreated={onSuccessProjectCreated}
      />
    </Box>
  );
}
