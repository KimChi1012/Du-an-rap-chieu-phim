class HistoryManager {
    constructor() {
        this.ticketList = document.getElementById('ticketList');
        this.dotsContainer = document.getElementById('historyDots');
        
        // Tìm arrow buttons trong context hiện tại
        this.leftArrow = document.querySelector('.history-arrow.left');
        this.rightArrow = document.querySelector('.history-arrow.right');
        
        if (!this.ticketList) {
            console.error('❌ Không tìm thấy element ticketList');
            return;
        }
        
        // Slider properties - DESKTOP ONLY
        this.currentIndex = 0;
        this.visibleCards = 4; // Luôn hiển thị 4 tickets
        this.tickets = [];
        this.dots = [];
        
        this.init();
    }

    async init() {
        console.log('🎫 Initializing History Manager...');
        
        // Load ticket history
        await this.loadTicketHistory();
        
        console.log('✅ History Manager initialized successfully');
    }

    async loadTicketHistory() {
        try {
            console.log('📡 Loading ticket history...');
            
            const response = await fetch('../api/history/get_ticket_history.php');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📊 Ticket history data:', data);
            
            if (data.message) {
                // Có lỗi từ server
                this.displayError(data.message);
                return;
            }
            
            if (!Array.isArray(data) || data.length === 0) {
                this.displayEmptyState();
                return;
            }
            
            this.tickets = data;
            this.displayTickets(data);
            this.setupSlider();
            
        } catch (error) {
            console.error('❌ Error loading ticket history:', error);
            this.displayError('Không thể tải lịch sử đặt vé. Vui lòng thử lại sau.');
        }
    }

    displayTickets(tickets) {
        console.log('🎨 Displaying tickets:', tickets.length);
        
        const ticketsHTML = tickets.map(ticket => {
            const showDate = new Date(ticket.NgayChieu).toLocaleDateString('vi-VN');
            const bookingDate = new Date(ticket.NgayLap).toLocaleDateString('vi-VN');
            const showTime = ticket.GioBatDau;
            const price = new Intl.NumberFormat('vi-VN').format(ticket.GiaVe);
            
            return `
                <div class="history-ticket">
                    <div class="history-ticket-right">
                        <img src="${ticket.Poster || 'images/default-poster.svg'}" 
                             alt="${ticket.TenPhim}"
                             onerror="this.src='images/default-poster.svg'">
                        <div class="history-ticket-left">
                            <h3>${ticket.TenPhim}</h3>
                            <p><strong>Mã vé:</strong> ${ticket.MaVe}</p>
                            <p><strong>Ngày chiếu:</strong> ${showDate}</p>
                            <p><strong>Giờ chiếu:</strong> ${showTime}</p>
                            <p><strong>Giá vé:</strong> ${price} VNĐ</p>
                            <p><strong>Ngày đặt:</strong> ${bookingDate}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.ticketList.innerHTML = ticketsHTML;
    }

    displayEmptyState() {
        console.log('📭 Displaying empty state');
        this.ticketList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666; width: 100%;">
                <i class="fas fa-ticket-alt" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <p style="font-size: 18px; margin-bottom: 8px;">Chưa có lịch sử đặt vé</p>
                <p style="font-size: 14px;">Hãy đặt vé xem phim để xem lịch sử tại đây!</p>
            </div>
        `;
        
        // Ẩn arrows và dots khi không có data
        if (this.leftArrow) this.leftArrow.style.display = 'none';
        if (this.rightArrow) this.rightArrow.style.display = 'none';
        if (this.dotsContainer) this.dotsContainer.style.display = 'none';
    }

    displayError(message) {
        console.log('❌ Displaying error:', message);
        this.ticketList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #e74c3c; width: 100%;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p style="font-size: 18px; margin-bottom: 8px;">Có lỗi xảy ra</p>
                <p style="font-size: 14px;">${message}</p>
                <button onclick="window.location.reload()" 
                        style="margin-top: 16px; padding: 8px 16px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Thử lại
                </button>
            </div>
        `;
        
        // Ẩn arrows và dots khi có lỗi
        if (this.leftArrow) this.leftArrow.style.display = 'none';
        if (this.rightArrow) this.rightArrow.style.display = 'none';
        if (this.dotsContainer) this.dotsContainer.style.display = 'none';
    }

    setupSlider() {
        if (!this.leftArrow || !this.rightArrow) {
            console.log('⚠️ Arrow buttons not found');
            return;
        }

        console.log('🏹 Setting up slider navigation');

        // Calculate total pages (mỗi page = 4 tickets)
        const totalPages = Math.ceil(this.tickets.length / this.visibleCards);
        
        // Ẩn navigation nếu chỉ có 1 page
        if (totalPages <= 1) {
            this.leftArrow.style.display = 'none';
            this.rightArrow.style.display = 'none';
            if (this.dotsContainer) this.dotsContainer.style.display = 'none';
            return;
        }

        // Hiển thị navigation
        this.leftArrow.style.display = 'flex';
        this.rightArrow.style.display = 'flex';
        if (this.dotsContainer) this.dotsContainer.style.display = 'flex';

        // Setup dots
        this.setupDots(totalPages);

        // Event listeners cho arrows
        this.leftArrow.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🏹 Left arrow clicked');
            this.showPrev();
        });

        this.rightArrow.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🏹 Right arrow clicked');
            this.showNext();
        });

        // Tắt scroll tự do
        this.disableScrolling();

        // Initial state
        this.updateArrowStates();
        this.moveToSlide(0);
    }

    disableScrolling() {
        // Tắt scroll bằng mouse wheel
        this.ticketList.addEventListener('wheel', (e) => {
            e.preventDefault();
        }, { passive: false });

        // Tắt scroll bằng touch/swipe
        this.ticketList.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });

        this.ticketList.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        // Tắt drag scroll
        this.ticketList.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });

        // Tắt keyboard scroll
        this.ticketList.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
                e.key === 'Home' || e.key === 'End' || 
                e.key === 'PageUp' || e.key === 'PageDown') {
                e.preventDefault();
            }
        });
    }

    setupDots(totalPages) {
        if (!this.dotsContainer) return;
        
        console.log('🔘 Setting up dots:', totalPages);
        
        this.dotsContainer.innerHTML = '';
        this.dots = [];
        
        for (let i = 0; i < totalPages; i++) {
            const dot = document.createElement('span');
            dot.classList.add('history-dot');
            if (i === 0) dot.classList.add('active');
            
            dot.addEventListener('click', () => {
                this.moveToPage(i);
            });
            
            this.dotsContainer.appendChild(dot);
            this.dots.push(dot);
        }
    }

    moveToPage(pageIndex) {
        const ticketIndex = pageIndex * this.visibleCards;
        this.moveToSlide(ticketIndex);
    }

    showNext() {
        try {
            console.log('🏹 showNext called, currentIndex:', this.currentIndex);
            const totalPages = Math.ceil(this.tickets.length / this.visibleCards);
            const currentPage = Math.floor(this.currentIndex / this.visibleCards);
            
            console.log('📊 totalPages:', totalPages, 'currentPage:', currentPage);
            
            if (currentPage < totalPages - 1) {
                const nextPage = currentPage + 1;
                console.log('➡️ Moving to page:', nextPage);
                this.moveToPage(nextPage);
            } else {
                console.log('⚠️ Already at last page');
            }
        } catch (error) {
            console.error('❌ Error in showNext:', error);
        }
    }

    showPrev() {
        try {
            console.log('🏹 showPrev called, currentIndex:', this.currentIndex);
            const currentPage = Math.floor(this.currentIndex / this.visibleCards);
            
            console.log('📊 currentPage:', currentPage);
            
            if (currentPage > 0) {
                const prevPage = currentPage - 1;
                console.log('⬅️ Moving to page:', prevPage);
                this.moveToPage(prevPage);
            } else {
                console.log('⚠️ Already at first page');
            }
        } catch (error) {
            console.error('❌ Error in showPrev:', error);
        }
    }

    moveToSlide(index) {
        try {
            console.log('🎯 moveToSlide called with index:', index);
            this.currentIndex = index;
            
            // Fixed desktop sizing
            const ticketWidth = 200; // Fixed width
            const gap = 16; // Fixed gap
            const scrollPosition = index * (ticketWidth + gap);
            
            console.log('📏 Scrolling to position:', scrollPosition);
            
            this.ticketList.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
            
            this.updateArrowStates();
            this.updateDots();
        } catch (error) {
            console.error('❌ Error in moveToSlide:', error);
        }
    }

    updateArrowStates() {
        if (!this.leftArrow || !this.rightArrow) return;
        
        const totalPages = Math.ceil(this.tickets.length / this.visibleCards);
        const currentPage = Math.floor(this.currentIndex / this.visibleCards);
        
        // Update left arrow
        if (currentPage <= 0) {
            this.leftArrow.style.opacity = '0.3';
            this.leftArrow.style.pointerEvents = 'none';
        } else {
            this.leftArrow.style.opacity = '1';
            this.leftArrow.style.pointerEvents = 'auto';
        }
        
        // Update right arrow
        if (currentPage >= totalPages - 1) {
            this.rightArrow.style.opacity = '0.3';
            this.rightArrow.style.pointerEvents = 'none';
        } else {
            this.rightArrow.style.opacity = '1';
            this.rightArrow.style.pointerEvents = 'auto';
        }
    }

    updateDots() {
        if (!this.dots.length) return;
        
        const currentPage = Math.floor(this.currentIndex / this.visibleCards);
        
        this.dots.forEach((dot, index) => {
            if (index === currentPage) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
}

export default HistoryManager;