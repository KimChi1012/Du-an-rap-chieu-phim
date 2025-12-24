import BannerAPI from '../api/banner.js';
import { showNotification } from './notification.js';

class BannerManagement {
    constructor() {
        console.log('🚀 BannerManagement constructor called');
        this.banners = [];
        this.mode = 'add'; // add | edit
        this.editingMaQC = null;
        this.api = new BannerAPI();

        this.modal = document.getElementById('bannerModal');
        this.tableBody = document.getElementById('bannerTable');

        console.log('📋 Modal element:', this.modal);
        console.log('📊 Table body element:', this.tableBody);

        this.init();
    }

    async init() {
        console.log('🔧 Initializing BannerManagement...');
        await this.loadBanners();
        this.bindEvents();
        console.log('✅ BannerManagement initialized successfully');
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchBanners());
        }
    }

    async loadBanners() {
        try {
            this.banners = await this.api.getBanners();
            this.renderTable(this.banners);
            
            if (this.banners.length > 0) {
                this.testSearch();
            }
        } catch (error) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-6 text-red-500">
                        ❌ Lỗi: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    renderTable(data) {
        this.tableBody.innerHTML = '';

        if (data.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-6 text-gray-400">
                        Không có banner
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach((b, index) => {
            const tr = document.createElement('tr');
            tr.className = 'odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition';

            tr.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium">${b.MaQC}</td>
                <td class="px-6 py-4 text-sm font-semibold">${b.TenQC}</td>
                <td class="px-6 py-4 text-sm text-center">
                    ${b.Banner ? `<img src="${b.Banner}" class="banner-thumbnail" alt="${b.TenQC}">` : '<span class="text-gray-400">Không có ảnh</span>'}
                </td>
                <td class="px-6 py-4 text-sm text-center">
                    ${b.Link ? `<a href="${b.Link}" target="_blank" class="text-blue-500 hover:underline">Mở</a>` : '<span class="text-gray-400">Không có</span>'}
                </td>
                <td class="px-6 py-4 text-sm text-center">
                    <div class="flex justify-center items-center gap-2 whitespace-nowrap">
                        <div class="action-button-wrapper">
                            <button class="action-button edit edit-btn">
                                <i class="fa fa-edit emoji"></i><span>Sửa</span>
                            </button>
                        </div>
                        <div class="action-button-wrapper">
                            <button class="action-button delete delete-btn">
                                <i class="fa fa-trash emoji"></i><span>Xóa</span>
                            </button>
                        </div>
                    </div>
                </td>
            `;

            tr.querySelector('.edit-btn').addEventListener('click', () => this.openEdit(b));
            tr.querySelector('.delete-btn').addEventListener('click', () => this.deleteBanner(b.MaQC));

            const img = tr.querySelector('.banner-thumbnail');
            if (img) {
                img.addEventListener('click', () => this.previewBannerImage(b.Banner, b.TenQC));
            }

            this.tableBody.appendChild(tr);
        });
    }

    removeAccents(str) {
        return str.normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/đ/g, 'd')
                  .replace(/Đ/g, 'D');
    }

    testSearch() {
        const testCases = [
            { input: 'tu chien', expected: 'TỬ CHIẾN TRÊN KHÔNG' },
            { input: 'tay anh', expected: 'TAY ANH GIỮ MỘT VÌ SAO' },
            { input: 'trai tim', expected: 'TRÁI TIM QUÈ QUẶT' },
            { input: 'conjuring', expected: 'THE CONJURING: NGHI LỄ CUỐI CÙNG' }
        ];
        
        console.log('🧪 Testing search function (tên banner only):');
        testCases.forEach(test => {
            const found = this.banners.find(b => {
                const tenQC = b.TenQC.toLowerCase();
                const tenQCNoAccent = this.removeAccents(tenQC);
                const key = test.input.toLowerCase();
                const keyNoAccent = this.removeAccents(key);
                
                return tenQC.includes(key) || 
                       tenQCNoAccent.includes(key) || 
                       tenQC.includes(keyNoAccent) || 
                       tenQCNoAccent.includes(keyNoAccent);
            });
            
            console.log(`  "${test.input}" → ${found ? '✅ Found: ' + found.TenQC : '❌ Not found'}`);
        });
    }

    searchBanners() {
        const key = document.getElementById('searchInput').value.toLowerCase().trim();
        
        if (!key) {
            this.renderTable(this.banners);
            return;
        }
        
        const keyNoAccent = this.removeAccents(key);
        
        const filtered = this.banners.filter(b => {
            const tenQC = b.TenQC.toLowerCase();
            const tenQCNoAccent = this.removeAccents(tenQC);

            return tenQC.includes(key) || 
                   tenQCNoAccent.includes(key) || 
                   tenQC.includes(keyNoAccent) || 
                   tenQCNoAccent.includes(keyNoAccent);
        });
        
        this.renderTable(filtered);
        
        console.log(`🔍 Tìm thấy ${filtered.length}/${this.banners.length} banner với từ khóa: "${key}"`);
    }

    resetForm() {
        document.getElementById('MaBanner').value = '';
        document.getElementById('TenBanner').value = '';
        document.getElementById('LienKet').value = '';
        document.getElementById('HinhAnhFile').value = '';
        document.getElementById('HinhAnh').value = '';
        document.getElementById('imagePreview').classList.add('hidden');
    }

    previewImage(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('imagePreview').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    removeImage() {
        document.getElementById('HinhAnhFile').value = '';
        document.getElementById('imagePreview').classList.add('hidden');
    }

    previewBannerImage(imagePath) {
        const modal = document.createElement('div');
        modal.className = 'image-preview-modal';
        modal.onclick = () => modal.remove();
        
        modal.innerHTML = `
            <div class="image-preview-content">
                <img src="${imagePath}" class="image-preview-img">
                <div class="image-preview-close">
                    <button onclick="this.closest('.image-preview-modal').remove()" 
                            class="close-btn">
                        ×
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

export default BannerManagement;