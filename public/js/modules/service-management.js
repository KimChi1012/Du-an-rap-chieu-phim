import { ServiceAPI } from '../api/service.js';
import { showNotification } from './notification.js';

// Use real API to connect to SQL database
const API = ServiceAPI;

class ServiceManagement {
    constructor() {
        console.log('ServiceManagement constructor called');
        this.services = [];
        this.filteredServices = [];
        this.currentService = null;
        this.isEditMode = false;
        this.init();
    }

    async init() {
        console.log('ServiceManagement init called');
        await this.loadServices();
        this.setupEventListeners();
        console.log('ServiceManagement initialization completed');
    }

    async loadServices() {
        try {
            console.log('Starting to load services...');
            this.services = await API.getServices();
            console.log('Services loaded:', this.services);
            this.filteredServices = [...this.services];
            this.renderTable();
            console.log('Table rendered successfully');
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu dịch vụ:', error);
            showNotification('Lỗi khi tải dữ liệu dịch vụ: ' + error.message, 'error');
        }
    }

    renderTable() {
        console.log('Rendering table with data:', this.filteredServices);
        const tbody = document.getElementById('serviceTable');
        if (!tbody) {
            console.error('Table body element not found!');
            return;
        }

        tbody.innerHTML = '';

        if (this.filteredServices.length === 0) {
            console.log('No data to display');
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                        Không có dữ liệu dịch vụ
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredServices.forEach((service, index) => {
            console.log(`Creating row ${index}:`, service);
            const row = this.createTableRow(service);
            tbody.appendChild(row);
        });
        
        console.log('Table rendering completed');
    }

    createTableRow(service) {
        const tr = document.createElement('tr');
        tr.className = 'odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition';

        tr.innerHTML = `
            <td class="px-6 py-4 text-sm font-medium">${service.MaDV || ''}</td>
            <td class="px-6 py-4 text-sm font-semibold">${service.TenDV || ''}</td>
            <td class="px-6 py-4 text-sm text-center">${service.DonGia ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.DonGia) : ''}</td>
            <td class="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title="${service.MoTa || ''}">${service.MoTa || ''}</td>
            <td class="px-6 py-4 text-sm text-center">
                <div class="w-12 h-12 mx-auto rounded border overflow-hidden bg-gray-100 flex items-center justify-center">
                    ${service.Anh ? 
                        `<img src="${service.Anh}" alt="Ảnh dịch vụ" class="w-full h-full object-cover" onerror="this.src='images/default-service.svg'">` : 
                        `<i class="fas fa-image text-gray-400 text-lg"></i>`
                    }
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-center">
                <div class="flex justify-center items-center gap-2 whitespace-nowrap">
                    <div class="action-button-wrapper">
                        <button onclick="window.serviceManagement.editService('${service.MaDV}')"
                            class="action-button edit">
                            <i class="fa fa-edit emoji"></i><span>Sửa</span>
                        </button>
                    </div>
                    <div class="action-button-wrapper">
                        <button onclick="window.serviceManagement.deleteService('${service.MaDV}')"
                            class="action-button delete">
                            <i class="fa fa-trash emoji"></i><span>Xóa</span>
                        </button>
                    </div>
                </div>
            </td>
        `;

        return tr;
    }

    searchServices() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredServices = [...this.services];
        } else {
            this.filteredServices = this.services.filter(service => 
                (service.TenDV && service.TenDV.toLowerCase().includes(searchTerm)) ||
                (service.MoTa && service.MoTa.toLowerCase().includes(searchTerm)) ||
                (service.MaDV && service.MaDV.toString().toLowerCase().includes(searchTerm))
            );
        }
        
        this.renderTable();
    }

    clearForm() {
        const fields = ['MaDV', 'TenDV', 'DonGia', 'MoTa', 'Anh'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.value = '';
                if (field === 'MaDV') {
                    element.disabled = true; // MaDV sẽ được tự động tạo
                    element.placeholder = 'Tự động tạo (DV001, DV002...)';
                }
            }
        });
        
        // Clear image preview
        this.hideImagePreview();
    }

    previewImage(input) {
        console.log('previewImage called with:', input);
        if (input.files && input.files[0]) {
            const file = input.files[0];
            console.log('File selected:', file.name, file.type, file.size);
            
            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                showNotification('Kích thước ảnh không được vượt quá 2MB', 'error');
                input.value = '';
                return;
            }
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                showNotification('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)', 'error');
                input.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log('FileReader loaded successfully');
                const previewImg = document.getElementById('previewImg');
                const imagePreview = document.getElementById('imagePreview');
                
                console.log('Preview elements:', { previewImg, imagePreview });
                
                if (previewImg && imagePreview) {
                    previewImg.src = e.target.result;
                    imagePreview.classList.remove('hidden');
                    console.log('Image preview updated successfully');
                } else {
                    console.error('Preview elements not found!');
                }
            };
            reader.readAsDataURL(file);
        } else {
            console.log('No file selected');
        }
    }

    removeImage() {
        const anhInput = document.getElementById('Anh');
        if (anhInput) {
            anhInput.value = '';
        }
        this.hideImagePreview();
    }

    hideImagePreview() {
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        
        if (imagePreview) {
            imagePreview.classList.add('hidden');
        }
        if (previewImg) {
            previewImg.src = '';
        }
    }

    showExistingImage(imagePath) {
        if (imagePath && imagePath.trim()) {
            const previewImg = document.getElementById('previewImg');
            const imagePreview = document.getElementById('imagePreview');
            
            if (previewImg && imagePreview) {
                // All images are now in images/ folder
                previewImg.src = imagePath;
                imagePreview.classList.remove('hidden');
            }
        }
    }

    fillForm(service) {
        const fields = ['MaDV', 'TenDV', 'DonGia', 'MoTa'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && service[field] !== undefined) {
                element.value = service[field] || '';
                if (field === 'MaDV') {
                    element.disabled = true; // Không cho sửa mã dịch vụ
                }
            }
        });
        
        // Reset file input khi edit
        const anhElement = document.getElementById('Anh');
        if (anhElement) {
            anhElement.value = '';
        }
        
        // Show existing image if available
        if (service.Anh) {
            this.showExistingImage(service.Anh);
        } else {
            this.hideImagePreview();
        }
    }

    getFormData() {
        return {
            MaDV: document.getElementById('MaDV').value.trim(),
            TenDV: document.getElementById('TenDV').value.trim(),
            DonGia: document.getElementById('DonGia').value.trim(),
            MoTa: document.getElementById('MoTa').value.trim(),
            Anh: document.getElementById('Anh').files[0] // FILE
        };
    }

    validateForm(data) {
        const requiredFields = ['TenDV', 'MoTa', 'DonGia'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                showNotification(`Vui lòng nhập ${this.getFieldLabel(field)}`, 'error');
                return false;
            }
        }

        // Ảnh không bắt buộc - sẽ dùng ảnh mặc định nếu không có

        // Validate đơn giá
        if (isNaN(data.DonGia) || parseFloat(data.DonGia) <= 0) {
            showNotification('Đơn giá phải là số dương', 'error');
            return false;
        }

        return true;
    }

    getFieldLabel(field) {
        const labels = {
            'TenDV': 'tên dịch vụ',
            'DonGia': 'đơn giá',
            'MoTa': 'mô tả',
            'Anh': 'URL ảnh'
        };
        return labels[field] || field;
    }

    setupEventListeners() {
        // Setup search input listener
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchServices());
        }

        // Setup modal close on Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeModal();
            }
        });
    }
}

// Initialize immediately when script loads
console.log('Script loaded, waiting for DOM...');

function initializeServiceManagement() {
    console.log('Initializing ServiceManagement...');
    if (document.getElementById('serviceTable')) {
        console.log('Table found, creating instance...');
        const instance = new ServiceManagement();
        window.serviceManagement = instance;
        window.serviceManagement.instance = instance; // Store reference for helper functions
        return true;
    } else {
        console.log('Table not found yet...');
        return false;
    }
}

// Try multiple initialization methods
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded event fired');
    if (!initializeServiceManagement()) {
        // If table not found, try again after a short delay
        setTimeout(() => {
            console.log('Retrying initialization...');
            initializeServiceManagement();
        }, 500);
    }
});

// Backup initialization
window.addEventListener('load', () => {
    if (!window.serviceManagement) {
        console.log('Window load event - backup initialization');
        initializeServiceManagement();
    }
});

// Immediate check if DOM is already ready
if (document.readyState === 'loading') {
    console.log('DOM is still loading...');
} else {
    console.log('DOM already ready, initializing immediately...');
    initializeServiceManagement();
}

export default ServiceManagement;

// Export functions to window object for HTML onclick handlers
if (typeof window !== 'undefined') {
    window.serviceManagement = window.serviceManagement || {};
    
    // Add helper functions for HTML
    window.serviceManagement.previewImage = function(input) {
        console.log('Window previewImage called with:', input);
        if (window.serviceManagement.instance) {
            console.log('Calling instance previewImage method');
            window.serviceManagement.instance.previewImage(input);
        } else {
            console.error('ServiceManagement instance not found!');
        }
    };
    
    window.serviceManagement.removeImage = function() {
        console.log('Window removeImage called');
        if (window.serviceManagement.instance) {
            window.serviceManagement.instance.removeImage();
        } else {
            console.error('ServiceManagement instance not found!');
        }
    };
    
    console.log('Window functions exported successfully');
}