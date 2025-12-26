import { showNotification } from './notification.js';

export class TermsOfUseManager {
    constructor() {
        this.leftPosters = [];
        this.rightPosters = [];
        this.leftCurrentIndex = 0;
        this.rightCurrentIndex = 0;
        this.leftInterval = null;
        this.rightInterval = null;
        this.readingProgressBar = null;
        this.notificationShown = false;
    }

    async init() {
        console.log('📋 Khởi tạo Terms of Use Manager');
        await this.loadPosters();
        this.startPosterRotation();
        this.initReadingProgress();
    }

    initReadingProgress() {
        this.readingProgressBar = document.querySelector('.reading-progress-fill');
        
        if (!this.readingProgressBar) {
            console.warn('❌ Không tìm thấy thanh tiến trình đọc');
            return;
        }

        this.handleScroll = this.updateReadingProgress.bind(this);

        window.addEventListener('scroll', this.handleScroll);

        console.log('✅ Đã khởi tạo thanh tiến trình đọc');
    }

    updateReadingProgress() {
        const termsWrapper = document.querySelector('.terms-wrapper');
        if (!termsWrapper || !this.readingProgressBar) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.min(Math.max((scrollTop / docHeight) * 100, 0), 100);

        this.readingProgressBar.style.width = scrollPercent + '%';

        if (scrollPercent >= 70 && !this.notificationShown) {
            this.showTermsNotification();
            this.notificationShown = true;

            setTimeout(() => {
                this.notificationShown = false;
            }, 10000);
        }
    }

    showTermsNotification() {
        const message = `
            <strong>Điều khoản sử dụng</strong><br>
            Việc tiếp tục sử dụng website đồng nghĩa với việc bạn đồng ý với điều khoản sử dụng và chính sách bảo mật của chúng tôi.
        `;
        
        showNotification(message, 'info', 8000);
        console.log('📢 Hiển thị notification điều khoản sử dụng');
    }

    async loadPosters() {
        try {
            console.log('🎬 Đang load posters từ API...');
            
            const [nowShowingResponse, comingSoonResponse] = await Promise.all([
                fetch('api/movie/get_now_showing.php'),
                fetch('api/movie/get_coming_soon.php')
            ]);

            const nowShowingMovies = nowShowingResponse.ok ? await nowShowingResponse.json() : [];
            const comingSoonMovies = comingSoonResponse.ok ? await comingSoonResponse.json() : [];
            
            console.log('📽️ Phim đang chiếu:', nowShowingMovies.length);
            console.log('🎭 Phim sắp chiếu:', comingSoonMovies.length);

            this.leftPosters = this.preparePosters(nowShowingMovies, 'left');
            this.rightPosters = this.preparePosters(comingSoonMovies, 'right');
            
            this.createPosterContainers();
            
            console.log('✅ Đã tạo xong các poster containers');
            
        } catch (error) {
            console.error('❌ Lỗi khi load posters:', error);
            this.createFallbackPosters();
        }
    }

    preparePosters(movies, side) {
        if (!movies || movies.length === 0) {
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
        const leftContainer = document.getElementById('left-poster-container');
        if (leftContainer && this.leftPosters.length > 0) {
            const leftHTML = this.leftPosters.map((poster, index) => 
                `<img src="${poster.src}" alt="${poster.title}" title="${poster.title}" 
                     class="${index === 0 ? 'active' : ''}" loading="lazy">`
            ).join('');
            leftContainer.innerHTML = leftHTML;
        }

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
        if (this.leftPosters.length > 1) {
            this.leftInterval = setInterval(() => {
                this.rotatePoster('left');
            }, 4500);
        }

        if (this.rightPosters.length > 1) {
            this.rightInterval = setInterval(() => {
                this.rotatePoster('right');
            }, 5500);
        }
    }

    rotatePoster(side) {
        const container = document.getElementById(`${side}-poster-container`);
        if (!container) return;

        const images = container.querySelectorAll('img');
        if (images.length <= 1) return;

        if (side === 'left') {
            images[this.leftCurrentIndex].classList.remove('active');
            
            this.leftCurrentIndex = (this.leftCurrentIndex + 1) % this.leftPosters.length;

            images[this.leftCurrentIndex].classList.add('active');
        } else {
            images[this.rightCurrentIndex].classList.remove('active');

            this.rightCurrentIndex = (this.rightCurrentIndex + 1) % this.rightPosters.length;

            images[this.rightCurrentIndex].classList.add('active');
        }
    }

    destroy() {
        if (this.leftInterval) {
            clearInterval(this.leftInterval);
            this.leftInterval = null;
        }
        
        if (this.rightInterval) {
            clearInterval(this.rightInterval);
            this.rightInterval = null;
        }

        if (this.handleScroll) {
            window.removeEventListener('scroll', this.handleScroll);
        }
        
        console.log('🧹 Đã dọn dẹp Terms of Use Manager');
    }
}

export function initTermsOfUse() {
    const manager = new TermsOfUseManager();
    manager.init();
    
    window.termsOfUseManager = manager;
    
    return manager;
}