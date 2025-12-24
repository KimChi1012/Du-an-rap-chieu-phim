
import { loginUser } from '../api/login.js';
import { registerUser } from '../api/register.js';


export function initAuth() {
    console.log('🔐 Initializing auth module...');
    

    if (window.authInitialized) {
        console.log('Auth already initialized, skipping...');
        return;
    }
    window.authInitialized = true;
    

    const authCard = document.querySelector(".auth-card");
    const panelTitle = document.getElementById("imageTitle");
    const panelDesc = document.getElementById("imageDesc");
    const switchBtn = document.getElementById("switchBtn");

    console.log('Elements found:', { authCard, panelTitle, panelDesc, switchBtn });

    if (!authCard || !switchBtn) {
        console.error('❌ Required elements not found!');
        return;
    }


    const mode = localStorage.getItem("authMode");
    
    if (mode === "register") {
        authCard.classList.add("register-mode");
        setPanelRegister();
    } else {
        setPanelLogin();
    }


    switchBtn.addEventListener("click", () => {
        authCard.classList.toggle("register-mode");
        const isRegister = authCard.classList.contains("register-mode");

        if (isRegister) {
            setPanelRegister();
            localStorage.setItem("authMode", "register");
        } else {
            setPanelLogin();
            localStorage.setItem("authMode", "login");
        }
    });


    function setPanelRegister() {
        panelTitle.textContent = "Chào mừng!";
        panelDesc.textContent = "Đã có tài khoản?";
        switchBtn.textContent = "Đăng nhập";
    }

    function setPanelLogin() {
        panelTitle.textContent = "Chào mừng trở lại!";
        panelDesc.textContent = "Chưa có tài khoản?";
        switchBtn.textContent = "Đăng ký";
    }

    function togglePassword(e) {
        const eye = e.currentTarget;
        const input = eye.previousElementSibling;
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";

        const icon = eye.querySelector('i');
        if (icon) {
            if (isPassword) {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }
        
        eye.classList.toggle('visible');
    }


    if (!window.eyeIconsInitialized) {
        const authCard = document.querySelector(".auth-card");
        if (authCard) {
            authCard.querySelectorAll(".password-wrapper .eye").forEach(eye => {
                eye.addEventListener("click", togglePassword);
            });
            window.eyeIconsInitialized = true;
        }
    }


    async function handleLoginSubmit(e) {
        e.preventDefault();

        const form = e.currentTarget;
        const usernameInput = form.querySelector('input[name="username"]');
        const passwordInput = form.querySelector('input[name="password"]');

        if (!usernameInput || !passwordInput) {
            console.error("Không tìm thấy input username hoặc password");
            return;
        }

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            showNotification('Vui lòng nhập đầy đủ thông tin', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Đang đăng nhập...';
        submitBtn.disabled = true;

        try {
            const result = await loginUser(username, password);
            
            if (result.success) {
                showNotification('Đăng nhập thành công!', 'success');
                

                localStorage.removeItem("authMode");
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showNotification(result.message || 'Đăng nhập thất bại', 'error');
            }
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            showNotification('Lỗi kết nối', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }


    async function handleRegisterSubmit(e) {
        e.preventDefault();

        const form = e.currentTarget;
        const fullnameInput = form.querySelector('input[name="fullname"]');
        const usernameInput = form.querySelector('input[name="username"]');
        const emailInput = form.querySelector('input[name="email"]');
        const passwordInput = form.querySelector('input[name="repass"]');

        if (!fullnameInput || !usernameInput || !emailInput || !passwordInput) {
            console.error("Không tìm thấy input đăng ký");
            return;
        }

        const fullname = fullnameInput.value.trim();
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!fullname || !username || !email || !password) {
            showNotification('Vui lòng nhập đầy đủ thông tin', 'error');
            return;
        }


        if (username.length < 3) {
            showNotification('Tên đăng nhập phải có ít nhất 3 ký tự', 'error');
            return;
        }


        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Email không hợp lệ', 'error');
            return;
        }


        if (password.length < 6) {
            showNotification('Mật khẩu phải có ít nhất 6 ký tự', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Đang đăng ký...';
        submitBtn.disabled = true;

        try {
            const result = await registerUser(fullname, username, email, password);
            
            if (result.success) {
                showNotification('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.', 'success');


                form.reset();
                authCard.classList.remove("register-mode");
                setPanelLogin();
                localStorage.setItem("authMode", "login");


                setTimeout(() => {
                    const loginUsernameInput = document.querySelector('#loginForm input[name="username"]');
                    if (loginUsernameInput) {
                        loginUsernameInput.value = username; // Pre-fill username
                        loginUsernameInput.focus();
                    }
                }, 100);
            } else {
                showNotification(result.message || 'Đăng ký thất bại', 'error');
            }
        } catch (error) {
            console.error("Lỗi đăng ký:", error);
            showNotification('Lỗi kết nối', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }


    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLoginSubmit);
    }


    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", handleRegisterSubmit);
    }
}


function showNotification(message, type = 'info') {
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        alert(message);
    }
}