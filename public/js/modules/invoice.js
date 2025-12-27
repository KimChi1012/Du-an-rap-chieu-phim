class InvoiceManager {
    constructor() {
        this.invoiceData = null;
        this.init();
    }

    async init() {
        console.log('📄 Initializing Invoice Manager...');
        
        try {
            await this.loadHeaderFooter();
            this.loadInvoiceData();
            this.setupEventListeners();
            this.updateBookingSteps();
            
            console.log('✅ Invoice Manager initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing invoice manager:', error);
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

            const { loadUserInfo } = await import('./user-info.js');
            await loadUserInfo();
        } catch (error) {
            console.error('Error loading header/footer:', error);
        }
    }

    loadInvoiceData() {
        const urlParams = new URLSearchParams(window.location.search);
        const invoiceId = urlParams.get('invoice');
        
        if (!invoiceId) {
            console.error('❌ No invoice ID found');
            this.showErrorNotification('Không tìm thấy thông tin hóa đơn.');
            return;
        }

        this.fetchInvoiceData(invoiceId);
    }

    async showErrorNotification(message) {
        const { showNotification } = await import('./notification.js');
        showNotification(message, 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }

    async fetchInvoiceData(invoiceId) {
        try {
            const { PaymentAPI } = await import('../api/payment.js');
            const result = await PaymentAPI.getInvoice(invoiceId);
            
            if (!result.success) {
                throw new Error(result.message || 'Lỗi tải hóa đơn');
            }

            this.invoiceData = result.data;
            this.renderInvoice();
            
        } catch (error) {
            console.error('❌ Error fetching invoice:', error);
            this.showErrorNotification('Lỗi tải thông tin hóa đơn: ' + error.message);
        }
    }

    renderInvoice() {
        const container = document.getElementById('invoiceContent');
        const invoice = this.invoiceData;
        
        const html = `
            <div class="ticket-wrapper">
                <!-- Left Section - Main Info -->
                <div class="ticket-left">
                    <div class="cinema-header">
                        <div class="cinema-logo">
                            <h1>HIGH CINEMA</h1>
                        </div>
                        <p class="ticket-title">Vé Điện Tử - E-Ticket</p>
                    </div>

                    <div class="movie-section">
                        <h2 class="movie-title">${invoice.TenPhim || 'Chưa có thông tin phim'}</h2>
                        <p class="movie-format">${this.getMovieFormat(invoice)}</p>
                        
                        <div class="showtime-info">
                            <div class="info-group">
                                <h4>Ngày chiếu</h4>
                                <p class="value">${this.formatDate(invoice.NgayChieu)}</p>
                            </div>
                            <div class="info-group">
                                <h4>Giờ chiếu</h4>
                                <p class="value">${this.formatTime(invoice.GioBatDau)}</p>
                            </div>
                            <div class="info-group">
                                <h4>Phòng chiếu</h4>
                                <p class="value">${invoice.TenPhong || 'N/A'}</p>
                            </div>
                            <div class="info-group">
                                <h4>Khách hàng</h4>
                                <p class="value">${invoice.HoTen}</p>
                            </div>
                        </div>
                    </div>

                    <div class="seats-section">
                        <h4 class="seats-title">Ghế đã chọn</h4>
                        <div class="seats-list">
                            ${this.renderSeatsList(invoice.seats)}
                        </div>
                    </div>
                </div>

                <!-- Perforation Line -->
                <div class="perforation"></div>

                <!-- Right Section - Details -->
                <div class="ticket-right">
                    <div class="invoice-header">
                        <h3>HÓA ĐƠN ĐIỆN TỬ</h3>
                        <p class="invoice-number gradient-text-main">${invoice.MaHD}</p>
                    </div>

                    <div class="ticket-details">
                        <div class="detail-row">
                            <span class="detail-label">Mã thanh toán</span>
                            <span class="detail-value">${invoice.MaThanhToan}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Ngày lập</span>
                            <span class="detail-value">${this.formatShortDate(invoice.NgayLap)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Phương thức</span>
                            <span class="detail-value">${invoice.PhuongThuc}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Số ghế</span>
                            <span class="detail-value">${invoice.seats ? invoice.seats.length : 0}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Email</span>
                            <span class="detail-value">${invoice.Email}</span>
                        </div>
                        
                        ${this.renderServicesSection(invoice.services)}
                    </div>

                    <div class="total-section">
                        <p class="total-label">Tổng thanh toán</p>
                        <p class="total-amount">${this.formatPrice(invoice.TongTien)}</p>
                        <span class="payment-status">${invoice.TrangThai}</span>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    renderSeatsList(seats) {
        if (!seats || seats.length === 0) {
            return '<span class="seat-item">Chưa có ghế</span>';
        }

        return seats.map(seat => 
            `<span class="seat-item">${seat.SoHang}${seat.SoCot}</span>`
        ).join('');
    }

    renderServicesSection(services) {
        if (!services || services.length === 0) {
            return '';
        }

        const servicesHtml = services.map(service => `
            <div class="detail-row">
                <span class="detail-label">${service.TenDV} (x${service.SoLuong})</span>
                <span class="detail-value">${this.formatCompactPrice(service.ThanhTien)}</span>
            </div>
        `).join('');

        return `
            <div class="services-section">
                <div class="services-divider"></div>
                ${servicesHtml}
            </div>
        `;
    }

    formatShortDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatCompactPrice(price) {
        const numPrice = parseInt(price);
        if (numPrice >= 1000000) {
            return (numPrice / 1000000).toFixed(1) + 'M';
        } else if (numPrice >= 1000) {
            return (numPrice / 1000).toFixed(0) + 'K';
        }
        return numPrice.toLocaleString('vi-VN');
    }

    renderSeatsInfo(seats) {
        if (!seats || seats.length === 0) {
            return '<div class="seats-info"><h3>Ghế đã chọn</h3><p>Không có thông tin ghế</p></div>';
        }

        const seatsHtml = seats.map(seat => {
            const seatType = this.normalizeSeatType(seat.LoaiGhe);
            return `<span class="seat-badge ${seatType}">${seat.SoHang}${seat.SoCot}</span>`;
        }).join('');

        const totalSeatPrice = seats.reduce((sum, seat) => sum + parseInt(seat.GiaVe), 0);

        return `
            <div class="seats-info">
                <h3><i class="fas fa-couch"></i> Ghế đã chọn</h3>
                <div class="info-row">
                    <span class="info-label">Số lượng ghế:</span>
                    <span class="info-value">${seats.length} ghế</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Vị trí ghế:</span>
                    <div class="info-value">
                        <div class="seats-grid">${seatsHtml}</div>
                    </div>
                </div>
                <div class="info-row">
                    <span class="info-label">Tổng tiền ghế:</span>
                    <span class="info-value">${this.formatPrice(totalSeatPrice)}</span>
                </div>
            </div>
        `;
    }

    renderServicesInfo(services) {
        if (!services || services.length === 0) {
            return '<div class="services-info"><h3>Dịch vụ</h3><p>Không có dịch vụ nào được chọn</p></div>';
        }

        const servicesHtml = services.map(service => `
            <div class="service-item">
                <div>
                    <div class="service-name">${service.TenDV}</div>
                    <div class="service-qty">Số lượng: ${service.SoLuong}</div>
                </div>
                <div class="service-price">${this.formatPrice(service.ThanhTien)}</div>
            </div>
        `).join('');

        const totalServicePrice = services.reduce((sum, service) => sum + parseInt(service.ThanhTien), 0);

        return `
            <div class="services-info">
                <h3><i class="fas fa-coffee"></i> Dịch vụ đã chọn</h3>
                ${servicesHtml}
                <div class="info-row" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                    <span class="info-label">Tổng tiền dịch vụ:</span>
                    <span class="info-value">${this.formatPrice(totalServicePrice)}</span>
                </div>
            </div>
        `;
    }

    renderTotalInfo(invoice) {
        const seatTotal = invoice.seats ? invoice.seats.reduce((sum, seat) => sum + parseInt(seat.GiaVe), 0) : 0;
        const serviceTotal = invoice.services ? invoice.services.reduce((sum, service) => sum + parseInt(service.ThanhTien), 0) : 0;

        return `
            <div class="total-section">
                <h3>Tổng kết thanh toán</h3>
                <div class="total-row">
                    <span>Tiền vé:</span>
                    <span>${this.formatPrice(seatTotal)}</span>
                </div>
                <div class="total-row">
                    <span>Tiền dịch vụ:</span>
                    <span>${this.formatPrice(serviceTotal)}</span>
                </div>
                <div class="total-row final">
                    <span>TỔNG CỘNG:</span>
                    <span>${this.formatPrice(invoice.TongTien)}</span>
                </div>
            </div>
        `;
    }

    updateBookingSteps() {
        const stepsContainer = document.getElementById('booking-steps');
        if (!stepsContainer) return;

        stepsContainer.innerHTML = `
            <div class="steps step-6">
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
                <div class="step completed">
                    <span class="circle">5</span>
                    <span class="step-text">Thanh toán</span>
                </div>
                <div class="step active">
                    <span class="circle">6</span>
                    <span class="step-text">Nhận hoá đơn</span>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadInvoice();
            });
        }
    }

    downloadInvoice() {
        const invoiceContent = document.querySelector('.invoice-container').cloneNode(true);

        const actions = invoiceContent.querySelector('.invoice-actions');
        if (actions) {
            actions.remove();
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Hóa đơn - ${this.invoiceData.MaHD}</title>
                <meta charset="UTF-8">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <link href="https://fonts.googleapis.com/css?family=Stint+Ultra+Expanded" rel="stylesheet">
                <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <link rel="stylesheet" href="css/base/variables.css">
                <link rel="stylesheet" href="css/style.css">
                <link rel="stylesheet" href="css/components/invoice.css">
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        background: white; 
                        font-family: 'Be Vietnam Pro', sans-serif;
                    }
                    .invoice-container { 
                        box-shadow: none; 
                        border: 1px solid #ddd; 
                        max-width: none;
                        width: 100%;
                    }
                    .ticket-left {
                        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%) !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    .ticket-right {
                        background: #f8f9fa !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    .gradient-text-main {
                        background: linear-gradient(#8a3b08, #e59d2c, #2e4365) !important;
                        -webkit-background-clip: text !important;
                        -webkit-text-fill-color: transparent !important;
                        background-clip: text !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                </style>
            </head>
            <body>
                ${invoiceContent.outerHTML}
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 500);
                    }
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
    }

    getMovieFormat(invoice) {
        const dinhDang = invoice.DinhDang || '2D';
        const ngonNgu = invoice.NgonNgu || 'Phụ Đề';

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

    formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
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

export default InvoiceManager;