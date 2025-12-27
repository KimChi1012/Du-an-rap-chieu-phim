export class RoomAPI {
    static async getRooms() {
        const possiblePaths = [
            '../api/room/get_room.php',  // From public/ folder
            'api/room/get_room.php',     // From root
            '/api/room/get_room.php'     // Absolute path
        ];
        
        for (const path of possiblePaths) {
            try {
                console.log(`🔄 Trying API path: ${path}`);
                const response = await fetch(path);
                console.log(`📡 Response status for ${path}:`, response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Success with path: ${path}`);
                    console.log('📦 Data received:', data);
                    return data;
                }
            } catch (error) {
                console.log(`❌ Failed with path ${path}:`, error.message);
                continue;
            }
        }
        
        // If all paths fail
        console.warn('⚠️ All API paths failed, using mock data for testing');
        
        // Return mock data for testing
        const mockData = [
            {
                MaPhong: 'P001',
                TenPhong: 'Phòng chiếu 1',
                LoaiPhong: '2D',
                SoLuongGhe: 100
            },
            {
                MaPhong: 'P002',
                TenPhong: 'Phòng chiếu 2',
                LoaiPhong: '3D',
                SoLuongGhe: 120
            },
            {
                MaPhong: 'P003',
                TenPhong: 'Phòng chiếu 3',
                LoaiPhong: 'IMAX',
                SoLuongGhe: 150
            }
        ];
        
        console.log('📦 Using mock data:', mockData);
        return mockData;
    }
}