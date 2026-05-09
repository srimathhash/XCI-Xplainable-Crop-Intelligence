import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000
});

export const checkHealth = async () => {
    try {
        const response = await api.get('/health');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getWeather = async (city) => {
    try {
        const response = await api.get(`/weather/${city}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};
