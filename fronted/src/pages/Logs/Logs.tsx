import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import { Search, FilterList, Download, Refresh } from '@mui/icons-material';
import CustomButton from '@src/components/CustomButton';

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
  source: string;
  userId: string;
}

const sampleLogs: LogEntry[] = [
  {
    id: 1,
    timestamp: '2024-01-15 10:30:25',
    level: 'INFO',
    message: 'Usuario inició sesión correctamente',
    source: 'AuthService',
    userId: 'user123'
  },
  {
    id: 2,
    timestamp: '2024-01-15 10:32:15',
    level: 'WARNING',
    message: 'Intento de acceso fallido desde IP desconocida',
    source: 'SecurityService',
    userId: 'unknown'
  },
  {
    id: 3,
    timestamp: '2024-01-15 10:35:42',
    level: 'ERROR',
    message: 'Error al conectar con la base de datos',
    source: 'DatabaseService',
    userId: 'system'
  },
  {
    id: 4,
    timestamp: '2024-01-15 10:38:10',
    level: 'DEBUG',
    message: 'Proceso de sincronización completado',
    source: 'SyncService',
    userId: 'system'
  },
  {
    id: 5,
    timestamp: '2024-01-15 10:40:33',
    level: 'INFO',
    message: 'Nuevo proyecto creado: E-commerce Platform',
    source: 'ProjectService',
    userId: 'user123'
  },
  {
    id: 6,
    timestamp: '2024-01-15 10:42:18',
    level: 'WARNING',
    message: 'Memoria del servidor al 85% de capacidad',
    source: 'SystemMonitor',
    userId: 'system'
  },
  {
    id: 7,
    timestamp: '2024-01-15 10:45:55',
    level: 'ERROR',
    message: 'Timeout en la API de terceros',
    source: 'ExternalAPIService',
    userId: 'user456'
  },
  {
    id: 8,
    timestamp: '2024-01-15 10:48:22',
    level: 'INFO',
    message: 'Backup automático completado exitosamente',
    source: 'BackupService',
    userId: 'system'
  }
];

export default function Logs() {
  const [logs] = useState<LogEntry[]>(sampleLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'error';
      case 'WARNING':
        return 'warning';
      case 'INFO':
        return 'info';
      case 'DEBUG':
        return 'default';
      default:
        return 'default';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'ALL' || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#333' }}>
          Logs del Sistema
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <CustomButton
            variant="outlined"
            startIcon={<Refresh />}
            sx={{ margin: 0 }}
          >
            Actualizar
          </CustomButton>
          <CustomButton
            variant="primary"
            startIcon={<Download />}
            sx={{ margin: 0 }}
          >
            Exportar
          </CustomButton>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Buscar en logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Nivel</InputLabel>
              <Select
                value={levelFilter}
                label="Nivel"
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <MenuItem value="ALL">Todos</MenuItem>
                <MenuItem value="ERROR">Error</MenuItem>
                <MenuItem value="WARNING">Advertencia</MenuItem>
                <MenuItem value="INFO">Info</MenuItem>
                <MenuItem value="DEBUG">Debug</MenuItem>
              </Select>
            </FormControl>
            <IconButton>
              <FilterList />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Tabla de logs */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nivel</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Mensaje</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fuente</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {log.timestamp}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.level}
                        color={getLevelColor(log.level) as any}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>{log.message}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{log.source}</TableCell>
                    <TableCell>{log.userId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {filteredLogs.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron logs que coincidan con los filtros
          </Typography>
        </Box>
      )}
    </Box>
  );
}
