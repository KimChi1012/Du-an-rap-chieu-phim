// Revenue Management Module
import { showNotification } from './notification.js';

class RevenueManagement {
    constructor() {
        this.chart = null;
        this.init();
    }

    init() {
        this.loadRevenueStats();
        this.loadTopInvoices();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Setup any additional event listeners if needed
        document.addEventListener('DOMContentLoaded', () => {
            this.loadRevenueStats();
            this.loadTopInvoices();
        });

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('invoiceModal');
            if (e.target === modal) {
                this.closeInvoiceModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeInvoiceModal();
            }
        });
    }

    async loadRevenueStats() {
        try {
            const response = await fetch('../api/revenue/get_revenue.php?action=stats');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.updateStatsCards(data.data);
            } else {
                console.error('Error loading revenue stats:', data.message || data.error);
                this.showError('Không thể tải thống kê doanh thu');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Lỗi kết nối khi tải thống kê');
        }
    }

    updateStatsCards(stats) {
        const elements = {
            totalRevenue: document.getElementById('totalRevenue'),
            todayRevenue: document.getElementById('todayRevenue'),
            monthRevenue: document.getElementById('monthRevenue'),
            totalInvoices: document.getElementById('totalInvoices')
        };

        if (elements.totalRevenue) {
            elements.totalRevenue.textContent = this.formatCurrency(stats.total_revenue || 0);
        }
        if (elements.todayRevenue) {
            elements.todayRevenue.textContent = this.formatCurrency(stats.today_revenue || 0);
        }
        if (elements.monthRevenue) {
            elements.monthRevenue.textContent = this.formatCurrency(stats.month_revenue || 0);
        }
        if (elements.totalInvoices) {
            elements.totalInvoices.textContent = stats.total_invoices || 0;
        }
    }

    async loadTopInvoices() {
        try {
            const response = await fetch('../api/revenue/get_revenue.php?action=top_invoices');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.renderTopInvoices(data.data);
            } else {
                console.error('Error loading top invoices:', data.message || data.error);
                this.showError('Không thể tải danh sách hóa đơn');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Lỗi kết nối khi tải hóa đơn');
        }
    }

    renderTopInvoices(invoices) {
        const tableBody = document.getElementById('topInvoicesTable');
        if (!tableBody) return;

        if (!invoices || invoices.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-8 text-gray-500">
                        Không có dữ liệu hóa đơn
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = invoices.map(invoice => {
            const movieName = invoice.TenPhim || 'N/A';
            const movieClass = movieName === 'Chỉ dịch vụ' ? 'gradient-text-main font-medium' : 'text-gray-700';
            
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium text-gray-900">${invoice.MaHD}</td>
                    <td class="px-4 py-3 text-gray-700">${invoice.HoTen || 'N/A'}</td>
                    <td class="px-4 py-3 text-gray-700">${invoice.Email || 'N/A'}</td>
                    <td class="px-4 py-3 ${movieClass}">${movieName}</td>
                    <td class="px-4 py-3 text-center text-gray-700">${this.formatDateShort(invoice.NgayTao)}</td>
                    <td class="px-4 py-3 text-center">
                        <span class="gradient-text-main font-semibold">${this.formatCurrency(invoice.TongTien)}</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <div class="revenue-action-button-wrapper">
                            <button onclick="window.revenueManagement?.showInvoiceModal('${invoice.MaHD}')" class="revenue-action-button">
                                <span>Xem</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    toggleFilterInputs() {
        const reportType = document.getElementById('reportType').value;
        const dateFilter = document.getElementById('dateFilter');
        const monthFilter = document.getElementById('monthFilter');
        const yearFilter = document.getElementById('yearFilter');
        const chartTypeFilter = document.getElementById('chartTypeFilter');
        const filterButtonGroup = document.getElementById('filterButtonGroup');

        // Hide all filters first
        [dateFilter, monthFilter, yearFilter, chartTypeFilter, filterButtonGroup].forEach(el => {
            if (el) el.style.display = 'none';
        });

        // Show relevant filters based on report type
        if (reportType) {
            if (chartTypeFilter) chartTypeFilter.style.display = 'flex';
            if (filterButtonGroup) filterButtonGroup.style.display = 'flex';

            switch (reportType) {
                case 'daily':
                    if (dateFilter) dateFilter.style.display = 'flex';
                    break;
                case 'monthly':
                    if (monthFilter) monthFilter.style.display = 'flex';
                    break;
                case 'yearly':
                    // No additional filter needed for yearly
                    break;
            }
        }
    }

    async loadFilteredRevenue() {
        const reportType = document.getElementById('reportType').value;
        const filterMonth = document.getElementById('filterMonth').value;
        const filterYear = document.getElementById('filterYear').value;
        const chartType = document.getElementById('chartType').value;

        if (!reportType) {
            this.showError('Vui lòng chọn loại báo cáo');
            return;
        }

        try {
            let url = `../api/revenue/get_revenue.php?action=filtered&type=${reportType}`;
            
            if (reportType === 'daily' && filterMonth) {
                url += `&month=${filterMonth}`;
            } else if (reportType === 'monthly' && filterYear) {
                url += `&year=${filterYear}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                this.renderFilteredResult(data.data, reportType, chartType);
                this.showSuccess('Tải báo cáo thành công');
            } else {
                console.error('Error loading filtered revenue:', data.message);
                this.showError('Không thể tải dữ liệu báo cáo');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Lỗi kết nối khi tải báo cáo');
        }
    }

    renderFilteredResult(data, reportType, chartType) {
        const resultContainer = document.getElementById('filteredResult');
        if (!resultContainer) return;

        if (!data || data.length === 0) {
            resultContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    Không có dữ liệu cho khoảng thời gian đã chọn
                </div>
            `;
            return;
        }

        // Create chart container
        resultContainer.innerHTML = `
            <div class="chart-container">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                    Biểu đồ doanh thu ${this.getReportTypeLabel(reportType)}
                </h3>
                <div class="chart-wrapper">
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>
        `;

        // Render chart
        this.renderChart(data, reportType, chartType);
    }

    renderChart(data, reportType, chartType) {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        const labels = data.map(item => {
            switch (reportType) {
                case 'daily':
                    return this.formatDateShort(item.date);
                case 'monthly':
                    return `Tháng ${item.month}`;
                case 'yearly':
                    return `Năm ${item.year}`;
                default:
                    return item.label || '';
            }
        });

        const revenues = data.map(item => parseFloat(item.revenue) || 0);

        // Create gradient matching website theme
        const barGradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        barGradient.addColorStop(0, 'rgba(138, 59, 8, 0.8)');      // #8a3b08
        barGradient.addColorStop(0.5, 'rgba(229, 157, 44, 0.6)');  // #e59d2c
        barGradient.addColorStop(1, 'rgba(46, 67, 101, 0.4)');     // #2e4365

        // Create gradient for line area
        const lineGradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        lineGradient.addColorStop(0, 'rgba(138, 59, 8, 0.3)');
        lineGradient.addColorStop(0.5, 'rgba(229, 157, 44, 0.2)');
        lineGradient.addColorStop(1, 'rgba(46, 67, 101, 0.1)');

        // Create border gradient matching website theme
        const borderGradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        borderGradient.addColorStop(0, '#8a3b08');
        borderGradient.addColorStop(0.5, '#e59d2c');
        borderGradient.addColorStop(1, '#2e4365');

        this.chart = new Chart(ctx, {
            type: chartType || 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Doanh thu (VNĐ)',
                    data: revenues,
                    backgroundColor: chartType === 'line' ? lineGradient : barGradient,
                    borderColor: borderGradient,
                    borderWidth: 3,
                    fill: chartType === 'line',
                    tension: chartType === 'line' ? 0.4 : 0,
                    pointBackgroundColor: chartType === 'line' ? borderGradient : undefined,
                    pointBorderColor: chartType === 'line' ? '#ffffff' : undefined,
                    pointBorderWidth: chartType === 'line' ? 2 : 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            color: '#374151'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.08)',
                            drawBorder: false
                        },
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ';
                            },
                            font: {
                                size: 11
                            },
                            color: '#6b7280'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.08)',
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            color: '#6b7280'
                        }
                    }
                },
                elements: {
                    point: {
                        radius: chartType === 'line' ? 6 : 0,
                        hoverRadius: chartType === 'line' ? 8 : 0
                    },
                    bar: {
                        borderRadius: chartType === 'bar' ? 4 : 0,
                        borderSkipped: false
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    getReportTypeLabel(type) {
        const labels = {
            'daily': 'theo ngày',
            'monthly': 'theo tháng',
            'yearly': 'theo năm'
        };
        return labels[type] || '';
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatDateShort(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    }

    showError(message) {
        showNotification(message, 'warning');
    }

    showSuccess(message) {
        showNotification(message, 'success');
    }

    // Invoice Modal Methods
    async showInvoiceModal(invoiceId) {
        const modal = document.getElementById('invoiceModal');
        const content = document.getElementById('invoiceModalContent');
        
        if (!modal || !content) return;

        // Show modal
        modal.style.display = 'flex';
        
        // Show loading
        content.innerHTML = `
            <div class="revenue-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Đang tải thông tin hóa đơn...</p>
            </div>
        `;

        try {
            // Fetch invoice data
            const { PaymentAPI } = await import('../api/payment.js');
            const result = await PaymentAPI.getInvoice(invoiceId);
            
            if (!result.success) {
                throw new Error(result.message || 'Lỗi tải hóa đơn');
            }

            this.currentInvoiceData = result.data;
            this.renderInvoiceModal(result.data);
            
        } catch (error) {
            console.error('❌ Error fetching invoice:', error);
            content.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p>Lỗi tải thông tin hóa đơn: ${error.message}</p>
                    <button onclick="window.revenueManagement?.closeInvoiceModal()" class="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                        Đóng
                    </button>
                </div>
            `;
        }
    }

    renderInvoiceModal(invoice) {
        const content = document.getElementById('invoiceModalContent');
        if (!content) return;

        const html = `
            <div class="revenue-ticket-wrapper">
                <!-- Left Section - Main Info -->
                <div class="revenue-ticket-left">
                    <div class="revenue-cinema-header">
                        <div class="cinema-logo">
                            <h1>HIGH CINEMA</h1>
                        </div>
                        <p class="revenue-ticket-title">Vé Điện Tử - E-Ticket</p>
                    </div>

                    <div class="revenue-movie-section">
                        <h2 class="revenue-movie-title">${invoice.TenPhim || 'Chưa có thông tin phim'}</h2>
                        <p class="revenue-movie-format">${this.getMovieFormat(invoice)}</p>
                        
                        <div class="revenue-showtime-info">
                            <div class="revenue-info-group">
                                <h4>Ngày chiếu</h4>
                                <p class="revenue-value">${this.formatDate(invoice.NgayChieu)}</p>
                            </div>
                            <div class="revenue-info-group">
                                <h4>Giờ chiếu</h4>
                                <p class="revenue-value">${this.formatTime(invoice.GioBatDau)}</p>
                            </div>
                            <div class="revenue-info-group">
                                <h4>Phòng chiếu</h4>
                                <p class="revenue-value">${invoice.TenPhong || 'N/A'}</p>
                            </div>
                            <div class="revenue-info-group">
                                <h4>Khách hàng</h4>
                                <p class="revenue-value">${invoice.HoTen}</p>
                            </div>
                        </div>
                    </div>

                    <div class="revenue-seats-section">
                        <h4 class="revenue-seats-title">Ghế đã chọn</h4>
                        <div class="revenue-seats-list">
                            ${this.renderSeatsList(invoice.seats)}
                        </div>
                    </div>
                </div>

                <!-- Perforation Line -->
                <div class="perforation"></div>

                <!-- Right Section - Details -->
                <div class="revenue-ticket-right">
                    <div class="revenue-invoice-header">
                        <h3>HÓA ĐƠN ĐIỆN TỬ</h3>
                        <p class="revenue-invoice-number revenue-gradient-text-main">${invoice.MaHD}</p>
                    </div>

                    <div class="revenue-ticket-details">
                        <div class="revenue-detail-row">
                            <span class="revenue-detail-label">Mã thanh toán</span>
                            <span class="revenue-detail-value">${invoice.MaThanhToan}</span>
                        </div>
                        <div class="revenue-detail-row">
                            <span class="revenue-detail-label">Ngày lập</span>
                            <span class="revenue-detail-value">${this.formatShortDate(invoice.NgayLap)}</span>
                        </div>
                        <div class="revenue-detail-row">
                            <span class="revenue-detail-label">Phương thức</span>
                            <span class="revenue-detail-value">${invoice.PhuongThuc}</span>
                        </div>
                        <div class="revenue-detail-row">
                            <span class="revenue-detail-label">Số ghế</span>
                            <span class="revenue-detail-value">${invoice.seats ? invoice.seats.length : 0}</span>
                        </div>
                        <div class="revenue-detail-row">
                            <span class="revenue-detail-label">Email</span>
                            <span class="revenue-detail-value">${invoice.Email}</span>
                        </div>
                        
                        ${this.renderServicesSection(invoice.services)}
                    </div>

                    <div class="revenue-total-section">
                        <p class="revenue-total-label">Tổng thanh toán</p>
                        <p class="revenue-total-amount">${this.formatPrice(invoice.TongTien)}</p>
                        <span class="revenue-payment-status">${invoice.TrangThai}</span>
                    </div>
                </div>
            </div>
        `;

        content.innerHTML = html;
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

    formatTime(timeString) {
        if (!timeString) return '';
        const timeParts = timeString.split(':');
        return `${timeParts[0]}:${timeParts[1]}`;
    }

    formatFullDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatShortDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
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

    closeInvoiceModal() {
        const modal = document.getElementById('invoiceModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    printInvoice() {
        if (!this.currentInvoiceData) return;

        // Create a temporary invoice container to mimic the original invoice page structure
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `<div class="invoice-container">${document.getElementById('invoiceModalContent').innerHTML}</div>`;
        const invoiceContent = tempDiv.querySelector('.invoice-container');

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Hóa đơn - ${this.currentInvoiceData.MaHD}</title>
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
                    .ticket-wrapper {
                        display: flex;
                        flex-direction: column;
                        min-height: auto;
                        page-break-inside: avoid;
                    }
                    .ticket-left {
                        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%) !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                        flex: none;
                        width: 100%;
                    }
                    .ticket-right {
                        background: #f8f9fa !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                        flex: none;
                        width: 100%;
                        border-left: none;
                        border-top: 2px dashed #ddd;
                    }
                    .gradient-text-main {
                        background: linear-gradient(#8a3b08, #e59d2c, #2e4365) !important;
                        -webkit-background-clip: text !important;
                        -webkit-text-fill-color: transparent !important;
                        background-clip: text !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    .perforation {
                        display: none;
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

    downloadInvoice() {
        if (!this.currentInvoiceData) return;

        // Create a temporary invoice container to mimic the original invoice page structure
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `<div class="invoice-container">${document.getElementById('invoiceModalContent').innerHTML}</div>`;
        const invoiceContent = tempDiv.querySelector('.invoice-container');

        const actions = invoiceContent.querySelector('.invoice-actions');
        if (actions) {
            actions.remove();
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Hóa đơn - ${this.currentInvoiceData.MaHD}</title>
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
                    .ticket-wrapper {
                        display: flex;
                        flex-direction: column;
                        min-height: auto;
                        page-break-inside: avoid;
                    }
                    .ticket-left {
                        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%) !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                        flex: none;
                        width: 100%;
                    }
                    .ticket-right {
                        background: #f8f9fa !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                        flex: none;
                        width: 100%;
                        border-left: none;
                        border-top: 2px dashed #ddd;
                    }
                    .gradient-text-main {
                        background: linear-gradient(#8a3b08, #e59d2c, #2e4365) !important;
                        -webkit-background-clip: text !important;
                        -webkit-text-fill-color: transparent !important;
                        background-clip: text !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    .perforation {
                        display: none;
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
}

// Export for use in script.js
export default RevenueManagement;