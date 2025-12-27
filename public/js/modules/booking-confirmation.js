import { loadUserInfo } from './user-info.js';
import { initNotification, showNotification } from './notification.js';

class BookingConfirmationSystem {
    constructor() {
        this.bookingData = null;
        this.reservationTimer = null;
        this.timeRemaining = 0;
        
        this.init();
    }

    async init() {
        console.log('✅ Initializing Booking Confirmation System...');
        
        try {
            await this.loadHeaderFooter();
            
            this.loadBookingData();
            
            this.setupEventListeners();

            this.setupPageExitHandler();
            
            // Khởi động timer sau khi đã render HTML
            setTimeout(() => {
                this.startReservationTimer();
            }, 500);
            
            console.log('✅ Booking Confirmation System initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing booking confirmation system:', error);
        }
    }

    async loadHeaderFooter() {
        try {
            const headerResponse = await fetch('header.html');
            if (headerResponse.ok) {
                const headerHTML = await headerResponse.text();
                document.getElementById('header').innerHTML = headerHTML;
            }

            const footerResponse = await fetch('footer.html');
            if (footerResponse.ok) {
                const footerHTML = await footerResponse.text();
                document.getElementById('footer').innerHTML = footerHTML;
            }

            const stepsEl = document.getElementById('booking-steps');
            if (stepsEl) {
                console.log('🔄 Loading booking steps...');
                const r = await fetch('booking-steps.html');
                if (r.ok) {
                    const stepsHTML = await r.text();
                    stepsEl.innerHTML = stepsHTML;

                    const stepsContainer = stepsEl.querySelector('.steps');
                    if (stepsContainer) {
                        stepsContainer.className = 'steps step-4';

                        const steps = stepsContainer.querySelectorAll('.step');
                        if (steps[0]) steps[0].classList.add('completed');
                        if (steps[1]) steps[1].classList.add('completed');
                        if (steps[2]) steps[2].classList.add('completed');
                        if (steps[3]) steps[3].classList.add('active');
                    }
                    
                    console.log('✅ Booking steps loaded and updated for confirmation');
                } else {
                    console.error('❌ Failed to load booking steps:', r.status);
                }
            }

            const summaryEl = document.getElementById('booking-summary');
            if (summaryEl) {
                console.log('🔄 Loading booking summary...');
                const r2 = await fetch('booking-summary.html');
                if (r2.ok) {
                    const summaryHTML = await r2.text();
                    summaryEl.innerHTML = summaryHTML;
                    console.log('✅ Booking summary loaded successfully');
                } else {
                    console.error('❌ Failed to load booking summary:', r2.status);
                }
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            await loadUserInfo();
            initNotification();
        } catch (error) {
            console.error('Error loading header/footer or booking components:', error);
        }
    }

    loadBookingData() {
        const bookingDataStr = localStorage.getItem('bookingData');
        
        if (!bookingDataStr) {
            console.error('❌ No booking data found');
            
            // Thử tìm từ URL parameters nếu có
            const urlParams = new URLSearchParams(window.location.search);
            const showtimeId = urlParams.get('showtime');
            
            if (showtimeId) {
                console.log('🔍 Found showtime in URL but no booking data, redirecting to seat selection...');
                window.location.href = `seat-selection.html?showtime=${showtimeId}`;
                return;
            }
            
            if (confirm('Không tìm thấy thông tin đặt vé.\n\nQuay lại trang chọn ghế?')) {
                window.location.href = 'seat-selection.html';
            }
            return;
        }

        try {
            this.bookingData = JSON.parse(bookingDataStr);
            console.log('📦 Loaded booking data:', this.bookingData);
            
            // Đảm bảo URL có thông tin showtime để có thể refresh
            this.updateURLWithShowtime();
            
            this.renderConfirmationDetails();
            this.updateSummary();
        } catch (error) {
            console.error('❌ Error parsing booking data:', error);
            if (confirm('Dữ liệu đặt vé không hợp lệ.\n\nQuay lại trang chọn ghế?')) {
                window.location.href = 'seat-selection.html';
            }
        }
    }

    updateURLWithShowtime() {
        if (this.bookingData && this.bookingData.showtime) {
            const currentUrl = new URL(window.location);
            currentUrl.searchParams.set('showtime', this.bookingData.showtime.MaSuat);
            
            // Cập nhật URL mà không reload trang
            window.history.replaceState({}, '', currentUrl);
            console.log('🔗 Updated URL with showtime parameter');
        }
    }

    renderConfirmationDetails() {
        const container = document.getElementById('confirmationContainer');
        const showtime = this.bookingData.showtime;
        const selectedSeats = this.bookingData.selectedSeats || [];
        const selectedServices = this.bookingData.selectedServices || [];
        
        // Tính toán giá
        const seatTotal = this.bookingData.totalPrice - (this.bookingData.serviceTotal || 0);
        const serviceTotal = this.bookingData.serviceTotal || 0;

        let html = `
            <!-- Timer giữ chỗ -->
            <div class="reservation-timer" id="reservationTimer">
                <div class="timer-text">
                    <i class="fas fa-clock"></i>
                    <span>Thời gian giữ chỗ còn lại: </span>
                    <span class="timer-countdown" id="timerCountdown">--:--</span>
                </div>
            </div>

            <!-- Thông tin phim -->
            <div class="confirmation-section">
                <h4><i class="fas fa-film"></i> Thông tin phim</h4>
                <div class="movie-info-section">
                    <div class="movie-poster">
                        <img src="${showtime.Poster || 'images/default-movie.jpg'}" 
                             alt="${showtime.TenPhim}"
                             onerror="this.src='images/default-movie.jpg'">
                    </div>
                    <div class="movie-details">
                        <div class="movie-title">${showtime.TenPhim}</div>
                        <div class="confirmation-row">
                            <span class="confirmation-label">Định dạng:</span>
                            <span class="confirmation-value">${this.getMovieFormat(showtime)}</span>
                        </div>
                        <div class="confirmation-row">
                            <span class="confirmation-label">Rạp:</span>
                            <span class="confirmation-value">High Cinema - ${showtime.TenPhong}</span>
                        </div>
                        <div class="confirmation-row">
                            <span class="confirmation-label">Ngày chiếu:</span>
                            <span class="confirmation-value">${this.formatDate(showtime.NgayChieu)}</span>
                        </div>
                        <div class="confirmation-row">
                            <span class="confirmation-label">Giờ chiếu:</span>
                            <span class="confirmation-value">${this.formatTime(showtime.GioBatDau)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Thông tin ghế -->
            <div class="confirmation-section">
                <h4><i class="fas fa-couch"></i> Ghế đã chọn</h4>
                <div class="confirmation-row">
                    <span class="confirmation-label">Số lượng ghế:</span>
                    <span class="confirmation-value">${selectedSeats.length} ghế</span>
                </div>
                <div class="confirmation-row">
                    <span class="confirmation-label">Vị trí ghế:</span>
                    <div class="confirmation-value">
                        <div class="seats-grid">
                            ${selectedSeats.map(seat => {
                                console.log('🪑 Seat data:', seat); // Debug log
                                const seatType = this.normalizeSeatType(seat.type);
                                return `<span class="seat-badge ${seatType}">${seat.label}</span>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
                <div class="confirmation-row">
                    <span class="confirmation-label">Tổng tiền ghế:</span>
                    <span class="confirmation-value">${this.formatPrice(seatTotal)}</span>
                </div>
            </div>

            <!-- Thông tin dịch vụ -->
            <div class="confirmation-section">
                <h4><i class="fas fa-coffee"></i> Dịch vụ đã chọn</h4>
                ${selectedServices.length > 0 ? `
                    <div class="services-list">
                        ${selectedServices.map(service => `
                            <div class="service-item-confirmation">
                                <div class="service-name">${service.name}</div>
                                <div class="service-total">${this.formatPrice(service.price * service.quantity)}</div>
                                <div class="service-qty">Số lượng: ${service.quantity}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="service-total-separator"></div>
                    <div class="confirmation-row">
                        <span class="confirmation-label">Tổng tiền dịch vụ:</span>
                        <span class="confirmation-value">${this.formatPrice(serviceTotal)}</span>
                    </div>
                ` : `
                    <div class="no-services">Không có dịch vụ nào được chọn</div>
                `}
            </div>
        `;

        container.innerHTML = html;
    }

    getMovieFormat(showtime) {
        const dinhDang = showtime.DinhDang || '2D';
        const ngonNgu = showtime.NgonNgu || 'Phụ Đề';

        let format = '';

        if (dinhDang.includes('3D')) {
            format += '3D';
        } else if (dinhDang.includes('IMAX')) {
            format += 'IMAX';
        } else {
            format += '2D';
        }

        if (ngonNgu.includes('Lồng tiếng') || ngonNgu.includes('lồng tiếng')) {
            format += ' Lồng Tiếng';
        } else {
            format += ' Phụ Đề';
        }
        
        return format;
    }

    normalizeSeatType(seatType) {
        if (!seatType) return 'thường';
        
        const type = seatType.toLowerCase();
        
        if (type.includes('vip')) {
            return 'vip';
        } else if (type.includes('đôi') || type.includes('couple')) {
            return 'đôi';
        } else {
            return 'thường';
        }
    }

    updateSummary() {
        if (!this.bookingData) return;

        const showtime = this.bookingData.showtime;
        
        document.getElementById('movieTitle').textContent = showtime.TenPhim;

        const formatElement = document.getElementById('movieFormat');
        if (formatElement) {
            formatElement.textContent = this.getMovieFormat(showtime);
        }
        
        const movieImg = document.querySelector('#summaryMovie img');
        if (movieImg && showtime.Poster) {
            movieImg.src = showtime.Poster;
            movieImg.alt = showtime.TenPhim;
        }

        document.getElementById('cinemaRoom').innerHTML = 
            `<b>High Cinema</b> - ${showtime.TenPhong || 'Đang tải...'}`;
        
        document.getElementById('showtimeInfo').innerHTML = 
            `Suất: <b>${this.formatTime(showtime.GioBatDau)}</b> - ${this.formatDate(showtime.NgayChieu)}`;

        const selectedSeatsElement = document.getElementById('selectedSeats');
        const seatsSelectedDiv = document.querySelector('.seats-selected');
        
        if (this.bookingData.selectedSeats && this.bookingData.selectedSeats.length > 0) {
            const seatLabels = this.bookingData.selectedSeats.map(seat => seat.label).join(', ');
            selectedSeatsElement.textContent = seatLabels;
            seatsSelectedDiv.style.display = 'flex';
        } else {
            selectedSeatsElement.textContent = 'Chưa có';
            seatsSelectedDiv.style.display = 'flex';
        }

        const totalDiv = document.querySelector('.total');
        if (totalDiv) {
            totalDiv.style.display = 'flex';
        }

        document.getElementById('totalPrice').textContent = this.formatPrice(this.bookingData.totalPrice || 0);
    }

    startReservationTimer() {
        console.log('🕐 Starting reservation timer...');
        
        const reservationStartTime = localStorage.getItem('reservationStartTime');
        console.log('📅 Reservation start time from storage:', reservationStartTime);
        
        if (!reservationStartTime) {
            // Nếu chưa có thời gian bắt đầu, tạo mới
            const startTime = Date.now();
            localStorage.setItem('reservationStartTime', startTime.toString());
            console.log('🕐 Started new reservation timer at:', startTime);
        }

        const startTime = parseInt(localStorage.getItem('reservationStartTime'));
        const reservationDuration = 10 * 60 * 1000; // 10 phút
        const endTime = startTime + reservationDuration;
        
        console.log('⏰ Timer details:', {
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            duration: reservationDuration / 1000 / 60 + ' minutes'
        });

        this.reservationTimer = setInterval(() => {
            const now = Date.now();
            this.timeRemaining = Math.max(0, endTime - now);

            if (this.timeRemaining <= 0) {
                this.handleReservationExpired();
                return;
            }

            this.updateTimerDisplay();
        }, 1000);

        // Cập nhật ngay lập tức
        const now = Date.now();
        this.timeRemaining = Math.max(0, endTime - now);
        console.log('⏱️ Initial time remaining:', this.timeRemaining / 1000 / 60 + ' minutes');
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const timerElement = document.getElementById('timerCountdown');
        const timerContainer = document.getElementById('reservationTimer');
        
        console.log('🔍 Timer elements found:', {
            timerElement: !!timerElement,
            timerContainer: !!timerContainer,
            timeRemaining: this.timeRemaining
        });
        
        if (!timerElement || !timerContainer) {
            console.error('❌ Timer elements not found!');
            return;
        }

        const minutes = Math.floor(this.timeRemaining / 60000);
        const seconds = Math.floor((this.timeRemaining % 60000) / 1000);
        
        const timeText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timerElement.textContent = timeText;
        
        console.log('⏰ Updated timer display:', timeText);

        // Thay đổi màu sắc khi còn ít thời gian
        if (this.timeRemaining <= 2 * 60 * 1000) { // 2 phút cuối
            timerContainer.classList.add('timer-warning');
        } else {
            timerContainer.classList.remove('timer-warning');
        }
    }

    handleReservationExpired() {
        clearInterval(this.reservationTimer);
        
        showNotification(
            'Thời gian giữ chỗ đã hết! Vui lòng đặt vé lại.',
            'error'
        );

        setTimeout(() => {
            // Sử dụng function chung để xóa dữ liệu
            if (window.clearAllBookingData) {
                window.clearAllBookingData();
            } else {
                this.clearAllBookingData();
            }
            window.location.href = 'index.html';
        }, 3000);
    }

    setupEventListeners() {
        // Đợi DOM load xong rồi mới setup nút
        setTimeout(() => {
            const nextBtn = document.getElementById('nextBtn');
            if (nextBtn) {
                // Xóa tất cả event listeners cũ
                nextBtn.replaceWith(nextBtn.cloneNode(true));
                const newNextBtn = document.getElementById('nextBtn');
                
                newNextBtn.innerHTML = '<i class="fas fa-credit-card"></i> Thanh toán';
                newNextBtn.disabled = false;
                newNextBtn.style.opacity = '1';
                
                newNextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('💳 Payment button clicked');
                    this.proceedToPayment();
                });
                
                console.log('✅ Payment button setup complete');
            } else {
                console.error('❌ nextBtn not found');
            }

            const backBtn = document.getElementById('backBtn');
            if (backBtn && this.bookingData) {
                const urlParams = new URLSearchParams();
                urlParams.set('showtime', this.bookingData.showtime.MaSuat);
                backBtn.href = `service-selection.html?${urlParams.toString()}`;

                backBtn.addEventListener('click', () => {
                    sessionStorage.setItem('returningFromConfirmation', 'true');
                    console.log('🔙 User clicking back to service selection, marked as returning');
                });
            }
        }, 500);
    }

    proceedToPayment() {
        // Lưu trạng thái đang thanh toán
        sessionStorage.setItem('paymentInProgress', 'true');
        
        console.log('💳 Proceeding to payment with booking data:', this.bookingData);
        
        // Chuyển đến trang thanh toán
        window.location.href = 'payment.html?showtime=' + this.bookingData.showtime.MaSuat;
    }

    setupPageExitHandler() {
        // Đánh dấu khi trang được load để phân biệt refresh vs navigation
        sessionStorage.setItem('confirmationPageLoaded', 'true');
        
        // Xử lý khi user rời khỏi trang
        window.addEventListener('beforeunload', (e) => {
            const paymentInProgress = sessionStorage.getItem('paymentInProgress');
            const returningFromConfirmation = sessionStorage.getItem('returningFromConfirmation');
            
            // Chỉ giữ dữ liệu nếu đang thanh toán hoặc quay lại trang trước
            if (!paymentInProgress && !returningFromConfirmation) {
                console.log('🧹 User exiting confirmation page, clearing all booking data...');
                this.clearAllBookingData();
            } else {
                console.log('💾 Keeping booking data (payment in progress or returning)');
            }
        });

        // Xử lý khi user navigate bằng browser buttons
        window.addEventListener('pagehide', () => {
            const paymentInProgress = sessionStorage.getItem('paymentInProgress');
            const returningFromConfirmation = sessionStorage.getItem('returningFromConfirmation');
            
            if (!paymentInProgress && !returningFromConfirmation) {
                console.log('🧹 Page hidden, clearing booking data...');
                this.clearAllBookingData();
            }
        });

        // Dọn dẹp timer khi trang bị đóng
        window.addEventListener('beforeunload', () => {
            if (this.reservationTimer) {
                clearInterval(this.reservationTimer);
            }
        });

        // Xóa flag khi focus lại trang (để tránh xóa dữ liệu khi switch tab)
        window.addEventListener('focus', () => {
            sessionStorage.removeItem('paymentInProgress');
        });
    }

    clearAllBookingData() {
        localStorage.removeItem('selectedShowtime');
        localStorage.removeItem('bookingData');
        localStorage.removeItem('selectedServices');
        localStorage.removeItem('reservationStartTime');
        
        if (this.reservationTimer) {
            clearInterval(this.reservationTimer);
        }
        
        console.log('🧹 All booking data cleared from confirmation');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatTime(timeString) {
        if (!timeString) return '';
        const timeParts = timeString.split(':');
        return `${timeParts[0]}:${timeParts[1]}`;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }
}

export default BookingConfirmationSystem;