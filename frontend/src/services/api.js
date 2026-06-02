import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('miniSocialAuth');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      localStorage.removeItem('miniSocialAuth');
    }
  }
  return config;
});

// Follow system
export const followUser = (username) => api.post(`/users/${username}/follow`);
export const unfollowUser = (username) => api.delete(`/users/${username}/follow`);
export const getFollowers = (username) => api.get(`/users/${username}/followers`);
export const getFollowing = (username) => api.get(`/users/${username}/following`);

export default api;
