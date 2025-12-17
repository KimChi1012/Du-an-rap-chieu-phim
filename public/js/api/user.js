export class UserAPI {
    static async getUserInfo(userId) {
        try {
            const response = await fetch(`../api/user/get_user_info.php?id=${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching user info:', error);
            throw error;
        }
    }

    static async getAvatar(userId) {
        try {
            const response = await fetch(`../api/user/get_avatar.php?id=${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching user avatar:', error);
            throw error;
        }
    }

    static async logout() {
        try {
            const response = await fetch('../api/user/logout.php', {
                method: 'POST'
            });
            return await response.json();
        } catch (error) {
            console.error('Error during logout:', error);
            throw error;
        }
    }
}