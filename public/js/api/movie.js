export class MovieAPI {
    static async getMovies() {
        try {
            const response = await fetch('../api/movie/get_movies.php');
            const result = await response.json();
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.error || 'Lỗi khi tải danh sách phim');
            }
        } catch (error) {
            console.error('Error fetching movies:', error);
            throw error;
        }
    }

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

    async addMovieAPI(movieData) {
        const formData = new FormData();
        
        // Thêm các field text
        Object.keys(movieData).forEach(key => {
            if (key !== 'Poster' && key !== 'Banner') {
                formData.append(key, movieData[key]);
            }
        });

        // Thêm file uploads
        const posterFile = document.getElementById('Poster').files[0];
        const bannerFile = document.getElementById('Banner').files[0];
        
        if (posterFile) {
            formData.append('Poster', posterFile);
        }
        if (bannerFile) {
            formData.append('Banner', bannerFile);
        }

        console.log('Sending add request with FormData:');
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        const response = await fetch('../api/movie/add_movie.php', {
            method: 'POST',
            body: formData
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('Raw response:', responseText);

        if (!response.ok) {
            console.error('Error response:', responseText);
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
        }

        try {
            const result = JSON.parse(responseText);
            console.log('Add response:', result);
            
            if (!result.success) {
                throw new Error(result.error || 'Unknown error');
            }
            
            return result;
        } catch (jsonError) {
            console.error('JSON parse error:', jsonError);
            console.error('Response was:', responseText);
            throw new Error('Server returned invalid JSON: ' + responseText.substring(0, 200));
        }
    }

    async updateMovieAPI(movieData) {
        const formData = new FormData();
        
        // Thêm các field text
        Object.keys(movieData).forEach(key => {
            if (key !== 'Poster' && key !== 'Banner') {
                formData.append(key, movieData[key]);
            }
        });

        // Thêm file uploads nếu có
        const posterFile = document.getElementById('Poster').files[0];
        const bannerFile = document.getElementById('Banner').files[0];
        
        if (posterFile) {
            formData.append('Poster', posterFile);
        }
        if (bannerFile) {
            formData.append('Banner', bannerFile);
        }

        console.log('Sending update request with FormData:');
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        const response = await fetch('../api/movie/update_movie.php', {
            method: 'POST',
            body: formData
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('Raw response:', responseText);

        if (!response.ok) {
            console.error('Error response:', responseText);
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
        }

        try {
            const result = JSON.parse(responseText);
            console.log('Update response:', result);
            
            if (!result.success) {
                throw new Error(result.error || 'Unknown error');
            }
            
            return result;
        } catch (jsonError) {
            console.error('JSON parse error:', jsonError);
            console.error('Response was:', responseText);
            throw new Error('Server returned invalid JSON: ' + responseText.substring(0, 200));
        }
    }

    async deleteMovieAPI(movieId) {
        try {
            const response = await fetch('../api/movie/delete_movie.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ MaPhim: movieId })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error deleting movie:', error);
            throw error;
        }
    }
}