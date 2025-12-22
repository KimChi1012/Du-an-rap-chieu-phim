export class MovieAPI {
    static async getNowShowing() {
        try {
            const response = await fetch('../api/movie/get_now_showing.php');
            return await response.json();
        } catch (error) {
            console.error('Error fetching now showing movies:', error);
            throw error;
        }
    }
}