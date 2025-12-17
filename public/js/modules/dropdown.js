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

    if (e.target.closest("#header-dropdown") || e.target.closest("#header-user")) {
      e.preventDefault();
      const userDropdownMenu = document.querySelector("#header-dropdown-menu");
      if (userDropdownMenu) {
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
    }

    if (e.target.matches(".dropdown-content a") || e.target.matches("#header-dropdown-menu a")) {
      dropdownContent?.classList.remove("show");
      userDropdownMenu?.classList.remove("show");
    }
  });
}
