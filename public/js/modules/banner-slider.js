import { showNotification } from './notification.js';

export async function initBannerSlider() {
  try {
    const res = await fetch('../api/banner/get_banner.php');
    const banners = await res.json();

    const slider = document.querySelector('.slider');
    slider.style.setProperty('--quantity', banners.length);
    slider.innerHTML = '';

    banners.forEach((qc, index) => {
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.style.setProperty('--position', index + 1);
      slide.style.cursor = 'pointer';

      const img = document.createElement('img');
      img.src = qc.Banner;
      img.alt = qc.TenQC || `Banner ${index + 1}`;
      slide.appendChild(img);

      const bookButton = document.createElement('a');
      bookButton.className = 'book-now-button';
      bookButton.href = '#';
      const textContent = document.createElement('span');
      textContent.className = 'text-content';
      textContent.textContent = 'Đặt vé ngay';
      bookButton.appendChild(textContent);

      const handleBooking = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (qc.MaPhim) {
          if (qc.TrangThai === 'Phim đang chiếu') {
            window.location.href = `booking.html?id=${qc.MaPhim}`;
          } else if (qc.TrangThai === 'Phim sắp chiếu') {
            showNotification(
              `Phim "${qc.TenQC}" chưa phát hành. Vui lòng quay lại sau!`,
              'info'
            );
          } else {
            showNotification(
              `Phim "${qc.TenQC}" đã qua thời gian phát hành. Vui lòng chọn phim khác!`,
              'info'
            );
          }
        } else {
          showNotification(
            'Banner này chưa được liên kết với phim cụ thể. Vui lòng chọn phim từ danh sách!',
            'info'
          );
        }
      };

      bookButton.addEventListener('click', handleBooking);
      
      slide.addEventListener('click', handleBooking);
      
      slide.appendChild(bookButton);

      const caption = document.createElement('div');
      caption.className = 'banner-caption';
      caption.textContent = qc.TenQC || `Banner ${index + 1}`;
      slide.appendChild(caption);

      slider.appendChild(slide);
    });
  } catch (error) {
    console.error('Lỗi khi tải banner:', error);
  }
}