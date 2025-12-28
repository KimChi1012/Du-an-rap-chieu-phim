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

    searchMovies() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const searchTerm = removeVietnameseAccents(searchInput.value.trim());
        
        if (!searchTerm) {
            this.filteredMovies = [...this.movies];
        } else {
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
    }
}

export default MovieManagement;