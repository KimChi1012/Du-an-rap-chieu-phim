async function includeHTML(id, file) {
  const element = document.getElementById(id);
  if (element) {
    const response = await fetch(file);
    if (!response.ok) {
      console.error(`Không thể tải ${file}: ${response.statusText}`);
      return;
    }
    const content = await response.text();
    element.innerHTML = content;
  } else {
    console.warn(`Không tìm thấy phần tử có id="${id}"`);
  }
}

import { initDropdown } from './modules/dropdown.js';
import { initUserSidebar } from './modules/user-sidebar.js';
import { loadUserInfo } from './modules/user-info.js';
import { initNotification } from './modules/notification.js';
import { initBannerSlider } from "./modules/banner-slider.js";
import { initUserManagement } from './modules/qlnguoidung.js';
import { initVideoModal } from "./modules/video-modal.js";
import { initMovieSlider } from "./modules/movie-slider.js";
import { initOfferModal, initOfferSlider } from "./modules/offer-slider.js";
import { initAuth } from './modules/auth.js';
import BannerManagement from './modules/banner-management.js';

function getCurrentPage() {
  const path = window.location.pathname;
  const filename = path.split('/').pop();
  return filename || 'index.html';
}

async function initPageSpecific() {
  const currentPage = getCurrentPage();
  console.log('📄 Current page:', currentPage);

  if (currentPage === 'login-register.html') {
    initAuth();
    console.log('✅ Auth module initialized');
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const currentPage = getCurrentPage();

    // Kiểm tra xem có phải trang admin không
    const isAdminPage = document.getElementById('shared-sidebar') && document.getElementById('shared-header');
    
    if (isAdminPage) {
      // Load admin header và sidebar
      await includeHTML('shared-header', 'admin-header.html');
      await includeHTML('shared-sidebar', 'admin-sidebar.html');
    } else {
      // Load header và footer thông thường
      await includeHTML('header', 'header.html');
      await includeHTML('footer', 'footer.html');
    }

    await new Promise(resolve => setTimeout(resolve, 200));
    
    initUserSidebar();
    initDropdown();
    await loadUserInfo();
    initVideoModal();
    initNotification();
    await initPageSpecific();

    if (document.getElementById('userTable') || document.getElementById('userModal')) {
      initUserManagement();
      console.log('✅ User Management đã được khởi tạo');
    }

    // Khởi tạo Banner Management
    const bannerTable = document.getElementById('bannerTable');
    const bannerModal = document.getElementById('bannerModal');
    
    console.log('🎯 Banner table found:', !!bannerTable);
    console.log('🎯 Banner modal found:', !!bannerModal);
    
    if (bannerTable || bannerModal) {
        console.log('🎯 Banner page detected, initializing...');
        
        try {
            window.bannerManagement = new BannerManagement();
            console.log('✅ Banner Management initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Banner Management:', error);
        }
    } else {
        console.log('ℹ️ Not a banner page');
    }

    if (currentPage === "index.html" || currentPage === "") {
      await initBannerSlider();

      await Promise.all([
        initMovieSlider(
          "#now-showing",
          "../api/movie/get_now_showing.php",
          "Chưa có phim đang chiếu."
        ),
        initMovieSlider(
          "#coming-soon",
          "../api/movie/get_coming_soon.php",
          "Chưa có phim sắp chiếu."
        )
      ]);

      initOfferModal();
      await initOfferSlider(
        "#special-offers",
        "../api/offer/get_offers.php",
        "Chưa có ưu đãi đặc biệt."
      );

      setTimeout(() => {
        const showMoreNowBtn = document.getElementById("show-more-now");
        const showMoreComingBtn = document.getElementById("show-more-coming");

        if (showMoreNowBtn) {
          showMoreNowBtn.onclick = function () {
            showNotification(
              "Trang danh sách Phim đang chiếu đang được phát triển. Vui lòng quay lại sau!",
              "info"
            );
          };
        }
        if (showMoreComingBtn) {
          showMoreComingBtn.onclick = function () {
            showNotification(
              "Trang danh sách Phim sắp chiếu đang được phát triển. Vui lòng quay lại sau!",
              "info"
            );
          };
        }
      }, 1000);
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const videoModal = document.getElementById("video-modal");
        const offerModal = document.getElementById("offer-modal");

        if (videoModal?.style.display === "block") {
          window.closeVideoModal();
        }
        if (offerModal?.style.display === "block") {
          window.closeOfferModal();
        }
      }
    });
  } catch (error) {
    console.error("Error initializing application:", error);
  }
});