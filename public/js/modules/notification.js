let autoHideTimeout = null;

function getIconClass(type) {
  const icons = {
    info: 'fa-solid fa-info-circle',
    success: 'fa-solid fa-check-circle',
    error: 'fa-solid fa-exclamation-circle',
    warning: 'fa-solid fa-exclamation-triangle'
  };
  return icons[type] || icons.info;
}

export function showNotification(message, type = 'info', duration = 5000) {
  closeNotification();

  const notification = document.createElement('div');
  notification.className = 'notification notification-show';
  notification.innerHTML = `
    <div class="notification-content">
      <i class="notification-icon ${getIconClass(type)}" aria-hidden="true"></i>
      <span class="notification-message">${message}</span>
      <button class="notification-close" aria-label="Đóng thông báo">&times;</button>
    </div>
  `;

  document.body.appendChild(notification);

  requestAnimationFrame(() => notification.classList.add('show'));

  notification.querySelector('.notification-close').addEventListener('click', closeNotification);

  if (duration > 0) {
    autoHideTimeout = setTimeout(closeNotification, duration);
  }
}

export function closeNotification() {
  if (autoHideTimeout) {
    clearTimeout(autoHideTimeout);
    autoHideTimeout = null;
  }

  const notification = document.querySelector('.notification.show');
  if (!notification) return;

  notification.classList.remove('show');
  notification.addEventListener('transitionend', () => notification.remove(), { once: true });
}

const unavailableLinks = {
  'profile.html': 'Tính năng xem thông tin cá nhân đang được phát triển. Vui lòng quay lại sau!',
  'history.html': 'Tính năng lịch sử đặt vé đang được phát triển. Vui lòng quay lại sau!',
  'booking-history.html': 'Tính năng lịch sử đặt vé đang được phát triển. Vui lòng quay lại sau!',
  'booking-guide.html': 'Tính năng hướng dẫn sử dụng đang được phát triển. Vui lòng quay lại sau!',
  'privacy-policy.html': 'Tính năng chính sách bảo mật đang được phát triển. Vui lòng quay lại sau!',
  'terms-of-use.html': 'Tính năng điều khoản sử dụng đang được phát triển. Vui lòng quay lại sau!',
  'copyright-policy.html': 'Tính năng bản quyền web đang được phát triển. Vui lòng quay lại sau!'
};

function initLinkInterception() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    const filename = href.split('/').pop();
    if (unavailableLinks[filename]) {
      e.preventDefault();
      showNotification(unavailableLinks[filename], 'info');
      return;
    }

    const text = link.textContent.trim();
    const blockedTexts = [
      'Tìm kiếm',
      'Phim sắp chiếu',
      'Ưu đãi đặc biệt',
      'Giới thiệu',
      'Chính sách bảo mật',
      'Điều khoản sử dụng',
      'Bản quyền web'
    ];

    if (blockedTexts.includes(text)) {
      e.preventDefault();
      showNotification('Tính năng này đang được phát triển. Vui lòng quay lại sau!', 'info');
    }
  });
}

export function initNotification() {
  initLinkInterception();
}

if (typeof window !== 'undefined') {
  window.showNotification = showNotification;
  window.closeNotification = closeNotification;
}