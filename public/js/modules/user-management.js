import { UserAPI } from '../api/user.js';
import { showNotification } from './notification.js';

let users = [];
let mode = "add";

// Helper function để format thời gian Việt Nam
function formatVietnameseDateTime(dateString) {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

export function initUserManagement() {
    console.log('🚀 Khởi tạo User Management...');
    loadUsers();
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('userModal');
            if (modal && !modal.classList.contains('hidden')) {
                closeModal();
            }
        }
    });
}

async function loadUsers() {
    console.log('📡 Đang tải dữ liệu users...');
    try {
        const data = await UserAPI.getUsers();
        console.log("✅ Dữ liệu từ bảng NguoiDung:", data);
        users = data;
        displayUsers(data);
    } catch (error) {
        console.error("❌ Lỗi kết nối database:", error);
        const tbody = document.getElementById("userTable");
        if (tbody) {
            tbody.innerHTML = `
            <tr>
                <td colspan="12" class="px-6 py-4 text-center text-red-500">
                    ❌ Không thể kết nối database<br>
                    <small>Lỗi: ${error.message}</small><br>
                    <small>Hãy đảm bảo: 1) MySQL đang chạy 2) Database 'HighCinema' tồn tại 3) Mở qua web server</small>
                </td>
            </tr>`;
        }
    }
}

function displayUsers(users) {
    const tbody = document.getElementById("userTable");
    if (!tbody) return;
    
    tbody.innerHTML = "";

    if (users.error) {
        tbody.innerHTML = `<tr><td colspan="12" class="px-6 py-4 text-center text-red-500">Lỗi database: ${users.error}</td></tr>`;
        return;
    }

    if (!Array.isArray(users) || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="px-6 py-4 text-center text-gray-500">Bảng NguoiDung không có dữ liệu</td></tr>`;
        return;
    }

    updateStats(users);

    users.forEach((user, index) => {
        const row = `
        <tr class="odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition">
            <td class="px-6 py-4 text-sm font-medium">${user.MaND}</td>
            <td class="px-6 py-4 text-sm font-semibold">${user.HoTen}</td>
            <td class="px-6 py-4 text-sm text-blue-600 break-all">${user.Email}</td>
            <td class="px-6 py-4 text-sm text-center">${user.SoDT || 'Chưa có'}</td>
            <td class="px-6 py-4 text-sm text-center">${user.NgaySinh || ''}</td>
            <td class="px-6 py-4 text-sm">${user.ThanhPho || ''}</td>
            <td class="px-6 py-4 text-sm">${user.TenDN}</td>
            <td class="px-6 py-4 text-sm text-center">******</td>
            <td class="px-6 py-4 text-sm text-center">
                <span class="px-3 py-1 text-xs rounded-full font-medium
                    ${(user.QuyenHan === 'Admin' || user.QuyenHan === 'Quản trị viên')
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'}">
                    ${(user.QuyenHan === 'Admin' || user.QuyenHan === 'Quản trị viên') 
                        ? '🛡️ Admin' 
                        : '👤 Khách hàng'}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-center">
                <div class="w-8 h-8 mx-auto rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    ${user.Avatar ? 
                        `<img src="${user.Avatar}" class="w-full h-full object-cover" alt="Avatar">` :
                        `<i class="fa fa-user text-gray-500 text-sm"></i>`
                    }
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-center">${formatVietnameseDateTime(user.NgayTao)}</td>

            <td class="px-6 py-4 text-sm text-center">
                <div class="flex justify-center items-center gap-2 whitespace-nowrap">
                    <div class="action-button-wrapper">
                        <button onclick="window.userManagement.openEdit(${index})"
                            class="action-button edit">
                            <i class="fa fa-edit emoji"></i><span>Sửa</span>
                        </button>
                    </div>
                    <div class="action-button-wrapper">
                        <button onclick="window.userManagement.deleteUser(${index})"
                            class="action-button delete">
                            <i class="fa fa-trash emoji"></i><span>Xóa</span>
                        </button>
                    </div>
                </div>
            </td>
        </tr>`;
        tbody.innerHTML += row;
    });

    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

function updateStats(users) {
    const totalUsers = users.length;
    const admins = users.filter(u => u.QuyenHan === 'Admin' || u.QuyenHan === 'Quản trị viên').length;
    const customers = users.filter(u => u.QuyenHan === 'Khách hàng').length;
    
    const totalElement = document.querySelector('.grid > div:nth-child(1) .text-2xl');
    const adminElement = document.querySelector('.grid > div:nth-child(2) .text-2xl');
    const customerElement = document.querySelector('.grid > div:nth-child(3) .text-2xl');
    
    if (totalElement) totalElement.textContent = totalUsers;
    if (adminElement) adminElement.textContent = admins;
    if (customerElement) customerElement.textContent = customers;
}

export function openAdd() {
    mode = "add";
    const modalTitle = document.getElementById("modalTitle");
    if (modalTitle) modalTitle.innerText = "Thêm người dùng";
    
    clearForm();
    generateNewUserCode();

    const addPasswordDiv = document.getElementById('addPasswordDiv');
    const currentPasswordDiv = document.getElementById('currentPasswordDiv');
    const newPasswordDiv = document.getElementById('newPasswordDiv');
    
    if (addPasswordDiv) addPasswordDiv.classList.remove('hidden');
    if (currentPasswordDiv) currentPasswordDiv.classList.add('hidden');
    if (newPasswordDiv) newPasswordDiv.classList.add('hidden');
    
    showModal();
}

export function openEdit(index) {
    mode = "edit";
    const modalTitle = document.getElementById("modalTitle");
    if (modalTitle) modalTitle.innerText = "Sửa người dùng";

    const u = users[index];
    const fields = ['MaND', 'HoTen', 'Email', 'SoDT', 'NgaySinh', 'ThanhPho', 'TenDN', 'QuyenHan'];
    
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) element.value = u[field] || '';
    });

    const currentPasswordField = document.getElementById('MatKhauHienTai');
    const newPasswordField = document.getElementById('MatKhauMoi');
    if (currentPasswordField) currentPasswordField.value = '';
    if (newPasswordField) newPasswordField.value = '';

    const addPasswordDiv = document.getElementById('addPasswordDiv');
    const currentPasswordDiv = document.getElementById('currentPasswordDiv');
    const newPasswordDiv = document.getElementById('newPasswordDiv');
    
    if (addPasswordDiv) addPasswordDiv.classList.add('hidden');
    if (currentPasswordDiv) currentPasswordDiv.classList.remove('hidden');
    if (newPasswordDiv) newPasswordDiv.classList.remove('hidden');

    showExistingAvatar(u.Avatar);
    showModal();
}

function showModal() {
    const modal = document.getElementById("userModal");
    if (modal) {
        modal.classList.remove("hidden");

        setTimeout(() => {
            const firstInput = modal.querySelector('input:not([readonly]):not([type="hidden"])');
            if (firstInput) firstInput.focus();
        }, 100);
    }
}

export function closeModal() {
    const modal = document.getElementById("userModal");
    if (modal) {
        modal.classList.add("hidden");
        clearForm();
    }
}

function clearForm() {
    document.querySelectorAll("#userModal input").forEach(i => i.value = "");
    document.querySelectorAll("#userModal select").forEach(s => s.selectedIndex = 0);

    const avatarPreview = document.getElementById('avatarPreview');
    const previewImg = document.getElementById('previewImg');
    if (avatarPreview) avatarPreview.classList.add('hidden');
    if (previewImg) previewImg.src = '';
}

function generateNewUserCode() {
    if (users && users.length > 0) {
        const maxId = Math.max(...users.map(u => {
            const num = parseInt(u.MaND.replace('ND', ''));
            return isNaN(num) ? 0 : num;
        }));
        
        const newId = maxId + 1;
        const newCode = 'ND' + String(newId).padStart(3, '0');
        const maND = document.getElementById('MaND');
        if (maND) maND.value = newCode;
    } else {
        const maND = document.getElementById('MaND');
        if (maND) maND.value = 'ND001';
    }
}

export function searchUsers() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;
    
    const keyword = searchInput.value.toLowerCase().trim();

    const filtered = users.filter(u =>
        u.MaND?.toLowerCase().includes(keyword) ||
        u.HoTen?.toLowerCase().includes(keyword) ||
        u.Email?.toLowerCase().includes(keyword) ||
        u.SoDT?.includes(keyword) ||
        u.TenDN?.toLowerCase().includes(keyword) ||
        u.ThanhPho?.toLowerCase().includes(keyword) ||
        u.QuyenHan?.toLowerCase().includes(keyword)
    );

    displayUsers(filtered);
}

export async function saveUser() {
    const data = {
        MaND: document.getElementById('MaND')?.value.trim() || '',
        HoTen: document.getElementById('HoTen')?.value.trim() || '',
        Email: document.getElementById('Email')?.value.trim() || '',
        SoDT: document.getElementById('SoDT')?.value.trim() || '',
        NgaySinh: document.getElementById('NgaySinh')?.value.trim() || '',
        ThanhPho: document.getElementById('ThanhPho')?.value.trim() || '',
        TenDN: document.getElementById('TenDN')?.value.trim() || '',
        QuyenHan: document.getElementById('QuyenHan')?.value.trim() || '',
        Avatar: document.getElementById('Avatar')?.value.trim() || ''
    };


    if (!data.MaND || !data.HoTen || !data.Email || !data.TenDN || !data.ThanhPho || !data.QuyenHan) {
        showNotification("Vui lòng nhập đầy đủ thông tin bắt buộc (có dấu *)", 'error');
        return;
    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.Email)) {
        showNotification("Email không hợp lệ", 'error');
        return;
    }


    if (data.SoDT && !/^\d{9,11}$/.test(data.SoDT)) {
        showNotification("Số điện thoại phải có từ 9-11 chữ số", 'error');
        return;
    }


    if (data.NgaySinh) {
        const birthDate = new Date(data.NgaySinh);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 13 || age > 100) {
            showNotification("Tuổi phải từ 13 đến 100", 'error');
            return;
        }
    }


    if (data.TenDN.length < 3) {
        showNotification("Tên đăng nhập phải có ít nhất 3 ký tự", 'error');
        return;
    }

    if (mode === "add") {
        const matKhau = document.getElementById('MatKhau')?.value.trim() || '';
        if (!matKhau) {
            showNotification("Vui lòng nhập mật khẩu", 'error');
            return;
        }
        if (matKhau.length < 6) {
            showNotification("Mật khẩu phải có ít nhất 6 ký tự", 'error');
            return;
        }
        data.MatKhau = matKhau;
    } else {
        const matKhauHienTai = document.getElementById('MatKhauHienTai')?.value.trim() || '';
        if (!matKhauHienTai) {
            showNotification("Vui lòng nhập mật khẩu hiện tại để xác nhận", 'error');
            return;
        }
        data.MatKhauHienTai = matKhauHienTai;

        const matKhauMoi = document.getElementById('MatKhauMoi')?.value.trim() || '';
        if (matKhauMoi && matKhauMoi.length < 6) {
            showNotification("Mật khẩu mới phải có ít nhất 6 ký tự", 'error');
            return;
        }
        if (matKhauMoi) {
            data.MatKhauMoi = matKhauMoi;
        }
    }

    const saveButton = document.querySelector('.modal-button.save');
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = 'Đang lưu...';
    }

    try {
        let result;
        
        if (mode === "add") {
            result = await UserAPI.addUser(data);
        } else {
            result = await UserAPI.updateUser(data);
        }
        
        if (result.success) {
            showNotification(result.message, 'success');
            closeModal();
            loadUsers();
        } else {
            showNotification(result.error, 'error');
        }
        
    } catch (error) {
        console.error('Lỗi:', error);
        showNotification('Lỗi kết nối server', 'error');
    } finally {

        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = 'Lưu';
        }
    }
}

export async function deleteUser(index) {
    const user = users[index];

    const confirmDelete = () => {
        return new Promise((resolve) => {
            const notification = document.createElement('div');
            notification.className = 'notification notification-show';
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="notification-icon fa-solid fa-exclamation-triangle" aria-hidden="true"></i>
                    <span class="notification-message">Bạn có chắc muốn xóa người dùng "${user.HoTen}"?</span>
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
        const result = await UserAPI.deleteUser(user.MaND);
        
        if (result.success) {
            showNotification(result.message, 'success');
            loadUsers();
        } else {
            showNotification(result.error, 'error');
        }
        
    } catch (error) {
        console.error('Lỗi:', error);
        showNotification('Lỗi kết nối server', 'error');
    }
}

export function previewAvatar(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        if (file.size > 2 * 1024 * 1024) {
            showNotification('Kích thước ảnh không được vượt quá 2MB', 'error');
            input.value = '';
            return;
        }

        if (!file.type.startsWith('image/')) {
            showNotification('Vui lòng chọn file ảnh (jpg, png, gif...)', 'error');
            input.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImg = document.getElementById('previewImg');
            const avatarPreview = document.getElementById('avatarPreview');
            const avatarField = document.getElementById('Avatar');
            
            if (previewImg) previewImg.src = e.target.result;
            if (avatarPreview) avatarPreview.classList.remove('hidden');
            if (avatarField) avatarField.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

export function removeAvatar() {
    const avatarFile = document.getElementById('AvatarFile');
    const avatar = document.getElementById('Avatar');
    const avatarPreview = document.getElementById('avatarPreview');
    const previewImg = document.getElementById('previewImg');
    
    if (avatarFile) avatarFile.value = '';
    if (avatar) avatar.value = '';
    if (avatarPreview) avatarPreview.classList.add('hidden');
    if (previewImg) previewImg.src = '';
}

function showExistingAvatar(avatarData) {
    const previewImg = document.getElementById('previewImg');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatar = document.getElementById('Avatar');
    
    if (avatarData && avatarData.trim()) {
        if (previewImg) previewImg.src = avatarData;
        if (avatarPreview) avatarPreview.classList.remove('hidden');
        if (avatar) avatar.value = avatarData;
    } else {
        if (avatarPreview) avatarPreview.classList.add('hidden');
    }
}

export function limitPhone(input) {

    input.value = input.value.replace(/\D/g, '');


    if (input.value.length > 11) {
        input.value = input.value.slice(0, 11);
    }
}

export function handleModalClick(event) {




}

window.userManagement = {
    openAdd,
    openEdit,
    closeModal,
    saveUser,
    deleteUser,
    searchUsers,
    previewAvatar,
    removeAvatar,
    limitPhone,
    handleModalClick
};