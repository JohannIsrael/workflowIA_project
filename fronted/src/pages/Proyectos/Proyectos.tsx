import { Box, Typography, Grid, CircularProgress } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import ProjectCard from '@src/components/ProjectCard';
import CustomButton from '@src/components/CustomButton';
import CreateProjectModal from '@src/components/CreateProjectModal';
import { getProjectsAPI } from '@src/apis/projects';
import { type Project } from './../../utils/interfaces/Project';


export default function Proyectos() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProjectsAPI();
      setProjects(data);
    } catch (err) {
      setError('Error fetching projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#333' }}>
          My projects
        </Typography>
        <CustomButton
          variant="primary"
          startIcon={<Add />}
          onClick={handleOpenModal}
          sx={{ margin: 0 }}
        >
          New Project
        </CustomButton>
      </Box>

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

      <CreateProjectModal 
        open={isModalOpen} 
        onClose={handleCloseModal} 
        onProjectCreated={fetchProjects}
      />
    </Box>
  );
}
