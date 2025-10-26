import interceptor from "./interceptor";


export const executeGeminiAction = async (strategy: string, userInput?: string, projectId?: string) => {
  const accessToken = localStorage.getItem("accessToken");

  const response = await interceptor.post(
    "/gemini/execute",
    {
      strategy: strategy,
      userInput: userInput,
      projectId: projectId,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.data;
};
