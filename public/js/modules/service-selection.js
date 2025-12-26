import { initUserSidebar } from './user-sidebar.js';
import { initDropdown } from './dropdown.js';
import { loadUserInfo } from './user-info.js';
import { initVideoModal } from './video-modal.js';
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

            initUserSidebar();
            initDropdown();
            await loadUserInfo();
            initVideoModal();
            initNotification();
        } catch (error) {
            console.error('Error loading header/footer or booking components:', error);
        }
    }

    loadBookingData() {
        const bookingDataStr = localStorage.getItem('bookingData');
        
        if (!bookingDataStr) {
            console.error('❌ No booking data found');
            if (confirm('Không tìm thấy thông tin đặt vé.\n\nQuay lại trang chọn ghế?')) {
                window.location.href = 'seat-selection.html';
            }
            return;
        }

        try {
            this.bookingData = JSON.parse(bookingDataStr);
            console.log('📦 Loaded booking data:', this.bookingData);
            
            this.updateSummary();
        } catch (error) {
            console.error('❌ Error parsing booking data:', error);
            if (confirm('Dữ liệu đặt vé không hợp lệ.\n\nQuay lại trang chọn ghế?')) {
                window.location.href = 'seat-selection.html';
            }
        }
    }

    async loadServicesData() {
        try {
            console.log('🛍️ Loading services data...');
            
            const response = await fetch('../api/booking/get_services.php');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📡 Services API Response:', data);
            
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
    }

    updateNextButton() {
        const nextBtn = document.getElementById('nextBtn');
        
        if (nextBtn) {
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
        
        showNotification(
            'Tính năng xác nhận vé trước khi thanh toán đang phát triển. Vui lòng quay lại sau!',
            'info'
        );
    }

    setupPageExitHandler() {
        window.addEventListener('beforeunload', () => {
            const bookingInProgress = sessionStorage.getItem('bookingInProgress');
            
            if (!bookingInProgress) {
                console.log('🧹 User exiting service selection without continuing, clearing data...');
                this.clearAllBookingData();
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
        const bookingInProgress = sessionStorage.getItem('bookingInProgress');
        if (!bookingInProgress) {
            console.log('🚫 Not in booking progress, skipping service restoration');
            return;
        }

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
                                
                                this.selectedServices.push(service);
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