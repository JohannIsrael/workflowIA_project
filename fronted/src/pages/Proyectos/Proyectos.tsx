import { Box, Typography, Grid } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ProjectCard from '@src/components/ProjectCard';
import CustomButton from '@src/components/CustomButton';
import CreateProjectModal from '@src/components/CreateProjectModal';

// Sample project data
const projects = [
  {
    id: 1,
    title: 'E-commerce Platform',
    priority: 'High' as const,
    endDate: '2024-12-31',
    technologies: ['React', 'Node.js']
  },
  {
    id: 2,
    title: 'Mobile Banking App',
    priority: 'High' as const,
    endDate: '2024-11-15',
    technologies: ['React Native', 'Express', 'MongoDB']
  },
  {
    id: 3,
    title: 'Learning Management System',
    priority: 'Medium' as const,
    endDate: '2025-01-20',
    technologies: ['Vue.js', 'Python', 'PostgreSQL']
  },
  {
    id: 4,
    title: 'Inventory Management',
    priority: 'Low' as const,
    endDate: '2025-02-28',
    technologies: ['Angular', 'Java', 'MySQL']
  },
  {
    id: 5,
    title: 'Social Media Dashboard',
    priority: 'Medium' as const,
    endDate: '2024-10-30',
    technologies: ['React', 'TypeScript', 'Firebase']
  },
  {
    id: 6,
    title: 'IoT Monitoring System',
    priority: 'High' as const,
    endDate: '2024-12-15',
    technologies: ['React', 'Python', 'AWS']
  }
];

export default function Proyectos() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProjectClick = (projectId: number) => {
    navigate('/detalle-proyecto');
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
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

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
            <Box 
              onClick={() => handleProjectClick(project.id)}
              sx={{ cursor: 'pointer' }}
            >
              <ProjectCard
                title={project.title}
                priority={project.priority}
                endDate={project.endDate}
                technologies={project.technologies}
              />
            </Box>
          </Grid>
        ))}
      </Grid>

      <CreateProjectModal 
        open={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </Box>
  );
}
