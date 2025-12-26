import { loadUserInfo } from './user-info.js';
import { initNotification, showNotification } from './notification.js';

class SeatSelectionSystem {
    constructor() {
        this.showtimeId = null;
        this.showtimeData = null;
        this.seatData = null;
        this.selectedSeats = [];
        this.seatPrices = {
            'Thường': 75000,
            'VIP': 120000,
            'Đôi': 180000
        };
        
        this.init();
    }

    async init() {
        console.log('🎬 Initializing Seat Selection System...');
        
        try {
            await this.loadHeaderFooter();
            
            this.getShowtimeFromURL();
            
            await this.loadSeatData();

            this.loadPreviouslySelectedSeats();

            this.setupEventListeners();

            this.setupPageExitHandler();
            
            console.log('✅ Seat Selection System initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing seat selection system:', error);
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
                        stepsContainer.className = 'steps step-2';

                        const steps = stepsContainer.querySelectorAll('.step');
                        if (steps[0]) steps[0].classList.add('completed');
                        if (steps[1]) steps[1].classList.add('active');
                    }
                    
                    console.log('✅ Booking steps loaded and updated for seat selection');
                } else {
                    console.error('❌ Failed to load booking steps:', r.status);
                }
            } else {
                console.error('❌ booking-steps element not found');
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
            } else {
                console.error('❌ booking-summary element not found');
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            await loadUserInfo();
            initNotification();
        } catch (error) {
            console.error('Error loading header/footer or booking components:', error);
        }
    }

    getShowtimeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.showtimeId = urlParams.get('showtime') || urlParams.get('movie');
        
        console.log('🔍 Showtime ID from URL:', this.showtimeId);
        
        if (!this.showtimeId) {
            console.error('❌ No showtime ID in URL');
            if (confirm('Không tìm thấy thông tin suất chiếu.\n\nQuay lại trang chọn suất chiếu?')) {
                window.location.href = 'booking.html';
            }
            return;
        }
    }

    async loadSeatData() {
        try {
            console.log('🪑 Loading seat data for showtime:', this.showtimeId);
            
            const response = await fetch(`../api/booking/get_seats.php?showtime_id=${this.showtimeId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📡 Seat API Response:', data);
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load seat data');
            }
            
            this.showtimeData = data.showtime;
            this.seatData = data;
            
            this.updateSeatPrices();

            this.updateShowtimeInfo();
            
            this.renderSeatMap();

            this.updateSummary();
            
            console.log('✅ Seat data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading seat data:', error);
            this.showError('Không thể tải dữ liệu ghế: ' + error.message);
        }
    }

    updateSeatPrices() {
        if (this.seatData && this.seatData.layout && this.seatData.layout.seatStats) {
            const stats = this.seatData.layout.seatStats;
            
            if (stats.Thường && stats.Thường.price > 0) {
                this.seatPrices.Thường = stats.Thường.price;
            }
            if (stats.VIP && stats.VIP.price > 0) {
                this.seatPrices.VIP = stats.VIP.price;
            }
            if (stats.Đôi && stats.Đôi.price > 0) {
                this.seatPrices.Đôi = stats.Đôi.price;
            }
            
            console.log('💰 Updated seat prices:', this.seatPrices);

            this.updatePriceDisplay();
        }
    }

    updatePriceDisplay() {
        const pricesContainer = document.getElementById('ticketPrices');
        if (pricesContainer) {
            pricesContainer.innerHTML = `
                <div class="price-item">
                    <span>Ghế thường:</span>
                    <span class="price">${this.formatPrice(this.seatPrices.Thường)}</span>
                </div>
                <div class="price-item">
                    <span>Ghế VIP:</span>
                    <span class="price">${this.formatPrice(this.seatPrices.VIP)}</span>
                </div>
                <div class="price-item">
                    <span>Ghế đôi:</span>
                    <span class="price">${this.formatPrice(this.seatPrices.Đôi)}</span>
                </div>
            `;
        }

        const normalPriceTooltip = document.getElementById('normalPrice');
        if (normalPriceTooltip) {
            normalPriceTooltip.textContent = this.formatPrice(this.seatPrices.Thường);
        }
        
        const vipPriceTooltip = document.getElementById('vipPrice');
        if (vipPriceTooltip) {
            vipPriceTooltip.textContent = this.formatPrice(this.seatPrices.VIP);
        }
        
        const couplePriceTooltip = document.getElementById('couplePrice');
        if (couplePriceTooltip) {
            couplePriceTooltip.textContent = this.formatPrice(this.seatPrices.Đôi);
        }
    }

    updateShowtimeInfo() {
        const showtime = this.showtimeData;
        const theater = this.seatData.theater;

        document.getElementById('theaterName').textContent = 
            `${theater.TenPhong} (${theater.LoaiPhong}) - ${theater.SoLuongGhe} ghế`;
        
        document.getElementById('movieInfo').textContent = showtime.TenPhim;
        
        const date = new Date(showtime.NgayChieu);
        const formattedDate = date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        document.getElementById('showtimeDetails').textContent = 
            `${this.formatTime(showtime.GioBatDau)} - ${formattedDate}`;
    }

    renderSeatMap() {
        const seatMap = document.getElementById('seatMap');
        const layout = this.seatData.seatLayout;
        const rows = this.seatData.layout.rows;
        const maxCols = this.seatData.layout.maxCols;
        
        console.log('🗺️ Rendering seat map:', { rows: rows.length, maxCols });
        
        let html = '';
        
        rows.forEach(rowLetter => {
            html += `<div class="seat-row">`;
            html += `<div class="row-label">${rowLetter}</div>`;
            
            const rowSeats = layout[rowLetter] || {};
            
            for (let col = 1; col <= maxCols; col++) {
                if (rowSeats[col]) {
                    const seat = rowSeats[col];
                    const seatClass = this.getSeatClass(seat);
                    const seatLabel = this.getSeatLabel(seat);
                    
                    html += `
                        <div class="seat ${seatClass}" 
                             data-seat-id="${seat.MaGhe}"
                             data-row="${seat.SoHang}"
                             data-col="${seat.SoCot}"
                             data-type="${seat.LoaiGhe}"
                             data-status="${seat.TrangThai}"
                             title="Ghế ${seat.SoHang}${seat.SoCot} - ${seat.LoaiGhe}">
                            ${seatLabel}
                        </div>
                    `;
                } else {
                    html += `<div class="seat-gap"></div>`;
                }
            }
            
            html += `</div>`;
        });
        
        seatMap.innerHTML = html;
        
        this.addSeatClickListeners();
        
        console.log('✅ Seat map rendered');
    }

    getSeatClass(seat) {
        let classes = [];
        
        if (seat.TrangThai === 'Đã đặt') {
            classes.push('occupied');
        } else {
            classes.push('available');
        }
        
        if (seat.LoaiGhe === 'VIP') {
            classes.push('vip');
        } else if (seat.LoaiGhe === 'Đôi') {
            classes.push('couple');
        }
        
        return classes.join(' ');
    }

    getSeatLabel(seat) {
        if (seat.LoaiGhe === 'Đôi') {
            return '♥';
        }
        return seat.SoCot;
    }

    addSeatClickListeners() {
        const seats = document.querySelectorAll('.seat:not(.occupied)');
        
        seats.forEach(seat => {
            seat.addEventListener('click', () => {
                this.toggleSeat(seat);
            });
        });
    }

    toggleSeat(seatElement) {
        const seatId = seatElement.dataset.seatId;
        const seatType = seatElement.dataset.type;
        const row = seatElement.dataset.row;
        const col = seatElement.dataset.col;
        
        if (seatElement.classList.contains('selected')) {
            seatElement.classList.remove('selected');
            this.selectedSeats = this.selectedSeats.filter(s => s.id !== seatId);
            
            console.log('🪑 Deselected seat:', seatId);
        } else {
            const seatPrice = this.getSeatPrice(row, col);
            
            seatElement.classList.add('selected');
            this.selectedSeats.push({
                id: seatId,
                row: row,
                col: col,
                type: seatType,
                label: `${row}${col}`,
                price: seatPrice
            });
            
            console.log('🪑 Selected seat:', seatId);
        }

        this.updateSummary();

        this.updateNextButton();
    }

    getSeatPrice(row, col) {
        if (this.seatData && this.seatData.seatLayout && 
            this.seatData.seatLayout[row] && 
            this.seatData.seatLayout[row][col]) {
            
            const seatInfo = this.seatData.seatLayout[row][col];
            if (seatInfo.GiaVe && seatInfo.GiaVe > 0) {
                return seatInfo.GiaVe;
            }

            return this.seatPrices[seatInfo.LoaiGhe] || 0;
        }

        return 0;
    }

    updateSummary() {
        const showtime = this.showtimeData;
        const theater = this.seatData?.theater;

        if (showtime) {
            document.getElementById('movieTitle').textContent = showtime.TenPhim;

            const formatElement = document.getElementById('movieFormat');
            if (formatElement && showtime) {
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
                
                formatElement.textContent = format;
            }
            
            const movieImg = document.querySelector('#summaryMovie img');
            if (movieImg && showtime.Poster) {
                movieImg.src = showtime.Poster;
                movieImg.alt = showtime.TenPhim;
            }
            
            document.getElementById('cinemaRoom').innerHTML = 
                `<b>High Cinema</b> - ${theater?.TenPhong || 'Đang tải...'}`;
            
            const date = new Date(showtime.NgayChieu);
            const formattedDate = date.toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            document.getElementById('showtimeInfo').innerHTML = 
                `Suất: <b>${this.formatTime(showtime.GioBatDau)}</b> - ${formattedDate}`;
        }
        
        const selectedSeatsElement = document.getElementById('selectedSeats');
        const seatsSelectedDiv = document.querySelector('.seats-selected');
        const totalDiv = document.querySelector('.total');
        
        if (this.selectedSeats.length === 0) {
            selectedSeatsElement.textContent = 'Chưa có';
            seatsSelectedDiv.style.display = 'none';
            totalDiv.style.display = 'none';
        } else {
            const seatLabels = this.selectedSeats.map(seat => seat.label).join(', ');
            selectedSeatsElement.textContent = seatLabels;
            seatsSelectedDiv.style.display = 'flex';
            totalDiv.style.display = 'flex';
        }

        const totalPrice = this.selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
        document.getElementById('totalPrice').textContent = this.formatPrice(totalPrice);
    }

    updateNextButton() {
        const nextBtn = document.getElementById('nextBtn');
        
        if (this.selectedSeats.length > 0) {
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
        } else {
            nextBtn.disabled = true;
            nextBtn.style.opacity = '0.5';
        }
    }

    setupEventListeners() {
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.selectedSeats.length > 0) {
                    this.proceedToNextStep();
                } else {
                    if (window.NotificationManager) {
                        window.NotificationManager.showWarning('Vui lòng chọn ít nhất một ghế!');
                    } else {
                        alert('Vui lòng chọn ít nhất một ghế!');
                    }
                }
            });
        }

        const backBtn = document.getElementById('backBtn');
        if (backBtn && this.showtimeData) {
            backBtn.href = `booking.html?movie=${this.showtimeData.MaPhim}`;

            backBtn.addEventListener('click', () => {
                sessionStorage.setItem('returningFromSeat', 'true');
                console.log('🔙 User clicking back to booking, marked as returning');
            });
        }
    }

    proceedToNextStep() {
        const bookingData = {
            showtime: this.showtimeData,
            selectedSeats: this.selectedSeats,
            totalPrice: this.selectedSeats.reduce((sum, seat) => sum + seat.price, 0)
        };
        
        localStorage.setItem('bookingData', JSON.stringify(bookingData));
        
        // Bắt đầu thời gian giữ chỗ
        localStorage.setItem('reservationStartTime', Date.now().toString());
        
        sessionStorage.setItem('bookingInProgress', 'true');
        
        console.log('🎫 Đã lưu thông tin đặt vé và bắt đầu giữ chỗ');
        
        window.location.href = `service-selection.html?showtime=${this.showtimeData.MaSuat}`;
    }

    setupPageExitHandler() {
        // Đánh dấu khi trang được load
        sessionStorage.setItem('seatPageLoaded', 'true');
        
        window.addEventListener('beforeunload', () => {
            const bookingInProgress = sessionStorage.getItem('bookingInProgress');
            const returningFromSeat = sessionStorage.getItem('returningFromSeat');
            
            // Chỉ xóa dữ liệu nếu không đang trong flow booking
            if (!bookingInProgress && !returningFromSeat) {
                console.log('🧹 User exiting seat selection without continuing, clearing data...');
                this.clearAllBookingData();
            } else {
                console.log('💾 Keeping seat selection data (booking in progress)');
            }
        });

        window.addEventListener('focus', () => {
            sessionStorage.removeItem('bookingInProgress');
        });
    }

    clearAllBookingData() {
        localStorage.removeItem('selectedShowtime');
        localStorage.removeItem('bookingData');
        localStorage.removeItem('reservationStartTime');
        localStorage.removeItem('selectedServices');
        console.log('🧹 All booking data cleared from seat selection');
    }

    showError(message) {
        const seatMap = document.getElementById('seatMap');
        seatMap.innerHTML = `
            <div style="text-align: center; color: #dc3545; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
                <h3>Có lỗi xảy ra</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; margin-top: 15px;">
                    Thử lại
                </button>
                <br>
                <a href="booking.html" style="display: inline-block; margin-top: 10px; color: #007bff;">
                    Quay lại chọn suất chiếu
                </a>
            </div>
        `;
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
    
    loadPreviouslySelectedSeats() {
        const bookingInProgress = sessionStorage.getItem('bookingInProgress');
        if (!bookingInProgress) {
            console.log('🚫 Not in booking progress, skipping seat restoration');
            return;
        }

        const bookingData = localStorage.getItem('bookingData');
        
        if (bookingData) {
            try {
                const data = JSON.parse(bookingData);

                if (data.selectedSeats && data.selectedSeats.length > 0 && 
                    data.showtime && data.showtime.MaSuat == this.showtimeId) {
                    console.log('📦 Found previously selected seats for same showtime:', data.selectedSeats);

                    setTimeout(() => {
                        data.selectedSeats.forEach(seat => {
                            const seatElement = document.querySelector(
                                `.seat[data-seat-id="${seat.id}"]`
                            );
                            
                            if (seatElement && !seatElement.classList.contains('occupied')) {
                                seatElement.classList.add('selected');
                                this.selectedSeats.push(seat);
                            }
                        });

                        this.updateSummary();
                        this.updateNextButton();
                        
                        console.log('✅ Restored previously selected seats');
                    }, 500);
                } else {
                    console.log('🔄 Different showtime or no seats, clearing old booking data');
                    localStorage.removeItem('bookingData');
                }
            } catch (error) {
                console.error('Error loading previously selected seats:', error);
                localStorage.removeItem('bookingData');
            }
        }
    }
}

export default SeatSelectionSystem;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        console.log('🚀 DOM loaded, starting seat selection system...');
        window.seatSelectionSystem = new SeatSelectionSystem();
    } catch (error) {
        console.error("❌ Error starting seat selection system:", error);
    }
});