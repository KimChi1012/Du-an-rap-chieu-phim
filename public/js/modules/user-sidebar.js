import { showNotification } from './notification.js';

export function initUserSidebar() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('#menu-icon')) {
      const sidebar = document.getElementById('user-sidebar');
      const overlay = document.getElementById('overlay');
      
      if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
      }
      return;
    }

    if (e.target.matches('#overlay')) {
      const sidebar = document.getElementById('user-sidebar');
      const overlay = document.getElementById('overlay');
      
      if (sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      }
      return;
    }

    if (e.target.matches('#signin-btn') || e.target.closest('#signin-btn')) {
      showNotification('Tính năng đăng nhập đang được phát triển. Vui lòng quay lại sau!', 'info');
      return;
    }

    if (e.target.matches('#header-login-btn') || e.target.closest('#header-login-btn')) {
      showNotification('Tính năng đăng nhập/đăng ký đang được phát triển. Vui lòng quay lại sau!', 'info');
      return;
    }

    if (e.target.matches('#header-logout-btn') || e.target.closest('#header-logout-btn')) {
      e.preventDefault();
      showNotification('Tính năng đăng xuất đang được phát triển. Vui lòng quay lại sau!', 'info');
      return;
    }
  });
}