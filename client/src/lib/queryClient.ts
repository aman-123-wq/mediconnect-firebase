import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mediconnect-firebase.onrender.com';
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to get auth token
function getAuthToken(): string | null {
  // Check different possible storage locations for the token
  return localStorage.getItem('auth-token') || 
         localStorage.getItem('token') ||
         sessionStorage.getItem('auth-token') ||
         sessionStorage.getItem('token');
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const token = getAuthToken();
  
  const res = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }), // ADD THIS
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const token = getAuthToken(); // ADD THIS
    
    const res = await fetch(fullUrl, {
      credentials: "include",
      headers: {
        ...(token && { "Authorization": `Bearer ${token}` }), // ADD THIS
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});