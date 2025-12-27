import BannerAPI from '../api/banner.js';
import { showNotification } from './notification.js';

class BannerManagement {
    constructor() {
        console.log('🚀 BannerManagement constructor called');
        this.banners = [];
        this.mode = 'add'; 
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

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchBanners());
        }


        const addButton = document.querySelector('.add-user-button');
        if (addButton) {
            addButton.onclick = () => this.openAdd();
        }


        if (this.modal) {
            this.modal.addEventListener('click', (e) => this.handleModalClick(e));
        }


        document.querySelectorAll('.modal-button.cancel, .text-gray-500').forEach(btn => {
            btn.onclick = () => this.closeModal();
        });


        const saveButton = document.querySelector('.modal-button.save');
        if (saveButton) {
            saveButton.onclick = () => this.saveBanner();
        }


        const fileInput = document.getElementById('HinhAnhFile');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.previewImage(e.target));
        }


        const removeImageBtn = document.querySelector('.text-red-500');
        if (removeImageBtn) {
            removeImageBtn.onclick = () => this.removeImage();
        }
    }

    /* ================= LOAD ================= */
    async loadBanners() {
        try {
            this.banners = await this.api.getBanners();
            this.renderTable(this.banners);
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

    /* ================= SEARCH ================= */

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

    /* ================= MODAL ================= */
    async openAdd() {
        this.mode = 'add';
        this.editingMaQC = null;
        document.getElementById('modalTitle').innerText = 'Thêm banner';
        this.resetForm();


        document.getElementById('MaBanner').value = 'Đang tạo mã...';
        

        this.openModal();

        try {
            const maQC = await this.api.getNewMaQC();
            document.getElementById('MaBanner').value = maQC;
        } catch (error) {
            document.getElementById('MaBanner').value = 'Lỗi tạo mã';
        }
    }

    openEdit(banner) {
        this.mode = 'edit';
        this.editingMaQC = banner.MaQC;
        document.getElementById('modalTitle').innerText = 'Sửa banner';

        document.getElementById('MaBanner').value = banner.MaQC;
        document.getElementById('TenBanner').value = banner.TenQC;
        document.getElementById('LienKet').value = banner.Link || '';
        

        document.querySelectorAll('#bannerModal input').forEach(i => i.disabled = false);
        document.querySelector('.modal-button.save').style.display = 'inline-block';

        if (banner.Banner) {
            document.getElementById('previewImg').src = banner.Banner;
            document.getElementById('imagePreview').classList.remove('hidden');
            document.getElementById('HinhAnh').value = banner.Banner;
        }

        this.openModal();
    }

    openModal() {
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
    }

    handleModalClick(e) {


    }

    resetForm() {
        document.getElementById('MaBanner').value = '';
        document.getElementById('TenBanner').value = '';
        document.getElementById('LienKet').value = '';
        document.getElementById('HinhAnhFile').value = '';
        document.getElementById('HinhAnh').value = '';
        document.getElementById('imagePreview').classList.add('hidden');
        

        document.querySelectorAll('#bannerModal input').forEach(i => i.disabled = false);
        document.querySelector('.modal-button.save').style.display = 'inline-block';
        document.querySelector('.modal-button.save').disabled = false;
    }

    /* ================= SAVE ================= */
    async saveBanner() {

        const maQC = document.getElementById('MaBanner').value;
        if (!maQC || maQC === 'Đang tạo mã...' || maQC === 'Lỗi tạo mã') {
            showNotification('Vui lòng đợi hệ thống tạo mã quảng cáo hoặc thử lại!', 'warning');
            return;
        }


        const tenBanner = document.getElementById('TenBanner').value.trim();
        if (!tenBanner) {
            showNotification('Vui lòng nhập tên quảng cáo!', 'warning');
            document.getElementById('TenBanner').focus();
            return;
        }

        const saveButton = document.querySelector('.modal-button.save');
        const originalText = saveButton.textContent;
        
        try {

            saveButton.textContent = 'Đang lưu...';
            saveButton.disabled = true;

            const formData = new FormData();


            if (this.mode === 'edit') {
                formData.append('MaQC', document.getElementById('MaBanner').value.trim());
            }

            formData.append('TenQC', tenBanner);
            const linkValue = document.getElementById('LienKet').value.trim();
            if (linkValue !== '') {
                formData.append('Link', linkValue);
            }

            const file = document.getElementById('HinhAnhFile').files[0];
            if (file) {
                formData.append('Banner', file);
            }

            let result;
            if (this.mode === 'add') {
                result = await this.api.addBanner(formData);
            } else {
                result = await this.api.updateBanner(formData);
            }


            if (this.mode === 'add' && result.MaQC) {
                document.getElementById('MaBanner').value = result.MaQC;
            }

            this.closeModal();

            await this.loadBanners();
            
        } catch (error) {

        } finally {

            saveButton.textContent = originalText;
            saveButton.disabled = false;
        }
    }

    /* ================= DELETE ================= */
    async deleteBanner(maQC) {
        const banner = this.banners.find(b => b.MaQC === maQC);
        if (!banner) return;

        const confirmDelete = () => {
            return new Promise((resolve) => {
                const notification = document.createElement('div');
                notification.className = 'notification notification-show';
                notification.innerHTML = `
                    <div class="notification-content">
                        <i class="notification-icon fa-solid fa-exclamation-triangle" aria-hidden="true"></i>
                        <span class="notification-message">Bạn có chắc muốn xóa banner "${banner.TenQC}"?</span>
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
            await this.api.deleteBanner(maQC);

            await this.loadBanners();
        } catch (error) {
            console.error('Lỗi:', error);

        }
    }

    /* ================= IMAGE ================= */
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

    /* ================= PREVIEW BANNER IMAGE ================= */
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