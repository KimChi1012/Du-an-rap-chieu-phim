import { RoomAPI } from '../api/room.js';
import { showNotification } from './notification.js';

// Use real API to connect to SQL database
const API = RoomAPI;

class RoomManagement {
    constructor() {
        console.log('RoomManagement constructor called');
        this.rooms = [];
        this.filteredRooms = [];
        this.currentRoom = null;
        this.isEditMode = false;
        this.init();
    }

    async init() {
        console.log('RoomManagement init called');
        await this.loadRooms();
        this.setupEventListeners();
        console.log('RoomManagement initialization completed');
    }

    async loadRooms() {
        try {
            console.log('Starting to load rooms...');
            console.log('API endpoint:', '../api/room/get_room.php');
            
            this.rooms = await API.getRooms();
            console.log('Rooms loaded:', this.rooms);
            console.log('Number of rooms:', this.rooms.length);
            
            this.filteredRooms = [...this.rooms];
            this.renderTable();
            console.log('Table rendered successfully');
            
            // Show success notification if we have data
            if (this.rooms.length > 0) {
                this.showNotification(`Đã tải ${this.rooms.length} phòng chiếu`, 'warning');
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu phòng chiếu:', error);
            this.showNotification('Lỗi khi tải dữ liệu phòng chiếu: ' + error.message, 'warning');
            this.showDatabaseError();
        }
    }

    showDatabaseError() {
        const tbody = document.getElementById('roomTable');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-12">
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
                                <span>Đã import file HighCinema.sql</span>
                            </div>
                        </div>
                        <div class="mt-6">
                            <button onclick="window.roomManagement.loadRooms()" 
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
        console.log('Rendering table with data:', this.filteredRooms);
        const tbody = document.getElementById('roomTable');
        if (!tbody) {
            console.error('Table body element not found!');
            return;
        }

        tbody.innerHTML = '';

        if (this.filteredRooms.length === 0) {
            console.log('No data to display');
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-8 text-gray-500">
                        Không có dữ liệu phòng chiếu
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredRooms.forEach((room, index) => {
            console.log(`Creating row ${index}:`, room);
            const row = this.createTableRow(room);
            tbody.appendChild(row);
        });
        
        console.log('Table rendering completed');
    }

    createTableRow(room) {
        const tr = document.createElement('tr');
        tr.className = 'odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition';

        tr.innerHTML = `
            <td class="px-4 py-3 text-sm font-medium text-gray-900">${room.MaPhong || ''}</td>
            <td class="px-4 py-3 text-sm font-semibold text-gray-900">${room.TenPhong || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${room.LoaiPhong || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${room.SoLuongGhe || ''}</td>
            <td class="px-4 py-3 text-sm text-center">
                <div class="flex justify-center items-center gap-2 whitespace-nowrap">
                    <div class="action-button-wrapper">
                        <button class="action-button edit edit-btn" title="Sửa">
                            <i class="fas fa-edit emoji"></i>
                            <span>Sửa</span>
                        </button>
                    </div>
                    <div class="action-button-wrapper">
                        <button class="action-button delete delete-btn" title="Xóa">
                            <i class="fas fa-trash emoji"></i>
                            <span>Xóa</span>
                        </button>
                    </div>
                </div>
            </td>
        `;

        // Add event listeners
        tr.querySelector('.edit-btn').addEventListener('click', () => this.editRoom(room.MaPhong));
        tr.querySelector('.delete-btn').addEventListener('click', () => this.deleteRoom(room.MaPhong));

        return tr;
    }

    // ===== UTILITY FUNCTIONS =====
    
    /**
     * Loại bỏ dấu tiếng Việt để tìm kiếm không dấu
     * Ví dụ: "Phòng" -> "Phong", "Tầng" -> "Tang"
     */
    removeVietnameseTones(str) {
        if (!str) return '';
        
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toLowerCase();
    }

    /**
     * Kiểm tra xem searchTerm có khớp với text không (bao gồm cả không dấu)
     */
    matchesSearch(text, searchTerm) {
        if (!text || !searchTerm) return false;
        
        const normalizedText = this.removeVietnameseTones(text);
        const normalizedSearch = this.removeVietnameseTones(searchTerm);
        
        // Tìm kiếm cả có dấu và không dấu
        return text.toLowerCase().includes(searchTerm.toLowerCase()) || 
               normalizedText.includes(normalizedSearch);
    }

    searchRooms() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const searchTerm = searchInput.value.trim();
        
        if (!searchTerm) {
            this.filteredRooms = [...this.rooms];
        } else {
            this.filteredRooms = this.rooms.filter(room => 
                this.matchesSearch(room.TenPhong, searchTerm) ||
                this.matchesSearch(room.LoaiPhong, searchTerm) ||
                this.matchesSearch(room.MaPhong, searchTerm)
            );
        }
        
        this.renderTable();
        
        // Hiển thị số kết quả tìm kiếm
        const resultCount = this.filteredRooms.length;
        if (searchTerm && resultCount > 0) {
            console.log(`Tìm thấy ${resultCount} kết quả cho "${searchTerm}"`);
        } else if (searchTerm && resultCount === 0) {
            console.log(`Không tìm thấy kết quả cho "${searchTerm}"`);
        }
    }

    async openAdd() {
        this.isEditMode = false;
        this.currentRoom = null;
        this.showModal('Thêm phòng mới');
        await this.clearForm();
    }

    editRoom(maPhong) {
        const room = this.rooms.find(r => r.MaPhong == maPhong);
        if (!room) return;

        this.isEditMode = true;
        this.currentRoom = room;
        this.showModal('Sửa thông tin phòng');
        this.fillForm(room);
    }

    async deleteRoom(maPhong) {
        const room = this.rooms.find(r => r.MaPhong == maPhong);
        if (!room) return;

        const confirmDelete = () => {
            return new Promise((resolve) => {
                const notification = document.createElement('div');
                notification.className = 'notification notification-show';
                notification.innerHTML = `
                    <div class="notification-content">
                        <i class="notification-icon fa-solid fa-exclamation-triangle" aria-hidden="true"></i>
                        <span class="notification-message">Bạn có chắc muốn xóa phòng "${room.TenPhong}"?</span>
                        <div class="confirm-dialog-actions">
                            <button class="confirm-button confirm-yes">Xóa</button>
                            <button class="confirm-button confirm-no">Hủy</button>
                        </div>
                    </div>
                `;

                document.body.appendChild(notification);
                requestAnimationFrame(() => notification.classList.add('show'));

                notification.querySelector('.confirm-yes').addEventListener('click', () => {
                    notification.remove();
                    resolve(true);
                });

                notification.querySelector('.confirm-no').addEventListener('click', () => {
                    notification.remove();
                    resolve(false);
                });
            });
        };

        const confirmed = await confirmDelete();
        if (!confirmed) return;

        try {
            await API.deleteRoom(maPhong);
            this.showNotification('Xóa phòng thành công', 'warning');
            await this.loadRooms();
        } catch (error) {
            console.error('Lỗi khi xóa phòng:', error);
            this.showNotification('Lỗi khi xóa phòng', 'warning');
        }
    }

    showModal(title) {
        const modal = document.getElementById('roomModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (modal && modalTitle) {
            modalTitle.textContent = title;
            modal.classList.remove('hidden');
        }
    }

    closeModal() {
        const modal = document.getElementById('roomModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    handleModalClick(event) {
        if (event.target.id === 'roomModal') {
            this.closeModal();
        }
    }

    async clearForm() {
        const fields = ['TenPhong', 'LoaiPhong', 'SoLuongGhe'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.value = '';
            }
        });
        
        // Hiển thị mã phòng dự kiến cho thêm mới
        const maPhongElement = document.getElementById('MaPhong');
        if (maPhongElement) {
            if (this.isEditMode) {
                maPhongElement.value = '';
            } else {
                // Tạo mã phòng dự kiến
                const nextRoomCode = await this.generateNextRoomCode();
                maPhongElement.value = nextRoomCode;
                maPhongElement.placeholder = 'Mã phòng sẽ được tự động tạo';
            }
        }
    }

    async generateNextRoomCode() {
        try {
            // Lấy số lượng phòng hiện tại để dự đoán mã phòng tiếp theo
            const roomCount = this.rooms.length;
            let nextNumber = roomCount + 1;
            let nextCode = 'P' + String(nextNumber).padStart(3, '0');
            
            // Kiểm tra xem mã này đã tồn tại chưa
            while (this.rooms.some(room => room.MaPhong === nextCode)) {
                nextNumber++;
                nextCode = 'P' + String(nextNumber).padStart(3, '0');
            }
            
            return nextCode;
        } catch (error) {
            console.error('Error generating room code:', error);
            return 'P001'; // Fallback
        }
    }

    fillForm(room) {
        const fields = ['TenPhong', 'LoaiPhong', 'SoLuongGhe'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && room[field] !== undefined) {
                element.value = room[field] || '';
            }
        });
        
        // Set MaPhong for edit mode
        const maPhongElement = document.getElementById('MaPhong');
        if (maPhongElement && room.MaPhong) {
            maPhongElement.value = room.MaPhong;
            maPhongElement.placeholder = 'Mã phòng không thể thay đổi';
        }
    }

    async saveRoom() {
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return;
        }

        try {
            if (this.isEditMode) {
                await API.updateRoom(formData);
                this.showNotification('Cập nhật phòng thành công', 'warning');
            } else {
                await API.addRoom(formData);
                this.showNotification('Thêm phòng thành công', 'warning');
            }
            
            this.closeModal();
            await this.loadRooms();
        } catch (error) {
            console.error('Lỗi khi lưu phòng:', error);
            this.showNotification('Lỗi khi lưu phòng', 'warning');
        }
    }

    getFormData() {
        const data = {
            TenPhong: document.getElementById('TenPhong').value.trim(),
            LoaiPhong: document.getElementById('LoaiPhong').value.trim(),
            SoLuongGhe: document.getElementById('SoLuongGhe').value.trim()
        };
        
        // Chỉ thêm MaPhong khi edit mode
        if (this.isEditMode) {
            const maPhongElement = document.getElementById('MaPhong');
            if (maPhongElement) {
                data.MaPhong = maPhongElement.value.trim();
            }
        }
        
        return data;
    }

    validateForm(data) {
        const requiredFields = ['TenPhong', 'LoaiPhong', 'SoLuongGhe'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                this.showNotification(`Vui lòng nhập ${this.getFieldLabel(field)}`, 'warning');
                return false;
            }
        }

        // Validate số lượng ghế
        const soLuongGhe = parseInt(data.SoLuongGhe);
        if (isNaN(soLuongGhe) || soLuongGhe <= 0) {
            this.showNotification('Số lượng ghế phải là số dương', 'warning');
            return false;
        }

        if (soLuongGhe > 200) {
            this.showNotification('Số lượng ghế không được vượt quá 200', 'warning');
            return false;
        }

        return true;
    }

    getFieldLabel(field) {
        const labels = {
            'TenPhong': 'tên phòng',
            'LoaiPhong': 'loại phòng',
            'SoLuongGhe': 'số ghế',          
        };
        return labels[field] || field;
    }

    showNotification(message, type = 'warning') {
        // Use the imported notification system
        showNotification(message, type);
    }

    setupEventListeners() {
        // Setup search input listener
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchRooms());
        }

        // Setup modal close on Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeModal();
            }
        });
    }
}

export default RoomManagement;