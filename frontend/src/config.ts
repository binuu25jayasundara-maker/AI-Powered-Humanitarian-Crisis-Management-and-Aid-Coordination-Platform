/**
 * Central API configuration.
 * Every backend base URL is read from Vite env variables (see frontend/.env.example).
 * Values are the SERVER ROOT (no trailing /api); '/api' is appended here once.
 */
const root = (value: string | undefined, fallback: string): string =>
  (value && value.trim() ? value : fallback).replace(/\/+$/, '');

/** Member 1: auth, users, roles, organisations, audit (launchSettings port 5016) */
export const AUTH_API_URL =
  root(import.meta.env.VITE_API_URL as string | undefined, 'http://localhost:5016') + '/api';

/** Member 4: AI services, case review, forecasting (port 5157) */
export const AI_API_URL =
  root(import.meta.env.VITE_AI_API_URL as string | undefined, 'http://localhost:5157') + '/api';

/** Member 5: resources, shelters, map (port 5126) */
export const RESOURCES_API_URL =
  root(import.meta.env.VITE_RESOURCES_API_URL as string | undefined, 'http://localhost:5126') + '/api';

/** Member 6: volunteers, donors, campaigns, notifications (port 5006) */
export const VOLUNTEERS_API_URL =
  root(import.meta.env.VITE_VOLUNTEERS_API_URL as string | undefined, 'http://localhost:5006') + '/api';

/** Core API for citizen requests + coordination (to be built; reserved port 5200) */
export const CORE_API_URL =
  root(import.meta.env.VITE_CORE_API_URL as string | undefined, 'http://localhost:5200') + '/api';
