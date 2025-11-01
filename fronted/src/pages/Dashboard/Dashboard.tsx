import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField,
  Paper,
  Grid,
  CircularProgress,
  Backdrop
} from '@mui/material';
import { 
  ArrowForward,
  FolderOpen
} from '@mui/icons-material';
import ProjectCard from '@src/components/ProjectCard';
import CustomButton from '@src/components/CustomButton';
import { getProjectsAPI } from '@src/apis/projects';
import { executeGeminiAction } from '@src/apis/gemini';
import { decodeRefreshToken } from '@src/utils/tokenDecoder';
import { toastError, toastInfo, toastSuccess } from '@src/utils/toast';

interface Project {
  id: number;
  name: string;
  priority: string;
  endDate: string;
  backtech: string;
  fronttech: string;
  cloudTech: string;
  sprints: number;
}

export default function Dashboard() {
  const [prompt, setPrompt] = useState('');
  const [userName, setUserName] = useState('Usuario');
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Cargar nombre del usuario desde el token
  useEffect(() => {
    const loadUserName = () => {
      try {
        const tokenPayload = decodeRefreshToken();
        if (tokenPayload) {
          // Usar fullName si está disponible, sino name
          const name = tokenPayload.fullName || tokenPayload.name || 'Usuario';
          setUserName(name);
        } else {
          // Si no hay token, intentar obtener del localStorage
          const savedUserStr = localStorage.getItem('user');
          if (savedUserStr) {
            const savedUser = JSON.parse(savedUserStr);
            setUserName(savedUser.fullName || savedUser.name || 'Usuario');
          }
        }
      } catch (error) {
        console.error('Error loading user name:', error);
      }
    };

    loadUserName();
  }, []);

  const fetchProjects = async () => {
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
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSendPrompt = async () => {
    if (prompt.trim()) {
      setIsSending(true);
      toastInfo('Creando proyecto...', 'Se ha enviado el prompt para la creación del proyecto')

      try {
        await executeGeminiAction('create', prompt);
        setPrompt('');
        toastSuccess('Se ha creado el proyecto correctamente.', 'Proyecto creado');
        fetchProjects(); // Re-fetch projects after creating a new one
      } catch (error) {
        console.error('Error executing Gemini action:', error);
        toastError('No se pudo crear el proyecto.', 'Error al crear');
        setError('Error creating project');
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleViewAllProjects = () => {
    navigate('/proyectos');
  };

  const handleProjectClick = (project: Project) => {
    navigate(`/detalle-proyecto/${project.id}`, { 
      state: { project } 
    });
  };

  return (
    <Box sx={{ 
      p: 4, 
      minHeight: '100vh',
      backgroundColor: 'white',
      color: '#333'
    }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isSending}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
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
         ¡Hola {userName}! ¿Qué quieres construir?
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
            placeholder="Escribe lo que quieres construir..."
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
              onClick={handleSendPrompt}
              disabled={!prompt.trim() || isSending}
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
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress />
          </Box>
        ) : projects.length === 0 ? (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '200px',
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
                maxWidth: '400px'
              }}
            >
              Comienza creando tu primer proyecto usando el formulario de arriba
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
      </Box>
    </Box>
  );
}

