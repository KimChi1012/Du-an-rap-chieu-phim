import { createMovieUrl } from './url-utils.js';
let allMoviesData = [];
let currentPageNum = 1;
const moviesPerPage = 10;

function renderMovies(movies, moviesGrid) {
  moviesGrid.innerHTML = "";
  
  if (movies.length === 0) {
    moviesGrid.innerHTML = '<p style="text-align: center; color: #777; grid-column: 1/-1;">Không có phim nào.</p>';
    return;
  }

  if (movies.length < 5) {
    moviesGrid.classList.add("center-items");
  } else {
    moviesGrid.classList.remove("center-items");
  }

  movies.forEach(m => {
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
    moviesGrid.appendChild(card);
  });

  const posters = moviesGrid.querySelectorAll(".poster");
  posters.forEach(poster => {
    const trailerUrl = poster.getAttribute("data-trailer");
    poster.addEventListener("click", () => {
      window.openVideoModal(trailerUrl);
    });
  });

  const movieTitles = moviesGrid.querySelectorAll(".movie-title-link");
  movieTitles.forEach(title => {
    title.addEventListener("click", (e) => {
      e.preventDefault();
      const encodedTitle = title.getAttribute("data-movie-title");
      const movieTitle = decodeURIComponent(encodedTitle);
      const movieId = title.getAttribute("data-movie-id");
      
      console.log('All-movies click debug:', {
        encodedTitle,
        movieTitle,
        movieId,
        createMovieUrl: typeof createMovieUrl
      });
      
      if (movieTitle) {
        const url = createMovieUrl(movieTitle, movieId);
        console.log('Generated URL:', url);
        window.location.href = url;
      } else {
        // Fallback to ID if no title
        console.log('No title, using ID URL');
        window.location.href = `movie-detail.html?id=${movieId}`;
      }
    });
  });
}

function renderPagination(totalMovies, container) {
  const pagination = container.querySelector('.pagination');
  if (!pagination) return;

  const totalPages = Math.ceil(totalMovies / moviesPerPage);
  
  if (totalPages <= 1) {
    pagination.style.display = 'none';
    return;
  }

  pagination.style.display = 'flex';
  pagination.innerHTML = '';

  if (currentPageNum > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.title = 'Trang trước';
    prevBtn.onclick = () => {
      currentPageNum--;
      updatePage(container);
    };
    pagination.appendChild(prevBtn);
  }

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPageNum - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (startPage > 1) {
    const firstBtn = document.createElement('button');
    firstBtn.innerHTML = '<span>1</span>';
    firstBtn.title = 'Trang 1';
    firstBtn.onclick = () => {
      currentPageNum = 1;
      updatePage(container);
    };
    pagination.appendChild(firstBtn);

    if (startPage > 2) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      dots.className = 'page-info';
      pagination.appendChild(dots);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.innerHTML = `<span>${i}</span>`;
    pageBtn.title = `Trang ${i}`;
    if (i === currentPageNum) {
      pageBtn.classList.add('active');
    }
    pageBtn.onclick = () => {
      currentPageNum = i;
      updatePage(container);
    };
    pagination.appendChild(pageBtn);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      dots.className = 'page-info';
      pagination.appendChild(dots);
    }

    const lastBtn = document.createElement('button');
    lastBtn.innerHTML = `<span>${totalPages}</span>`;
    lastBtn.title = `Trang ${totalPages}`;
    lastBtn.onclick = () => {
      currentPageNum = totalPages;
      updatePage(container);
    };
    pagination.appendChild(lastBtn);
  }

  if (currentPageNum < totalPages) {
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.title = 'Trang sau';
    nextBtn.onclick = () => {
      currentPageNum++;
      updatePage(container);
    };
    pagination.appendChild(nextBtn);
  }
}

function updatePage(container) {
  const moviesGrid = container.querySelector('.movies-grid');
  const startIndex = (currentPageNum - 1) * moviesPerPage;
  const endIndex = startIndex + moviesPerPage;
  const moviesToShow = allMoviesData.slice(startIndex, endIndex);

  renderMovies(moviesToShow, moviesGrid);
  renderPagination(allMoviesData.length, container);

  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadAllMovies(apiUrl, containerId) {
  const container = document.querySelector(containerId);
  if (!container) return;

  const moviesGrid = container.querySelector('.movies-grid');
  if (!moviesGrid) return;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("Fetch thất bại");
    const movies = await res.json();

    if (!Array.isArray(movies) || movies.length === 0) {
      moviesGrid.innerHTML = '<p style="text-align: center; color: #777; grid-column: 1/-1;">Chưa có phim nào.</p>';
      return;
    }

    allMoviesData = movies;
    currentPageNum = 1;
    updatePage(container);

  } catch (err) {
    console.error("Lỗi tải phim:", err);
    moviesGrid.innerHTML = '<p style="text-align: center; color: #777; grid-column: 1/-1;">Lỗi tải dữ liệu phim.</p>';
  }
}

export { renderMovies, renderPagination, updatePage, loadAllMovies };
