import { useState, useEffect } from 'react';
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
  IconButton,
  CircularProgress
} from '@mui/material';
import { Search, FilterList, Download, Refresh } from '@mui/icons-material';
import CustomButton from '@src/components/CustomButton';
import { getAuditLogsAPI } from '@src/apis/logs';

interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  description: string | null;
  details: string | null;
  userName: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    loadLogs();
  }, []);

  const sanitizeDescription = (description: string | null): string | null => {
    if (!description) return null;
    
    // Buscar "with id" o "con id" (case insensitive) y eliminar todo lo que sigue, incluyendo el UUID
    const withIdRegex = /\s*(with|con)\s+id\s*:?\s*[a-f0-9\-]+\s*$/i;
    let sanitized = description.replace(withIdRegex, '').trim();
    
    // También eliminar cualquier patrón de UUID que pueda quedar
    sanitized = sanitized.replace(/\s*[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\s*$/i, '').trim();
    
    return sanitized || null;
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getAuditLogsAPI(1, 100);
      const transformedLogs: LogEntry[] = data.map((log: any) => ({
        id: log.id,
        timestamp: log.createdAt ? new Date(log.createdAt).toLocaleString() : '',
        action: log.action,
        description: sanitizeDescription(log.description),
        details: sanitizeDescription(log.details),
        userName: log.user?.name || log.user?.email || 'Sistema'
      }));
      setLogs(transformedLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'success';
    if (action.includes('UPDATE')) return 'info';
    if (action.includes('DELETE')) return 'error';
    if (action.includes('PREDICT') || action.includes('OPTIMIZE')) return 'warning';
    return 'default';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'CREATE_PROJECT': 'Crear Proyecto',
      'UPDATE_PROJECT': 'Actualizar Proyecto',
      'DELETE_PROJECT': 'Eliminar Proyecto',
      'CREATE_TASK': 'Crear Tarea',
      'UPDATE_TASK': 'Actualizar Tarea',
      'DELETE_TASK': 'Eliminar Tarea',
      'PREDICT_PROJECT': 'Predecir Proyecto',
      'OPTIMIZE_PROJECT': 'Optimizar Proyecto',
    };
    return labels[action] || action;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (log.action.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#333' }}>
          Logs de Proyectos y Tareas
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <CustomButton
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadLogs}
            disabled={loading}
            sx={{ margin: 0 }}
          >
            Actualizar
          </CustomButton>
          {/* <CustomButton
            variant="primary"
            startIcon={<Download />}
            sx={{ margin: 0 }}
          >
            Exportar
          </CustomButton> */}
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
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Acción</InputLabel>
              <Select
                value={actionFilter}
                label="Acción"
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <MenuItem value="ALL">Todas</MenuItem>
                <MenuItem value="CREATE_PROJECT">Crear Proyecto</MenuItem>
                <MenuItem value="UPDATE_PROJECT">Actualizar Proyecto</MenuItem>
                <MenuItem value="DELETE_PROJECT">Eliminar Proyecto</MenuItem>
                <MenuItem value="CREATE_TASK">Crear Tarea</MenuItem>
                <MenuItem value="UPDATE_TASK">Actualizar Tarea</MenuItem>
                <MenuItem value="DELETE_TASK">Eliminar Tarea</MenuItem>
                <MenuItem value="PREDICT_PROJECT">Predecir Proyecto</MenuItem>
                <MenuItem value="OPTIMIZE_PROJECT">Optimizar Proyecto</MenuItem>
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Acción</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Detalles</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron logs
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {log.timestamp}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getActionLabel(log.action)}
                          color={getActionColor(log.action) as any}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>{sanitizeDescription(log.description) || '-'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {log.details || '-'}
                      </TableCell>
                      <TableCell>{log.userName}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {!loading && filteredLogs.length === 0 && logs.length > 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron logs que coincidan con los filtros
          </Typography>
        </Box>
      )}
    </Box>
  );
}
