export class BannerAPI {
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
}