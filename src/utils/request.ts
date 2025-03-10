import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

instance.interceptors.request.use(
  config => {
    // 这里可以添加 token 逻辑
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    console.error('API request fail:', error);
    return Promise.reject(error);
  }
);

export default instance;
