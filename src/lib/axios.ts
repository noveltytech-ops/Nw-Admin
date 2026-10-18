import axios from 'axios';

export const http = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      'Request failed';
    return Promise.reject(new Error(msg));
  },
);
