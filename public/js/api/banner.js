export class BannerAPI {
    static async getBanner() {
        try {
            const response = await fetch('../api/banner/get_banner.php');
            return await response.json();
        } catch (error) {
            console.error('Error fetching banner:', error);
            throw error;
        }
    }
}