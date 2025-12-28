export function initDropdown() {
  document.addEventListener("click", (e) => {
    if (e.target.closest(".dropbtn")) {
      e.preventDefault();
      const dropdown = e.target.closest(".dropdown");
      const dropdownContent = dropdown?.querySelector(".dropdown-content");
      if (dropdownContent) {
        dropdownContent.classList.toggle("show");
      }
      return;
    }

    // Chỉ preventDefault khi click vào icon dropdown, không phải toàn bộ header-user
    if (e.target.closest("#header-dropdown")) {
      e.preventDefault();
      const userDropdownMenu = document.querySelector("#header-dropdown-menu");
      if (userDropdownMenu) {
        userDropdownMenu.classList.remove("hidden");
        userDropdownMenu.classList.toggle("show");
      }
      return;
    }

    // Nếu click vào header-user nhưng không phải dropdown icon, vẫn mở dropdown
    if (e.target.closest("#header-user") && !e.target.closest("#header-dropdown-menu a")) {
      const userDropdownMenu = document.querySelector("#header-dropdown-menu");
      if (userDropdownMenu) {
        userDropdownMenu.classList.remove("hidden");
        userDropdownMenu.classList.toggle("show");
      }
      return;
    }

    const dropdownContent = document.querySelector(".dropdown-content");
    const userDropdownMenu = document.querySelector("#header-dropdown-menu");
    
    if (!e.target.closest(".dropdown")) {
      dropdownContent?.classList.remove("show");
    }
    if (!e.target.closest("#header-user")) {
      userDropdownMenu?.classList.remove("show");
      userDropdownMenu?.classList.add("hidden");
    }

    if (e.target.matches(".dropdown-content a") || e.target.matches("#header-dropdown-menu a")) {
      dropdownContent?.classList.remove("show");
      userDropdownMenu?.classList.remove("show");
      userDropdownMenu?.classList.add("hidden");
    }
  });
}
