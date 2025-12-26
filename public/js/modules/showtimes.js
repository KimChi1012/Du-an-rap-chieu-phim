class GetShowtimes {
    constructor(movieId, apiUrl = '../api/booking/get_showtimes.php') {
        this.movieId = movieId;
        this.apiUrl = apiUrl;
        this.dateTabsContainer = document.getElementById('dateTabs');
        this.showtimesContainer = document.getElementById('showtimesContainer');
        this.selectedDate = null;
    }

    async loadDates() {
        try {
            const response = await fetch(`${this.apiUrl}?movie_id=${this.movieId}`);
            if (!response.ok) throw new Error('Lỗi mạng');
            const data = await response.json();

            console.log('API Response:', data);

            if (data.success && data.dates) {
                this.renderDates(data.dates);
                this.setupDatePicker(); 

                if (data.dates.length > 0) {
                    this.selectDate(data.dates[0].date);
                }
            } else {
                throw new Error(data.message || 'Không có dữ liệu lịch chiếu');
            }
        } catch (error) {
            console.error('Lỗi load ngày chiếu:', error);
            if (this.dateTabsContainer) {
                this.dateTabsContainer.innerHTML = '<p style="color:red;">Không thể tải lịch chiếu.</p>';
            }
        }
    }

    renderDates(dates) {
        if (!this.dateTabsContainer) {
            console.error('Date tabs container not found');
            return;
        }

        this.dateTabsContainer.innerHTML = '';

        dates.forEach((dateObj, index) => {
            const tab = document.createElement('button');
            tab.className = 'date-tab';
            if (index === 0) tab.classList.add('selected');
            tab.dataset.date = dateObj.date;
            tab.innerHTML = `
                <span class="date-day">${dateObj.dayName}</span>
                <span class="date-number">${dateObj.day}</span>
            `;

            tab.addEventListener('click', () => this.selectDate(dateObj.date));

            this.dateTabsContainer.appendChild(tab);
        });
    }

    async selectDate(dateStr) {
        document.querySelectorAll('.date-tab').forEach(tab => {
            tab.classList.toggle('selected', tab.dataset.date === dateStr);
        });

        this.selectedDate = dateStr;
        await this.loadShowtimes(dateStr);
    }

    async loadShowtimes(date) {
        try {
            const response = await fetch(`${this.apiUrl}?movie_id=${this.movieId}&date=${date}`);
            if (!response.ok) throw new Error('Lỗi mạng');
            const data = await response.json();

            console.log('Showtimes for date:', date, data); // Debug log

            if (data.success) {
                this.renderShowtimes(data.showtimes);
            } else {
                throw new Error(data.message || 'Không có suất chiếu');
            }
        } catch (error) {
            console.error('Lỗi load suất chiếu:', error);
            if (this.showtimesContainer) {
                this.showtimesContainer.innerHTML = '<p style="color:red;">Không thể tải suất chiếu.</p>';
            }
        }
    }

    renderShowtimes(showtimes) {
        if (!this.showtimesContainer) {
            console.error('Showtimes container not found');
            return;
        }

        if (!showtimes || showtimes.length === 0) {
            this.showtimesContainer.innerHTML = `
                <div class="showtime-date">
                    <div class="no-showtimes">
                        <p>Không có suất chiếu nào trong ngày này</p>
                        <small>Vui lòng chọn ngày khác hoặc thử lại sau</small>
                    </div>
                </div>
            `;
            return;
        }

        const showtimeDate = this.selectedDate;
        const dateObj = new Date(showtimeDate);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        let dateLabel = dateObj.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        if (dateObj.toDateString() === today.toDateString()) {
            dateLabel = 'Hôm nay - ' + dateLabel;
        } else if (dateObj.toDateString() === tomorrow.toDateString()) {
            dateLabel = 'Ngày mai - ' + dateLabel;
        }

        this.showtimesContainer.innerHTML = `
            <div class="showtime-date">
                <h4>${dateLabel}</h4>
                <div class="time-slots">
                    ${showtimes.map(st => {
                        const timeFormatted = st.GioBatDau ? st.GioBatDau.slice(0, 5) : 'N/A';
                        const roomName = st.TenPhong || 'N/A';
                        
                        const hour = parseInt(timeFormatted.split(':')[0]);
                        let period = 'morning';
                        if (hour >= 6 && hour < 12) period = 'morning';
                        else if (hour >= 12 && hour < 17) period = 'afternoon';
                        else if (hour >= 17 && hour < 21) period = 'evening';
                        else period = 'night';

                        return `
                            <button class="time-slot" 
                                    data-showtime-id="${st.MaSuat}"
                                    data-date="${this.selectedDate}" 
                                    data-time="${st.GioBatDau}" 
                                    data-room="${roomName}" 
                                    data-period="${period}">
                                ${timeFormatted}
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        this.showtimesContainer.querySelectorAll('.time-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                document.querySelectorAll('.time-slot').forEach(s => 
                    s.classList.remove('selected'));
                
                slot.classList.add('selected');
                
                const btn = e.target;
                const selectedData = {
                    id: btn.dataset.showtimeId,
                    date: btn.dataset.date,
                    time: btn.dataset.time,
                    room: btn.dataset.room
                };
                document.dispatchEvent(new CustomEvent('showtimeSelected', { detail: selectedData }));
            });
        });
    }

    setupDatePicker() {
        const datePicker = document.getElementById('datePicker');
        const datePickerBtn = document.getElementById('datePickerBtn');
        if (!datePicker || !datePickerBtn) return;

        const today = new Date();
        const todayStr = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, '0'),
            String(today.getDate()).padStart(2, '0')
        ].join('-');

        datePicker.min = todayStr;
        datePicker.value = todayStr;

        datePicker.addEventListener('change', async (e) => {
            const selectedDate = e.target.value;
            if (selectedDate) {
                await this.selectCustomDate(selectedDate);
            }
        });

        datePickerBtn.addEventListener('click', () => {
            datePicker.showPicker?.();
        });
    }

    async selectCustomDate(dateStr) {
        console.log('📅 Custom date selected:', dateStr);
        
        const today = new Date();
        const selectedDate = new Date(dateStr);
        const todayStr = today.toISOString().split('T')[0];
        
        if (dateStr < todayStr) {
            alert('Không thể chọn ngày trong quá khứ. Vui lòng chọn ngày từ hôm nay trở đi.');
            const datePicker = document.getElementById('datePicker');
            if (datePicker) {
                datePicker.value = todayStr;
            }
            return;
        }

        this.selectedDate = dateStr;
        
        document.querySelectorAll('.date-tab').forEach(tab => {
            tab.classList.remove('selected');
        });
        
        const existingTab = document.querySelector(`[data-date="${dateStr}"]`);
        if (existingTab) {
            existingTab.classList.add('selected');
        }

        await this.loadShowtimes(dateStr);
    }
}

export default GetShowtimes;