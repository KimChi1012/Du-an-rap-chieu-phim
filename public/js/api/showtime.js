export class ShowtimeAPI {
    static async getShowtimes() {
        try {
            const response = await fetch('../api/showtime/get_showtime.php');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching showtimes:', error);
            throw error;
        }
    }

    static async addShowtime(showtimeData) {
        try {
            console.log('=== ADD SHOWTIME API CALL ===');
            console.log('URL:', '../api/showtime/add_showtime.php');
            console.log('Data being sent:', showtimeData);
            console.log('JSON string:', JSON.stringify(showtimeData));
            
            const response = await fetch('../api/showtime/add_showtime.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(showtimeData)
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            const responseText = await response.text();
            console.log('Raw response:', responseText);

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

                try {
                    const errorData = JSON.parse(responseText);
                    if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (e) {
                    if (responseText) {
                        errorMessage += ` - ${responseText}`;
                    }
                }
                
                throw new Error(errorMessage);
            }

            const result = JSON.parse(responseText);
            console.log('Parsed result:', result);
            return result;
            
        } catch (error) {
            console.error('=== ADD SHOWTIME ERROR ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Full error:', error);
            throw error;
        }
    }

    static async updateShowtime(showtimeData) {
        try {
            console.log('=== UPDATE SHOWTIME API CALL ===');
            console.log('URL:', '../api/showtime/update_showtime.php');
            console.log('Data being sent:', showtimeData);
            console.log('JSON string:', JSON.stringify(showtimeData));
            
            const response = await fetch('../api/showtime/update_showtime.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(showtimeData)
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            const responseText = await response.text();
            console.log('Raw response:', responseText);

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                
                try {
                    const errorData = JSON.parse(responseText);
                    if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (e) {
                    if (responseText) {
                        errorMessage += ` - ${responseText}`;
                    }
                }
                
                throw new Error(errorMessage);
            }

            const result = JSON.parse(responseText);
            console.log('Parsed result:', result);
            return result;
            
        } catch (error) {
            console.error('=== UPDATE SHOWTIME ERROR ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Full error:', error);
            throw error;
        }
    }

    static async deleteShowtime(maSuat) {
        try {
            const response = await fetch('../api/showtime/delete_showtime.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ MaSuat: maSuat })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error deleting showtime:', error);
            throw error;
        }
    }
}

class ShowtimeManagement {
    constructor() {
        console.log('ShowtimeManagement constructor - SQL database only');
        this.showtimes = [];
        this.filteredShowtimes = [];
        this.currentShowtime = null;
        this.isEditMode = false;
        this.init();
    }

    async init() {
        console.log('Initializing ShowtimeManagement with SQL database...');
        await this.loadShowtimes();
        this.setupEventListeners();
    }

    async loadShowtimes() {
        try {
            console.log('Loading showtimes from SQL database...');
            this.showtimes = await ShowtimeAPI.getShowtimes();
            console.log('Showtimes loaded from database:', this.showtimes);
            this.filteredShowtimes = [...this.showtimes];
            this.renderTable();

            if (this.showtimes.length > 0) {
                console.log(`Loaded ${this.showtimes.length} showtimes from database`);
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu từ database:', error);
            this.showNotification('Lỗi kết nối database. Vui lòng kiểm tra PHP server và MySQL.', 'error');
            this.showDatabaseError();
        }
    }

    showDatabaseError() {
        const tbody = document.getElementById('showtimeTable');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-12">
                        <div class="text-red-600 mb-6">
                            <i class="fas fa-database text-4xl mb-4"></i>
                            <h3 class="text-xl font-semibold mb-2">Không thể kết nối đến database</h3>
                            <p class="text-gray-600 mb-4">Vui lòng kiểm tra:</p>
                        </div>
                        <div class="text-left max-w-md mx-auto space-y-2 text-gray-700">
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-server text-blue-500"></i>
                                <span>XAMPP/PHP server đã chạy</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-database text-green-500"></i>
                                <span>MySQL đã khởi động</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-table text-orange-500"></i>
                                <span>Database 'HighCinema' đã tạo</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-code text-purple-500"></i>
                                <span>Đã chạy SQL từ sample_data.sql</span>
                            </div>
                        </div>
                        <div class="mt-6">
                            <button onclick="window.showtimeManagement.loadShowtimes()" 
                                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                                <i class="fas fa-refresh mr-2"></i>Thử lại
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    renderTable() {
        const tbody = document.getElementById('showtimeTable');
        if (!tbody) {
            console.error('Table body element not found!');
            return;
        }

        tbody.innerHTML = '';

        if (this.filteredShowtimes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-8">
                        <div class="text-gray-500 space-y-4">
                            <i class="fas fa-calendar-plus text-4xl"></i>
                            <p class="text-lg">Chưa có dữ liệu suất chiếu trong database</p>
                            <div class="space-x-4">
                                <button onclick="window.showtimeManagement.autoGenerateShowtimes()" 
                                        class="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
                                    <i class="fas fa-magic mr-2"></i>Tự động tạo lịch chiếu
                                </button>
                                <button onclick="window.showtimeManagement.openManualAdd()" 
                                        class="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all">
                                    <i class="fas fa-plus mr-2"></i>Thêm thủ công
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredShowtimes.forEach((showtime) => {
            const row = this.createTableRow(showtime);
            tbody.appendChild(row);
        });
    }

    createTableRow(showtime) {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition-colors duration-200';
        
        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN');
        };

        const formatTime = (timeString) => {
            if (!timeString) return '';
            const timeParts = timeString.split(':');
            return `${timeParts[0]}:${timeParts[1]}`;
        };
        tr.innerHTML = `
            <td class="px-4 py-3 text-sm font-medium text-gray-900">${showtime.MaSuat || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${showtime.MaPhim || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${showtime.MaPhong || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${formatDate(showtime.NgayChieu)}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${formatTime(showtime.GioBatDau)}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${formatTime(showtime.GioKetThuc)}</td>
            <td class="px-4 py-3 text-sm text-center">
                <div class="flex justify-center space-x-2">
                    <button onclick="window.showtimeManagement.editShowtime('${showtime.MaSuat}')" 
                            class="text-blue-600 hover:text-blue-800 transition-colors duration-200 p-1" 
                            title="Sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="window.showtimeManagement.deleteShowtime('${showtime.MaSuat}')" 
                            class="text-red-600 hover:text-red-800 transition-colors duration-200 p-1" 
                            title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        return tr;
    }

    searchShowtimes() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredShowtimes = [...this.showtimes];
        } else {
            this.filteredShowtimes = this.showtimes.filter(showtime => 
                (showtime.MaPhim && showtime.MaPhim.toLowerCase().includes(searchTerm)) ||
                (showtime.MaPhong && showtime.MaPhong.toLowerCase().includes(searchTerm)) ||
                (showtime.MaSuat && showtime.MaSuat.toString().toLowerCase().includes(searchTerm))
            );
        }
        
        this.renderTable();
    }

    openAdd() {
        this.autoGenerateShowtimes();
    }

    openManualAdd() {
        this.isEditMode = false;
        this.currentShowtime = null;
        this.showModal('Thêm suất chiếu thủ công');
        this.clearForm();
    }

    async autoGenerateShowtimes() {
        try {
            const infoResponse = await fetch('../api/showtime/auto_generate_info.php');
            
            if (!infoResponse.ok) {
                throw new Error(`HTTP ${infoResponse.status}: ${infoResponse.statusText}`);
            }
            
            const infoText = await infoResponse.text();
            console.log('Info API raw response:', infoText);
            
            let info;
            try {
                info = JSON.parse(infoText);
            } catch (parseError) {
                console.error('Failed to parse info response:', parseError);
                throw new Error('Lỗi phân tích dữ liệu từ server');
            }
            
            if (!info.success) {
                throw new Error(info.error || 'Không thể lấy thông tin hệ thống');
            }
            
            const movieCount = info.info?.movies_showing || 0;
            const upcomingCount = info.info?.movies_upcoming || 0;
            const roomCount = info.info?.available_rooms || 0;
            const estimatedNew = info.info?.estimated_new_showtimes || 0;
            const existing = info.info?.existing_future_showtimes || 0;
            
            const confirmMessage = `🎬 TỰ ĐỘNG TẠO LỊCH CHIẾU\n\n` +
                `📊 Thông tin hệ thống:\n` +
                `• ${movieCount} phim đang chiếu\n` +
                `• ${upcomingCount} phim sắp chiếu\n` +
                `• ${roomCount} phòng chiếu\n` +
                `• 3 khung giờ/ngày (09:00, 14:00, 19:00)\n` +
                `• Tạo lịch cho 30 ngày tới\n\n` +
                `📈 Dự kiến tạo: ~${estimatedNew} suất chiếu mới\n` +
                `📅 Hiện có: ${existing} suất chiếu\n\n` +
                `⚡ Hệ thống sẽ:\n` +
                `• Chỉ tạo cho phim đang chiếu và sắp chiếu\n` +
                `• Tự động tránh trùng lịch\n` +
                `• Chỉ tạo từ ngày khởi chiếu\n` +
                `• Không tạo sau ngày kết thúc chiếu\n` +
                `• Tạo mã SUAT tự động\n\n` +
                `Bạn có muốn tiếp tục?`;
            
            if (!confirm(confirmMessage)) {
                return;
            }

            const response = await fetch('../api/showtime/auto_generate.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const resultText = await response.text();
            console.log('Generate API raw response:', resultText);
            
            let result;
            try {
                result = JSON.parse(resultText);
            } catch (parseError) {
                console.error('Failed to parse generate response:', parseError);
                throw new Error('Lỗi phân tích kết quả từ server');
            }
            
            if (result.success) {
                const successMessage = `🎉 THÀNH CÔNG!\n\n` +
                    `✅ Đã tạo: ${result.total_generated || 0} suất chiếu\n` +
                    `🎬 Cho: ${result.movies_processed || 0} phim\n` +
                    `🏢 Trong: ${result.rooms_processed || 0} phòng chiếu\n` +
                    `⏰ Thời gian: ${result.timestamp || 'N/A'}`;
                
                this.showNotification(successMessage, 'success');
                await this.loadShowtimes();
                
                setTimeout(() => {
                    alert(successMessage);
                }, 1000);
            } else {
                throw new Error(result.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Lỗi khi tự động tạo lịch chiếu:', error);
            this.showNotification('❌ Lỗi: ' + error.message, 'error');
        }
    }
    editShowtime(maSuat) {
        const showtime = this.showtimes.find(s => s.MaSuat == maSuat);
        if (!showtime) return;

        this.isEditMode = true;
        this.currentShowtime = showtime;
        this.showModal('Sửa thông tin suất chiếu');
        this.fillForm(showtime);
    }

    async deleteShowtime(maSuat) {
        if (!confirm('Bạn có chắc chắn muốn xóa suất chiếu này khỏi database?')) return;
        try {
            const result = await ShowtimeAPI.deleteShowtime(maSuat);
            if (result.success) {
                this.showNotification('Đã xóa suất chiếu khỏi database', 'success');
                await this.loadShowtimes();
            }
        } catch (error) {
            console.error('Lỗi khi xóa suất chiếu:', error);
            this.showNotification('Lỗi khi xóa suất chiếu: ' + error.message, 'error');
        }
    }

    showModal(title) {
        const modal = document.getElementById('showtimeModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (modal && modalTitle) {
            modalTitle.textContent = title;
            modal.classList.remove('hidden');
        }
    }

    closeModal() {
        const modal = document.getElementById('showtimeModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    handleModalClick(event) {
        if (event.target.id === 'showtimeModal') {
            this.closeModal();
        }
    }

    clearForm() {
        const fields = ['MaSuat', 'MaPhim', 'MaPhong', 'NgayChieu', 'GioBatDau', 'GioKetThuc'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.value = '';
                if (field === 'MaSuat') {
                    element.disabled = true;
                    element.placeholder = 'Tự động tạo (SUAT0001, SUAT0002...)';
                } else if (field === 'GioKetThuc') {
                    element.placeholder = 'Tự động tính theo thời lượng phim';
                }
            }
        });
    }

    fillForm(showtime) {
        const fields = ['MaSuat', 'MaPhim', 'MaPhong', 'NgayChieu', 'GioBatDau', 'GioKetThuc'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && showtime[field] !== undefined) {
                if (field === 'NgayChieu') {
                    const date = new Date(showtime[field]);
                    element.value = date.toISOString().split('T')[0];
                } else if (field === 'GioBatDau' || field === 'GioKetThuc') {
                    element.value = showtime[field] || '';
                } else {
                    element.value = showtime[field] || '';
                }
                
                if (field === 'MaSuat') {
                    element.disabled = true;
                }
            }
        });
    }

    async calculateEndTime() {
        const maPhim = document.getElementById('MaPhim').value;
        const gioBatDau = document.getElementById('GioBatDau').value;
        const gioKetThucElement = document.getElementById('GioKetThuc');
        
        if (!maPhim || !gioBatDau) {
            gioKetThucElement.value = '';
            return;
        }

        try {
            const response = await fetch(`../api/showtime/get_movie_duration.php?MaPhim=${maPhim}`);
            const result = await response.json();
            
            if (result.success && result.ThoiLuong) {
                const [hours, minutes] = gioBatDau.split(':').map(Number);
                const startMinutes = hours * 60 + minutes;
                const endMinutes = startMinutes + result.ThoiLuong;
                
                const endHours = Math.floor(endMinutes / 60);
                const endMins = endMinutes % 60;
                
                const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;
                gioKetThucElement.value = endTimeStr;
                gioKetThucElement.placeholder = `${result.ThoiLuong} phút → ${endTimeStr}`;
                
                console.log(`Calculated end time: ${endTimeStr} (${result.message})`);
            } else {
                gioKetThucElement.value = '';
                gioKetThucElement.placeholder = 'Không tìm thấy thông tin phim';
                this.showNotification('Không tìm thấy thông tin phim', 'error');
            }
        } catch (error) {
            console.error('Lỗi khi tính giờ kết thúc:', error);
            gioKetThucElement.value = '';
            gioKetThucElement.placeholder = 'Lỗi khi tính thời gian';
            this.showNotification('Lỗi khi tính giờ kết thúc: ' + error.message, 'error');
        }
    }

    async saveShowtime() {
        const formData = this.getFormData();

        console.log('=== SAVE SHOWTIME DEBUG ===');
        console.log('Form data:', formData);
        console.log('Is edit mode:', this.isEditMode);
        
        if (!this.validateForm(formData)) {
            return;
        }

        try {
            let result;
            if (this.isEditMode) {
                console.log('Calling updateShowtime API...');
                result = await ShowtimeAPI.updateShowtime(formData);
                this.showNotification('Đã cập nhật suất chiếu trong database', 'success');
            } else {
                console.log('Calling addShowtime API...');
                console.log('Sending data:', JSON.stringify(formData, null, 2));
                result = await ShowtimeAPI.addShowtime(formData);
                console.log('API response:', result);
                this.showNotification('Đã thêm suất chiếu vào database', 'success');
            }
            
            this.closeModal();
            await this.loadShowtimes();
        } catch (error) {
            console.error('=== SAVE ERROR ===');
            console.error('Error object:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            this.showNotification('Lỗi khi lưu vào database: ' + error.message, 'error');
        }
    }

    getFormData() {
        return {
            MaSuat: document.getElementById('MaSuat').value.trim(),
            MaPhim: document.getElementById('MaPhim').value.trim(),
            MaPhong: document.getElementById('MaPhong').value.trim(),
            NgayChieu: document.getElementById('NgayChieu').value,
            GioBatDau: document.getElementById('GioBatDau').value,
            GioKetThuc: document.getElementById('GioKetThuc').value,         
        };
    }


    validateForm(data) {
        const requiredFields = ['MaPhim', 'MaPhong', 'NgayChieu', 'GioBatDau'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                this.showNotification(`Vui lòng nhập ${this.getFieldLabel(field)}`, 'error');
                return false;
            }
        }

        const selectedDate = new Date(data.NgayChieu);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            this.showNotification('Ngày chiếu không được trong quá khứ', 'error');
            return false;
        }

        return true;
    }

    getFieldLabel(field) {
        const labels = {
            'MaPhim': 'mã phim',
            'MaPhong': 'mã phòng',
            'NgayChieu': 'ngày chiếu',
            'GioBatDau': 'giờ bắt đầu',
            'GioKetThuc': 'giờ kết thúc'
        };
        return labels[field] || field;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 transition-all duration-300 max-w-md ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
           
        const formattedMessage = message.replace(/\n/g, '<br>');
        notification.innerHTML = `
            <div class="flex items-start space-x-2">
                <div class="flex-shrink-0 mt-1">
                    ${type === 'success' ? '<i class="fas fa-check-circle"></i>' :
                      type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' :
                      '<i class="fas fa-info-circle"></i>'}
                </div>
                <div class="flex-1 text-sm leading-relaxed">${formattedMessage}</div>
                <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
             if (notification.parentElement) {
                notification.remove();
            }
        }, type === 'success' ? 8000 : 6000);
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchShowtimes());
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeModal();
            }
        });

        document.addEventListener('change', (event) => {
            if (event.target.id === 'MaPhim' || event.target.id === 'GioBatDau') {
                this.calculateEndTime();
            }
        });
        
        document.addEventListener('blur', (event) => {
            if (event.target.id === 'MaPhim' || event.target.id === 'GioBatDau') {
                this.calculateEndTime();
            }
        });
    }
}

console.log('Showtime management system loaded - SQL database only');

function initializeShowtimeManagement() {
    if (document.getElementById('showtimeTable')) {
        console.log('Initializing ShowtimeManagement with SQL database...');
        window.showtimeManagement = new ShowtimeManagement();
        return true;
    }
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    if (!initializeShowtimeManagement()) {
        setTimeout(initializeShowtimeManagement, 500);
    }
});

window.addEventListener('load', () => {
    if (!window.showtimeManagement) {
        initializeShowtimeManagement();
    }
});

if (document.readyState !== 'loading') {
    initializeShowtimeManagement();
}

export default ShowtimeManagement;