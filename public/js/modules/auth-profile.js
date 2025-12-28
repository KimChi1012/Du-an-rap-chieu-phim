// js/modules/authprofile.js

import { showNotification } from './notification.js';

let CURRENT_USER = null;
let isChangingPassword = false;
let isEditingProfile = false;
let hasNewAvatar = false; // Theo dõi xem có avatar mới không
let originalAvatarSrc = ''; // Lưu avatar gốc

export function initAuthProfile() {
  /* ===== DOM ===== */
  const form = document.getElementById('profile-form');
  if (!form) return;

  const avatarImg = document.querySelector('.profile-avatar');
  const formActions = document.getElementById('form-actions');

  const editProfileBtn = document.getElementById('edit-profile-btn');
  const changePassBtn = document.getElementById('change-password-btn');
  const cancelChangePassBtn = document.getElementById('cancel-change-password-btn');
  const passwordSection = document.getElementById('password-section');

  const currentPassInput = document.getElementById('current-password');
  const newPassInput = document.getElementById('password');
  const cfPassInput = document.getElementById('cf-password');

  // Profile inputs
  const fullnameInput = document.getElementById('fullname');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const birthdateInput = document.getElementById('birthdate');
  const cityInput = document.getElementById('city-input');
  const citySelect = document.getElementById('city-select');

  /* ===== TABS ===== */
  initTabs();

  /* ===== LOAD USER ===== */
  loadUser();

  /* ===== PASSWORD INIT ===== */
  resetPasswordSection();

  /* ===== CHỈNH SỬA PROFILE ===== */
  editProfileBtn.addEventListener('click', () => {
    isEditingProfile = true;
    enableProfileInputs();
    showFormActions();
    editProfileBtn.style.display = 'none';
    
    // Switch to select for city
    cityInput.style.display = 'none';
    citySelect.style.display = 'block';
    citySelect.value = cityInput.value;
  });

  /* ===== ĐỔI MẬT KHẨU ===== */
  changePassBtn.addEventListener('click', () => {
    isChangingPassword = true;
    passwordSection.hidden = false;
    changePassBtn.style.display = 'none';
    enablePasswordInputs();
    showFormActions();
  });

  cancelChangePassBtn.addEventListener('click', resetPasswordSection);

  /* ===== SUBMIT ===== */
  form.addEventListener('submit', handleSubmit);

  /* ===== CANCEL ===== */
  document.querySelector('.cancel-btn')
    ?.addEventListener('click', () => {
      // Reset avatar về trạng thái ban đầu nếu có thay đổi
      if (hasNewAvatar) {
        avatarImg.src = originalAvatarSrc;
        hasNewAvatar = false;
      }
      resetEditMode();
      loadUser(); // Reload original data
    });

  /* ===== AVATAR ===== */
  initAvatarUpload();

  /* ================= HELPER FUNCTIONS ================= */

  function resetPasswordSection() {
    isChangingPassword = false;
    passwordSection.hidden = true;
    changePassBtn.style.display = 'inline-block';

    currentPassInput.value = '';
    newPassInput.value = '';
    cfPassInput.value = '';

    disablePasswordInputs();
    
    if (!isEditingProfile) {
      hideFormActions();
    }
  }

  function resetEditMode() {
    isEditingProfile = false;
    hasNewAvatar = false; // Reset avatar flag
    disableProfileInputs();
    hideFormActions();
    editProfileBtn.style.display = 'inline-block';
    
    // Switch back to input for city
    citySelect.style.display = 'none';
    cityInput.style.display = 'block';
    
    // Reset avatar to original if no new avatar was saved
    if (!hasNewAvatar) {
      avatarImg.src = originalAvatarSrc;
    }
    
    // Also reset password section if active
    if (isChangingPassword) {
      resetPasswordSection();
    }
  }

  function disablePasswordInputs() {
    currentPassInput.disabled = true;
    newPassInput.disabled = true;
    cfPassInput.disabled = true;
  }

  function enablePasswordInputs() {
    currentPassInput.disabled = false;
    newPassInput.disabled = false;
    cfPassInput.disabled = false;
  }

  function disableProfileInputs() {
    fullnameInput.disabled = true;
    emailInput.disabled = true;
    phoneInput.disabled = true;
    birthdateInput.disabled = true;
    cityInput.disabled = true;
    citySelect.disabled = true;
  }

  function enableProfileInputs() {
    fullnameInput.disabled = false;
    emailInput.disabled = false;
    phoneInput.disabled = false;
    birthdateInput.disabled = false;
    cityInput.disabled = false;
    citySelect.disabled = false;
  }

  function showFormActions() {
    formActions.style.display = 'flex';
  }

  function hideFormActions() {
    formActions.style.display = 'none';
  }

  /* ===== LOAD USER DATA ===== */
  async function loadUser() {
    try {
      const res = await fetch('../api/user/get_user_info.php');
      const data = await res.json();

      if (!data.success) {
        showNotification('Bạn chưa đăng nhập', 'error');
        setTimeout(() => {
          window.location.href = 'login-register.html';
        }, 2000);
        return;
      }

      CURRENT_USER = data.user;

      form.fullname.value = CURRENT_USER.HoTen ?? '';
      form.email.value = CURRENT_USER.Email ?? '';
      form.phone.value = CURRENT_USER.SoDT ?? '';
      form.birthdate.value = CURRENT_USER.NgaySinh ?? '';
      cityInput.value = CURRENT_USER.ThanhPho ?? '';
      citySelect.value = CURRENT_USER.ThanhPho ?? '';
      form.username.value = CURRENT_USER.TenDN ?? '';

      // Luôn sử dụng API get_avatar.php để lấy avatar từ database
      avatarImg.src = '../api/user/get_avatar.php';
      originalAvatarSrc = '../api/user/get_avatar.php';

    } catch (err) {
      console.error('Lỗi load user:', err);
      showNotification('Không thể tải thông tin người dùng', 'error');
    }
  }

  /* ===== SUBMIT FORM ===== */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!CURRENT_USER) return;

    const payload = {
      MaND: CURRENT_USER.MaND,
      TenDN: CURRENT_USER.TenDN,
      QuyenHan: CURRENT_USER.QuyenHan,
      NgaySinh: form.birthdate.value || null,

      HoTen: form.fullname.value.trim(),
      Email: form.email.value.trim(),
      SoDT: form.phone.value.trim(),
      ThanhPho: citySelect.style.display === 'block' ? citySelect.value.trim() : cityInput.value.trim()
    };

    // Chỉ gửi avatar nếu có avatar mới
    if (hasNewAvatar) {
      payload.Avatar = avatarImg.src; // Gửi base64 data của avatar mới
    }
    // Nếu không có avatar mới, không gửi trường Avatar để giữ nguyên trong database

    // Nếu đang đổi mật khẩu mới
    if (isChangingPassword) {
      const currentPass = currentPassInput.value.trim();
      const newPass = newPassInput.value.trim();
      const cfPass = cfPassInput.value.trim();

      if (!currentPass) {
        showNotification('Vui lòng nhập mật khẩu hiện tại', 'warning');
        return;
      }

      if (!newPass || !cfPass) {
        showNotification('Vui lòng nhập đầy đủ mật khẩu mới', 'warning');
        return;
      }

      if (newPass !== cfPass) {
        showNotification('Xác nhận mật khẩu không khớp', 'error');
        return;
      }

      payload.MatKhauHienTai = currentPass;
      payload.MatKhauMoi = newPass;
    }

    try {
      const res = await fetch('../api/user/update_user.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!data.success) {
        showNotification(data.error || 'Cập nhật thất bại', 'error');
        return;
      }

      showNotification('Cập nhật thành công', 'success');
      setTimeout(() => {
        // Update the input with the new value from select
        cityInput.value = citySelect.value;
        
        // Reset avatar flag after successful save
        if (hasNewAvatar) {
          // Cập nhật originalAvatarSrc để trỏ về API get_avatar.php
          originalAvatarSrc = '../api/user/get_avatar.php';
          hasNewAvatar = false;
        }
        
        resetEditMode();
        loadUser(); // Reload updated data
      }, 1500);

    } catch (err) {
      console.error(err);
      showNotification('Lỗi cập nhật', 'error');
    }
  }

  /* ===== AVATAR UPLOAD ===== */
  function initAvatarUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.hidden = true;
    document.body.appendChild(input);

    avatarImg.addEventListener('click', () => {
      if (!isEditingProfile) {
        showNotification('Vui lòng nhấn "Chỉnh sửa thông tin" để thay đổi avatar', 'info');
        return;
      }
      input.click();
    });

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        avatarImg.src = e.target.result;
        hasNewAvatar = true; // Đánh dấu có avatar mới
        showNotification('Avatar đã được chọn. Nhấn "Lưu" để cập nhật', 'success');
      };
      reader.readAsDataURL(file);
    });
  }
}

/* =====================================================
   TABS FUNCTIONALITY
===================================================== */
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetTab = document.getElementById(`tab-${tab.dataset.tab}`);
      targetTab?.classList.add('active');

      // Update URL hash (only for non-personal tabs)
      if (tab.dataset.tab === 'personal') {
        // Remove hash for personal tab to keep URL clean
        history.replaceState(null, null, window.location.pathname);
      } else {
        window.location.hash = tab.dataset.tab;
      }

      // Khởi tạo history manager khi chuyển sang tab history
      if (tab.dataset.tab === 'history' && !window.authProfileHistoryManager) {
        initHistoryInAuthProfile();
      }
    });
  });

  // Handle initial hash or hash changes
  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);
}

function handleHashChange() {
  const hash = window.location.hash.substring(1); // Remove #
  const validTabs = ['personal', 'account', 'history'];
  
  // Default to personal if no hash or invalid hash
  const targetTab = validTabs.includes(hash) ? hash : 'personal';
  
  // Find and click the corresponding tab
  const tabButton = document.querySelector(`[data-tab="${targetTab}"]`);
  if (tabButton && !tabButton.classList.contains('active')) {
    // Remove active from all tabs and contents
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Activate target tab
    tabButton.classList.add('active');
    const targetContent = document.getElementById(`tab-${targetTab}`);
    if (targetContent) {
      targetContent.classList.add('active');
    }
    
    // Initialize history if needed
    if (targetTab === 'history' && !window.authProfileHistoryManager) {
      initHistoryInAuthProfile();
    }
    
    // Update hash only if it's not personal (to keep URL clean for default tab)
    if (targetTab !== 'personal' && window.location.hash !== `#${targetTab}`) {
      window.location.hash = targetTab;
    } else if (targetTab === 'personal' && window.location.hash) {
      // Remove hash for personal tab
      history.replaceState(null, null, window.location.pathname);
    }
  }
}

/* =====================================================
   HISTORY FUNCTIONALITY IN AUTH PROFILE
===================================================== */
async function initHistoryInAuthProfile() {
  try {
    console.log('🎫 Initializing History in Auth Profile...');
    
    // Import HistoryManager
    const { default: HistoryManager } = await import('./history.js');
    
    // Tạo instance riêng cho auth-profile
    window.authProfileHistoryManager = new HistoryManager();
    
    console.log('✅ History in Auth Profile initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing History in Auth Profile:', error);
  }
}