import { showNotification } from './notification.js';
import { initVideoModal } from './video-modal.js';
import { MovieAPI } from '../api/movie.js';

function removeVietnameseAccents(str) {
    if (!str) return '';
    
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

class MovieManagement {
    constructor() {
        this.movies = [];
        this.filteredMovies = [];
        this.currentMovie = null;
        this.isEditMode = false;
        this.init();
    }

    async init() {
        await this.loadMovies();
        this.setupEventListeners();
        initVideoModal(); // Khởi tạo video modal
    }

    async loadMovies() {
        try {
            this.movies = await MovieAPI.getMovies();
            this.filteredMovies = [...this.movies];
            this.renderTable();
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu phim:', error);
            showNotification('Lỗi khi tải dữ liệu phim: ' + error.message, 'warning');
        }
    }

    async updateDatabaseStatus() {
        try {
            showNotification('Đang cập nhật CSDL...', 'info');
            
            const response = await fetch('../api/movie/update_status_direct.php');
            const result = await response.json();
            
            if (result.success) {
                console.log('📊 Kết quả cập nhật CSDL:', result.data);
                
                if (result.data.updatedCount > 0) {
                    showNotification(`${result.message}`, 'success');
                    console.table(result.data.updates);
                    
                    // Reload lại danh sách phim từ database
                    setTimeout(() => {
                        this.loadMovies();
                    }, 1000);
                } else {
                    showNotification(`${result.message}`, 'info');
                }
            } else {
                console.error('❌ Lỗi cập nhật CSDL:', result.error);
                showNotification(`Lỗi: ${result.error}`, 'warning');
            }
        } catch (error) {
            console.error('❌ Lỗi khi gọi API:', error);
            showNotification('Không thể kết nối đến server PHP. Vui lòng khởi động XAMPP/WAMP.', 'warning');
        }
    }

    // Thêm phương thức để cập nhật trạng thái phim cụ thể
    async updateMovieStatus(movieId, status) {
        try {
            const response = await fetch('../api/movie/update_movie_status.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    MaPhim: movieId, 
                    TrangThai: status 
                })
            });
            
            const result = await response.json();
            if (result.success) {
                showNotification('Cập nhật trạng thái phim thành công', 'success');
                await this.loadMovies();
                return result;
            } else {
                throw new Error(result.error || 'Lỗi khi cập nhật trạng thái phim');
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái phim:', error);
            showNotification('Lỗi khi cập nhật trạng thái phim: ' + error.message, 'warning');
            throw error;
        }
    }

    renderTable() {
        const tbody = document.getElementById('movieTable');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.filteredMovies.length === 0) {
            // Kiểm tra xem có đang tìm kiếm không
            const searchInput = document.getElementById('searchInput');
            const isSearching = searchInput && searchInput.value.trim() !== '';
            
            if (isSearching) {
                // Hiển thị thông báo không tìm thấy kết quả (giống các management khác)
                tbody.innerHTML = `
                    <tr>
                        <td colspan="16" class="px-6 py-4 text-center text-gray-500">
                            Không tìm thấy kết quả phù hợp
                        </td>
                    </tr>
                `;
            } else {
                // Hiển thị thông báo không có dữ liệu (giống các management khác)
                tbody.innerHTML = `
                    <tr>
                        <td colspan="16" class="px-6 py-4 text-center text-gray-500">
                            Bảng Phim không có dữ liệu
                        </td>
                    </tr>
                `;
            }
            return;
        }

        this.filteredMovies.forEach((movie) => {
            const row = this.createTableRow(movie);
            tbody.appendChild(row);
        });
    }

    createTableRow(movie) {
        const tr = document.createElement('tr');
        tr.className = 'odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition';
        
        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN');
        };

        tr.innerHTML = `
            <td class="px-4 py-3 text-sm font-medium text-gray-900">${movie.MaPhim || ''}</td>
            <td class="px-4 py-3 text-sm font-medium text-gray-900">${movie.TenPhim || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title="${movie.MoTa || ''}">${movie.MoTa ? movie.MoTa.substring(0, 50) + '...' : ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${movie.GioiHanTuoi || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${movie.DinhDang || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${movie.DaoDien || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${movie.DienVien || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${movie.TheLoai || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${formatDate(movie.NgayKhoiChieu)}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${movie.NgonNgu || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">
                <div class="flex justify-center">
                    ${movie.Poster ? `<img src="${movie.Poster}" alt="Poster" class="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity" onclick="window.movieManagement?.viewImage('${movie.Poster}', 'Poster - ${movie.TenPhim}')">` : '<span class="text-gray-400">Không có ảnh</span>'}
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">
                <div class="flex justify-center">
                    ${movie.Banner ? `<img src="${movie.Banner}" alt="Banner" class="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity" onclick="window.movieManagement?.viewImage('${movie.Banner}', 'Banner - ${movie.TenPhim}')">` : '<span class="text-gray-400">Không có ảnh</span>'}
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">
                ${movie.Trailer ? `<button onclick="window.movieManagement?.viewTrailer('${movie.Trailer}')" class="text-blue-600 hover:text-blue-800 hover:underline">Xem</button>` : '<span class="text-gray-400">Không có</span>'}
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">
                <span class="px-2 py-1 text-xs rounded-full font-medium
                    ${movie.TrangThai === 'Phim đang chiếu' ? 'bg-green-100 text-green-700 border border-green-200' :
                      movie.TrangThai === 'Phim sắp chiếu' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      'bg-gray-100 text-gray-700 border border-gray-200'}">
                    ${movie.TrangThai || ''}
                </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 text-center">${movie.ThoiLuong || ''} phút</td>
            <td class="px-4 py-3 text-sm text-center">
                <div class="flex justify-center space-x-2">
                    <div class="action-button-wrapper">
                        <button onclick="window.movieManagement.editMovie('${movie.MaPhim}')" 
                                class="action-button"
                                title="Sửa">
                            <i class="fas fa-edit emoji"></i>
                            <span>Sửa</span>
                        </button>
                    </div>
                    <div class="action-button-wrapper">
                        <button onclick="window.movieManagement.deleteMovie('${movie.MaPhim}')" 
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

    async searchMovies() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const searchTerm = removeVietnameseAccents(searchInput.value.trim());
        
        if (!searchTerm) {
            this.filteredMovies = [...this.movies];
        } else {
            // Có thể sử dụng API search nếu cần
            this.filteredMovies = this.movies.filter(movie => {
                const tenPhim = removeVietnameseAccents(movie.TenPhim || '');
                const moTa = removeVietnameseAccents(movie.MoTa || '');
                const maPhim = removeVietnameseAccents(movie.MaPhim || '');
                const daoDien = removeVietnameseAccents(movie.DaoDien || '');
                const dienVien = removeVietnameseAccents(movie.DienVien || '');
                const theLoai = removeVietnameseAccents(movie.TheLoai || '');
                
                return tenPhim.includes(searchTerm) ||
                       moTa.includes(searchTerm) ||
                       maPhim.includes(searchTerm) ||
                       daoDien.includes(searchTerm) ||
                       dienVien.includes(searchTerm) ||
                       theLoai.includes(searchTerm);
            });
        }
        
        this.renderTable();
    }

    // Thêm phương thức để sử dụng search API
    async searchMoviesAPI(searchTerm) {
        try {
            const response = await fetch(`../api/movie/search_movies.php?q=${encodeURIComponent(searchTerm)}`);
            const result = await response.json();
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.error || 'Lỗi khi tìm kiếm phim');
            }
        } catch (error) {
            console.error('Lỗi khi tìm kiếm phim:', error);
            throw error;
        }
    }

    // Thêm phương thức để lấy phim đang chiếu
    async getNowShowingMovies() {
        try {
            const result = await MovieAPI.getNowShowing();
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.error || 'Lỗi khi tải phim đang chiếu');
            }
        } catch (error) {
            console.error('Lỗi khi tải phim đang chiếu:', error);
            throw error;
        }
    }

    // Thêm phương thức để lấy phim sắp chiếu
    async getComingSoonMovies() {
        try {
            const result = await MovieAPI.getComingSoon();
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.error || 'Lỗi khi tải phim sắp chiếu');
            }
        } catch (error) {
            console.error('Lỗi khi tải phim sắp chiếu:', error);
            throw error;
        }
    }

    // Thêm phương thức để lấy chi tiết phim
    async getMovieDetail(movieId) {
        try {
            const result = await MovieAPI.getMovieDetail(movieId);
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.error || 'Lỗi khi tải chi tiết phim');
            }
        } catch (error) {
            console.error('Lỗi khi tải chi tiết phim:', error);
            throw error;
        }
    }

    openAdd() {
        this.isEditMode = false;
        this.currentMovie = null;
        this.showModal('Thêm phim mới');
        this.clearForm();
        this.autoGenerateMovieCode();
    }

    editMovie(maPhim) {
        const movie = this.movies.find(p => p.MaPhim == maPhim);
        if (!movie) return;

        this.isEditMode = true;
        this.currentMovie = movie;
        this.showModal('Sửa thông tin phim');
        this.fillForm(movie);
    }

    async deleteMovie(maPhim) {
        const movie = this.movies.find(p => p.MaPhim == maPhim);
        if (!movie) return;

        const confirmDelete = () => {
            return new Promise((resolve) => {
                const notification = document.createElement('div');
                notification.className = 'notification notification-show';
                notification.innerHTML = `
                    <div class="notification-content">
                        <i class="notification-icon fa-solid fa-exclamation-triangle" aria-hidden="true"></i>
                        <span class="notification-message">Bạn có chắc muốn xóa phim "${movie.TenPhim}"?</span>
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
            const movieAPI = new MovieAPI();
            const result = await movieAPI.deleteMovieAPI(maPhim);
            if (result.success) {
                showNotification('Xóa phim thành công', 'success');
                await this.loadMovies();
            } else {
                showNotification('Lỗi: ' + result.error, 'warning');
            }
        } catch (error) {
            console.error('Lỗi khi xóa phim:', error);
            showNotification('Lỗi khi xóa phim: ' + error.message, 'warning');
        }
    }

    showModal(title) {
        const modal = document.getElementById('movieModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (modal && modalTitle) {
            modalTitle.textContent = title;
            modal.classList.remove('hidden');
        }
    }

    closeModal() {
        const modal = document.getElementById('movieModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    viewImage(imageSrc, title) {
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        
        if (modal && modalImage) {
            modalImage.src = imageSrc;
            modalImage.alt = title;
            modal.classList.remove('hidden');
        }
    }

    closeImageModal() {
        const modal = document.getElementById('imageModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    viewTrailer(trailerUrl) {
        if (window.openVideoModal) {
            window.openVideoModal(trailerUrl);
        } else {
            // Fallback nếu video modal chưa được khởi tạo
            window.open(trailerUrl, '_blank');
        }
    }

    clearForm() {
        const fields = ['MaPhim', 'TenPhim', 'MoTa', 'GioiHanTuoi', 'DinhDang', 'DaoDien', 'DienVien', 'TheLoai', 'NgayKhoiChieu', 'NgonNgu', 'Poster', 'Banner', 'Trailer', 'TrangThai', 'ThoiLuong'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.value = '';
            }
        });
    }

    fillForm(movie) {
        const fields = ['MaPhim', 'TenPhim', 'MoTa', 'GioiHanTuoi', 'DinhDang', 'DaoDien', 'DienVien', 'TheLoai', 'NgayKhoiChieu', 'NgonNgu', 'Trailer', 'TrangThai', 'ThoiLuong'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && movie[field] !== undefined) {
                if (field === 'NgayKhoiChieu') {
                    const date = new Date(movie[field]);
                    element.value = date.toISOString().split('T')[0];
                } else {
                    element.value = movie[field] || '';
                }
            }
        });
    }

    async saveMovie() {
        const formData = this.getFormData();
        
        console.log('Form data before validation:', formData);
        
        if (!this.validateForm(formData)) {
            return;
        }

        try {
            console.log('Saving movie, isEditMode:', this.isEditMode);
            
            const movieAPI = new MovieAPI();
            let result;
            if (this.isEditMode) {
                result = await movieAPI.updateMovieAPI(formData);
                console.log('Update result:', result);
                showNotification('Cập nhật phim thành công', 'success');
            } else {
                result = await movieAPI.addMovieAPI(formData);
                console.log('Add result:', result);
                showNotification('Thêm phim thành công', 'success');
            }
            
            this.closeModal();
            await this.loadMovies();
        } catch (error) {
            console.error('Lỗi khi lưu phim:', error);
            
            // Show detailed error information
            let errorMessage = error.message;
            if (error.message.includes('Unexpected end of JSON input')) {
                errorMessage = 'Server trả về dữ liệu không hợp lệ. Kiểm tra console để xem chi tiết.';
            }
            
            showNotification('Lỗi khi lưu phim: ' + errorMessage, 'warning');
            
            // Also show an alert with more details for debugging
            alert('Chi tiết lỗi:\n' + error.message + '\n\nKiểm tra console (F12) để xem thêm thông tin.');
        }
    }

    getFormData() {
        const data = {};
        const fields = ['MaPhim', 'TenPhim', 'MoTa', 'GioiHanTuoi', 'DinhDang', 'DaoDien', 'DienVien', 'TheLoai', 'NgayKhoiChieu', 'NgonNgu', 'Trailer', 'TrangThai', 'ThoiLuong'];
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                data[field] = element.value.trim();
            }
        });

        return data;
    }

    validateForm(data) {
        const requiredFields = ['TenPhim', 'MoTa', 'TheLoai', 'NgayKhoiChieu', 'Trailer', 'TrangThai', 'ThoiLuong'];
        
        for (const field of requiredFields) {
            if (!data[field] || data[field].trim() === '') {
                showNotification(`Vui lòng nhập ${this.getFieldLabel(field)}`, 'warning');
                return false;
            }
        }

        if (!this.isEditMode) {
            const posterFile = document.getElementById('Poster').files[0];
            const bannerFile = document.getElementById('Banner').files[0];
            
            if (!posterFile) {
                showNotification('Vui lòng chọn file poster', 'warning');
                return false;
            }
            if (!bannerFile) {
                showNotification('Vui lòng chọn file banner', 'warning');
                return false;
            }
        }

        return true;
    }

    getFieldLabel(field) {
        const labels = {
            'MaPhim': 'mã phim',
            'TenPhim': 'tên phim',
            'MoTa': 'mô tả',
            'GioiHanTuoi': 'giới hạn tuổi',
            'DinhDang': 'định dạng',
            'DaoDien': 'đạo diễn',
            'DienVien': 'diễn viên',
            'TheLoai': 'thể loại',
            'NgayKhoiChieu': 'ngày khởi chiếu',
            'NgonNgu': 'ngôn ngữ',
            'Trailer': 'trailer',
            'TrangThai': 'trạng thái',
            'ThoiLuong': 'thời lượng'
        };
        return labels[field] || field;
    }

    async autoGenerateMovieCode() {
        try {
            const response = await fetch('../api/movie/generate_simple_code.php');
            const data = await response.json();
            
            if (data.success) {
                const maPhimInput = document.getElementById('MaPhim');
                if (maPhimInput) {
                    maPhimInput.value = data.movieCode;
                }
            } else {
                console.error('Lỗi tạo mã phim:', data.error);

                const maPhimInput = document.getElementById('MaPhim');
                if (maPhimInput) {
                    maPhimInput.value = 'PH001';
                }
            }
        } catch (error) {
            console.error('Lỗi khi tạo mã phim:', error);

            const maPhimInput = document.getElementById('MaPhim');
            if (maPhimInput) {
                maPhimInput.value = 'PH001';
            }
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchMovies());
        }

        // Event listener cho modal xem ảnh
        const imageModal = document.getElementById('imageModal');
        if (imageModal) {
            imageModal.addEventListener('click', (e) => {
                // Chỉ đóng modal khi click vào background (không phải ảnh)
                if (e.target === imageModal) {
                    this.closeImageModal();
                }
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeModal();
                this.closeImageModal();
            }
        });

        // Thêm event listener cho filter theo trạng thái (nếu có)
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterByStatus());
        }
    }

    // Thêm phương thức lọc theo trạng thái
    filterByStatus() {
        const statusFilter = document.getElementById('statusFilter');
        if (!statusFilter) return;

        const selectedStatus = statusFilter.value;
        
        if (!selectedStatus || selectedStatus === 'all') {
            this.filteredMovies = [...this.movies];
        } else {
            this.filteredMovies = this.movies.filter(movie => 
                movie.TrangThai === selectedStatus
            );
        }
        
        this.renderTable();
    }

    // Thêm phương thức để lấy thống kê phim
    getMovieStats() {
        const stats = {
            total: this.movies.length,
            nowShowing: this.movies.filter(m => m.TrangThai === 'Phim đang chiếu').length,
            comingSoon: this.movies.filter(m => m.TrangThai === 'Phim sắp chiếu').length,
            ended: this.movies.filter(m => m.TrangThai === 'Phim đã kết thúc').length
        };
        
        console.log('📊 Thống kê phim:', stats);
        return stats;
    }
}

export default MovieManagement;