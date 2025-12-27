// js/authprofile.js

let CURRENT_USER = null;
let isChangingPassword = false;

document.addEventListener('DOMContentLoaded', async () => {

  /* ===== DOM ===== */
  const form = document.getElementById('profile-form');
  if (!form) return;

  const avatarImg = document.querySelector('.profile-avatar');

  const changePassBtn = document.getElementById('change-password-btn');
  const cancelChangePassBtn = document.getElementById('cancel-change-password-btn');
  const passwordSection = document.getElementById('password-section');

  const currentPassInput = document.getElementById('current-password');
  const newPassInput = document.getElementById('password');
  const cfPassInput = document.getElementById('cf-password');

  /* ===== TABS ===== */
  initTabs();

  /* ===== LOAD USER ===== */
  await loadUser(form, avatarImg);

  /* ===== PASSWORD INIT ===== */
  resetPasswordSection();

  /* ===== ĐỔI MẬT KHẨU ===== */
  changePassBtn.addEventListener('click', () => {
    isChangingPassword = true;
    passwordSection.hidden = false;
    changePassBtn.style.display = 'none';
    enablePasswordInputs();
  });

  cancelChangePassBtn.addEventListener('click', resetPasswordSection);

  /* ===== SUBMIT ===== */
  form.addEventListener('submit', (e) => handleSubmit(e, form, avatarImg));

  /* ===== CANCEL ===== */
  document.querySelector('.cancel-btn')
    ?.addEventListener('click', () => location.reload());

  /* ===== AVATAR ===== */
  initAvatarUpload(avatarImg);

  /* ================= HELPERS ================= */

  function resetPasswordSection() {
    isChangingPassword = false;
    passwordSection.hidden = true;
    changePassBtn.style.display = 'inline-block';

    currentPassInput.value = '';
    newPassInput.value = '';
    cfPassInput.value = '';

    disablePasswordInputs();
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
});

/* =====================================================
   TABS
===================================================== */
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document
        .getElementById(`tab-${tab.dataset.tab}`)
        ?.classList.add('active');
    });
  });
}

/* =====================================================
   LOAD USER
===================================================== */
async function loadUser(form, avatarImg) {
  try {
    const res = await fetch('../api/user/get_user_info.php');
    const data = await res.json();

    if (!data.success) {
      alert('Bạn chưa đăng nhập');
      return;
    }

    CURRENT_USER = data.user;

    form.fullname.value = CURRENT_USER.HoTen ?? '';
    form.email.value = CURRENT_USER.Email ?? '';
    form.phone.value = CURRENT_USER.SoDT ?? '';
    form.address.value = CURRENT_USER.ThanhPho ?? '';
    form.username.value = CURRENT_USER.TenDN ?? '';

    if (CURRENT_USER.Avatar) {
      avatarImg.src = CURRENT_USER.Avatar;
    }

  } catch (err) {
    console.error('Lỗi load user:', err);
    alert('Không thể tải thông tin người dùng');
  }
}

/* =====================================================
   SUBMIT PROFILE
===================================================== */
async function handleSubmit(e, form, avatarImg) {
  e.preventDefault();
  if (!CURRENT_USER) return;

  const payload = {
    MaND: CURRENT_USER.MaND,
    TenDN: CURRENT_USER.TenDN,
    QuyenHan: CURRENT_USER.QuyenHan,

    HoTen: form.fullname.value.trim(),
    Email: form.email.value.trim(),
    SoDT: form.phone.value.trim(),
    ThanhPho: form.address.value.trim(),
    Avatar: avatarImg.src
  };

  // Luôn yêu cầu mật khẩu hiện tại
  const currentPass = prompt('Vui lòng nhập mật khẩu hiện tại để xác nhận');
  if (!currentPass) {
    alert('Bạn chưa nhập mật khẩu hiện tại');
    return;
  }
  payload.MatKhauHienTai = currentPass;

  // Nếu đang đổi mật khẩu mới
  if (isChangingPassword) {
    const newPass = document.getElementById('password').value.trim();
    const cfPass = document.getElementById('cf-password').value.trim();

    if (!newPass || !cfPass) {
      alert('Vui lòng nhập đầy đủ mật khẩu mới');
      return;
    }

    if (newPass !== cfPass) {
      alert('Xác nhận mật khẩu không khớp');
      return;
    }

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
      alert(data.error || 'Cập nhật thất bại');
      return;
    }

    alert('Cập nhật thành công');
    location.reload();

  } catch (err) {
    console.error(err);
    alert('Lỗi cập nhật');
  }
}

/* =====================================================
   AVATAR PREVIEW
===================================================== */
function initAvatarUpload(avatarImg) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.hidden = true;
  document.body.appendChild(input);

  avatarImg.addEventListener('click', () => input.click());

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => avatarImg.src = e.target.result;
    reader.readAsDataURL(file);
  });
}
