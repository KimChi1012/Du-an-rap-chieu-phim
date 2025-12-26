import GetShowtimes from './showtimes.js';

class BookingSystem {
    isUserProfileComplete(user) {
        if (!user) return false;

        const requiredFields = ['HoTen', 'Email', 'SoDT', 'NgaySinh', 'ThanhPho'];

        return requiredFields.every(field => {
            const value = user[field];
            return value !== null && value !== undefined && String(value).trim() !== '';
        });
    }

    showUserModal({ title, message, confirmText, onConfirm }) {
        const modal = document.getElementById('userModal');
        const titleEl = document.getElementById('modalTitle');
        const msgEl = document.getElementById('modalMessage');
        const confirmBtn = document.getElementById('modalConfirm');
        const cancelBtn = document.getElementById('modalCancel');

        titleEl.textContent = title;
        msgEl.textContent = message;
        confirmBtn.textContent = confirmText || 'Tiếp tục';

        modal.classList.remove('hidden');

        const close = () => modal.classList.add('hidden');

        cancelBtn.onclick = close;
        confirmBtn.onclick = () => {
            close();
            onConfirm && onConfirm();
        };
    }

    calculateAge(birthDate) {
        const dob = new Date(birthDate);
        const today = new Date();

        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        return age;
    }

    getMovieAgeLimit(movie) {
        if (!movie || !movie.GioiHanTuoi) return 0;

        const limit = movie.GioiHanTuoi.toUpperCase();

        if (limit === 'P' || limit === 'K') return 0;

        const match = limit.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }

    isUserOldEnough(user, movie) {
        if (!user?.NgaySinh) return false;

        const userAge = this.calculateAge(user.NgaySinh);
        const movieLimit = this.getMovieAgeLimit(movie);

        console.log('👤 Tuổi người dùng:', userAge);
        console.log('🎬 Giới hạn phim:', movieLimit);

        return userAge >= movieLimit;
    }

    constructor() {
        this.selectedMovie = null;
        this.selectedShowtime = null;
        this.currentUser = null;
        this.getShowtimes = null;
        
        this.init();
    }

    async init() {
        console.log('🎬 Initializing Booking System...');
        
        try {
            await this.loadBookingComponents();
            
            await this.checkUserLogin();
            
            await this.loadMovieFromURL();
            
            this.setupEventListeners();

            this.setupPageExitHandler();
            
            console.log('✅ Booking System initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing booking system:', error);
        }
    }

    async loadBookingComponents() {
        try {
            console.log('Loading booking components...');

            await this.includeHTML("booking-steps", "booking-steps.html");
            await this.includeHTML("booking-summary", "booking-summary.html");
            
            console.log('Booking components loaded successfully');
        } catch (error) {
            console.error('Error loading booking components:', error);
        }
    }

    async includeHTML(id, file) {
        const element = document.getElementById(id);
        if (element) {
            try {
                const response = await fetch(file);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const content = await response.text();
                element.innerHTML = content;
            } catch (error) {
                console.error(`Error loading ${file}:`, error);
            }
        }
    }

    async checkUserLogin() {
        try {
            console.log('Checking user login...');

            const response = await fetch('../api/user/get_user_info.php');
            const data = await response.json();

            if (data.success && data.user) {
                this.currentUser = data.user;
                console.log('✅ User logged in:', data.user.TenDN);
                return true;
            } else {
                this.currentUser = null;
                return false;
            }
        } catch (error) {
            console.error('Error checking user login:', error);
            alert('Không thể kiểm tra trạng thái đăng nhập!');
            return false;
        }
    }

    async loadMovieFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('movie') || urlParams.get('id');
        
        console.log('🔍 URL Analysis:');
        console.log('  Movie ID:', movieId);
        
        if (!movieId) {
            console.error('❌ No movie ID in URL');
            
            if (confirm('Không tìm thấy movie ID trong URL.\n\nClick OK để về trang chủ.')) {
                window.location.href = 'index.html';
            }
            return;
        }
        
        await this.loadMovieDetails(movieId);
    }

    async loadMovieDetails(movieId) {
        try {
            console.log('🎬 Loading movie details for:', movieId);
            
            const response = await fetch(`../api/movie/get_movie_detail.php?id=${movieId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            if (data.movie) {
                this.selectedMovie = data.movie;
                this.updateMovieDisplay();
                await this.initShowtimes(movieId);
            } else {
                console.warn('⚠️ No movie data, using fallback');
                this.selectedMovie = {
                    TenPhim: `Test Movie ${movieId}`,
                    Poster: 'https://via.placeholder.com/300x450?text=Test+Movie',
                    ThoiLuong: 120,
                    TheLoai: 'Action',
                    GioiHanTuoi: 'T13'
                };
                this.updateMovieDisplay();
                await this.initShowtimes(movieId);
            }
        } catch (error) {
            console.error('❌ Error loading movie details:', error);
            
            if (confirm('Có lỗi xảy ra khi tải thông tin phim.\n\nClick OK để thử với dữ liệu test.')) {
                this.selectedMovie = {
                    TenPhim: `Test Movie ${movieId}`,
                    Poster: 'https://via.placeholder.com/300x450?text=Test+Movie',
                    ThoiLuong: 120,
                    TheLoai: 'Action',
                    GioiHanTuoi: 'T13'
                };
                this.updateMovieDisplay();
                await this.initShowtimes(movieId);
            }
        }
    }

    async initShowtimes(movieId) {
        try {
            this.getShowtimes = new GetShowtimes(movieId);

            await this.getShowtimes.loadDates();

            document.addEventListener('showtimeSelected', (e) => {
                this.handleShowtimeSelection(e.detail);
            });
            
        } catch (error) {
            console.error('Error initializing showtimes:', error);
        }
    }

    handleShowtimeSelection(showtimeData) {
        this.selectedShowtime = {
            id: showtimeData.id,
            date: showtimeData.date,
            time: showtimeData.time.slice(0, 5),
            room: showtimeData.room
        };
        
        // Store the showtime ID for seat selection
        if (this.getShowtimes) {
            this.getShowtimes.selectedShowtimeId = showtimeData.id;
        }
        
        localStorage.setItem('selectedShowtime', JSON.stringify(this.selectedShowtime));
        
        this.updateSummary();
        this.enableNextButton();
    }

    updateMovieDisplay() {
        const movie = this.selectedMovie;
        console.log('Updating movie display:', movie.TenPhim);
        
        const movieTitle = document.getElementById('movieTitle');
        const summaryMovie = document.getElementById('summaryMovie');
        
        if (movieTitle) {
            movieTitle.textContent = movie.TenPhim;
        }
        
        const formatElement = document.getElementById('movieFormat');
        if (formatElement && movie) {
            let format = this.parseMovieFormat(movie);
            formatElement.textContent = format;
        }
        
        if (summaryMovie) {
            const img = summaryMovie.querySelector('img');
            if (img) {
                img.src = movie.Poster;
                img.alt = movie.TenPhim;
            }
        }
        
        console.log('✅ Movie display updated');
    }

    updateSummary() {
        const cinemaRoom = document.getElementById('cinemaRoom');
        const showtimeInfo = document.getElementById('showtimeInfo');
        
        if (this.selectedShowtime) {
            console.log('Updating summary with showtime:', this.selectedShowtime);
            
            if (cinemaRoom) {
                cinemaRoom.innerHTML = `<b>High Cinema</b> - ${this.selectedShowtime.room}`;
            }
            
            if (showtimeInfo) {
                const date = new Date(this.selectedShowtime.date);
                const formattedDate = date.toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                showtimeInfo.innerHTML = `Suất: <b>${this.selectedShowtime.time}</b> - ${formattedDate}`;
            }
        } else {
            if (cinemaRoom) {
                cinemaRoom.innerHTML = `<b>High Cinema</b> - Chưa chọn phòng`;
            }
            
            if (showtimeInfo) {
                showtimeInfo.innerHTML = `Suất: <b>Chưa chọn</b> - Ngày chiếu`;
            }
        }
    }

    enableNextButton() {
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'nextBtn') {
                if (!this.currentUser) {
                    this.showUserModal({
                        title: 'Bạn chưa đăng nhập',
                        message: 'Vui lòng đăng nhập để tiếp tục đặt vé.',
                        confirmText: 'Đăng nhập',
                        onConfirm: () => {
                            window.location.href = 'login-register.html';
                        }
                    });
                    return;
                }

                if (!this.isUserProfileComplete(this.currentUser)) {
                    this.showUserModal({
                        title: 'Thiếu thông tin cá nhân',
                        message: 'Bạn cần cập nhật đầy đủ thông tin trước khi đặt vé.',
                        confirmText: 'Cập nhật',
                        onConfirm: () => {
                            window.location.href = 'profile.html';
                        }
                    });
                    return;
                }

                if (!this.isUserOldEnough(this.currentUser, this.selectedMovie)) {
                    const limit = this.getMovieAgeLimit(this.selectedMovie);

                    this.showUserModal({
                        title: 'Không đủ độ tuổi',
                        message: `Phim này chỉ dành cho khán giả từ ${limit}+ tuổi.`,
                        confirmText: 'Đã hiểu',
                        onConfirm: () => {
                            window.location.href = 'index.html';
                        }
                    });
                    return;
                }

                if (!this.selectedShowtime) {
                    alert('Vui lòng chọn suất chiếu');
                    return;
                }

                sessionStorage.setItem('bookingInProgress', 'true');
                
                // Use the selected showtime ID
                if (this.selectedShowtime && this.selectedShowtime.id) {
                    window.location.href = `seat-selection.html?showtime=${this.selectedShowtime.id}`;
                } else {
                    alert('Vui lòng chọn suất chiếu trước khi tiếp tục');
                    return;
                }
            }
        });
    }

    setupPageExitHandler() {
        window.addEventListener('beforeunload', () => {
            const bookingInProgress = sessionStorage.getItem('bookingInProgress');
            
            if (!bookingInProgress) {
                console.log('🧹 User exiting without completing booking, clearing data...');
                this.clearAllBookingData();
            } else {
                console.log('🔄 User continuing booking flow, keeping data...');
            }
        });
        
        window.addEventListener('load', () => {
            const returningFromSeat = sessionStorage.getItem('returningFromSeat');
            
            if (returningFromSeat) {
                console.log('🔙 User returned from seat selection, keeping showtime data');
                sessionStorage.removeItem('returningFromSeat');
            } else {
                sessionStorage.removeItem('bookingInProgress');
            }
        });
        
        window.addEventListener('focus', () => {
            sessionStorage.removeItem('bookingInProgress');
        });
        
        window.addEventListener('pageshow', () => {
            sessionStorage.removeItem('bookingInProgress');
        });
    }

    clearAllBookingData() {
        localStorage.removeItem('selectedShowtime');
        localStorage.removeItem('bookingData');
        localStorage.removeItem('reservationStartTime');
        localStorage.removeItem('selectedServices');
        
        console.log('🧹 All booking data cleared');
    }

    parseMovieFormat(movie) {
        const dinhDang = movie.DinhDang || '';
        const ngonNgu = movie.NgonNgu || '';
        
        console.log('Parsing format:', { dinhDang, ngonNgu });
        
        let formatParts = [];
        
        if (dinhDang) {
            const formatLower = dinhDang.toLowerCase();
            if (formatLower.includes('imax')) {
                formatParts.push('IMAX');
            } else if (formatLower.includes('4dx')) {
                formatParts.push('4DX');
            } else if (formatLower.includes('3d')) {
                formatParts.push('3D');
            } else if (formatLower.includes('2d')) {
                formatParts.push('2D');
            } else {
                formatParts.push('Chưa xác định');
            }
        } else {
            formatParts.push('Chưa xác định');
        }

        if (ngonNgu) {
            const languageLower = ngonNgu.toLowerCase();
            if (languageLower.includes('lồng tiếng') || 
                languageLower.includes('long tieng') ||
                languageLower.includes('dubbed') ||
                languageLower.includes('vietsub')) {
                formatParts.push('Lồng Tiếng');
            } else if (languageLower.includes('phụ đề') || 
                       languageLower.includes('phu de') ||
                       languageLower.includes('subtitle') ||
                       languageLower.includes('sub')) {
                formatParts.push('Phụ Đề');
            } else {
                formatParts.push();
            }
        } else {
            formatParts.push();
        }
        
        const result = formatParts.join(' ');
        console.log('Final format:', result);
        return result;
    }
}

export { BookingSystem };