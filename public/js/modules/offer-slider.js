export function initOfferModal() {
  const offerModal = document.getElementById("offer-modal");
  const closeOfferModalBtn = document.querySelector(".close-offer");
  const offerImg = document.getElementById("offerImg");
  const offerTitle = document.getElementById("offerTitle");
  const offerDate = document.getElementById("offerDate");
  const offerDesc = document.getElementById("offerDesc");
  const offerThumbnail = document.getElementById("offerThumbnail");

  function openOfferModal(offerData) {
    if (!offerData || !offerModal || !offerImg || !offerTitle || !offerDate || !offerDesc || !offerThumbnail) {
      console.warn("No offer data provided or modal elements missing.");
      return;
    }

    const imgSrc = offerData.Anh || '';
    offerImg.src = imgSrc;
    offerImg.style.height = "280px";
    offerImg.alt = offerData.TenUD || '';
    offerThumbnail.src = imgSrc;
    offerThumbnail.alt = offerData.TenUD || '';
    offerTitle.textContent = offerData.TenUD || 'Không có tiêu đề';

    let formattedDate = 'Không có ngày đăng';
    if (offerData.NgayBatDau) {
      const date = new Date(offerData.NgayBatDau);
      formattedDate = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    offerDate.textContent = formattedDate;

    offerDesc.innerHTML = offerData.MoTa ? 
      offerData.MoTa.replace(/\n/g, '<br>') : 
      'Không có mô tả.';

    offerModal.style.display = "block";
  }

  function closeOfferModal() {
    if (offerModal) {
      offerModal.style.display = "none";
    }
  }

  if (closeOfferModalBtn) {
    closeOfferModalBtn.addEventListener("click", closeOfferModal);
  }

  if (offerModal) {
    offerModal.addEventListener("click", (e) => {
      if (e.target === offerModal) closeOfferModal();
    });
  }

  window.openOfferModal = openOfferModal;
  window.closeOfferModal = closeOfferModal;
}

export async function initOfferSlider(sectionId, apiUrl, emptyText) {
  const section = document.querySelector(sectionId);
  if (!section) return;

  const offerSlider = section.querySelector(".offer-slider");
  const dotsOffer = section.querySelector(".offer-dots");
  const prevBtnOffer = section.querySelector(".prev-offer");
  const nextBtnOffer = section.querySelector(".next-offer");

  if (!offerSlider) return;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("Fetch thất bại");
    const offers = await res.json();

    if (!Array.isArray(offers) || offers.length === 0) {
      offerSlider.innerHTML = `<p>${emptyText}</p>`;
      offerSlider.style.justifyContent = "center";
      if (prevBtnOffer) prevBtnOffer.style.display = "none";
      if (nextBtnOffer) nextBtnOffer.style.display = "none";
      if (dotsOffer) dotsOffer.style.display = "none";
      return;
    }

    offerSlider.innerHTML = "";
    offers.forEach(offer => {
      const card = document.createElement("div");
      card.classList.add("offer-card");
      card.setAttribute("data-offer", JSON.stringify(offer));

      card.innerHTML = `
        <img src="${offer.Anh || ''}" alt="${offer.TenUD || ''}" draggable="false">
        <h3 title="${offer.TenUD || ''}">${offer.TenUD || ''}</h3>
        <p>${offer.MoTa || ''}</p>
      `;
      offerSlider.appendChild(card);
    });

    const offerCards = offerSlider.querySelectorAll(".offer-card");
    offerCards.forEach(card => {
      card.addEventListener("click", () => {
        if (!offerSlider.classList.contains("dragging")) {
          const offerData = JSON.parse(card.getAttribute("data-offer") || "{}");
          window.openOfferModal(offerData);
        }
      });
    });

    const allCards = offerSlider.querySelectorAll(".offer-card");
    if (allCards.length === 0) return;

    const sliderStyle = getComputedStyle(offerSlider);
    const gap = parseFloat(sliderStyle.gap) || 0;
    const cardWidth = allCards[0].getBoundingClientRect().width + gap;

    const visibleCards = Math.max(1, Math.round((offerSlider.clientWidth + gap * 0.5) / cardWidth));
    const totalSlides = offers.length > visibleCards ? offers.length - visibleCards + 1 : 1;
    let index = 0;

    if (offers.length <= visibleCards) {
      offerSlider.style.justifyContent = "center";
    } else {
      offerSlider.style.justifyContent = "flex-start";
    }

    let moveToSlide;
    if (dotsOffer) {
      dotsOffer.innerHTML = "";
      const dots = [];
      for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement("span");
        if (i === 0) dot.classList.add("active");
        dot.addEventListener("click", () => moveToSlide(i));
        dotsOffer.appendChild(dot);
        dots.push(dot);
      }

      function updateDots() {
        dots.forEach(dot => dot.classList.remove("active"));
        if (dots[index]) dots[index].classList.add("active");
      }

      moveToSlide = function(i) {
        index = i;
        offerSlider.scrollTo({ left: index * cardWidth, behavior: "smooth" });
        updateDots();
      };
    }

    if (offers.length > visibleCards && prevBtnOffer && nextBtnOffer) {
      function showNext() {
        index = (index + 1) % totalSlides;
        moveToSlide(index);
      }

      function showPrev() {
        index = (index - 1 + totalSlides) % totalSlides;
        moveToSlide(index);
      }

      nextBtnOffer.addEventListener("click", showNext);
      prevBtnOffer.addEventListener("click", showPrev);
    } else {
      if (prevBtnOffer) prevBtnOffer.style.display = "none";
      if (nextBtnOffer) nextBtnOffer.style.display = "none";
    }

    let isDragging = false, startX, startScrollLeft, lastX, velocity = 0, lastTime = 0;

    function startDrag(x) {
      isDragging = true;
      offerSlider.classList.add("dragging");
      startX = x;
      lastX = x;
      startScrollLeft = offerSlider.scrollLeft;
      velocity = 0;
      lastTime = Date.now();
      offerSlider.style.scrollBehavior = 'auto';
    }

    function duringDrag(x) {
      if (!isDragging) return;
      
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      const deltaX = x - lastX;
      
      if (deltaTime > 0) {
        velocity = deltaX / deltaTime;
      }
      
      const walk = (x - startX) * 1.2;
      let newScroll = startScrollLeft - walk;
      const clampMax = (totalSlides - 1) * cardWidth;
      newScroll = Math.max(0, Math.min(newScroll, clampMax));
      
      requestAnimationFrame(() => {
        offerSlider.scrollLeft = newScroll;
      });
      
      lastX = x;
      lastTime = currentTime;
    }

    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      offerSlider.classList.remove("dragging");
      offerSlider.style.scrollBehavior = 'smooth';

      const momentum = velocity * 200;
      let targetScroll = offerSlider.scrollLeft - momentum;
      const clampMax = (totalSlides - 1) * cardWidth;
      targetScroll = Math.max(0, Math.min(targetScroll, clampMax));
      
      const nearestIndex = Math.round(targetScroll / cardWidth);
      index = Math.max(0, Math.min(nearestIndex, totalSlides - 1));
      
      if (typeof moveToSlide === 'function') {
        setTimeout(() => moveToSlide(index), 50);
      }
    }

    offerSlider.addEventListener("mousedown", e => {
      e.preventDefault();
      startDrag(e.pageX);
    });
    offerSlider.addEventListener("mousemove", e => duringDrag(e.pageX));
    offerSlider.addEventListener("mouseup", endDrag);
    offerSlider.addEventListener("mouseleave", endDrag);

    offerSlider.addEventListener("touchstart", e => {
      startDrag(e.touches[0].pageX);
    }, { passive: true });
    
    offerSlider.addEventListener("touchmove", e => {
      e.preventDefault();
      duringDrag(e.touches[0].pageX);
    }, { passive: false });
    
    offerSlider.addEventListener("touchend", endDrag, { passive: true });

  } catch (err) {
    console.error("Lỗi tải ưu đãi:", err);
    offerSlider.innerHTML = "<p>Lỗi tải dữ liệu ưu đãi.</p>";
  }
}