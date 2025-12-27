import { loadUserInfo } from './user-info.js';
import { initNotification, showNotification } from './notification.js';

class ServiceSelectionSystem {
    constructor() {
        this.bookingData = null;
        this.servicesData = [];
        this.selectedServices = [];
        
        this.init();
    }

    async init() {
        console.log('🛍️ Initializing Service Selection System...');
        
        try {
            await this.loadHeaderFooter();
            
            this.loadBookingData();
            
            await this.loadServicesData();

            this.loadPreviouslySelectedServices();

            this.setupEventListeners();

            this.setupPageExitHandler();
            
            // Đảm bảo nút tiếp tục luôn được enable ngay từ đầu
            setTimeout(() => {
                this.updateNextButton();
            }, 100);
            
            console.log('✅ Service Selection System initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing service selection system:', error);
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
                        stepsContainer.className = 'steps step-3';

                        const steps = stepsContainer.querySelectorAll('.step');
                        if (steps[0]) steps[0].classList.add('completed');
                        if (steps[1]) steps[1].classList.add('completed');
                        if (steps[2]) steps[2].classList.add('active');
                    }
                    
                    console.log('✅ Booking steps loaded and updated for service selection');
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
            
            const urlParams = new URLSearchParams(window.location.search);
            const showtimeId = urlParams.get('showtime');
            
            if (showtimeId) {
                console.log('🔍 Found showtime in URL, redirecting to seat selection...');
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

            this.updateURLWithShowtime();
            
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

            window.history.replaceState({}, '', currentUrl);
            console.log('🔗 Updated URL with showtime parameter');
        }
    }

    async loadServicesData() {
        try {
            console.log('🛍️ Loading services data...');
            
            // Thử nhiều đường dẫn khác nhau
            const possiblePaths = [
                '../api/booking/get_services.php',
                'api/booking/get_services.php',
                '/api/booking/get_services.php'
            ];
            
            let response = null;
            let lastError = null;
            
            for (const path of possiblePaths) {
                try {
                    console.log(`Trying path: ${path}`);
                    response = await fetch(path);
                    if (response.ok) {
                        console.log(`✅ Success with path: ${path}`);
                        break;
                    } else {
                        console.log(`❌ Failed with path: ${path}, status: ${response.status}`);
                    }
                } catch (error) {
                    console.log(`❌ Error with path: ${path}`, error);
                    lastError = error;
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`HTTP ${response?.status || 'Network Error'}: ${response?.statusText || lastError?.message || 'Failed to fetch'}`);
            }
            
            const text = await response.text();
            console.log('📡 Raw API Response:', text);
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError);
                throw new Error('Invalid JSON response from server: ' + text.substring(0, 100));
            }
            
            console.log('📡 Parsed Services API Response:', data);
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load services data');
            }
            
            this.servicesData = data.services || [];
            
            this.renderServices();
            
            console.log('✅ Services data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading services data:', error);
            this.showError('Không thể tải dữ liệu dịch vụ: ' + error.message);
        }
    }

    renderServices() {
        const servicesContainer = document.getElementById('servicesContainer');
        
        if (this.servicesData.length === 0) {
            servicesContainer.innerHTML = `
                <div class="no-services">
                    <i class="fas fa-coffee"></i>
                    <p>Hiện tại không có dịch vụ nào</p>
                </div>
            `;
            return;
        }

        let html = '';
        
        this.servicesData.forEach(service => {
            html += `
                <div class="service-item" data-service-id="${service.MaDichVu}">
                    <div class="service-image">
                        <img src="${service.HinhAnh || 'images/default-service.jpg'}" 
                             alt="${service.TenDichVu}" 
                             onerror="this.src='images/default-service.jpg'">
                    </div>
                    <div class="service-info">
                        <h4 class="service-name">${service.TenDichVu}</h4>
                        <p class="service-description">${service.MoTa || ''}</p>
                        <div class="price-controls-row">
                            <div class="service-price">${this.formatPrice(service.Gia)}</div>
                            <div class="service-controls">
                                <button class="quantity-btn minus" data-action="decrease">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="quantity">0</span>
                                <button class="quantity-btn plus" data-action="increase">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        servicesContainer.innerHTML = html;
        
        this.addServiceEventListeners();
        
        // Đảm bảo nút tiếp tục được enable sau khi render services
        this.updateNextButton();
        
        console.log('✅ Services rendered');
    }

    addServiceEventListeners() {
        const serviceItems = document.querySelectorAll('.service-item');
        
        serviceItems.forEach(item => {
            const serviceId = item.dataset.serviceId;
            const minusBtn = item.querySelector('.quantity-btn.minus');
            const plusBtn = item.querySelector('.quantity-btn.plus');
            
            minusBtn.addEventListener('click', () => {
                this.updateServiceQuantity(serviceId, -1);
            });
            
            plusBtn.addEventListener('click', () => {
                this.updateServiceQuantity(serviceId, 1);
            });
        });
    }

    updateServiceQuantity(serviceId, change) {
        const service = this.servicesData.find(s => s.MaDichVu == serviceId);
        if (!service) return;

        let existingService = this.selectedServices.find(s => s.id == serviceId);
        
        if (!existingService) {
            if (change > 0) {
                existingService = {
                    id: serviceId,
                    name: service.TenDichVu,
                    price: service.Gia,
                    quantity: 0
                };
                this.selectedServices.push(existingService);
            } else {
                return;
            }
        }

        existingService.quantity += change;

        if (existingService.quantity <= 0) {
            this.selectedServices = this.selectedServices.filter(s => s.id != serviceId);
            existingService.quantity = 0;
        }

        const serviceItem = document.querySelector(`[data-service-id="${serviceId}"]`);
        const quantitySpan = serviceItem.querySelector('.quantity');
        quantitySpan.textContent = existingService.quantity;

        const minusBtn = serviceItem.querySelector('.quantity-btn.minus');
        minusBtn.disabled = existingService.quantity <= 0;

        localStorage.setItem('selectedServices', JSON.stringify(this.selectedServices));

        this.updateSummary();
        this.updateNextButton();

        console.log('🛍️ Updated service quantity:', {
            serviceId,
            quantity: existingService.quantity,
            selectedServices: this.selectedServices
        });
    }

    updateSummary() {
        if (!this.bookingData) return;

        const showtime = this.bookingData.showtime;
        
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
            `<b>High Cinema</b> - ${showtime.TenPhong || 'Đang tải...'}`;
        
        const date = new Date(showtime.NgayChieu);
        const formattedDate = date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        document.getElementById('showtimeInfo').innerHTML = 
            `Suất: <b>${this.formatTime(showtime.GioBatDau)}</b> - ${formattedDate}`;

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

        const seatTotal = this.bookingData.totalPrice || 0;
        const serviceTotal = this.selectedServices.reduce((sum, service) => 
            sum + (service.price * service.quantity), 0);
        const totalPrice = seatTotal + serviceTotal;

        document.getElementById('totalPrice').textContent = this.formatPrice(totalPrice);
        
        // Đảm bảo nút tiếp tục luôn được enable
        this.updateNextButton();
    }

    updateNextButton() {
        const nextBtn = document.getElementById('nextBtn');
        
        if (nextBtn) {
            // Luôn cho phép tiếp tục, không cần chọn dịch vụ
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
        }
    }

    setupEventListeners() {
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.proceedToNextStep();
            });
        }

        const backBtn = document.getElementById('backBtn');
        if (backBtn && this.bookingData) {
            const urlParams = new URLSearchParams();
            urlParams.set('showtime', this.bookingData.showtime.MaSuat);
            backBtn.href = `seat-selection.html?${urlParams.toString()}`;

            backBtn.addEventListener('click', () => {
                sessionStorage.setItem('returningFromService', 'true');
                console.log('🔙 User clicking back to seat selection, marked as returning');
            });
        }
    }

    proceedToNextStep() {
        const updatedBookingData = {
            ...this.bookingData,
            selectedServices: this.selectedServices,
            serviceTotal: this.selectedServices.reduce((sum, service) => 
                sum + (service.price * service.quantity), 0)
        };

        updatedBookingData.totalPrice = (this.bookingData.totalPrice || 0) + updatedBookingData.serviceTotal;
        
        localStorage.setItem('bookingData', JSON.stringify(updatedBookingData));
        localStorage.setItem('selectedServices', JSON.stringify(this.selectedServices));
        
        sessionStorage.setItem('bookingInProgress', 'true');
        
        console.log('🎫 Updated booking data with services:', updatedBookingData);
        
        // Chuyển đến trang xác nhận với thông tin showtime trong URL
        window.location.href = `booking-confirmation.html?showtime=${this.bookingData.showtime.MaSuat}`;
    }

    setupPageExitHandler() {
        // Đánh dấu khi trang được load
        sessionStorage.setItem('servicePageLoaded', 'true');
        
        // Xử lý khi user rời khỏi trang
        window.addEventListener('beforeunload', () => {
            const bookingInProgress = sessionStorage.getItem('bookingInProgress');
            const returningFromService = sessionStorage.getItem('returningFromService');
            
            // Luôn lưu services đã chọn
            if (this.selectedServices.length > 0) {
                localStorage.setItem('selectedServices', JSON.stringify(this.selectedServices));
                console.log('💾 Saved selected services before page unload');
            }
            
            // Chỉ xóa booking data nếu không đang trong flow booking và không phải đang chuyển đến confirmation
            const isGoingToConfirmation = window.location.href.includes('booking-confirmation.html') || 
                                         document.referrer.includes('booking-confirmation.html');
            
            if (!bookingInProgress && !returningFromService && !isGoingToConfirmation) {
                console.log('🧹 User exiting service selection, clearing booking data...');
                localStorage.removeItem('bookingData');
                localStorage.removeItem('reservationStartTime');
            } else {
                console.log('💾 Keeping booking data (in booking flow or going to confirmation)');
            }
        });

        // Auto-save định kỳ
        this.autoSaveInterval = setInterval(() => {
            if (this.selectedServices.length > 0) {
                localStorage.setItem('selectedServices', JSON.stringify(this.selectedServices));
                console.log('💾 Auto-saved selected services');
            }
        }, 5000);
    }

    clearAllBookingData() {
        localStorage.removeItem('selectedShowtime');
        localStorage.removeItem('bookingData');
        localStorage.removeItem('reservationStartTime');
        localStorage.removeItem('selectedServices');
        
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        console.log('🧹 All booking data cleared from service selection');
    }

    showError(message) {
        const servicesContainer = document.getElementById('servicesContainer');
        servicesContainer.innerHTML = `
            <div style="text-align: center; color: #dc3545; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
                <h3>Có lỗi xảy ra</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; margin-top: 15px;">
                    Thử lại
                </button>
                <br>
                <a href="seat-selection.html" style="display: inline-block; margin-top: 10px; color: #007bff;">
                    Quay lại chọn ghế
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
    
    loadPreviouslySelectedServices() {
        const selectedServicesStr = localStorage.getItem('selectedServices');
        
        if (selectedServicesStr) {
            try {
                const services = JSON.parse(selectedServicesStr);
                
                if (services && services.length > 0) {
                    console.log('📦 Found previously selected services:', services);

                    setTimeout(() => {
                        services.forEach(service => {
                            const serviceItem = document.querySelector(`[data-service-id="${service.id}"]`);
                            
                            if (serviceItem) {
                                const quantitySpan = serviceItem.querySelector('.quantity');
                                quantitySpan.textContent = service.quantity;
                                
                                const minusBtn = serviceItem.querySelector('.quantity-btn.minus');
                                minusBtn.disabled = service.quantity <= 0;
                                
                                const existingIndex = this.selectedServices.findIndex(s => s.id == service.id);
                                if (existingIndex >= 0) {
                                    this.selectedServices[existingIndex] = service;
                                } else {
                                    this.selectedServices.push(service);
                                }
                            }
                        });

                        this.updateSummary();
                        this.updateNextButton();
                        
                        console.log('✅ Restored previously selected services');
                    }, 500);
                }
            } catch (error) {
                console.error('Error loading previously selected services:', error);
                localStorage.removeItem('selectedServices');
            }
        }
    }
}

export default ServiceSelectionSystem;