async function getApiPath() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/public/')) {
        return '../api/auth/';
    } else {
        return 'api/auth/';
    }
}

export async function registerUser(fullname, username, email, password) {
    try {
        const apiPath = await getApiPath();
        const response = await fetch(`${apiPath}register.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fullname: fullname,
                username: username,
                email: email,
                repass: password
            })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, message: 'Lỗi kết nối' };
    }
}