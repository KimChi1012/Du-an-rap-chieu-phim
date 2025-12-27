export class ChairAPI {
    static async getChairs() {
        try {
            const response = await fetch('../api/chair/get_chair.php');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching chairs:', error);
            throw error;
        }
    }

    static async addChair(chairData) {
        const formData = new FormData();
        Object.keys(chairData).forEach(key => {
            formData.append(key, chairData[key]);
        });

        const response = await fetch('../api/chair/add_chair.php', {
            method: 'POST',
            body: formData
        });

        return await response.json();
    }

    static async updateChair(chairData) {
        const formData = new FormData();
        Object.keys(chairData).forEach(key => {
            formData.append(key, chairData[key]);
        });

        const response = await fetch('../api/chair/update_chair.php', {
            method: 'POST',
            body: formData
        });

        return await response.json();
    }

    static async deleteChair(maGhe) {
        try {
            const response = await fetch('../api/chair/delete_chair.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ MaGhe: maGhe })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error deleting chair:', error);
            throw error;
        }
    }
}