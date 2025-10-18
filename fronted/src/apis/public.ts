import interceptor from "./interceptor";

export const getHelloAPI = async () => {
    const response = await interceptor.get('/');
    return response.data;
};