import interceptor from "./interceptor";

export const getProjectsAPI = async () => {
    const accessToken = localStorage.getItem("accessToken");
    const response = await interceptor.get('/projects', {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    return response.data;
};

export const createProjectAPI = async (projectData: any) => {
    const accessToken = localStorage.getItem("accessToken");
    const response = await interceptor.post('/projects', projectData, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    return response.data;
};

export const getProjectAPI = async (projectId: string) => {
    const accessToken = localStorage.getItem("accessToken");
    const response = await interceptor.get(`/projects/${projectId}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    return response.data;
};

export const updateProjectAPI = async (projectId: string, projectData: any) => {
    const accessToken = localStorage.getItem("accessToken");
    const response = await interceptor.patch(`/projects/${projectId}`, projectData, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    return response.data;        
};

export const deleteProjectAPI = async (projectId: string) => {
    const accessToken = localStorage.getItem("accessToken");
    const response = await interceptor.delete(`/projects/${projectId}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    return response.data;
};

