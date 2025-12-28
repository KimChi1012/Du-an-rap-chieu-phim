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
}