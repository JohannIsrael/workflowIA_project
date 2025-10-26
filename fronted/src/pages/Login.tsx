import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import ImgLogo from '@src/assets/logo.svg'
import CustomTextField from '@src/components/CustomTextField';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '@src/apis/interceptor';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    width: '400px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [loginError, setLoginError] = React.useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateInputs()) {
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    
    const data = new FormData(event.currentTarget);
    const loginData = {
      email: data.get('email') as string,
      password: data.get('password') as string,
    };
    
    try {
      const response = await api.post('/auth/login', loginData);
      const { accessToken, refreshToken, user } = response.data;
      
      // Guardar tokens en localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Redirigir a la página original o al dashboard
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
      
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(
        error.response?.data?.message || 
        'Error al iniciar sesión. Verifica tus credenciales.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validateInputs = () => {
    const email = document.getElementById('email') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  return (
    <>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="center" alignItems="center">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <img src={ImgLogo} alt="Logo" style={{ width: '30px', height: 'auto' }} />
            <Typography
              component="h4"
              variant="h4"
              align="center"
              sx={{ fontSize: '20px', fontWeight: 'bold' }}
            >
              FlowPilot
            </Typography>
          </Box>
          
          <Card variant="outlined">

            {/* Inicio del formulario */}


            <Typography
              component="h1"
              variant="h4"
              fontWeight="bold"
              sx={{ width: '100%', fontSize: '1.5rem' }}
            >
              Iniciar sesión
            </Typography>
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gap: 2,
              }}
            >
              <FormControl>
                <FormLabel htmlFor="email">Email</FormLabel>
                <CustomTextField
                  error={emailError}
                  helperText={emailErrorMessage}
                  id="email"
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                  autoFocus
                  required
                  fullWidth
                  color={emailError ? 'error' : 'primary'}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="password">Contraseña</FormLabel>
                <CustomTextField
                  error={passwordError}
                  helperText={passwordErrorMessage}
                  name="password"
                  placeholder="••••••"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  autoFocus
                  required
                  fullWidth
                  color={passwordError ? 'error' : 'primary'}
                />
              </FormControl>

              {/* Mensaje de error */}
              {loginError && (
                <Typography color="error" variant="body2" sx={{ textAlign: 'center' }}>
                  {loginError}
                </Typography>
              )}

              {/* Inicio del botón de inicio de sesión */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                onClick={validateInputs}
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Ingresar'}
              </Button>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>

                <Link
                  component="button"
                  type="button"
                  onClick={() => alert('Forgot password functionality')}
                  variant="body2"
                  sx={{ alignSelf: 'center', textDecoration: 'none' }}
                >
                  Crear cuenta
                </Link>
                <Link
                  component="button"
                  type="button"
                  onClick={() => alert('Forgot password functionality')}
                  variant="body2"
                  sx={{ alignSelf: 'center', textDecoration: 'none' }}
                >
                  Recuperar contraseña
                </Link>
                {/* Fin del botón de inicio de sesión */}
              </Box>

            </Box>

            {/* Fin del formulario */}
          </Card>
        </Box>
      </SignInContainer>

    </>
  );

}
