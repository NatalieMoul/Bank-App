import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

function getDevelopmentHost() {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  const host = hostUri?.split(':')[0];

  return host || 'localhost';
}

export const BASE_URL = `http://${getDevelopmentHost()}:8000/api/v1`;

const REQUEST_TIMEOUT_MS = 10000;

const TOKEN_KEY = 'bank_auth_token';

let accountStatusHandler = null;
let deletedAccountHandler = null;
let maintenanceHandler = null;

export function setAccountStatusHandler(handler) {
  accountStatusHandler = handler;
}

export function setDeletedAccountHandler(handler) {
  deletedAccountHandler = handler;
}

export function setMaintenanceHandler(handler) {
  maintenanceHandler = handler;
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

/**
 * Generic request helper.
 * Attaches the Sanctum bearer token automatically
 * if one is stored, and normalizes Laravel's error response shape.
 */
export async function apiRequest(path, { method = 'GET', body } = {}) {
  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (networkError) {
    const message =
      networkError?.name === 'AbortError'
        ? 'The server took too long to respond. Check that the API is running and BASE_URL is correct.'
        : 'Could not reach the server. Check that the API is running and BASE_URL is correct.';

    throw new Error(message);
  } finally {
    clearTimeout(timeout);
  }

  let data = null;

  try {
    data = await response.json();
  } catch (e) {
    // No JSON body, for example 204 No Content.
  }

  if (!response.ok) {
    let message =
      data?.message ||
      data?.error ||
      'Something went wrong. Please try again.';

    if (data?.errors) {
      const firstField = Object.keys(data.errors)[0];

      if (
        firstField &&
        data.errors[firstField]?.[0]
      ) {
        message = data.errors[firstField][0];
      }
    }

    // --------------------------------------------------
    // DELETED USER
    // --------------------------------------------------
    if (
    response.status === 401 &&
    path !== '/auth/login' &&
    token
  ) {
    await clearToken();

    deletedAccountHandler?.();
  }

    // --------------------------------------------------
    // SUSPENDED / BANNED USER
    // --------------------------------------------------
    if (
      response.status === 403 &&
      (
        data?.status === 'suspended' ||
        data?.status === 'banned'
      )
    ) {
      await clearToken();

      accountStatusHandler?.(data.status);
    }

    // --------------------------------------------------
    // MAINTENANCE MODE
    // --------------------------------------------------
    if (
      response.status === 503 &&
      data?.maintenance
    ) {
      maintenanceHandler?.(message);
    }

    const error = new Error(message);

    error.code = data?.code;
    error.accountStatus = data?.status;
    error.status = response.status;
    error.maintenance = !!data?.maintenance;

    throw error;
  }

  return data;
}