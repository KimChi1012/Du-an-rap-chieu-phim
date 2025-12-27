import { createMovieUrl } from './url-utils.js';
import { showNotification } from './notification.js';

export async function initMovieSlider(sectionId, apiUrl, emptyText) {
  const section = document.querySelector(sectionId);
  if (!section) return;

  const movieSlider = section.querySelector(".movie-slider");
  const dotsMovie = section.querySelector(".movie-dots");
  const prevBtnMovie = section.querySelector(".prev-movie");
  const nextBtnMovie = section.querySelector(".next-movie");

  if (!movieSlider) return;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("Fetch thất bại");
    const movies = await res.json();
    const visibleLimit = 7;
    const displayedMovies = movies.slice(0, visibleLimit);

    if (!Array.isArray(displayedMovies) || displayedMovies.length === 0) {
      movieSlider.innerHTML = `<p>${emptyText}</p>`;
      movieSlider.style.justifyContent = "center";
      if (prevBtnMovie) prevBtnMovie.style.display = "none";
      if (nextBtnMovie) nextBtnMovie.style.display = "none";
      if (dotsMovie) dotsMovie.style.display = "none";
      return;
    }

    movieSlider.innerHTML = "";
    displayedMovies.forEach(m => {
      const card = document.createElement("div");
      card.classList.add("movie-card");

      let tagsHTML = "";
      if (m.GioiHanTuoi && 
          m.GioiHanTuoi.trim() !== '' && 
          m.GioiHanTuoi.trim() !== 'null' &&
          m.GioiHanTuoi.trim() !== 'Mọi lứa tuổi') {
          tagsHTML += `<span class="age">${m.GioiHanTuoi.trim()}</span>`;
      }
      if (m.NgonNgu && m.NgonNgu.trim() !== '') tagsHTML += `<span class="subTitle">${m.NgonNgu}</span>`;
      if (m.DinhDang && m.DinhDang.trim() !== '') tagsHTML += `<span class="format">${m.DinhDang}</span>`;

      const tagsDiv = `<div class="tags" ${!tagsHTML ? 'style="visibility: hidden;"' : ''}>${tagsHTML || ''}</div>`;

      card.innerHTML = `
        <div class="poster" data-trailer="${m.Trailer || ''}">
          <img src="${m.Poster}" alt="${m.TenPhim}" class="movie-img" draggable="false">
          <div class="play-icon"><i class="fas fa-play"></i></div>
        </div>
        ${tagsDiv}
        <h3 title="${m.TenPhim}" class="movie-title-link" data-movie-id="${m.MaPhim}" data-movie-title="${encodeURIComponent(m.TenPhim)}" style="cursor: pointer;">${m.TenPhim}</h3>
        <p>Thể loại phim: <span>${m.TheLoai}</span></p>
      `;
      movieSlider.appendChild(card);
    });

    const posters = movieSlider.querySelectorAll(".poster");
    posters.forEach(poster => {
      const trailerUrl = poster.getAttribute("data-trailer");
      poster.addEventListener("click", () => {
        if (!movieSlider.classList.contains("dragging")) {
          if (trailerUrl && trailerUrl.trim() !== '' && trailerUrl !== 'null') {
            window.openVideoModal(trailerUrl);
          } else {
            if (typeof showNotification === 'function') {
              showNotification(
                "Trailer cho phim này chưa có sẵn. Vui lòng quay lại sau!",
                "warning"
              );
            } else {
              alert("Trailer cho phim này chưa có sẵn. Vui lòng quay lại sau!");
            }
          }
        }
      });
    });

    const movieTitles = movieSlider.querySelectorAll(".movie-title-link");
    movieTitles.forEach(title => {
      title.addEventListener("click", (e) => {
        e.preventDefault();
        if (!movieSlider.classList.contains("dragging")) {
          const encodedTitle = title.getAttribute("data-movie-title");
          const movieTitle = decodeURIComponent(encodedTitle);
          const movieId = title.getAttribute("data-movie-id");
          if (movieTitle) {
            window.location.href = createMovieUrl(movieTitle, movieId);
          }
        }
      });
    });

    const allCards = movieSlider.querySelectorAll(".movie-card");
    if (allCards.length === 0) return;

    if (displayedMovies.length < 5) {
      movieSlider.classList.add("center-items");
      if (prevBtnMovie) prevBtnMovie.style.display = "none";
      if (nextBtnMovie) nextBtnMovie.style.display = "none";
      if (dotsMovie) dotsMovie.style.display = "none";
    } else {
      movieSlider.classList.remove("center-items");
      if (prevBtnMovie) prevBtnMovie.style.display = "block";
      if (nextBtnMovie) nextBtnMovie.style.display = "block";
      if (dotsMovie) dotsMovie.style.display = "flex";
    }

    const sliderStyle = getComputedStyle(movieSlider);
    const gap = parseFloat(sliderStyle.gap) || 0;
    const cardWidth = allCards[0].getBoundingClientRect().width + gap;

    const visibleCards = Math.max(1, Math.round((movieSlider.clientWidth + gap * 0.5) / cardWidth));
    const totalSlides = displayedMovies.length > visibleCards ? displayedMovies.length - visibleCards + 1 : 1;
    let index = 0;
    let moveToSlide;
    if (dotsMovie) {
      dotsMovie.innerHTML = "";
      const dots = [];
      for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement("span");
        if (i === 0) dot.classList.add("active");
        dot.addEventListener("click", () => moveToSlide(i));
        dotsMovie.appendChild(dot);
        dots.push(dot);
      }

      function updateDots() {
        dots.forEach(dot => dot.classList.remove("active"));
        if (dots[index]) dots[index].classList.add("active");
      }

      moveToSlide = function(i) {
        index = i;
        movieSlider.scrollTo({ left: index * cardWidth, behavior: "smooth" });
        updateDots();
      };
    }

    if (movies.length > visibleCards && prevBtnMovie && nextBtnMovie) {
      function showNext() {
        index = (index + 1) % totalSlides;
        moveToSlide(index);
      }

      function showPrev() {
        index = (index - 1 + totalSlides) % totalSlides;
        moveToSlide(index);
      }

      nextBtnMovie.addEventListener("click", showNext);
      prevBtnMovie.addEventListener("click", showPrev);
    } else {
      if (prevBtnMovie) prevBtnMovie.style.display = "none";
      if (nextBtnMovie) nextBtnMovie.style.display = "none";
    }

    let isDragging = false, startX, startScrollLeft, lastX, velocity = 0, lastTime = 0;

    function startDrag(x) {
      isDragging = true;
      movieSlider.classList.add("dragging");
      startX = x;
      lastX = x;
      startScrollLeft = movieSlider.scrollLeft;
      velocity = 0;
      lastTime = Date.now();
      movieSlider.style.scrollBehavior = 'auto';
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
        movieSlider.scrollLeft = newScroll;
      });
      
      lastX = x;
      lastTime = currentTime;
    }

    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      movieSlider.classList.remove("dragging");
      movieSlider.style.scrollBehavior = 'smooth';
      
      const momentum = velocity * 200;
      let targetScroll = movieSlider.scrollLeft - momentum;
      const clampMax = (totalSlides - 1) * cardWidth;
      targetScroll = Math.max(0, Math.min(targetScroll, clampMax));
      
      const nearestIndex = Math.round(targetScroll / cardWidth);
      index = Math.max(0, Math.min(nearestIndex, totalSlides - 1));
      
      if (typeof moveToSlide === 'function') {
        setTimeout(() => moveToSlide(index), 50);
      }
    }

    movieSlider.addEventListener("mousedown", e => {
      e.preventDefault();
      startDrag(e.pageX);
    });
    movieSlider.addEventListener("mousemove", e => duringDrag(e.pageX));
    movieSlider.addEventListener("mouseup", endDrag);
    movieSlider.addEventListener("mouseleave", endDrag);

    movieSlider.addEventListener("touchstart", e => {
      startDrag(e.touches[0].pageX);
    }, { passive: true });
    
    movieSlider.addEventListener("touchmove", e => {
      e.preventDefault();
      duringDrag(e.touches[0].pageX);
    }, { passive: false });
    
    movieSlider.addEventListener("touchend", endDrag, { passive: true });

  } catch (err) {
    console.error("Lỗi tải phim:", err);
    movieSlider.innerHTML = "<p>Lỗi tải dữ liệu phim.</p>";
  }
}