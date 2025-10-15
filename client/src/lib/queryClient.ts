import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from './firebase'; // ADD THIS IMPORT

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mediconnect-firebase.onrender.com';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// IMPROVED: Check both Firebase auth AND localStorage
async function getAuthToken(): Promise<string | null> {
  try {
    // 1. First try Firebase Auth (if user is logged in)
    const user = auth.currentUser;
    if (user) {
      const firebaseToken = await user.getIdToken();
      console.log("Using Firebase auth token");
      return firebaseToken;
    }
    
    // 2. Fallback to localStorage tokens (for other auth systems)
    const storedToken = localStorage.getItem('auth-token') || 
                       localStorage.getItem('token') ||
                       sessionStorage.getItem('auth-token') ||
                       sessionStorage.getItem('token');
    
    if (storedToken) {
      console.log("Using stored token from localStorage");
      return storedToken;
    }
    
    console.log("No auth token available");
    return null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const token = await getAuthToken(); // AWAIT NOW
    
  const res = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
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
    const token = await getAuthToken(); // AWAIT NOW
    
    const res = await fetch(fullUrl, {
      credentials: "include",
      headers: {
        ...(token && { "Authorization": `Bearer ${token}` }),
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