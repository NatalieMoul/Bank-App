// CHANGE THIS to match where your Laravel API is running.
export const BASE_URL = 'http://localhost:8000/api/v1';

const TOKEN_KEY = 'admin_auth_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Generic request helper. Attaches the Sanctum bearer token automatically,
 * and normalizes Laravel's error response shape.
 */
export async function apiRequest(path, { method = 'GET', body } = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new Error('Could not reach the server. Check that the API is running and BASE_URL is correct.');
  }

  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    // No JSON body — fine.
  }

  if (!response.ok) {
    let message = data?.message || data?.error || 'Something went wrong.';
    if (data?.errors) {
      const firstField = Object.keys(data.errors)[0];
      if (firstField && data.errors[firstField]?.[0]) {
        message = data.errors[firstField][0];
      }
    }
    if (response.status === 403) {
      message = 'You are not authorized to view this. Admin access required.';
    }
    throw new Error(message);
  }

  return data;
}
