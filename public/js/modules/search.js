export class SearchSystem {
    constructor() {
        this.searchForm = document.getElementById('hc-search-form');
        this.resultsContainer = document.getElementById('hc-search-results-container');
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        if (this.searchForm) {
            this.searchForm.addEventListener('submit', (e) => this.handleSearch(e));

            const resetBtn = this.searchForm.querySelector('.hc-search-btn-reset');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => this.resetForm());
            }

            const inputs = this.searchForm.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('change', () => this.debounceSearch());
            });
        }

        this.checkUrlParams();
    }
    
    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const hasParams = Array.from(urlParams.keys()).length > 0;
        
        if (hasParams) {
            this.fillFormFromUrl(urlParams);
            this.performSearch(urlParams);
        } else {
            console.log('🔍 Loading all movies...');
            this.performSearch(new URLSearchParams());
        }
    }
    
    fillFormFromUrl(urlParams) {
        urlParams.forEach((value, key) => {
            const input = this.searchForm.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = value;
            }
        });
    }
    
    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.handleSearch(null, true);
        }, 500);
    }
    
    async handleSearch(e, isAutoSearch = false) {
        if (e) {
            e.preventDefault();
        }
        
        if (this.isLoading) return;
        
        const formData = new FormData(this.searchForm);
        const searchParams = new URLSearchParams();
        
        for (let [key, value] of formData.entries()) {
            if (value.trim() !== '') {
                searchParams.append(key, value.trim());
            }
        }

        if (!isAutoSearch) {
            const newUrl = searchParams.toString() ? 
                `${window.location.pathname}?${searchParams.toString()}` : 
                window.location.pathname;
            window.history.pushState({}, '', newUrl);
        }
        
        await this.performSearch(searchParams);
    }
    
    async performSearch(searchParams) {
        this.isLoading = true;
        this.showLoading();
        
        try {
            const url = `../api/movie/search_movies.php?${searchParams.toString()}`;
            console.log('🔍 Search URL:', url);
            
            const response = await fetch(url);
            console.log('📡 Response status:', response.status);
            
            const data = await response.json();
            console.log('📊 Response data:', data);
            
            if (data.success) {
                this.displayResults(data.data, searchParams);
            } else {
                this.showError(data.message || 'Có lỗi xảy ra khi tìm kiếm');
            }
        } catch (error) {
            console.error('❌ Search error:', error);
            this.showError('Không thể kết nối đến server');
        } finally {
            this.isLoading = false;
        }
    }
    
    showLoading() {
        this.resultsContainer.innerHTML = `
            <div class="hc-search-loading-container">
                <div class="hc-search-loading-spinner"></div>
                <p>Đang tìm kiếm...</p>
            </div>
        `;
    }
    
    showError(message) {
        this.resultsContainer.innerHTML = `
            <div class="hc-search-error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
    
    displayResults(movies, searchParams) {
        if (movies.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="hc-search-no-results">
                    <i class="fas fa-search"></i>
                    <h3>Không tìm thấy phim nào</h3>
                    <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                </div>
            `;
            return;
        }
        
        const resultsHtml = `
            <div class="hc-search-results-header">
                <h3>Kết quả tìm kiếm (${movies.length} phim)</h3>
                <div class="hc-search-summary">
                    ${this.generateSearchSummary(searchParams)}
                </div>
            </div>
            <div class="hc-search-movies-grid">
                ${movies.map(movie => this.createMovieCard(movie)).join('')}
            </div>
        `;
        
        this.resultsContainer.innerHTML = resultsHtml;

        this.addMovieCardListeners();
    }
    
    generateSearchSummary(searchParams) {
        const summaryParts = [];
        
        for (let [key, value] of searchParams.entries()) {
            switch (key) {
                case 'title':
                    summaryParts.push(`Tên phim: "${value}"`);
                    break;
                case 'director':
                    summaryParts.push(`Đạo diễn: "${value}"`);
                    break;
                case 'actor':
                    summaryParts.push(`Diễn viên: "${value}"`);
                    break;
                case 'genre':
                    summaryParts.push(`Thể loại: ${this.getGenreLabel(value)}`);
                    break;
                case 'year_from':
                    summaryParts.push(`Từ năm: ${value}`);
                    break;
                case 'year_to':
                    summaryParts.push(`Đến năm: ${value}`);
                    break;
                case 'rating':
                    summaryParts.push(`Độ tuổi: ${value}`);
                    break;
                case 'format':
                    summaryParts.push(`Định dạng: ${value}`);
                    break;
                case 'language':
                    summaryParts.push(`Ngôn ngữ: ${this.getLanguageLabel(value)}`);
                    break;
            }
        }
        
        return summaryParts.length > 0 ? summaryParts.join(' • ') : 'Tất cả phim';
    }
    
    getGenreLabel(value) {
        const genres = {
            'Action': 'Hành động',
            'Comedy': 'Hài',
            'Drama': 'Drama',
            'Horror': 'Kinh dị',
            'Sci-fi': 'Khoa học viễn tưởng',
            'Romantic': 'Lãng mạn',
            'Animation': 'Hoạt hình'
        };
        return genres[value] || value;
    }
    
    getLanguageLabel(value) {
        const languages = {
            'Phụ đề': 'Phụ đề',
            'Lồng tiếng': 'Lồng tiếng',
            'Phụ đề/Lồng tiếng': 'Phụ đề/Lồng tiếng'
        };
        return languages[value] || value;
    }
    
    createMovieCard(movie) {
        const releaseDate = movie.NgayKhoiChieu ? 
            new Date(movie.NgayKhoiChieu).toLocaleDateString('vi-VN') : 'Chưa xác định';
        
        const statusClass = this.getStatusClass(movie.TrangThai);
        const duration = movie.ThoiLuong ? `${movie.ThoiLuong} phút` : '';
        const director = movie.DaoDien || 'Chưa cập nhật';
        const rating = movie.GioiHanTuoi || 'Chưa phân loại';
        
        return `
            <div class="hc-search-movie-card" data-movie-id="${movie.MaPhim}" data-movie-status="${movie.TrangThai}">
                <div class="hc-search-movie-poster">
                    <img src="${movie.Poster}" alt="${movie.TenPhim}" loading="lazy" onerror="this.src='images/default-poster.svg'">
                    <div class="hc-search-movie-overlay">
                        <div class="hc-search-movie-actions">
                            <button class="hc-search-btn-info" title="Chi tiết">
                                <i class="fas fa-info-circle"></i> Chi tiết
                            </button>
                            <button class="hc-search-btn-book" title="Đặt vé" data-movie-status="${movie.TrangThai}">
                                <i class="fas fa-ticket-alt"></i> Đặt vé
                            </button>
                        </div>
                    </div>
                    <div class="hc-search-movie-status ${statusClass}">
                        ${movie.TrangThai}
                    </div>
                </div>
                <div class="hc-search-movie-info">
                    <h4 class="hc-search-movie-title" data-movie-id="${movie.MaPhim}" title="${movie.TenPhim}">${movie.TenPhim}</h4>
                    <div class="hc-search-movie-details">
                        ${movie.TheLoai ? `<span>${movie.TheLoai}</span>` : ''}
                        ${duration ? `<span>${duration}</span>` : ''}
                        ${movie.DinhDang ? `<span>${movie.DinhDang}</span>` : ''}
                    </div>
                    <div class="hc-search-movie-meta">
                        <p class="hc-search-movie-director">
                            <i class="fas fa-user-tie"></i>
                            ${director}
                        </p>
                        <p class="hc-search-movie-release">
                            <i class="fas fa-calendar"></i>
                            ${releaseDate}
                        </p>
                        <p class="hc-search-movie-rating">
                            <i class="fas fa-users"></i>
                            ${rating}
                        </p>
                    </div>
                    <p class="hc-search-movie-description" title="${movie.MoTa || ''}">${this.truncateText(movie.MoTa, 120)}</p>
                </div>
            </div>
        `;
    }
    
    getStatusClass(status) {
        switch (status) {
            case 'Phim đang chiếu':
                return 'hc-search-status-now-showing';
            case 'Phim sắp chiếu':
                return 'hc-search-status-coming-soon';
            case 'Phim đã chiếu':
                return 'hc-search-status-ended';
            default:
                return '';
        }
    }
    
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
    
    addMovieCardListeners() {
        document.querySelectorAll('.hc-search-movie-card .hc-search-movie-title').forEach(title => {
            title.addEventListener('click', (e) => {
                e.stopPropagation();
                const movieId = title.dataset.movieId;
                console.log('🎬 Title clicked, navigating to movie detail:', movieId);
                window.location.href = `movie-detail.html?id=${movieId}`;
            });
        });
        
        document.querySelectorAll('.hc-search-movie-card .hc-search-btn-info').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const movieCard = btn.closest('.hc-search-movie-card');
                const movieId = movieCard.dataset.movieId;
                console.log('🎬 Navigating to movie detail:', movieId);
                window.location.href = `movie-detail.html?id=${movieId}`;
            });
        });

        document.querySelectorAll('.hc-search-movie-card .hc-search-btn-book').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const movieCard = btn.closest('.hc-search-movie-card');
                const movieId = movieCard.dataset.movieId;
                const movieStatus = btn.dataset.movieStatus;

                if (movieStatus === 'Phim đang chiếu') {
                    console.log('🎫 Navigating to booking:', movieId);
                    window.location.href = `booking.html?id=${movieId}`;
                } else if (movieStatus === 'Phim sắp chiếu') {
                    if (window.showNotification) {
                        window.showNotification('Phim này chưa được khởi chiếu. Vui lòng quay lại sau khi phim được công chiếu!', 'warning', 4000);
                    } else {
                        alert('Phim này chưa được khởi chiếu. Vui lòng quay lại sau khi phim được công chiếu!');
                    }
                } else if (movieStatus === 'Phim đã chiếu') {
                    if (window.showNotification) {
                        window.showNotification('Phim này đã kết thúc lịch chiếu. Không thể đặt vé!', 'error', 4000);
                    } else {
                        alert('Phim này đã kết thúc lịch chiếu. Không thể đặt vé!');
                    }
                } else {
                    if (window.showNotification) {
                        window.showNotification('Không thể xác định trạng thái phim. Vui lòng thử lại sau!', 'error', 4000);
                    } else {
                        alert('Không thể xác định trạng thái phim. Vui lòng thử lại sau!');
                    }
                }
            });
        });

        document.querySelectorAll('.hc-search-movie-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.hc-search-btn-info, .hc-search-btn-book, .hc-search-movie-title')) {
                    return;
                }
                
                const movieId = card.dataset.movieId;
                console.log('🎬 Card clicked, navigating to movie detail:', movieId);
                window.location.href = `movie-detail.html?id=${movieId}`;
            });
        });
    }
    
    resetForm() {
        this.searchForm.reset();
        this.resultsContainer.innerHTML = '';

        window.history.pushState({}, '', window.location.pathname);
    }
}

export default SearchSystem;