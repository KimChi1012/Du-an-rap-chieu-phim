import { initVideoModal, openVideoModal } from './video-modal.js';
import { initUserSidebar } from './user-sidebar.js';
import { initDropdown } from './dropdown.js';
import { loadUserInfo } from './user-info.js';
import { getMovieParamFromUrl, createMovieUrl } from './url-utils.js';
import { showNotification } from './notification.js';

class MovieDetail {
    constructor() {
        const params = getMovieParamFromUrl();
        this.movieTitle = params.title;
        this.movieId = params.id;
        this.movieData = null;
        this.init();
    }

    async init() {
        if (!this.movieTitle && !this.movieId) {
            this.showError('Không tìm thấy thông tin phim');
            return;
        }

        try {
            await this.loadHeaderFooter();
            await this.loadMovieData();
            this.setupEventListeners();
            initVideoModal();
        } catch (error) {
            console.error('Lỗi khởi tạo trang:', error);
            this.showError('Có lỗi xảy ra khi tải trang');
        }
    }

    async loadHeaderFooter() {
        try {
            const headerResponse = await fetch('header.html');
            const headerHTML = await headerResponse.text();
            document.getElementById('header').innerHTML = headerHTML;

            const footerResponse = await fetch('footer.html');
            const footerHTML = await footerResponse.text();
            document.getElementById('footer').innerHTML = footerHTML;

            await new Promise(resolve => setTimeout(resolve, 100));

            initUserSidebar();
            initDropdown();
            await loadUserInfo();
        } catch (error) {
            console.error('Lỗi tải header/footer:', error);
        }
    }

    async loadMovieData() {
        try {
            let apiUrl;
            let data;
            
            if (this.movieTitle) {
                apiUrl = `../api/movie/get_movie_detail.php?title=${encodeURIComponent(this.movieTitle)}`;
                console.log('Fetching movie data from:', apiUrl);
                
                const response = await fetch(apiUrl);
                data = await response.json();
                
                console.log('API Response:', data);
                
                if (data.error && this.movieId) {
                    console.log('Title search failed, trying with ID:', this.movieId);
                    apiUrl = `../api/movie/get_movie_detail.php?id=${this.movieId}`;
                    const fallbackResponse = await fetch(apiUrl);
                    data = await fallbackResponse.json();
                    console.log('Fallback API Response:', data);
                }
            } else {
                apiUrl = `../api/movie/get_movie_detail.php?id=${this.movieId}`;
                console.log('Fetching movie data from:', apiUrl);
                const response = await fetch(apiUrl);
                data = await response.json();
                console.log('API Response:', data);
            }

            if (data.error) {
                console.error('API Error:', data.error);
                if (data.debug) {
                    console.log('Debug info:', data.debug);
                }
                this.showError(data.error + (data.debug ? '\n\nDebug: ' + JSON.stringify(data.debug, null, 2) : ''));
                return;
            }

            this.movieData = data;
            if (data.movie && data.movie.MaPhim) {
                this.movieId = data.movie.MaPhim;
            }
            this.renderMovieDetail();
            this.renderShowtimes();
            this.renderRelatedMovies();
        } catch (error) {
            console.error('Lỗi tải dữ liệu phim:', error);
            this.showError('Không thể tải thông tin phim');
        }
    }

    renderMovieDetail() {
        const movie = this.movieData.movie;
        
        document.title = `${movie.TenPhim} - High Cinema`;

        const bannerBg = document.getElementById('movieBanner');
        if (movie.Banner) {
            const cacheBuster = new Date().getTime();
            const bannerUrl = `${movie.Banner}?v=${cacheBuster}`;
            
            bannerBg.style.imageRendering = '-webkit-optimize-contrast';
            bannerBg.style.imageRendering = 'optimize-contrast';
            bannerBg.style.imageRendering = 'crisp-edges';

            const img = new Image();

            img.crossOrigin = 'anonymous';
            
            img.onload = function() {
                console.log(`Banner loaded: ${bannerUrl} (${img.naturalWidth}x${img.naturalHeight})`);

                if (img.naturalWidth < 1920) {
                    console.warn('Banner resolution is low:', img.naturalWidth + 'x' + img.naturalHeight);
                }
                
                bannerBg.style.backgroundImage = `url('${bannerUrl}')`;
                bannerBg.classList.add('loaded');
                
                bannerBg.style.transform = 'translateZ(0)';
            };
            
            img.onerror = function() {
                console.log('Banner failed, trying poster:', movie.Poster);
                if (movie.Poster) {
                    const posterUrl = `${movie.Poster}?v=${cacheBuster}`;
                    const posterImg = new Image();
                    posterImg.onload = function() {
                        console.log(`Poster loaded as fallback: ${posterUrl} (${posterImg.naturalWidth}x${posterImg.naturalHeight})`);
                        bannerBg.style.backgroundImage = `url('${posterUrl}')`;
                        bannerBg.classList.add('loaded');
                    };
                    posterImg.src = posterUrl;
                }
            };
            
            img.src = bannerUrl;
        } else if (movie.Poster) {
            const cacheBuster = new Date().getTime();
            const posterUrl = `${movie.Poster}?v=${cacheBuster}`;
            const img = new Image();
            img.onload = function() {
                console.log(`Poster loaded: ${posterUrl} (${img.naturalWidth}x${img.naturalHeight})`);
                bannerBg.style.backgroundImage = `url('${posterUrl}')`;
                bannerBg.classList.add('loaded');
            };
            img.src = posterUrl;
        }

        const poster = document.getElementById('moviePoster');
        poster.src = movie.Poster || 'images/default-poster.jpg';
        poster.alt = movie.TenPhim;
        
        document.getElementById('movieTitleDetail').textContent = movie.TenPhim;
        document.getElementById('movieDurationDetail').textContent = movie.ThoiLuong || 'N/A';
        document.getElementById('movieReleaseDateDetail').textContent = this.formatDate(movie.NgayKhoiChieu);
        
        const ageElement = document.getElementById('movieAgeDetail');
        if (movie.GioiHanTuoi && movie.GioiHanTuoi.trim() !== '') {
            ageElement.textContent = movie.GioiHanTuoi;
        } else {
            ageElement.textContent = 'Chưa cập nhật';
        }

        const genresDetailContainer = document.getElementById('movieGenresDetail');
        if (movie.TheLoai) {
            const genres = movie.TheLoai.split(',').map(genre => genre.trim());
            genresDetailContainer.innerHTML = genres.map(genre => 
                `<span class="genre-tag">${genre}</span>`
            ).join('');
        }

        document.getElementById('movieDescriptionDetail').textContent = movie.MoTa || 'Chưa có mô tả';

        this.renderClickableNames('movieDirector', movie.DaoDien, 'director');
        this.renderClickableNames('movieActors', movie.DienVien, 'actor');
        document.getElementById('movieLanguage').textContent = movie.NgonNgu || 'Chưa cập nhật';
    }

    renderShowtimes() {
        const showtimes = this.movieData.showtimes || [];
        const allDates = this.generateNext6Days();
        const groupedShowtimes = this.groupShowtimesByDate(showtimes);
        this.setupDatePicker();
        this.renderDateTabs(allDates);
        this.selectedDate = allDates[0];
        
        const datePicker = document.getElementById('datePicker');
        if (datePicker) {
            datePicker.value = this.selectedDate;
        }
        
        this.renderShowtimesForDate(this.selectedDate, groupedShowtimes[this.selectedDate] || []);
    }

    generateNext6Days() {
        const dates = [];
        const today = new Date();
        
        for (let i = 0; i < 6; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date.toISOString().split('T')[0]); 
        }
        
        return dates;
    }

    renderDateTabs(dates) {
        const dateTabsContainer = document.getElementById('dateTabs');
        
        const html = dates.map((date, index) => {
            const dateObj = new Date(date);
            const dayName = this.getDayName(dateObj);
            const dateInfo = this.getDateInfo(dateObj);
            
            return `
                <button class="date-tab ${index === 0 ? 'active' : ''}" data-date="${date}">
                    <span class="day-info">${dayName}</span>
                    <span class="date-info">${dateInfo}</span>
                </button>
            `;
        }).join('');
        
        dateTabsContainer.innerHTML = html;
        
        dateTabsContainer.querySelectorAll('.date-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const selectedDate = e.currentTarget.dataset.date;
                this.selectDate(selectedDate);
            });
        });
    }

    setupDatePicker() {
        const datePicker = document.getElementById('datePicker');
        const datePickerBtn = document.getElementById('datePickerBtn');
        
        if (!datePicker) return;

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        datePicker.min = todayStr;

        const next6Days = this.generateNext6Days();
        if (next6Days.length > 0) {
            datePicker.value = next6Days[0];
        }

        datePicker.addEventListener('change', (e) => {
            const selectedDate = e.target.value;
            if (selectedDate) {
                this.selectCustomDate(selectedDate);
            }
        });

        if (datePickerBtn) {
            datePickerBtn.addEventListener('click', () => {
                if (datePicker.showPicker) {
                    datePicker.showPicker();
                } else {
                    datePicker.focus();
                }
            });
        }
    }

    selectCustomDate(date) {
        console.log('📅 Custom date selected from picker:', date);

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        if (date < todayStr) {
            alert('Không thể chọn ngày trong quá khứ. Vui lòng chọn ngày từ hôm nay trở đi.');
            const datePicker = document.getElementById('datePicker');
            if (datePicker) {
                datePicker.value = todayStr;
            }
            return;
        }
        
        this.selectedDate = date;
        
        document.querySelectorAll('.date-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        const existingTab = document.querySelector(`[data-date="${date}"]`);
        if (existingTab) {
            existingTab.classList.add('active');
        }

        this.loadShowtimesForDate(date);
    }

    async loadShowtimesForDate(date) {
        try {
            console.log('Loading showtimes for date:', date, 'movieId:', this.movieId);

            const response = await fetch(`../api/movie/get_movie_detail.php?id=${this.movieId}&date=${date}`);
            const data = await response.json();
            
            console.log('API response:', data);
            
            if (data.error) {
                console.log('API error:', data.error);
                this.renderShowtimesForDate(date, []);
                return;
            }

            const showtimes = data.showtimes || [];
            console.log('Showtimes found:', showtimes.length);
            this.renderShowtimesForDate(date, showtimes);
        } catch (error) {
            console.error('Error loading showtimes for date:', error);
            this.renderShowtimesForDate(date, []);
        }
    }

    renderShowtimesForDate(date, times) {
        const showtimesContainer = document.getElementById('showtimesContainer');
        
        if (!times || times.length === 0) {
            const html = `
                <div class="showtime-date">
                    <h4>${this.formatShowtimeDate(date)}</h4>
                    <div class="no-showtimes">
                        <p>Không có suất chiếu trong ngày này</p>
                    </div>
                </div>
            `;
            showtimesContainer.innerHTML = html;
            return;
        }
        
        const html = `
            <div class="showtime-date">
                <h4>${this.formatShowtimeDate(date)}</h4>
                <div class="time-slots">
                    ${times.map(time => {
                        const period = this.getTimePeriod(time.GioBatDau);
                        return `
                            <button class="time-slot" data-showtime-id="${time.MaSuatChieu}" data-period="${period}">
                                ${this.formatTime(time.GioBatDau)}
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        showtimesContainer.innerHTML = html;
    }

    selectDate(date) {
        console.log('📅 Selecting date:', date);
        
        document.querySelectorAll('.date-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const selectedTab = document.querySelector(`[data-date="${date}"]`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        this.selectedDate = date;

        const datePicker = document.getElementById('datePicker');
        if (datePicker && datePicker.value !== date) {
            datePicker.value = date;
        }

        const next6Days = this.generateNext6Days();
        if (next6Days.includes(date)) {
            const groupedShowtimes = this.groupShowtimesByDate(this.movieData.showtimes || []);
            this.renderShowtimesForDate(date, groupedShowtimes[date] || []);
        } else {
            this.loadShowtimesForDate(date);
        }
        
        console.log('📅 Date selected and UI updated:', date);
    }

    getDayName(date) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Hôm nay';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Ngày mai';
        } else {
            const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
            return days[date.getDay()];
        }
    }

    getDateInfo(date) {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        return `${day}/${month}`;
    }

    getTimePeriod(timeString) {
        if (!timeString) return 'morning';
        
        const hour = parseInt(timeString.split(':')[0]);
        
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
    }

    renderRelatedMovies() {
        const relatedMovies = this.movieData.relatedMovies;
        const container = document.getElementById('relatedMovies');
        
        if (!relatedMovies || relatedMovies.length === 0) {
            container.innerHTML = '<p>Không có phim liên quan</p>';
            return;
        }

        const html = relatedMovies.map(movie => {
            const movieUrl = createMovieUrl(movie.TenPhim, movie.MaPhim);
            return `
                <div class="related-movie" onclick="window.location.href='${movieUrl}'">
                    <img src="${movie.Poster || 'images/default-poster.jpg'}" alt="${movie.TenPhim}">
                    <div class="related-movie-info">
                        <h5>${movie.TenPhim}</h5>
                        <p class="genre">${movie.TheLoai || ''}</p>
                        <p>${movie.ThoiLuong || 'N/A'} phút</p>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    setupEventListeners() {
        const playTrailerBtn = document.getElementById('playTrailer');
        if (playTrailerBtn) {
            playTrailerBtn.addEventListener('click', () => {
                this.playTrailer();
            });
        }

        const bookTicketBtn = document.querySelector('.book-ticket-btn');
        if (bookTicketBtn) {
            bookTicketBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.bookTicket();
            });
        }

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('time-slot')) {
                this.selectTimeSlot(e.target);
            }
        });

    }

    playTrailer() {
        const movie = this.movieData.movie;
        if (movie.Trailer) {
            openVideoModal(movie.Trailer);
        } else {
            alert('Trailer chưa có sẵn');
        }
    }

    bookTicket() {
        showNotification(
            'Tính năng đặt vé đang được phát triển. Vui lòng quay lại sau!',
            'info'
        );
    }

    selectTimeSlot(slot) {
        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        slot.classList.add('selected');
        this.selectedShowtimeId = slot.dataset.showtimeId;
    }

    groupShowtimesByDate(showtimes) {
        const grouped = {};
        
        showtimes.forEach(showtime => {
            const date = showtime.NgayChieu;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(showtime);
        });
        
        return grouped;
    }

    formatDate(dateString) {
        if (!dateString) return 'Chưa xác định';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatShowtimeDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Hôm nay - ' + this.formatDate(dateString);
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Ngày mai - ' + this.formatDate(dateString);
        } else {
            return this.formatDate(dateString);
        }
    }

    formatTime(timeString) {
        if (!timeString) return '';

        const timeParts = timeString.split(':');
        return `${timeParts[0]}:${timeParts[1]}`;
    }

    renderClickableNames(elementId, namesString, type) {
        const element = document.getElementById(elementId);
        
        if (!namesString || namesString === 'Chưa cập nhật') {
            element.textContent = 'Chưa cập nhật';
            return;
        }
        
        const names = namesString.split(',').map(name => name.trim());
        
        const clickableNames = names.map(name => {
            return `<span class="clickable-name" data-name="${name}" data-type="${type}">${name}</span>`;
        });
        
        element.innerHTML = clickableNames.join(', ');

        element.querySelectorAll('.clickable-name').forEach(nameElement => {
            nameElement.addEventListener('click', (e) => {
                const name = e.target.dataset.name;
                const type = e.target.dataset.type;
                this.showPersonMovies(name, type);
            });
        });
    }

    async showPersonMovies(name, type) {
        try {
            const response = await fetch(`../api/movie/get_movies_by_person.php?name=${encodeURIComponent(name)}&type=${type}`);
            const data = await response.json();
            
            if (data.error) {
                alert('Lỗi: ' + data.error);
                return;
            }
            
            this.showPersonMoviesModal(name, type, data.movies);
        } catch (error) {
            console.error('Lỗi khi tải phim của người này:', error);
            alert('Có lỗi xảy ra khi tải dữ liệu');
        }
    }

    showPersonMoviesModal(name, type, movies) {
        const typeText = type === 'director' ? 'đạo diễn' : 'diễn viên';
        const icon = type === 'director' ? 'fas fa-video' : 'fas fa-user-tie';
        
        const modalHTML = `
            <div id="person-movies-modal" class="person-modal-overlay">
                <div class="person-modal-container">
                    <div class="person-modal-header">
                        <div class="person-modal-title">
                            <i class="${icon}"></i>
                            <div>
                                <h2>${name}</h2>
                                <p>Tất cả phim của ${typeText}</p>
                            </div>
                        </div>
                        <button class="person-modal-close">
                            &times;
                        </button>
                    </div>
                    <div class="person-modal-content">
                        ${movies.length > 0 ? `
                            <div class="person-movies-count">
                                <span>${movies.length} phim được tìm thấy</span>
                            </div>
                            <div class="person-movies-list">
                                ${movies.map(movie => `
                                    <div class="person-movie-item" data-movie-id="${movie.MaPhim}">
                                        <div class="person-movie-poster">
                                            <img src="${movie.Poster || 'images/default-poster.jpg'}" alt="${movie.TenPhim}">
                                        </div>
                                        <div class="person-movie-info">
                                            <h4 class="movie-title">${movie.TenPhim}</h4>
                                            <p class="movie-subtitle">${type === 'director' ? 'Đạo diễn' : 'Diễn viên'}: ${name}</p>
                                            <div class="movie-meta">
                                                ${movie.GioiHanTuoi && movie.GioiHanTuoi.trim() !== '' && movie.GioiHanTuoi.trim() !== 'Mọi lứa tuổi' ? `<span class="age-limit">${movie.GioiHanTuoi}</span>` : ''}
                                                <span class="duration">${movie.ThoiLuong || 'N/A'}p</span>
                                                <span class="genre">${movie.TheLoai || 'Chưa phân loại'}</span>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="person-no-movies">
                                <i class="fas fa-film-slash"></i>
                                <h3>Không tìm thấy phim</h3>
                                <p>Hiện tại chưa có phim nào của ${typeText} ${name} trong hệ thống.</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('person-movies-modal');
        modal.querySelectorAll('.person-movie-item').forEach((item) => {
            item.addEventListener('click', () => {
                const movieId = item.dataset.movieId;
                this.closePersonMoviesModal();
                this.navigateToMovie(movieId);
            });
        });

        const closeBtn = modal.querySelector('.person-modal-close');
        closeBtn.addEventListener('click', () => {
            this.closePersonMoviesModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('person-modal-overlay')) {
                this.closePersonMoviesModal();
            }
        });

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closePersonMoviesModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    closePersonMoviesModal() {
        const modal = document.getElementById('person-movies-modal');
        if (modal) {
            modal.remove();
        }
    }

    async navigateToMovie(movieId) {
        this.closePersonMoviesModal();
        const newUrl = `movie-detail.html?id=${movieId}`;
        
        window.history.replaceState({movieId: movieId}, '', newUrl);
        this.movieId = movieId;
        
        try {
            window.scrollTo(0, 0);
            document.querySelector('.movie-details-section').style.opacity = '0.5';
            await this.loadMovieData();
            document.querySelector('.movie-details-section').style.opacity = '1';
        } catch (error) {
            console.error('Lỗi khi chuyển phim:', error);
            window.location.href = newUrl;
        }
    }

    showError(message) {
        const container = document.querySelector('.movie-detail-content') || document.body;
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: white;">
                <h2>Lỗi</h2>
                <p>${message}</p>
                <button onclick="window.history.back()" style="padding: 1rem 2rem; background: var(--accent-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Quay lại
                </button>
            </div>
        `;
    }
}

export default MovieDetail;