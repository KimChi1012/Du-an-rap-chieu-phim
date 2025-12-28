import { showNotification, initNotification } from '../modules/notification.js';

export class ServiceAPI {
    static async getServices() {
        try {
            const response = await fetch('../api/service/get_service.php');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching services:', error);
            throw error;
        }
    }

    static async addService(serviceData) {
        const formData = new FormData();
        Object.keys(serviceData).forEach(key => {
            formData.append(key, serviceData[key]);
        });

        const response = await fetch('../api/service/add_service.php', {
            method: 'POST',
            body: formData
        });

        return await response.json();
    }

    static async updateService(serviceData) {
        const formData = new FormData();
        Object.keys(serviceData).forEach(key => {
            formData.append(key, serviceData[key]);
        });

        const response = await fetch('../api/service/update_service.php', {
            method: 'POST',
            body: formData
        });

        return await response.json();
    }

    static async deleteService(maDV) {
        try {
            const response = await fetch('../api/service/delete_service.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ MaDV: maDV })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error deleting service:', error);
            throw error;
        }
    }
}