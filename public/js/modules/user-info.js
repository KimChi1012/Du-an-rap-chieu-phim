import { showNotification } from './notification.js';

export async function loadUserInfo() {
  try {
    const res = await fetch("../api/user/get_user_info.php");
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Raw response:", text);
      return;
    }

    const userContent = document.getElementById("userContent");
    const userFooter = document.getElementById("userFooter");
    const userName = document.getElementById("userName");
    const avatarImg = document.querySelector(".user-header .avatar");

    const headerLoginBtn = document.getElementById("header-login-btn");
    const headerUser = document.getElementById("header-user");
    const headerAvatar = document.getElementById("header-avatar");
    const headerUserName = document.getElementById("header-user-name");
    const headerDropdownMenu = document.getElementById("header-dropdown-menu");

    if (!userContent || !userFooter || !userName || !avatarImg) return;

    if (data.success && data.user) {
      // Store user data globally
      window.currentUser = data.user;
      
      if (headerLoginBtn && headerUser) {
        headerLoginBtn.classList.add("hidden");
        headerUser.classList.remove("hidden");

        headerAvatar.src = "../api/user/get_avatar.php";

        const fullName = data.user.HoTen.trim();
        const parts = fullName.split(/\s+/);
        const shortName = parts.slice(-2).join(" ");
        headerUserName.textContent = shortName;

        // Dropdown menu giống nhau cho tất cả user (admin và khách hàng)
        headerDropdownMenu.innerHTML = `
                <a href="auth-profile.html">Tài khoản</a>
                <a href="#" id="header-logout-btn">Đăng xuất</a>
            `;

        const headerLogoutBtnNew = document.getElementById("header-logout-btn");
        if (headerLogoutBtnNew) {
          headerLogoutBtnNew.onclick = async () => {
            await fetch("../api/user/logout.php", { method: "POST" });
            location.reload();
          };
        }
      }

      const fullName = data.user.HoTen.trim();
      const parts = fullName.split(/\s+/);
      const shortName = parts.slice(-3).join(" ");

      const userInfo = document.querySelector(".user-info");
      userInfo.classList.add("logged-in");

      userInfo.innerHTML = `
        <p class="user-name"><b>${shortName}</b></p>
        <p class="user-email">${data.user.Email}</p>
      `;

      avatarImg.src = `../api/user/get_avatar.php`;

      const isAdmin = data.user.QuyenHan === "Quản trị viên";

      userContent.innerHTML = `
        <div class="user-menu">
          <a href="auth-profile.html" class="menu-item">
            <i class="bi bi-person"></i> <p class="text-gradient">Thông tin cá nhân</p>
          </a>
          <a href="auth-profile.html#history" class="menu-item">
            <i class="bi bi-clock-history"></i> <p class="text-gradient">Lịch sử đặt vé</p>
          </a>
          <a href="auth-profile.html#booking-guide" class="menu-item">
            <i class="bi bi-book"></i> <p class="text-gradient">Hướng dẫn đặt vé</p>
          </a>
          ${
            isAdmin
              ? `
          <div class="menu-divider"></div>
          <div class="admin-toggle-container">
            <div class="admin-toggle-label">
              <i class="bi bi-speedometer2"></i>
              <span class="text-gradient">Chế độ quản trị</span>
            </div>
            <div class="toggle-switch" id="admin-mode-toggle">
              <div class="toggle-slider"></div>
            </div>
          </div>
          `
              : ""
          }
        </div>
      `;

      if (isAdmin) {
        const toggleSwitch = document.getElementById("admin-mode-toggle");

        window.addEventListener("pageshow", (event) => {
          if (event.persisted) {
            localStorage.setItem("adminMode", "false");
          }

          const adminMode = localStorage.getItem("adminMode") === "true";
          toggleSwitch.classList.toggle("active", adminMode);
          updateSidebarForAdminMode(adminMode);
        });

        toggleSwitch.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          const isActive = toggleSwitch.classList.contains("active");
          toggleSwitch.classList.toggle("active");
          
          const adminMode = !isActive;
          localStorage.setItem("adminMode", adminMode.toString());
          
          // Update sidebar content
          updateSidebarForAdminMode(adminMode);
          
          if (typeof showNotification === 'function') {
            showNotification(
              adminMode ? "Đã chuyển sang chế độ Admin" : "Đã chuyển về chế độ User",
              "success"
            );
          }
        });
      }

      userFooter.innerHTML = `
        <div class="logout-section">
          <a href="#" id="logout-btn" class="logout">
            <i class="bi bi-box-arrow-right"></i>
            <span>Đăng xuất</span>
          </a>
        </div>
      `;
      userFooter.classList.add("logged-in");

      document
        .getElementById("logout-btn")
        .addEventListener("click", async () => {
          await fetch("../api/user/logout.php", { method: "POST" });
          location.reload();
        });
    } else {
      if (headerLoginBtn && headerUser) {
        headerLoginBtn.classList.remove("hidden");
        headerUser.classList.add("hidden");

        headerLoginBtn.addEventListener("click", () => {
          if (typeof showFeatureNotification === 'function') {
            showFeatureNotification("Tính năng đăng nhập");
          }
        });
      }

      const userInfo = document.querySelector(".user-info");
      userInfo.classList.remove("logged-in");

      userInfo.innerHTML = `<p>Xin chào, <span id="userName">Khách</span></p>`;
      avatarImg.src = "images/default-avatar.jpeg";

      userContent.innerHTML = `
        <button class="signin-btn" id="signin-btn">Đăng nhập</button>
        <p>Chưa có thông tin.</p>
      `;
      userFooter.innerHTML = "";
      userFooter.classList.remove("logged-in");

      setTimeout(() => {
        const signinBtn = document.getElementById("signin-btn");
        if (signinBtn) {
          signinBtn.addEventListener("click", () => {
            if (typeof showFeatureNotification === 'function') {
              showFeatureNotification("Tính năng đăng nhập");
            }
          });
        }
      }, 100);
    }
  } catch (err) {
    console.error("Lỗi tải thông tin người dùng:", err);
  }
}

function updateSidebarForAdminMode(isAdminMode) {
  const userContent = document.getElementById("userContent");
  if (!userContent || !window.currentUser) return;

  const isAdmin = window.currentUser.QuyenHan === "Quản trị viên";
  
  if (isAdminMode && isAdmin) {
    // Admin mode content
    userContent.innerHTML = `
      <div class="admin-menu">
        <div class="admin-links">
          <a href="user-management.html" class="menu-item admin-link">
            <i class="bi bi-people"></i>
            <p class="text-gradient">Quản lý người dùng</p>
          </a>
          <a href="movie-management.html" class="menu-item admin-link">
            <i class="bi bi-film"></i>
            <p class="text-gradient">Quản lý phim</p>
          </a>
          <a href="room-management.html" class="menu-item admin-link">
            <i class="bi bi-door-open"></i>
            <p class="text-gradient">Quản lý phòng chiếu</p>
          </a>
          <a href="chair-management.html" class="menu-item admin-link">
            <i class="bi bi-grid-3x3"></i>
            <p class="text-gradient">Quản lý ghế ngồi</p>
          </a>
          <a href="showtime-management.html" class="menu-item admin-link">
            <i class="bi bi-clock"></i>
            <p class="text-gradient">Quản lý suất chiếu</p>
          </a>
          <a href="service-management.html" class="menu-item admin-link">
            <i class="bi bi-cup-straw"></i>
            <p class="text-gradient">Quản lý dịch vụ</p>
          </a>
          <a href="banner-management.html" class="menu-item admin-link">
            <i class="bi bi-image"></i>
            <p class="text-gradient">Quản lý banner</p>
          </a>
          <a href="offer-management.html" class="menu-item admin-link">
            <i class="bi bi-tags"></i>
            <p class="text-gradient">Quản lý ưu đãi</p>
          </a>
          <a href="revenue-management.html" class="menu-item admin-link">
            <i class="bi bi-graph-up"></i>
            <p class="text-gradient">Quản lý doanh thu</p>
          </a>
        </div>
        
        <div class="menu-divider"></div>
        <div class="admin-toggle-container">
          <div class="admin-toggle-label">
            <i class="bi bi-speedometer2"></i>
            <span class="text-gradient">Chế độ quản trị</span>
          </div>
          <div class="toggle-switch active" id="admin-mode-toggle">
            <div class="toggle-slider"></div>
          </div>
        </div>
      </div>
    `;
  } else {
    // User mode content (original)
    userContent.innerHTML = `
      <div class="user-menu">
        <a href="auth-profile.html" class="menu-item">
          <i class="bi bi-person"></i> <p class="text-gradient">Thông tin cá nhân</p>
        </a>
        <a href="auth-profile.html#history" class="menu-item">
          <i class="bi bi-clock-history"></i> <p class="text-gradient">Lịch sử đặt vé</p>
        </a>
        <a href="auth-profile.html#booking-guide" class="menu-item">
          <i class="bi bi-book"></i> <p class="text-gradient">Hướng dẫn đặt vé</p>
        </a>
        ${
          isAdmin
            ? `
        <div class="menu-divider"></div>
        <div class="admin-toggle-container">
          <div class="admin-toggle-label">
            <i class="bi bi-speedometer2"></i>
            <span class="text-gradient">Chế độ quản trị</span>
          </div>
          <div class="toggle-switch" id="admin-mode-toggle">
            <div class="toggle-slider"></div>
          </div>
        </div>
        `
            : ""
        }
      </div>
    `;
  }

  // Re-attach event listener for toggle switch
  if (isAdmin) {
    const toggleSwitch = document.getElementById("admin-mode-toggle");
    if (toggleSwitch) {
      toggleSwitch.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isActive = toggleSwitch.classList.contains("active");
        toggleSwitch.classList.toggle("active");
        
        const adminMode = !isActive;
        localStorage.setItem("adminMode", adminMode.toString());
        
        // Update sidebar content
        updateSidebarForAdminMode(adminMode);
        
        if (typeof showNotification === 'function') {
          showNotification(
            adminMode ? "Đã chuyển sang chế độ Admin" : "Đã chuyển về chế độ User",
            "success"
          );
        }
      });
    }
  }
}
