import { showNotification } from '../modules/notification.js';

export class OfferAPI {
    static async getOffers() {
        try {
            const response = await fetch('../api/offer/get_offers.php');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            return data;
        } catch (error) {
            console.error('Error fetching offers:', error);
            throw error;
        }
    }

    static async addOffer(offerData) {
        try {
            const formData = new FormData();
            Object.keys(offerData).forEach(key => {
                if (offerData[key] !== null && offerData[key] !== undefined) {
                    formData.append(key, offerData[key]);
                }
            });

            const response = await fetch('../api/offer/add_offer.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            showNotification('Thêm ưu đãi thành công!', 'success');
            return result;
        } catch (error) {
            console.error('Error adding offer:', error);
            showNotification('Lỗi khi thêm ưu đãi: ' + error.message, 'error');
            throw error;
        }
    }

    static async updateOffer(offerData) {
        try {
            const formData = new FormData();
            Object.keys(offerData).forEach(key => {
                if (offerData[key] !== null && offerData[key] !== undefined) {
                    formData.append(key, offerData[key]);
                }
            });

            const response = await fetch('../api/offer/update_offer.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            showNotification('Cập nhật ưu đãi thành công!', 'success');
            return result;
        } catch (error) {
            console.error('Error updating offer:', error);
            showNotification('Lỗi khi cập nhật ưu đãi: ' + error.message, 'error');
            throw error;
        }
    }

    static async deleteOffer(maUD) {
        try {
            const response = await fetch('../api/offer/delete_offer.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ MaUD: maUD })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Có lỗi xảy ra khi xóa ưu đãi');
            }
            
            showNotification('Xóa ưu đãi thành công!', 'success');
            return result;
        } catch (error) {
            console.error('Error deleting offer:', error);
            showNotification('Lỗi khi xóa ưu đãi: ' + error.message, 'error');
            throw error;
        }
    }
}