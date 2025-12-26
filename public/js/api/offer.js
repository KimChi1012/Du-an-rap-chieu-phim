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
}