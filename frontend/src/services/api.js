import axios from 'axios';
import { getUserId } from '../utils/userId';

/**
 * Axios API Instance
 *
 * We create a custom axios instance instead of using the global 'axios' object.
 * This gives us a centralized place to configure the Base URL and headers.
 */
const api = axios.create({
  // Vite exposes env variables using import.meta.env
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000, // Abort requests that take longer than 10 seconds
});

/**
 * Request Interceptor
 *
 * This function runs automatically right before EVERY request is sent out.
 * We use it to seamlessly inject the anonymous user ID into the headers.
 * React components don't even need to know this is happening!
 */
api.interceptors.request.use((config) => {
  // Attach the anonymous user ID to every request
  config.headers['x-user-id'] = getUserId();
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
