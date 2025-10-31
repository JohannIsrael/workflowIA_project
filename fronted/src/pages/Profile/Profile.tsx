import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Avatar, 
  TextField, 
  Grid,
  CircularProgress
} from '@mui/material';
import { 
  Person, 
  Email, 
  CalendarToday,
  Edit,
  Save,
  Cancel
} from '@mui/icons-material';
import CustomButton from '@src/components/CustomButton';
import { decodeRefreshToken } from '@src/utils/tokenDecoder';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  avatar?: string;
  fullName?: string;
  lastLogin?: string;
}

const defaultProfile: UserProfile = {
  id: '',
  name: '',
  email: '',
  joinDate: '',
  avatar: undefined,
  fullName: '',
  lastLogin: ''
};

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener datos del usuario desde el refreshToken al cargar el componente
  useEffect(() => {
    const loadUserProfile = () => {
      try {
        const tokenPayload = decodeRefreshToken();
        
        if (tokenPayload) {
          // Obtener datos adicionales del localStorage si existen
          const savedUserStr = localStorage.getItem('user');
          const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
          
          // Obtener campos personalizados guardados previamente
          const savedFullName = localStorage.getItem('user_fullName');
          
          // Formatear fecha de creación (createdAt)
          const formatDate = (dateString: string | undefined) => {
            if (!dateString) return '';
            try {
              const date = new Date(dateString);
              return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
            } catch {
              return '';
            }
          };

          const userProfile: UserProfile = {
            id: tokenPayload.sub || '',
            name: tokenPayload.name || savedUser?.name || '',
            email: tokenPayload.email || savedUser?.email || '',
            fullName: savedFullName || tokenPayload.fullName || savedUser?.fullName || '',
            joinDate: formatDate(tokenPayload.createdAt),
            lastLogin: tokenPayload.lastLogin || '',
            avatar: undefined
          };

          setProfile(userProfile);
          setEditedProfile(userProfile);
        } else {
          // Si no hay token, intentar obtener datos del localStorage
          const savedUserStr = localStorage.getItem('user');
          if (savedUserStr) {
            const savedUser = JSON.parse(savedUserStr);
            const userProfile: UserProfile = {
              ...defaultProfile,
              id: savedUser.id || '',
              name: savedUser.name || '',
              email: savedUser.email || '',
              fullName: savedUser.fullName || ''
            };
            setProfile(userProfile);
            setEditedProfile(userProfile);
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile({ ...profile });
  };

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    
    // Guardar campos personalizados en localStorage
    if (editedProfile.fullName) {
      localStorage.setItem('user_fullName', editedProfile.fullName);
    }
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Usar fullName si está disponible, sino name
  const displayName = profile.fullName || profile.name;
  const displayNameEditing = editedProfile.fullName || editedProfile.name;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#333' }}>
          Mi Perfil
        </Typography>
        {/* <Box sx={{ display: 'flex', gap: 2 }}>
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
        </Box> */}
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
                {isEditing ? displayNameEditing : displayName}
              </Typography>
              {profile.lastLogin && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Último acceso: {new Date(profile.lastLogin).toLocaleString()}
                </Typography>
              )}
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
                    label="Nombre"
                    value={isEditing ? editedProfile.name : profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={true}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: '#666' }} />
                    }}
                    helperText="Nombre del token (no editable)"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre Completo"
                    value={isEditing ? (editedProfile.fullName || '') : (profile.fullName || '')}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditedProfile(prev => ({ ...prev, fullName: value }));
                    }}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: '#666' }} />
                    }}
                    helperText="Puede editarse, pero se usa el valor del token por defecto"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Correo Electrónico"
                    value={isEditing ? editedProfile.email : profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={true}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: '#666' }} />
                    }}
                    helperText="Correo del token (no editable)"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fecha de Ingreso"
                    value={isEditing ? editedProfile.joinDate : profile.joinDate}
                    onChange={(e) => handleInputChange('joinDate', e.target.value)}
                    disabled={true}
                    type="date"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      startAdornment: <CalendarToday sx={{ mr: 1, color: '#666' }} />
                    }}
                    helperText="Fecha de creación de la cuenta (no editable)"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
