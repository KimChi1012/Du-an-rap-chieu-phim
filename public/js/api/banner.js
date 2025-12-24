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

    async getNewMaQC() {
        try {
            const response = await fetch(`${this.baseURL}/get_new_maqc.php`);
            const data = await response.json();

            if (data.success && data.MaQC) {
                return data.MaQC;
            } else {
                throw new Error(data.error || 'Lỗi không xác định');
            }
        } catch (error) {
            console.error('Lỗi getNewMaQC:', error);
            showNotification('Không lấy được mã quảng cáo: ' + error.message, 'error');
            throw error;
        }
    }

    async addBanner(formData) {
        try {
            const response = await fetch(`${this.baseURL}/add_banner.php`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Có lỗi xảy ra khi thêm banner');
            }

            showNotification('Thêm banner thành công!', 'success');
            return data;
        } catch (error) {
            console.error('Lỗi addBanner:', error);
            showNotification('Lỗi khi thêm banner: ' + error.message, 'error');
            throw error;
        }
    }

    async updateBanner(formData) {
        try {
            const response = await fetch(`${this.baseURL}/update_banner.php`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Có lỗi xảy ra khi cập nhật banner');
            }

            showNotification('Cập nhật banner thành công!', 'success');
            return data;
        } catch (error) {
            console.error('Lỗi updateBanner:', error);
            showNotification('Lỗi khi cập nhật banner: ' + error.message, 'error');
            throw error;
        }
    }

    async deleteBanner(maQC) {
        try {
            const response = await fetch(`${this.baseURL}/delete_banner.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ MaQC: maQC })
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Có lỗi xảy ra khi xóa banner');
            }

            showNotification('Xóa banner thành công!', 'success');
            return data;
        } catch (error) {
            console.error('Lỗi deleteBanner:', error);
            showNotification('Lỗi khi xóa banner: ' + error.message, 'error');
            throw error;
        }
    }
}

export default BannerAPI;