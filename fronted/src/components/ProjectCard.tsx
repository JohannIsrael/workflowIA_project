import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';

interface ProjectCardProps {
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  endDate: string;
  technologies: string[];
}

export default function ProjectCard({ title, priority, endDate, technologies }: ProjectCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return '#ffebee';
      case 'Medium':
        return '#fff3e0';
      case 'Low':
        return '#e8f5e8';
      default:
        return '#f5f5f5';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return '#d32f2f';
      case 'Medium':
        return '#f57c00';
      case 'Low':
        return '#388e3c';
      default:
        return '#666';
    }
  };

  const getTechColor = (index: number) => {
    const colors = ['#e3f2fd', '#e8f5e8', '#fff3e0', '#f3e5f5', '#e0f2f1'];
    return colors[index % colors.length];
  };

  const getTechTextColor = (index: number) => {
    const colors = ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#00695c'];
    return colors[index % colors.length];
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
            {title}
          </Typography>
          <Chip
            label={priority}
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
            {technologies.map((tech, index) => (
              <Chip
                key={tech}
                label={tech}
                size="small"
                sx={{
                  backgroundColor: getTechColor(index),
                  color: getTechTextColor(index),
                  fontWeight: '500',
                  fontSize: '0.75rem',
                  height: '28px'
                }}
              />
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
