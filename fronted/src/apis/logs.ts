import interceptor from "./interceptor";

export const getAuditLogsAPI = async (page: number = 1, limit: number = 100) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const response = await interceptor.get('/auth/audit-logs/success', { params });
  return response.data;
};

