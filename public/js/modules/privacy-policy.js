// Module cho trang Privacy Policy
export class PrivacyPolicyManager {
    constructor() {
        this.leftPosters = [];
        this.rightPosters = [];
        this.leftCurrentIndex = 0;
        this.rightCurrentIndex = 0;
        this.leftInterval = null;
        this.rightInterval = null;
    }

    async init() {
        console.log('🔒 Khởi tạo Privacy Policy Manager');
        await this.loadPosters();
        this.startPosterRotation();
    }

    async loadPosters() {
        try {
            console.log('🎬 Đang load posters từ API...');
            
            // Load phim đang chiếu và sắp chiếu
            const [nowShowingResponse, comingSoonResponse] = await Promise.all([
                fetch('api/movie/get_now_showing.php'),
                fetch('api/movie/get_coming_soon.php')
            ]);

            const nowShowingMovies = nowShowingResponse.ok ? await nowShowingResponse.json() : [];
            const comingSoonMovies = comingSoonResponse.ok ? await comingSoonResponse.json() : [];
            
            console.log('📽️ Phim đang chiếu:', nowShowingMovies.length);
            console.log('🎭 Phim sắp chiếu:', comingSoonMovies.length);

            // Chuẩn bị dữ liệu poster
            this.leftPosters = this.preparePosters(nowShowingMovies, 'left');
            this.rightPosters = this.preparePosters(comingSoonMovies, 'right');
            
            // Tạo HTML cho poster containers
            this.createPosterContainers();
            
            console.log('✅ Đã tạo xong các poster containers');
            
        } catch (error) {
            console.error('❌ Lỗi khi load posters:', error);
            this.createFallbackPosters();
        }
    }

    preparePosters(movies, side) {
        if (!movies || movies.length === 0) {
            // Fallback posters
            const fallbackPosters = side === 'left' 
                ? ['images/poster1.jpg', 'images/poster2.jpg', 'images/poster3.jpg', 'images/poster8.jpg', 'images/poster9.jpg']
                : ['images/poster4.jpg', 'images/poster5.jpg', 'images/poster7.jpg', 'images/poster11.jpg', 'images/poster12.jpg'];
            
            return fallbackPosters.map(poster => ({
                src: poster,
                title: 'Movie Poster'
            }));
        }

        return movies.map(movie => ({
            src: movie.HinhAnh || 'images/poster1.jpg',
            title: movie.TenPhim || 'Phim'
        }));
    }

    createPosterContainers() {
        // Tạo poster cho dải trái
        const leftContainer = document.getElementById('left-poster-container');
        if (leftContainer && this.leftPosters.length > 0) {
            const leftHTML = this.leftPosters.map((poster, index) => 
                `<img src="${poster.src}" alt="${poster.title}" title="${poster.title}" 
                     class="${index === 0 ? 'active' : ''}" loading="lazy">`
            ).join('');
            leftContainer.innerHTML = leftHTML;
        }
        
        // Tạo poster cho dải phải
        const rightContainer = document.getElementById('right-poster-container');
        if (rightContainer && this.rightPosters.length > 0) {
            const rightHTML = this.rightPosters.map((poster, index) => 
                `<img src="${poster.src}" alt="${poster.title}" title="${poster.title}" 
                     class="${index === 0 ? 'active' : ''}" loading="lazy">`
            ).join('');
            rightContainer.innerHTML = rightHTML;
        }
    }

    createFallbackPosters() {
        console.log('🔄 Tạo poster fallback...');
        
        this.leftPosters = [
            { src: 'images/poster1.jpg', title: 'Movie 1' },
            { src: 'images/poster2.jpg', title: 'Movie 2' },
            { src: 'images/poster3.jpg', title: 'Movie 3' },
            { src: 'images/poster8.jpg', title: 'Movie 8' },
            { src: 'images/poster9.jpg', title: 'Movie 9' }
        ];
        
        this.rightPosters = [
            { src: 'images/poster4.jpg', title: 'Movie 4' },
            { src: 'images/poster5.jpg', title: 'Movie 5' },
            { src: 'images/poster7.jpg', title: 'Movie 7' },
            { src: 'images/poster11.jpg', title: 'Movie 11' },
            { src: 'images/poster12.jpg', title: 'Movie 12' }
        ];
        
        this.createPosterContainers();
    }

    startPosterRotation() {
        // Dải trái: chuyển poster mỗi 4 giây
        if (this.leftPosters.length > 1) {
            this.leftInterval = setInterval(() => {
                this.rotatePoster('left');
            }, 4000);
        }
        
        // Dải phải: chuyển poster mỗi 5 giây (khác nhịp với dải trái)
        if (this.rightPosters.length > 1) {
            this.rightInterval = setInterval(() => {
                this.rotatePoster('right');
            }, 5000);
        }
    }

    rotatePoster(side) {
        const container = document.getElementById(`${side}-poster-container`);
        if (!container) return;

        const images = container.querySelectorAll('img');
        if (images.length <= 1) return;

        if (side === 'left') {
            // Ẩn poster hiện tại
            images[this.leftCurrentIndex].classList.remove('active');
            
            // Chuyển sang poster tiếp theo
            this.leftCurrentIndex = (this.leftCurrentIndex + 1) % this.leftPosters.length;
            
            // Hiện poster mới
            images[this.leftCurrentIndex].classList.add('active');
        } else {
            // Ẩn poster hiện tại
            images[this.rightCurrentIndex].classList.remove('active');
            
            // Chuyển sang poster tiếp theo
            this.rightCurrentIndex = (this.rightCurrentIndex + 1) % this.rightPosters.length;
            
            // Hiện poster mới
            images[this.rightCurrentIndex].classList.add('active');
        }
    }

    destroy() {
        // Dọn dẹp intervals khi rời khỏi trang
        if (this.leftInterval) {
            clearInterval(this.leftInterval);
            this.leftInterval = null;
        }
        
        if (this.rightInterval) {
            clearInterval(this.rightInterval);
            this.rightInterval = null;
        }
        
        console.log('🧹 Đã dọn dẹp Privacy Policy Manager');
    }
}

// Export function để sử dụng trong script.js
export function initPrivacyPolicy() {
    const manager = new PrivacyPolicyManager();
    manager.init();
    
    // Lưu reference để có thể destroy sau này
    window.privacyPolicyManager = manager;
    
    return manager;
}