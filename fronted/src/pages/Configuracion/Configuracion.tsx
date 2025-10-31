import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid,
  Divider
} from '@mui/material';
import { 
  Settings, 
  Person,
  Save
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CustomButton from '@src/components/CustomButton';

export default function Configuracion() {
  const navigate = useNavigate();

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#333' }}>
          Configuración del Sistema
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Enlace a Mi Perfil */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Person sx={{ mr: 2, color: '#1976d2', fontSize: '2rem' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Gestión de Perfil
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Administra tu información personal, configuración de cuenta y preferencias de usuario.
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CustomButton
                  variant="primary"
                  startIcon={<Person />}
                  onClick={handleGoToProfile}
                  sx={{ margin: 0, px: 4, py: 1.5 }}
                >
                  Ir a Mi Perfil
                </CustomButton>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
