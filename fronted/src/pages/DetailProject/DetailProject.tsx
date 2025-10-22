import React from 'react'
import './DetailProject.css'
import TaskCard, { type Task } from '@src/components/detailProject/TaskCard'
import { AddCircleOutline, Speed, AutoAwesome, SaveAlt, CalendarMonth } from '@mui/icons-material';
import { Box, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment } from '@mui/material';


const tasks: Task[] = [
  {
    id: 1,
    name: 'taskName',
    description: 'task description',
    assignedTo: 'Persona responsable',
    sprint: 1,
  },
  {
    id: 2,
    name: 'taskName 2asdsa',
    description: 'task description',
    assignedTo: 'Persona responsable',
    sprint: 1,
  },
];


export default function DetailProject() {
  return (
    <div className="containerPage">
      <div className='headerSection'>
            <h1 className="heroDetailProject">FlowPilot App</h1>
            <div className='headerSection__buttons'>
              <button className='predictTaskButton'>
                  <AutoAwesome className='iconAdd'/>
                  Predecir
              </button>
              <button className='addTaskButton'>
                  <Speed className='iconAdd'/>
                  Optimizar
              </button>
            </div>
          </div>
      <div className='generalSection'>
        <div className='ProjectInfoSection'>
          <h2 className='heroProjectInfoSection'>Project Information</h2>
          <Box className='editableLabels' component="form" sx={{ '& > :not(style)': { m: 1, width: '25ch' }, }} noValidate autoComplete="off">
            <FormControl fullWidth>
              <InputLabel id="priority-select-label">Priority</InputLabel>
              <Select
                labelId="priority-select-label"
                id="priority-select"
                label="Priority"
              >
                <MenuItem value={'Low'}>Low</MenuItem>
                <MenuItem value={'Medium'}>Medium</MenuItem>
                <MenuItem value={'High'}>High</MenuItem>
              </Select>
            </FormControl>
            <TextField id="frontend-tech" label="Frontend Technologies" variant="outlined" />
            <TextField id="backend-tech" label="Backend Technologies" variant="outlined" />
            <TextField id="cloud-tech" label="Cloud Technologies" variant="outlined" />
            <TextField
              id="end-date"
              label="End Date"
              type="date"
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" style={{ pointerEvents: 'none' }}>
                    <CalendarMonth />
                  </InputAdornment>
                ),
              }}
            />
            <TextField id="sprints" label="Number of Sprints" type="number" variant="outlined" />
            <button className='addTaskButton'>
              <SaveAlt className='iconAdd'/>
              Actualizar proyecto
            </button>
          </Box>
        </div>
        <div>
          <section className="tasksSection">
            <div className='taskHeaderSection'>
              <h2 className="heroTasksSection">Tareas</h2>
              <button className='addTaskButton'>
                <AddCircleOutline className='iconAdd'/>
                Agregar Tarea
                </button>
            </div>

            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}