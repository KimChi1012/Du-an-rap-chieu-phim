export class OfferAPI {
    static async getOffers() {
        try {
            const response = await fetch('../api/offer/get_offers.php');
            return await response.json();
        } catch (error) {
            console.error('Error fetching offers:', error);
            throw error;
        }
    }
}