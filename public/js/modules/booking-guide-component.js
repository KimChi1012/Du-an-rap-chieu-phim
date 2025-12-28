// ================= BOOKING GUIDE COMPONENT ================= 
class BookingGuideComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.slideIndex = 1;
    this.slides = [];
    this.dots = [];
    this.lightbox = null;
    
    this.init();
  }

  init() {
    this.createSlideshow();
    this.createLightbox();
    this.bindEvents();
    this.showSlide(this.slideIndex);
  }

  createSlideshow() {
    const slideshowHTML = `
      <div class="booking-guide-slideshow">
        <!-- Slide 1 -->
        <div class="booking-guide-slide">
          <img src="images/booking-guide1.png" alt="Chọn suất chiếu">
          <div class="booking-guide-text-overlay">
            <h3>Bước 1: Chọn suất chiếu</h3>
            <p>Truy cập lịch chiếu của bộ phim và chọn suất chiếu mong muốn.</p>
          </div>
        </div>

        <!-- Slide 2 -->
        <div class="booking-guide-slide">
          <img src="images/booking-guide2.png" alt="Chọn ghế">
          <div class="booking-guide-text-overlay">
            <h3>Bước 2: Chọn ghế</h3>
            <p>Chọn ghế trống trên sơ đồ phòng chiếu. Ghế đã có người đặt sẽ khác màu.</p>
          </div>
        </div>

        <!-- Slide 3 -->
        <div class="booking-guide-slide">
          <img src="images/booking-guide3.png" alt="Chọn dịch vụ">
          <div class="booking-guide-text-overlay">
            <h3>Bước 3: Chọn dịch vụ</h3>
            <p>Chọn thêm các dịch vụ kèm theo như combo đồ ăn, nước uống nếu muốn.</p>
          </div>
        </div>

        <!-- Slide 4 -->
        <div class="booking-guide-slide">
          <img src="images/booking-guide4.png" alt="Xác nhận vé">
          <div class="booking-guide-text-overlay">
            <h3>Bước 4: Xác nhận vé</h3>
            <p>Kiểm tra chi tiết vé và thời gian giữ chỗ còn lại trước khi thanh toán.</p>
          </div>
        </div>

        <!-- Slide 5 -->
        <div class="booking-guide-slide">
          <img src="images/booking-guide5.png" alt="Thanh toán">
          <div class="booking-guide-text-overlay">
            <h3>Bước 5: Thanh toán</h3>
            <p>Nhấn Thanh toán và chọn phương thức thanh toán phù hợp.</p>
          </div>
        </div>

        <!-- Slide 6 -->
        <div class="booking-guide-slide">
          <img src="images/booking-guide6.png" alt="Nhập thông tin thanh toán">
          <div class="booking-guide-text-overlay">
            <h3>Bước 6: Nhập thông tin thanh toán</h3>
            <p>Điền thông tin thẻ hoặc ví điện tử và nhấn Xác nhận.</p>
          </div>
        </div>

        <!-- Slide 7 -->
        <div class="booking-guide-slide">
          <img src="images/booking-guide7.png" alt="Thanh toán thành công">
          <div class="booking-guide-text-overlay">
            <h3>Bước 7: Thanh toán thành công</h3>
            <p>Hệ thống hiển thị thông báo xác nhận giao dịch thành công.</p>
          </div>
        </div>

        <!-- Slide 8 -->
        <div class="booking-guide-slide">
          <img src="images/booking-guide8.png" alt="Xem hóa đơn">
          <div class="booking-guide-text-overlay">
            <h3>Bước 8: Xem hóa đơn</h3>
            <p>Nhấn Xem hóa đơn ngay để xem chi tiết vé và lưu lại khi đến rạp.</p>
          </div>
        </div>

        <!-- Navigation buttons -->
        <button type="button" class="booking-guide-prev" data-booking-guide-nav="true">&#10094;</button>
        <button type="button" class="booking-guide-next" data-booking-guide-nav="true">&#10095;</button>

        <!-- Dot indicators -->
        <div class="booking-guide-dots">
          <button type="button" class="booking-guide-dot" data-slide="1" data-booking-guide-nav="true"></button>
          <button type="button" class="booking-guide-dot" data-slide="2" data-booking-guide-nav="true"></button>
          <button type="button" class="booking-guide-dot" data-slide="3" data-booking-guide-nav="true"></button>
          <button type="button" class="booking-guide-dot" data-slide="4" data-booking-guide-nav="true"></button>
          <button type="button" class="booking-guide-dot" data-slide="5" data-booking-guide-nav="true"></button>
          <button type="button" class="booking-guide-dot" data-slide="6" data-booking-guide-nav="true"></button>
          <button type="button" class="booking-guide-dot" data-slide="7" data-booking-guide-nav="true"></button>
          <button type="button" class="booking-guide-dot" data-slide="8" data-booking-guide-nav="true"></button>
        </div>
      </div>
    `;

    this.container.innerHTML = slideshowHTML;
    this.slides = this.container.querySelectorAll('.booking-guide-slide');
    this.dots = this.container.querySelectorAll('.booking-guide-dot');
  }

  createLightbox() {
    this.lightbox = document.createElement('div');
    this.lightbox.className = 'booking-guide-lightbox';
    
    const lightboxImg = document.createElement('img');
    this.lightbox.appendChild(lightboxImg);
    
    document.body.appendChild(this.lightbox);
  }

  bindEvents() {
    // Navigation buttons
    const prevBtn = this.container.querySelector('.booking-guide-prev');
    const nextBtn = this.container.querySelector('.booking-guide-next');
    
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.changeSlide(-1);
    });
    
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.changeSlide(1);
    });

    // Dot indicators
    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.currentSlide(index + 1);
      });
    });

    // Image click for lightbox
    const images = this.container.querySelectorAll('.booking-guide-slide img');
    images.forEach(img => {
      img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.openLightbox(img.src);
      });
    });

    // Close lightbox
    this.lightbox.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.closeLightbox();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (this.container.closest('.tab-content.active')) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.changeSlide(-1);
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.changeSlide(1);
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this.closeLightbox();
        }
      }
    });
  }

  changeSlide(n) {
    this.showSlide(this.slideIndex += n);
  }

  currentSlide(n) {
    this.showSlide(this.slideIndex = n);
  }

  showSlide(n) {
    if (n > this.slides.length) { this.slideIndex = 1; }
    if (n < 1) { this.slideIndex = this.slides.length; }

    // Hide all slides
    this.slides.forEach(slide => slide.classList.remove('active'));
    
    // Remove active class from all dots
    this.dots.forEach(dot => dot.classList.remove('active'));

    // Show current slide and activate corresponding dot
    this.slides[this.slideIndex - 1].classList.add('active');
    this.dots[this.slideIndex - 1].classList.add('active');
  }

  openLightbox(imageSrc) {
    const img = this.lightbox.querySelector('img');
    img.src = imageSrc;
    this.lightbox.style.display = 'flex';
  }

  closeLightbox() {
    this.lightbox.style.display = 'none';
  }

  // Auto-play functionality (optional)
  startAutoPlay(interval = 5000) {
    this.autoPlayInterval = setInterval(() => {
      this.changeSlide(1);
    }, interval);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  // Cleanup method
  destroy() {
    this.stopAutoPlay();
    if (this.lightbox && this.lightbox.parentNode) {
      this.lightbox.parentNode.removeChild(this.lightbox);
    }
  }
}

// Export for use in other modules
export default BookingGuideComponent;