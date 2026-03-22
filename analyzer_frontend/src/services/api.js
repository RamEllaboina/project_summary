import axios from 'axios';

const API_BASE_URL = '/api'; // Vite proxy handles this to localhost:3000

export const api = {
    uploadProject: async (files) => {
        const formData = new FormData();
        
        // Handle both single file and array of files
        if (Array.isArray(files)) {
            files.forEach(file => {
                formData.append('project', file);
            });
        } else {
            formData.append('project', files);
        }

        const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getProjectStatus: async (projectId) => {
        const response = await axios.get(`${API_BASE_URL}/status/${projectId}`);
        return response.data;
    },

    getProjectReport: async (projectId) => {
        const response = await axios.get(`${API_BASE_URL}/report/${projectId}`);
        return response.data;
    }
};
