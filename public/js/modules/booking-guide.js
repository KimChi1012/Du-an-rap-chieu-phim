let slideIndex = 1;
showSlide(slideIndex);

// Chuyển slide khi click Prev/Next
function changeSlide(n) {
  showSlide(slideIndex += n);
}

// Chuyển slide khi click dot
function currentSlide(n) {
  showSlide(slideIndex = n);
}

// Hiển thị slide theo index
function showSlide(n) {
  let slides = document.getElementsByClassName("slide");
  let dots = document.getElementsByClassName("dot");

  if (n > slides.length) { slideIndex = 1; }
  if (n < 1) { slideIndex = slides.length; }

  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }

  for (let i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }

  slides[slideIndex - 1].style.display = "block";
  dots[slideIndex - 1].className += " active";
}

// -------- Lightbox khi click vào ảnh --------
const lightbox = document.createElement("div");
lightbox.id = "lightbox";
lightbox.style.cssText = `
  display: none;
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.8);
  justify-content: center;
  align-items: center;
  z-index: 1000;
  cursor: pointer;
`;
const lightboxImg = document.createElement("img");
lightboxImg.style.cssText = `
  max-width: 90%;
  max-height: 90%;
  border-radius: 12px;
`;
lightbox.appendChild(lightboxImg);
document.body.appendChild(lightbox);

// Click ảnh mở lightbox
document.querySelectorAll(".slide img").forEach(img => {
  img.addEventListener("click", () => {
    lightbox.style.display = "flex";
    lightboxImg.src = img.src;
  });
});

// Click overlay đóng lightbox
lightbox.addEventListener("click", () => {
  lightbox.style.display = "none";
});
