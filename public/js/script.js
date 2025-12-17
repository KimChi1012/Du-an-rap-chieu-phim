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

function getCurrentPage() {
  const path = window.location.pathname;
  const filename = path.split('/').pop();
  return filename || 'index.html';
}

async function initPageSpecific() {
  const currentPage = getCurrentPage();
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const currentPage = getCurrentPage();

    await includeHTML("header", "header.html");
    await includeHTML("footer", "footer.html");

    await new Promise(resolve => setTimeout(resolve, 200));

    initUserSidebar();
    initDropdown();
    await loadUserInfo();
    initNotification();
    await initPageSpecific();

    if (currentPage === "index.html" || currentPage === "") {
      await initBannerSlider();
    }
  } catch (error) {
    console.error("Error initializing application:", error);
  }
});