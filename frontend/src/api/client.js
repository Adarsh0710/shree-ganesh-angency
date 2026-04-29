// import axios from 'axios';

// const api = axios.create({
//   baseURL: '/api',
//   headers: { 'Content-Type': 'application/json' },
// });

// api.interceptors.request.use((config) => {
//   const t = localStorage.getItem('token');
//   if (t) config.headers.Authorization = `Bearer ${t}`;
//   return config;
// });

// export default api;


import axios from 'axios';

// detect local vs production
const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const api = axios.create({
  baseURL: isLocal
    ? '/api'
    : 'https://shree-ganesh-angency.onrender.com/api',
  withCredentials: true,
});

// attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
