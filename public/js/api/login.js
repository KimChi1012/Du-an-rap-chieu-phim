async function getApiPath() {
    // Detect correct API path based on current location
    const currentPath = window.location.pathname;
    if (currentPath.includes('/public/')) {
        return '../api/auth/';
    } else {
        return 'api/auth/';
    }
}

export async function loginUser(username, password) {
    try {
        const apiPath = await getApiPath();
        const response = await fetch(`${apiPath}login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Lỗi kết nối' };
    }
}