import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField,
  Paper
} from '@mui/material';
import { 
  Send,
  ArrowForward
} from '@mui/icons-material';
import ProjectCard from '@src/components/ProjectCard';
import CustomButton from '@src/components/CustomButton';

interface RecentProject {
  id: number;
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  endDate: string;
  technologies: string[];
}

const recentProjects: RecentProject[] = [
  {
    id: 1,
    title: 'E-commerce Platform',
    priority: 'High',
    endDate: '2024-12-31',
    technologies: ['React', 'Node.js']
  },
  {
    id: 2,
    title: 'Mobile Banking App',
    priority: 'High',
    endDate: '2024-11-15',
    technologies: ['React Native', 'Express']
  },
  {
    id: 3,
    title: 'Learning Management System',
    priority: 'Medium',
    endDate: '2025-01-20',
    technologies: ['Vue.js', 'Python']
  }
];

export default function Dashboard() {
  const [prompt, setPrompt] = useState('');
  const [userName, setUserName] = useState('Johann');
  const navigate = useNavigate();

  const handleSendPrompt = () => {
    if (prompt.trim()) {
      console.log('Sending prompt:', prompt);
      // Here you would integrate with your AI service
      setPrompt('');
    }
  };

  const handleViewAllProjects = () => {
    navigate('/proyectos');
  };

  const handleProjectClick = (projectId: number) => {
    navigate('/detalle-proyecto');
  };

  return (
    <Box sx={{ 
      p: 4, 
      minHeight: '100vh',
      backgroundColor: 'white',
      color: '#333'
    }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold', 
            color: '#333',
            mb: 4,
            fontSize: { xs: '1.5rem', md: '2.2rem' }
          }}
        >
          ¡Hola {userName}!, ¿Qué proyecto quieres empezar hoy?
        </Typography>
      </Box>

      {/* Main Input Section */}
      <Box sx={{ maxWidth: '800px', mx: 'auto', mb: 6 }}>
        <Paper sx={{ 
          p: 3, 
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Describe the idea you want to build..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white',
                borderRadius: 2,
                '& fieldset': {
                  borderColor: '#1976d2',
                  borderWidth: 2,
                },
                '&:hover fieldset': {
                  borderColor: '#1976d2',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                },
              },
              '& .MuiInputBase-input': {
                color: '#333',
                fontSize: '1.1rem',
                '&::placeholder': {
                  color: '#666',
                  opacity: 1,
                },
              },
            }}
          />
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'end', 
            alignItems: 'center', 
            mt: 3 
          }}>
            
            
            <CustomButton
              variant="primary"
              endIcon={<Send />}
              onClick={handleSendPrompt}
              disabled={!prompt.trim()}
              sx={{ 
                margin: 0, 
                color: 'white !important',
                '& .MuiButton-root': {
                  color: 'white !important'
                }
              }}
              type="submit"              
            >
              Enviar
            </CustomButton>
          </Box>
        </Paper>
      </Box>

      
      

      {/* Recent Projects */}
      <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 'bold', 
              color: '#333' 
            }}
          >
            Proyectos Recientes
          </Typography>
          <CustomButton
            variant="outlined"
            endIcon={<ArrowForward />}
            onClick={handleViewAllProjects}
            sx={{ margin: 0 }}
          >
            Ver todos
          </CustomButton>
        </Box>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)' 
          }, 
          gap: 3 
        }}>
          {recentProjects.map((project) => (
            <Box 
              key={project.id} 
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
          ))}
        </Box>
      </Box>
    </Box>
  );
}
