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

    static async getComingSoon() {
        try {
            const response = await fetch('../api/movie/get_coming_soon.php');
            return await response.json();
        } catch (error) {
            console.error('Error fetching coming soon movies:', error);
            throw error;
        }
    }

    static async getMovieDetail(movieId) {
        try {
            const response = await fetch(`../api/movie/get_movie_detail.php?id=${movieId}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching movie detail:', error);
            throw error;
        }
    }

    static async getMoviesByPerson(personId) {
        try {
            const response = await fetch(`../api/movie/get_movies_by_person.php?person_id=${personId}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching movies by person:', error);
            throw error;
        }
    }
}