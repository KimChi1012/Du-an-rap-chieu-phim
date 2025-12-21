export class UserAPI {
    static async getUserInfo(userId) {
        try {
            const response = await fetch(`../api/user/get_user_info.php?id=${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching user info:', error);
            throw error;
        }
    }

    static async getAvatar(userId) {
        try {
            const response = await fetch(`../api/user/get_avatar.php?id=${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching user avatar:', error);
            throw error;
        }
    }

    static async getUsers() {
        try {
            const response = await fetch('../api/user/get_users.php');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    static async getUsersSorted(sortBy = 'MaND', order = 'ASC') {
        try {
            const response = await fetch(`../api/user/get_users_sorted.php?sort=${sortBy}&order=${order}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching sorted users:', error);
            throw error;
        }
    }

    static async addUser(userData) {
        try {
            const response = await fetch('../api/user/add_user.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            const result = await response.json();

            if (!response.ok && !result.success) {
                return result;
            }
            
            return result;
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    }

    static async updateUser(userData) {
        try {
            const response = await fetch('../api/user/update_user.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            const result = await response.json();

            if (!response.ok && !result.success) {
                return result;
            }
            
            return result;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    static async deleteUser(userId) {
        try {
            const response = await fetch('../api/user/delete_user.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ MaND: userId })
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    static async logout() {
        try {
            const response = await fetch('../api/user/logout.php', {
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error during logout:', error);
            throw error;
        }
    }
}