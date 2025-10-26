import interceptor from "./interceptor";

export const getProjectTasksAPI = async (projectId: string) => {
    const accessToken = localStorage.getItem("accessToken");
    const response = await interceptor.get('/tasks/'+projectId, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    return response.data;
};

export const createTaskAPI = async (taskData: any) => {
    const accessToken = localStorage.getItem("accessToken");
    const response = await interceptor.post('/tasks', taskData, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    return response.data;
};

export const deleteTaskAPI = async (taskId: string) => {
    const accessToken = localStorage.getItem("accessToken");
    const response = await interceptor.delete(`/tasks/${taskId}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    return response.data;
};

export const updateTaskAPI = async (taskId: string, taskData: any) => {
    const accessToken = localStorage.getItem("accessToken");
    const response = await interceptor.patch(`/tasks/${taskId}`, taskData, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    return response.data;
};
        
