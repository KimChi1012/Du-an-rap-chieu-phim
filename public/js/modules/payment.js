class PaymentManager {
    constructor() {
        this.selectedMethod = null;
        this.bookingData = null;
        this.totalAmount = 0;
        this.lastPaymentResult = null;
        
        try {
            this.init();
        } catch (error) {
            console.error('Error in PaymentManager constructor:', error);
        }
    }

    async init() {
        try {
            await this.loadHeaderFooter();
            await this.loadBookingData();
            this.setupEventListeners();
            this.updateBookingSteps();
        } catch (error) {
            console.error('Error initializing payment manager:', error);
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
                const r = await fetch('booking-steps.html');
                if (r.ok) {
                    const stepsHTML = await r.text();
                    stepsEl.innerHTML = stepsHTML;
                }
            }

            const summaryEl = document.getElementById('booking-summary');
            if (summaryEl) {
                const r2 = await fetch('booking-summary.html');
                if (r2.ok) {
                    const summaryHTML = await r2.text();
                    summaryEl.innerHTML = summaryHTML;
                }
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            const { loadUserInfo } = await import('./user-info.js');
            const { initNotification } = await import('./notification.js');
            await loadUserInfo();
            initNotification();
        } catch (error) {
            console.error('Error loading header/footer:', error);
        }
    }

    async loadBookingData() {
        console.log('📦 Loading booking data...');

        const bookingDataStr = localStorage.getItem('bookingData');
        console.log('📦 Raw booking data:', bookingDataStr);
        
        if (!bookingDataStr) {
            console.error('❌ No booking data found');
            const { showNotification } = await import('./notification.js');
            showNotification('Không tìm thấy thông tin đặt vé. Vui lòng đặt vé lại.', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        try {
            this.bookingData = JSON.parse(bookingDataStr);
            console.log('📦 Parsed booking data:', this.bookingData);

            if (!this.bookingData.showtime) {
                throw new Error('Missing showtime data');
            }
            
            if (!this.bookingData.totalPrice) {
                console.warn('⚠️ No totalPrice found, calculating...');
                this.bookingData.totalPrice = 0;
            }
            
        } catch (error) {
            console.error('❌ Error parsing booking data:', error);
            const { showNotification } = await import('./notification.js');
            showNotification('Dữ liệu đặt vé không hợp lệ. Vui lòng đặt vé lại.', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        this.calculateTotal();
        this.loadBookingSummary();
        
        console.log('✅ Booking data loaded successfully');
    }

    calculateTotal() {
        let total = 0;

        if (this.bookingData && this.bookingData.totalPrice) {
            total = this.bookingData.totalPrice;
        }

        this.totalAmount = total;
    }

    loadBookingSummary() {
        const summaryContainer = document.getElementById('booking-summary');
        if (!summaryContainer) return;

        const showtime = this.bookingData.showtime;
        const selectedSeats = this.bookingData.selectedSeats || [];
        
        let seatsText = 'Chưa chọn ghế';
        if (selectedSeats && selectedSeats.length > 0) {
            seatsText = selectedSeats.map(seat => seat.label).join(', ');
        }

        summaryContainer.innerHTML = `
            <div class="right">
                <div class="summary">
                    <div class="summary-header">
                        <h3>Thông tin đặt vé</h3>
                    </div>

                    <div class="movie">
                        <img src="${showtime.Poster || 'https://via.placeholder.com/120x180?text=Poster'}" alt="Poster phim">
                        <div>
                            <h3>${showtime.TenPhim || 'Chưa chọn phim'}</h3>
                            <p>${this.getMovieFormat(showtime)}</p>
                        </div>
                    </div>

                    <p><b>High Cinema</b> - ${showtime.TenPhong || 'Chưa chọn phòng'}</p>
                    <p>Suất: <b>${this.formatTime(showtime.GioBatDau)}</b> - ${this.formatDate(showtime.NgayChieu)}</p>

                    <hr>

                    <div class="seats-selected">
                        <span>Ghế đã chọn:</span>
                        <span>${seatsText}</span>
                    </div>

                    <div class="total">
                        <span>Tổng cộng</span>
                        <span class="price">${this.totalAmount.toLocaleString('vi-VN')} đ</span>
                    </div>

                    <div class="actions">
                        <a href="booking-confirmation.html" class="back-btn">Quay lại</a>
                        <button class="next-btn" disabled id="paymentNextBtn">Tiếp tục</button>
                    </div>
                </div>
            </div>
        `;
    }

    updateBookingSteps() {
        const stepsContainer = document.getElementById('booking-steps');
        if (!stepsContainer) return;

        stepsContainer.innerHTML = `
            <div class="steps step-5">
                <div class="step completed">
                    <span class="circle">1</span>
                    <span class="step-text">Chọn suất chiếu</span>
                </div>
                <div class="step completed">
                    <span class="circle">2</span>
                    <span class="step-text">Chọn ghế</span>
                </div>
                <div class="step completed">
                    <span class="circle">3</span>
                    <span class="step-text">Chọn dịch vụ</span>
                </div>
                <div class="step completed">
                    <span class="circle">4</span>
                    <span class="step-text">Xác nhận</span>
                </div>
                <div class="step active">
                    <span class="circle">5</span>
                    <span class="step-text">Thanh toán</span>
                </div>
                <div class="step">
                    <span class="circle">6</span>
                    <span class="step-text">Nhận hoá đơn</span>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const paymentOptions = document.querySelectorAll('.payment-option');
        
        paymentOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectPaymentMethod(option);
            });
        });

        const payBtn = document.getElementById('payBtn');
        
        if (payBtn) {
            payBtn.replaceWith(payBtn.cloneNode(true));
            const newPayBtn = document.getElementById('payBtn');
            
            newPayBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!this.selectedMethod) {
                    alert('Vui lòng chọn phương thức thanh toán!');
                    return;
                }
                
                this.showPaymentModal();
            });
        }

        this.setupModalEvents();
    }

    selectPaymentMethod(option) {
        document.querySelectorAll('.payment-option').forEach(opt => {
            opt.classList.remove('selected');
            const radio = opt.querySelector('input[type="radio"]');
            if (radio) radio.checked = false;
        });

        option.classList.add('selected');
        const radio = option.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        
        this.selectedMethod = option.dataset.method;
        
        const payBtn = document.getElementById('payBtn');
        if (payBtn) {
            payBtn.disabled = false;
        }
    }

    showPaymentModal() {
        if (!this.selectedMethod) {
            alert('Vui lòng chọn phương thức thanh toán!');
            return;
        }

        document.getElementById('loadingModal').style.display = 'none';
        document.getElementById('successModal').style.display = 'none';

        const modal = document.getElementById('paymentModal');
        const modalTitle = document.getElementById('modalTitle');
        const paymentAmount = document.getElementById('paymentAmount');

        const methodNames = {
            'momo': 'Thanh toán MoMo',
            'zalopay': 'Thanh toán ZaloPay',
            'bank': 'Chuyển khoản ngân hàng',
            'shopeepay': 'Thanh toán ShopeePay'
        };

        if (modalTitle) {
            modalTitle.textContent = methodNames[this.selectedMethod] || 'Thanh toán';
        }
        
        if (paymentAmount) {
            paymentAmount.textContent = `${this.totalAmount.toLocaleString('vi-VN')} đ`;
        }

        const accountNumberInput = document.getElementById('accountNumber');
        const passwordInput = document.getElementById('password');
        
        if (accountNumberInput) accountNumberInput.value = '';
        if (passwordInput) passwordInput.value = '';

        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('modal');
            modal.style.zIndex = '9999';

            setTimeout(() => {
                if (accountNumberInput) {
                    accountNumberInput.focus();
                }
            }, 200);
        }
    }

    setupModalEvents() {
        const closeBtn = document.querySelector('#paymentModal .close');
        const cancelBtn = document.querySelector('.btn-cancel');
        
        [closeBtn, cancelBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    document.getElementById('paymentModal').style.display = 'none';
                });
            }
        });

        const confirmBtn = document.getElementById('confirmPayBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.processPayment();
            });
        }

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('paymentModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        const viewInvoiceBtn = document.getElementById('viewInvoiceBtn');
        if (viewInvoiceBtn) {
            viewInvoiceBtn.addEventListener('click', () => {
                console.log('🧾 View invoice button clicked');
                const invoiceId = this.lastPaymentResult?.data?.invoiceId;
                if (invoiceId) {
                    window.location.href = `invoice.html?invoice=${invoiceId}`;
                } else {
                    console.warn('⚠️ No invoice ID found, redirecting to home');
                    window.location.href = 'index.html';
                }
            });
        }

        const backToHomeBtn = document.getElementById('backToHomeBtn');
        if (backToHomeBtn) {
            backToHomeBtn.addEventListener('click', () => {
                console.log('🏠 Back to home button clicked');
                window.location.href = 'index.html';
            });
        }
    }

    async processPayment() {
        console.log('💳 processPayment called');
        
        const accountNumber = document.getElementById('accountNumber').value.trim();
        const password = document.getElementById('password').value.trim();

        console.log('📝 Form data:', { 
            accountNumber: accountNumber ? 'filled' : 'empty', 
            password: password ? 'filled' : 'empty' 
        });

        if (!accountNumber || !password) {
            const { showNotification } = await import('./notification.js');
            showNotification('Vui lòng nhập đầy đủ thông tin!', 'warning');
            return;
        }

        if (accountNumber.length < 6) {
            const { showNotification } = await import('./notification.js');
            showNotification('Số tài khoản/số điện thoại không hợp lệ!', 'error');
            return;
        }

        document.getElementById('paymentModal').style.display = 'none';
        const loadingModal = document.getElementById('loadingModal');
        loadingModal.style.display = 'flex';
        loadingModal.classList.add('modal');

        try {
            const userInfo = await this.getCurrentUserInfo();
            
            if (!userInfo.success) {
                throw new Error('Vui lòng đăng nhập để thanh toán!');
            }

            const isValidPassword = await this.verifyUserPassword(userInfo.userId, password);
            
            if (!isValidPassword) {
                throw new Error('Mật khẩu không chính xác!');
            }

            await this.simulatePayment(accountNumber, userInfo.userId);

            document.getElementById('loadingModal').style.display = 'none';

            const successModal = document.getElementById('successModal');
            successModal.style.display = 'flex';
            successModal.classList.add('modal');

            this.clearBookingData();     
        } catch (error) {
            document.getElementById('loadingModal').style.display = 'none';
            const { showNotification } = await import('./notification.js');
            showNotification('Thanh toán thất bại: ' + error.message, 'error');
        }
    }

    async simulatePayment(accountNumber, userId) {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const result = await this.createPaymentRecord(accountNumber, userId);
                    
                    this.lastPaymentResult = result;
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }, 2000);
        });
    }

    async getCurrentUserInfo() {
        try {
            const userIdResponse = await fetch('../api/user/get_current_user_id.php');
            
            if (!userIdResponse.ok) {
                throw new Error(`HTTP error! status: ${userIdResponse.status}`);
            }

            const userIdText = await userIdResponse.text();

            if (!userIdText.trim().startsWith('{') && !userIdText.trim().startsWith('[')) {
                throw new Error('Server trả về HTML thay vì JSON: ' + userIdText.substring(0, 100));
            }

            const userIdResult = JSON.parse(userIdText);
            
            if (!userIdResult.success) {
                return {
                    success: false,
                    message: userIdResult.message || 'Chưa đăng nhập'
                };
            }

            const userInfoResponse = await fetch('../api/user/get_user_info.php');
            
            if (!userInfoResponse.ok) {
                throw new Error(`HTTP error! status: ${userInfoResponse.status}`);
            }

            const userInfoText = await userInfoResponse.text();

            if (!userInfoText.trim().startsWith('{') && !userInfoText.trim().startsWith('[')) {
                throw new Error('Server trả về HTML thay vì JSON: ' + userInfoText.substring(0, 100));
            }

            const userInfoResult = JSON.parse(userInfoText);
            
            if (userInfoResult.success && userInfoResult.user) {
                return {
                    success: true,
                    user: userInfoResult.user,
                    userId: userIdResult.userId
                };
            } else {
                return {
                    success: false,
                    message: userInfoResult.message || 'Không thể lấy thông tin người dùng'
                };
            }
        } catch (error) {
            console.error('Get user info error:', error);
            return {
                success: false,
                message: 'Lỗi kết nối server: ' + error.message
            };
        }
    }

    async verifyUserPassword(userId, password) {
        try {
            const { PaymentAPI } = await import('../api/payment.js');
            const result = await PaymentAPI.verifyPassword(userId, password);
            return result.success;
            
        } catch (error) {
            console.error('Password verification error:', error);
            return false;
        }
    }

    async createPaymentRecord(accountNumber, userId) {
        try {
            const paymentData = {
                userId: userId,
                paymentMethod: this.selectedMethod,
                accountNumber: accountNumber,
                amount: this.totalAmount,
                showtime: this.bookingData.showtime,
                selectedSeats: this.bookingData.selectedSeats || [],
                selectedServices: this.bookingData.selectedServices || []
            };

            console.log('💳 Payment data to send:', paymentData);

            const { PaymentAPI } = await import('../api/payment.js');
            const result = await PaymentAPI.processPayment(paymentData);
            
            if (!result.success) {
                throw new Error(result.message || 'Lỗi xử lý thanh toán');
            }

            return result;
            
        } catch (error) {
            console.error('Payment processing error:', error);
            throw error;
        }
    }

    clearBookingData() {
        localStorage.removeItem('selectedShowtime');
        localStorage.removeItem('bookingData');
        localStorage.removeItem('selectedServices');
        localStorage.removeItem('reservationStartTime');
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
}

export default PaymentManager;