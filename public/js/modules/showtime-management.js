import { ShowtimeAPI } from '../api/showtime.js';
import { showNotification } from './notification.js';

const API = ShowtimeAPI;

class ShowtimeManagement {
    constructor() {
        console.log('ShowtimeManagement constructor called');
        this.showtimes = [];
        this.filteredShowtimes = [];
        this.currentShowtime = null;
        this.isEditMode = false;
        this.isInitialLoad = true; // Thêm flag để theo dõi lần load đầu tiên
        this.init();
    }

    async init() {
        console.log('ShowtimeManagement init called');
        await this.loadShowtimes();
        this.setupEventListeners();
        console.log('ShowtimeManagement initialization completed');
    }

    async loadShowtimes() {
        try {
            console.log('📡 Đang tải dữ liệu suất chiếu...');
            this.showtimes = await API.getShowtimes();
            console.log('Showtimes loaded:', this.showtimes);
            this.filteredShowtimes = [...this.showtimes];
            this.renderTable();
            
            // Chỉ hiển thị thông báo "Đã tải" khi load trang lần đầu
            if (this.isInitialLoad && this.showtimes.length > 0) {
                showNotification(`Đã tải ${this.showtimes.length} suất chiếu từ database`, 'success');
                this.isInitialLoad = false; // Đánh dấu đã load lần đầu
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu suất chiếu:', error);
            showNotification('Lỗi khi tải dữ liệu suất chiếu: ' + error.message, 'error');
        }
    }

    renderTable() {
        console.log('Rendering table with data:', this.filteredShowtimes);
        const tbody = document.getElementById('showtimeTable');
        if (!tbody) {
            console.error('Table body element not found!');
            return;
        }

        tbody.innerHTML = '';

        if (this.filteredShowtimes.length === 0) {
            console.log('No data to display');
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-8 text-gray-500">
                        Không có dữ liệu suất chiếu
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredShowtimes.forEach((showtime, index) => {
            console.log(`Creating row ${index}:`, showtime);
            const row = this.createTableRow(showtime);
            tbody.appendChild(row);
        });
        
        console.log('Table rendering completed');
    }

    createTableRow(showtime) {
        const tr = document.createElement('tr');
        tr.className = 'odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition';

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
            <td class="px-4 py-3 text-sm text-gray-900">${showtime.MaPhong || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${formatDate(showtime.NgayChieu)}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${formatTime(showtime.GioBatDau)}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${formatTime(showtime.GioKetThuc)}</td>
            <td class="px-4 py-3 text-sm text-center">
                <div class="flex justify-center space-x-2">
                    <div class="action-button-wrapper">
                        <button onclick="window.showtimeManagement.editShowtime('${showtime.MaSuat}')" 
                                class="action-button"
                                title="Sửa">
                            <i class="fas fa-edit emoji"></i>
                            <span>Sửa</span>
                        </button>
                    </div>
                    <div class="action-button-wrapper">
                        <button onclick="window.showtimeManagement.deleteShowtime('${showtime.MaSuat}')" 
                                class="action-button"
                                title="Xóa">
                            <i class="fas fa-trash emoji"></i>
                            <span>Xóa</span>
                        </button>
                    </div>
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
        this.isEditMode = false;
        this.currentShowtime = null;
        this.showModal('Thêm suất chiếu mới');
        this.clearForm();
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
        const showtime = this.showtimes.find(s => s.MaSuat == maSuat);
        if (!showtime) return;

        const confirmDelete = () => {
            return new Promise((resolve) => {
                const notification = document.createElement('div');
                notification.className = 'notification notification-show';
                notification.innerHTML = `
                    <div class="notification-content">
                        <i class="notification-icon fa-solid fa-exclamation-circle" aria-hidden="true"></i>
                        <span class="notification-message">Bạn có chắc muốn xóa suất chiếu "${maSuat}"?</span>
                        <div class="confirm-dialog-actions">
                            <button class="confirm-button confirm-yes">Xóa</button>
                            <button class="confirm-button confirm-no">Hủy</button>
                        </div>
                    </div>
                `;

                document.body.appendChild(notification);
                requestAnimationFrame(() => notification.classList.add('show'));

                notification.querySelector('.confirm-yes').onclick = () => {
                    notification.remove();
                    resolve(true);
                };
                notification.querySelector('.confirm-no').onclick = () => {
                    notification.remove();
                    resolve(false);
                };
            });
        };

        const confirmed = await confirmDelete();
        if (!confirmed) return;

        try {
            await API.deleteShowtime(maSuat);
            showNotification('Xóa suất chiếu thành công', 'success');
            await this.loadShowtimes();
        } catch (error) {
            console.error('Lỗi khi xóa suất chiếu:', error);
            showNotification('Lỗi khi xóa suất chiếu: ' + error.message, 'error');
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

    async saveShowtime() {
        const formData = this.getFormData();
        
        const isValid = await this.validateForm(formData);
        if (!isValid) {
            return;
        }

        try {
            if (this.isEditMode) {
                await API.updateShowtime(formData);
                showNotification('Cập nhật suất chiếu thành công', 'success');
            } else {
                await API.addShowtime(formData);
                showNotification('Thêm suất chiếu thành công', 'success');
            }
            
            this.closeModal();
            await this.loadShowtimes();
        } catch (error) {
            console.error('Lỗi khi lưu suất chiếu:', error);
            showNotification('Lỗi khi lưu suất chiếu: ' + error.message, 'error');
        }
    }

    async autoGenerateShowtimes() {
        const confirmGenerate = () => {
            return new Promise((resolve) => {
                const notification = document.createElement('div');
                notification.className = 'notification notification-show';
                notification.innerHTML = `
                    <div class="notification-content">
                        <i class="notification-icon fa-solid fa-question-circle" aria-hidden="true"></i>
                        <span class="notification-message">Bạn có chắc chắn muốn tự động tạo lịch chiếu cho tất cả phim đang chiếu?</span>
                        <div class="confirm-dialog-actions">
                            <button class="confirm-button confirm-yes">Tạo lịch</button>
                            <button class="confirm-button confirm-no">Hủy</button>
                        </div>
                    </div>
                `;

                document.body.appendChild(notification);
                requestAnimationFrame(() => notification.classList.add('show'));

                notification.querySelector('.confirm-yes').onclick = () => {
                    notification.remove();
                    resolve(true);
                };
                notification.querySelector('.confirm-no').onclick = () => {
                    notification.remove();
                    resolve(false);
                };
            });
        };

        const confirmed = await confirmGenerate();
        if (!confirmed) return;

        try {
            const response = await fetch('../api/showtime/auto_generate.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const responseText = await response.text();
            console.log('Raw response:', responseText);
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error(`Server trả về dữ liệu không hợp lệ: ${responseText.substring(0, 100)}...`);
            }
            
            if (result.success) {
                showNotification(`Tạo thành công ${result.total_generated} suất chiếu`, 'success');
                await this.loadShowtimes();
            } else {
                throw new Error(result.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Lỗi khi tự động tạo lịch chiếu:', error);
            showNotification('Lỗi khi tự động tạo lịch chiếu: ' + error.message, 'error');
        }
    }

    async generateForMovie(movieId, startDate, endDate, roomId) {
        try {
            const response = await fetch('../api/showtime/auto_generate.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    movieId: movieId,
                    startDate: startDate,
                    endDate: endDate,
                    roomId: roomId
                })
            });

            const result = await response.json();
            
            if (result.success) {
                showNotification(`Tạo thành công ${result.generated_count} suất chiếu`, 'success');
                await this.loadShowtimes();
            } else {
                throw new Error(result.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Lỗi khi tạo lịch chiếu:', error);
            showNotification('Lỗi khi tạo lịch chiếu: ' + error.message, 'error');
        }
    }

    async checkScheduleConflict(roomId, date, startTime, duration) {
        try {
            const response = await fetch('../api/showtime/check_conflict.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomId: roomId,
                    date: date,
                    startTime: startTime,
                    duration: duration
                })
            });

            const result = await response.json();
            return result.hasConflict || false;
        } catch (error) {
            console.error('Lỗi khi kiểm tra xung đột:', error);
            return false;
        }
    }

    getFormData() {
        const fields = ['MaSuat', 'MaPhim', 'MaPhong', 'NgayChieu', 'GioBatDau', 'GioKetThuc'];
        const data = {};
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                data[field] = element.value.trim();
            }
        });
        
        return data;
    }

    async validateForm(data) {
        const requiredFields = ['MaPhim', 'NgayChieu', 'GioBatDau', 'MaPhong'];

        for (const field of requiredFields) {
            if (!data[field]) {
                showNotification(`Vui lòng nhập ${this.getFieldLabel(field)}`, 'warning');
                return false;
            }
        }

        const selectedDate = new Date(data.NgayChieu);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            showNotification('Ngày chiếu không được trong quá khứ', 'warning');
            return false;
        }

        if (!this.isEditMode || this.hasScheduleInfoChanged(data)) {
            const hasConflict = await this.checkScheduleConflict(
                data.MaPhong, 
                data.NgayChieu, 
                data.GioBatDau, 
                120
            );
            
            if (hasConflict) {
                showNotification('Lịch chiếu bị trùng với suất chiếu khác trong cùng phòng', 'warning');
                return false;
            }
        }
        return true;
    }

    hasScheduleInfoChanged(newData) {
        if (!this.currentShowtime) return true;
        
        return (
            this.currentShowtime.MaPhong != newData.MaPhong ||
            this.currentShowtime.NgayChieu != newData.NgayChieu ||
            this.currentShowtime.GioBatDau != newData.GioBatDau
        );
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

    calculateEndTime() {
        const startTimeElement = document.getElementById('GioBatDau');
        const endTimeElement = document.getElementById('GioKetThuc');
        
        if (!startTimeElement || !endTimeElement) return;
        
        const startTime = startTimeElement.value;
        if (!startTime) {
            endTimeElement.value = '';
            return;
        }
        
        // Giả sử thời lượng phim trung bình là 120 phút (2 giờ)
        const movieDuration = 120; // phút
        
        // Chuyển đổi thời gian bắt đầu
        const [hours, minutes] = startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        
        // Thêm thời lượng phim
        const endDate = new Date(startDate.getTime() + movieDuration * 60000);
        
        // Format lại thành HH:MM:SS
        const endHours = endDate.getHours().toString().padStart(2, '0');
        const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
        
        endTimeElement.value = `${endHours}:${endMinutes}:00`;
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
    }
}

console.log('Script loaded, waiting for DOM...');

function initializeShowtimeManagement() {
    console.log('Initializing ShowtimeManagement...');
    if (document.getElementById('showtimeTable')) {
        console.log('Table found, creating instance...');
        window.showtimeManagement = new ShowtimeManagement();
        return true;
    } else {
        console.log('Table not found yet...');
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded event fired');
    if (!initializeShowtimeManagement()) {
        setTimeout(() => {
            console.log('Retrying initialization...');
            initializeShowtimeManagement();
        }, 500);
    }
});

window.addEventListener('load', () => {
    if (!window.showtimeManagement) {
        console.log('Window load event - backup initialization');
        initializeShowtimeManagement();
    }
});

if (document.readyState === 'loading') {
    console.log('DOM is still loading...');
} else {
    console.log('DOM already ready, initializing immediately...');
    initializeShowtimeManagement();
}

export default ShowtimeManagement;