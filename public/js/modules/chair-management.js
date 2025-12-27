import { ChairAPI } from '../api/chair.js';
import { showNotification } from './notification.js';

class ChairManagement {
    constructor() {
        console.log('ChairManagement constructor called');
        this.chairs = [];
        this.filteredChairs = [];
        this.init();
    }

    async init() {
        console.log('ChairManagement init called');
        await this.loadChairs();
        this.setupEventListeners();
        console.log('ChairManagement initialization completed');
    }

    async loadChairs() {
        try {
            console.log('Starting to load chairs...');
            console.log('API endpoint:', '../api/chair/get_chair.php');
            
            this.chairs = await ChairAPI.getChairs();
            console.log('Chairs loaded:', this.chairs);
            console.log('Number of chairs:', this.chairs.length);
            
            this.filteredChairs = [...this.chairs];
            this.renderTable();
            console.log('Table rendered successfully');
            
            // Show success notification if we have data
            if (this.chairs.length > 0) {
                this.showNotification(`Đã tải ${this.chairs.length} ghế`, 'warning');
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu ghế:', error);
            this.showNotification('Lỗi khi tải dữ liệu ghế: ' + error.message, 'warning');
            this.showDatabaseError();
        }
    }

    showDatabaseError() {
        const tbody = document.getElementById('chairTable');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-12">
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
                            <button onclick="window.chairManagement.loadChairs()" 
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
        console.log('Rendering table with data:', this.filteredChairs);
        const tbody = document.getElementById('chairTable');
        if (!tbody) {
            console.error('Table body element not found!');
            return;
        }

        tbody.innerHTML = '';

        if (this.filteredChairs.length === 0) {
            console.log('No data to display');
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-8 text-gray-500">
                        Không có dữ liệu ghế
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredChairs.forEach((chair, index) => {
            console.log(`Creating row ${index}:`, chair);
            const row = this.createTableRow(chair);
            tbody.appendChild(row);
        });
        
        console.log('Table rendering completed');
    }

    createTableRow(chair) {
        const tr = document.createElement('tr');
        tr.className = 'odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition';

        tr.innerHTML = `
            <td class="px-4 py-3 text-sm font-medium text-gray-900">${chair.MaGhe || ''}</td>
            <td class="px-4 py-3 text-sm font-semibold text-gray-900">${chair.MaPhong || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${chair.SoHang || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${chair.SoCot || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${chair.LoaiGhe || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">
                <span class="px-2 py-1 text-xs rounded-full ${
                    chair.TrangThai === 'Trống' ? 'bg-green-100 text-green-800' :
                    chair.TrangThai === 'Đã đặt' ? 'bg-red-100 text-red-800' :
                    chair.TrangThai === 'Bảo trì' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                }">
                    ${chair.TrangThai || ''}
                </span>
            </td>
        `;

        return tr;
    }

    searchChairs() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const searchTerm = searchInput.value.trim();
        
        if (!searchTerm) {
            this.filteredChairs = [...this.chairs];
        } else {
            this.filteredChairs = this.chairs.filter(chair => 
                this.matchesSearch(chair.MaGhe, searchTerm) ||
                this.matchesSearch(chair.MaPhong, searchTerm) ||
                this.matchesSearch(chair.LoaiGhe, searchTerm) ||
                this.matchesSearch(chair.TrangThai, searchTerm) ||
                this.matchesSearch(chair.SoHang, searchTerm) ||
                this.matchesSearch(chair.SoCot, searchTerm)
            );
        }
        
        this.renderTable();
        
        // Hiển thị số kết quả tìm kiếm
        const resultCount = this.filteredChairs.length;
        if (searchTerm && resultCount > 0) {
            console.log(`Tìm thấy ${resultCount} kết quả cho "${searchTerm}"`);
        } else if (searchTerm && resultCount === 0) {
            console.log(`Không tìm thấy kết quả cho "${searchTerm}"`);
        }
    }

    /**
     * Loại bỏ dấu tiếng Việt để tìm kiếm không dấu
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
        
        const normalizedText = this.removeVietnameseTones(text.toString());
        const normalizedSearch = this.removeVietnameseTones(searchTerm);
        
        // Tìm kiếm cả có dấu và không dấu
        return text.toString().toLowerCase().includes(searchTerm.toLowerCase()) || 
               normalizedText.includes(normalizedSearch);
    }

    showNotification(message, type = 'warning') {
        // Use the imported notification system with warning color for consistency
        showNotification(message, type);
    }

    setupEventListeners() {
        // Setup search input listener
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchChairs());
        }
    }
}

export default ChairManagement;