import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { getTechColor, getTechTextColor } from './../utils/techColors';


interface ProjectCardProps {
  name: string;
  priority: string;
  endDate: string;
  backtech: string;
  fronttech: string;
  cloudTech: string;
  sprints: number;
}

export default function ProjectCard({ name, priority, endDate, backtech, fronttech, cloudTech, sprints}: ProjectCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '5':
        return '#ffebee';
      case '4':
        return '#ffebee';
      case '3':
        return '#fff3e0';
      case '2':
        return '#e8f5e8';
      case '1':
        return '#e8f5e8';
      default:
        return '#f5f5f5';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case '5':
        return '#d32f2f';
      case '4':
        return '#e76b6bff';
      case '3':
        return '#f57c00';
      case '2':
        return '#388e3c';
      case '1':
        return '#75b878ff';
      default:
        return '#666';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case '5':
        return 'Urgente';
      case '4':
        return 'Alta';
      case '3':
        return 'Media';
      case '2':
        return 'Baja';
      case '1':
        return 'No urgente';
      default:
        return '#666';
    }
  };


  return (
    <Card 
      sx={{ 
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        },
        cursor: 'pointer'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              fontWeight: 'bold', 
              color: '#333',
              flex: 1,
              mr: 2
            }}
          >
            {name}
          </Typography>
          <Chip
            label={getPriorityText(priority)}
            size="small"
            sx={{
              backgroundColor: getPriorityColor(priority),
              color: getPriorityTextColor(priority),
              fontWeight: 'bold',
              fontSize: '0.75rem',
              height: '24px'
            }}
          />
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 2 }}
        >
          End Date: {endDate}
        </Typography>
        
        <Box sx={{ borderTop: '1px solid #e0e0e0', pt: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
            label={fronttech}
            size="small"
            sx={{
              backgroundColor: getTechColor(fronttech),
              color: getTechTextColor(fronttech),
              fontWeight: 'bold',
              fontSize: '0.75rem',
              height: '24px'
            }}
          />

          <Chip
            label={backtech}
            size="small"
            sx={{
              backgroundColor: getTechColor(backtech),
              color: getTechTextColor(backtech),
              fontWeight: 'bold',
              fontSize: '0.75rem',
              height: '24px'
            }}
          />

          <Chip
            label={cloudTech}
            size="small"
            sx={{
              backgroundColor: getTechColor(cloudTech),
              color: getTechTextColor(cloudTech),
              fontWeight: 'bold',
              fontSize: '0.75rem',
              height: '24px'
            }}
          />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
