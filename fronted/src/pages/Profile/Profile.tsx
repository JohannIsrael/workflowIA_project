import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Avatar, 
  TextField, 
  Button,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import { 
  Person, 
  Email, 
  Phone, 
  LocationOn, 
  Work, 
  CalendarToday,
  Edit,
  Save,
  Cancel
} from '@mui/icons-material';
import CustomButton from '@src/components/CustomButton';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  position: string;
  department: string;
  joinDate: string;
  avatar?: string;
}

const initialProfile: UserProfile = {
  id: 1,
  name: 'Johann',
  email: 'johann@flowpilot.com',
  phone: '+1 (555) 123-4567',
  location: 'Bogotá, Colombia',
  position: 'Desarrollador Full Stack',
  department: 'Tecnología',
  joinDate: '2024-01-15',
  avatar: undefined
};

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(initialProfile);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile({ ...profile });
  };

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#333' }}>
          Mi Perfil
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {isEditing ? (
            <>
              <CustomButton
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancel}
                sx={{ margin: 0 }}
              >
                Cancelar
              </CustomButton>
              <CustomButton
                variant="primary"
                startIcon={<Save />}
                onClick={handleSave}
                sx={{ margin: 0 }}
              >
                Guardar
              </CustomButton>
            </>
          ) : (
            <CustomButton
              variant="secondary"
              startIcon={<Edit />}
              onClick={handleEdit}
              sx={{ margin: 0 }}
            >
              Editar Perfil
            </CustomButton>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Información Principal */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Avatar
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mx: 'auto', 
                  mb: 2,
                  fontSize: '3rem',
                  backgroundColor: '#1976d2'
                }}
              >
                <Person sx={{ fontSize: '4rem' }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                {isEditing ? editedProfile.name : profile.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {isEditing ? editedProfile.position : profile.position}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isEditing ? editedProfile.department : profile.department}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Información Detallada */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Información Personal
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre Completo"
                    value={isEditing ? editedProfile.name : profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: '#666' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Correo Electrónico"
                    value={isEditing ? editedProfile.email : profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: '#666' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={isEditing ? editedProfile.phone : profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: '#666' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ubicación"
                    value={isEditing ? editedProfile.location : profile.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1, color: '#666' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Posición"
                    value={isEditing ? editedProfile.position : profile.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <Work sx={{ mr: 1, color: '#666' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Departamento"
                    value={isEditing ? editedProfile.department : profile.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <Work sx={{ mr: 1, color: '#666' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fecha de Ingreso"
                    value={isEditing ? editedProfile.joinDate : profile.joinDate}
                    onChange={(e) => handleInputChange('joinDate', e.target.value)}
                    disabled={!isEditing}
                    type="date"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      startAdornment: <CalendarToday sx={{ mr: 1, color: '#666' }} />
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Estadísticas */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Estadísticas del Usuario
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      12
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Proyectos Completados
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      8
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Proyectos Activos
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                      156
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tareas Completadas
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                      95%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Eficiencia Promedio
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
