import { showNotification } from '../modules/notification.js';

export class BannerAPI {
    constructor() {
        this.baseURL = '../api/banner';
    }

    static async getBanner() {
        try {
            const response = await fetch('../api/banner/get_banner.php');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching banner:', error);
            throw error;
        }
    }

    async getBanners() {
        try {
            const response = await fetch(`${this.baseURL}/get_banner.php`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching banners:', error);
            showNotification('Không thể tải danh sách banner: ' + error.message, 'error');
            throw error;
        }
    }
}

export default BannerAPI;