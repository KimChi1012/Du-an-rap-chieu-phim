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

    if (
      e.target.matches('#signin-btn') ||
      e.target.closest('#signin-btn') ||
      e.target.matches('#header-login-btn') ||
      e.target.closest('#header-login-btn')
    ) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = 'login-register.html';
      return;
    }
  });
}