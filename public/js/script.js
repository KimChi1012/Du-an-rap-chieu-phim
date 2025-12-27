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
import { initUserManagement } from './modules/user-management.js';
import { initVideoModal } from "./modules/video-modal.js";
import { initMovieSlider } from "./modules/movie-slider.js";
import { initOfferModal, initOfferSlider } from "./modules/offer-slider.js";
import { initAuth } from './modules/auth.js';
import { initAuthProfile } from './modules/auth-profile.js';
import BannerManagement from './modules/banner-management.js';
import { BookingSystem } from './modules/booking.js';
import { initPrivacyPolicy } from './modules/privacy-policy.js';
import {OfferManagement} from './modules/offer-management.js';
import { initTermsOfUse } from './modules/terms-of-use.js';
import { initCopyrightPolicy } from './modules/copyright-policy.js';
import './modules/policy-poster-strips.js';
import ShowtimeManagement from './modules/showtime-management.js';

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('movie_id') || 1;

function getCurrentPage() {
  const path = window.location.pathname;
  const filename = path.split('/').pop();
  return filename || 'index.html';
}

function clearAllBookingData() {
  localStorage.removeItem('selectedShowtime');
  localStorage.removeItem('bookingData');
  localStorage.removeItem('reservationStartTime');
  localStorage.removeItem('selectedServices');
  sessionStorage.removeItem('bookingInProgress');
  sessionStorage.removeItem('returningFromSeat');
  sessionStorage.removeItem('returningFromService');
  sessionStorage.removeItem('returningFromConfirmation');
  sessionStorage.removeItem('seatPageLoaded');
  sessionStorage.removeItem('servicePageLoaded');
  sessionStorage.removeItem('confirmationPageLoaded');
  sessionStorage.removeItem('paymentInProgress');
  console.log('🧹 All booking data cleared when returning to index');
}

window.clearAllBookingData = clearAllBookingData;

function initShowtimeManagement() {
  if (document.getElementById('showtimeTable') && !window.showtimeManagement) {
    console.log('🎯 Initializing Showtime Management...');
    window.showtimeManagement = new ShowtimeManagement();
    return true;
  }
  return false;
}

async function initPageSpecific() {
  const currentPage = getCurrentPage();
  console.log('📄 Current page:', currentPage);

  if (currentPage === 'login-register.html') {
    initAuth();
    console.log('✅ Auth module initialized');
  }

  if (currentPage === 'auth-profile.html') {
    initAuthProfile();
    console.log('✅ AuthProfile module initialized');
  }

  if (currentPage === "movie-detail.html") {
    const { default: MovieDetail } = await import("./modules/movie-detail.js");
    new MovieDetail();
  }

  if (currentPage === "booking.html") {
    console.log('🎬 Initializing booking page...');
    window.bookingSystem = new BookingSystem();
  }

  if (currentPage === "seat-selection.html") {
    console.log('🪑 Initializing seat selection page...');
    const { default: SeatSelectionSystem } = await import("./modules/seat-selection.js");
    window.seatSelectionSystem = new SeatSelectionSystem();
  }

  if (currentPage === "service-selection.html") {
    console.log('🛍️ Initializing service selection page...');
    const { default: ServiceSelectionSystem } = await import("./modules/service-selection.js");
    window.serviceSelectionSystem = new ServiceSelectionSystem();
  }

  if (currentPage === "booking-confirmation.html") {
    console.log('✅ Initializing booking confirmation page...');
    const { default: BookingConfirmationSystem } = await import("./modules/booking-confirmation.js");
    window.bookingConfirmationSystem = new BookingConfirmationSystem();
  }

  if (currentPage === "payment.html") {
    console.log('💳 Initializing payment page...');
    const { default: PaymentManager } = await import("./modules/payment.js");
    window.paymentManager = new PaymentManager();
  }

  if (currentPage === "invoice.html") {
    console.log('📄 Initializing invoice page...');
    const { default: InvoiceManager } = await import("./modules/invoice.js");
    window.invoiceManager = new InvoiceManager();
  }

  if (currentPage === "now-showing.html"){
    const { loadAllMovies } = await import("./modules/all-movies.js");
    
    if (currentPage.includes("now-showing.html")) {
      await loadAllMovies(
        "../api/movie/get_now_showing.php",
        "#all-now-showing"
      );
    } 
  }

  if (currentPage === "coming-soon.html"){
    const { loadAllMovies } = await import("./modules/all-movies.js");
    
    if (currentPage.includes("coming-soon.html")) {
      await loadAllMovies(
        "../api/movie/get_coming_soon.php",
        "#all-coming-soon"
      );
    }
  }

  if (currentPage === "privacy-policy.html") {
    console.log('🔒 Initializing Privacy Policy page...');
    initPrivacyPolicy();
  }

  if (currentPage === "terms-of-use.html") {
    console.log('📋 Initializing Terms of Use page...');
    initTermsOfUse();
  }

  if (currentPage === "copyright-policy.html") {
    console.log('©️ Initializing Copyright Policy page...');
    initCopyrightPolicy();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const currentPage = getCurrentPage();

    if (currentPage === "movie-detail.html") {
      await initPageSpecific();
      return;
    }

    const isAdminPage = document.getElementById('shared-sidebar') && document.getElementById('shared-header');
    
    if (isAdminPage) {
      await includeHTML('shared-header', 'admin-header.html');
      await includeHTML('shared-sidebar', 'admin-sidebar.html');
    } else {
      await includeHTML('header', 'header.html');
      await includeHTML('footer', 'footer.html');
    }

    const backBtn = document.getElementById('backBtn');

    if (backBtn) {
        const page = getCurrentPage();

        if (page.includes('seat-selection')) {
            backBtn.href = 'booking.html';
        } else if (page.includes('service-selection')) {
        } else if (page.includes('booking-confirmation')) {
        } else if (page.includes('booking')) {
            backBtn.href = 'index.html';
        } else {
            backBtn.href = 'index.html';
        }
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    if (document.getElementById('showtimeTable') || document.getElementById('showtimeModal')) {
        initShowtimeManagement();
        console.log('✅ Showtime Management đã được khởi tạo');
    }
    
    initUserSidebar();
    initDropdown();
    await loadUserInfo();
    initVideoModal();
    initNotification();
    await initPageSpecific();

    if (document.getElementById('userTable') || document.getElementById('userModal')) {
      console.log('🎯 User management elements found!');
      console.log('🎯 userTable:', document.getElementById('userTable'));
      console.log('🎯 userModal:', document.getElementById('userModal'));
      initUserManagement();
      console.log('✅ User Management đã được khởi tạo');
    } else {
      console.log('❌ Không tìm thấy user management elements');
    }

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

    const offerTable = document.getElementById('offerTable');
    const offerModal = document.getElementById('offerModal');
    
    console.log('🎯 Offer table found:', !!offerTable);
    console.log('🎯 Offer modal found:', !!offerModal);
    
    if (offerTable || offerModal) {
        console.log('🎯 Offer page detected, initializing...');
        
        try {
            window.offerManagement = new OfferManagement();
            console.log('✅ Offer Management initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Offer Management:', error);
        }
    } else {
        console.log('ℹ️ Not an offer page');
    }

    window.initOfferManagement = function() {
        if (document.getElementById('offerTable') && !window.offerManagement) {
            console.log('🎯 Late initializing Offer Management...');
            window.offerManagement = new OfferManagement();
            return true;
        }
        return false;
    };

    if (currentPage === "index.html" || currentPage === "") {
      clearAllBookingData();
      
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
            window.location.href = "now-showing.html";
          };
        }
        if (showMoreComingBtn) {
          showMoreComingBtn.onclick = function () {
            window.location.href = "coming-soon.html";
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

    document.addEventListener('click', (e) => {
      const target = e.target.closest('a');
      if (target && (target.href.includes('index.html') || target.href.endsWith('/'))) {
        console.log('🏠 Navigating to home page, clearing booking data...');
        clearAllBookingData();
      }
    });

    window.addEventListener('popstate', () => {
      const currentPage = getCurrentPage();
      if (currentPage === 'index.html' || currentPage === '') {
        console.log('🏠 Browser navigation to home page, clearing booking data...');
        clearAllBookingData();
      }
    });
  } catch (error) {
    console.error("Error initializing application:", error);
  }
});