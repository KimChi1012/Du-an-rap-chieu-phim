let initialized = false;

function getElements() {
  return {
    videoModal: document.getElementById('video-modal'),
    youtubeIframe: document.getElementById('youtubeVideo')
  };
}

export function openVideoModal(trailerUrl) {
  if (!trailerUrl) return;

  const { videoModal, youtubeIframe } = getElements();
  if (!videoModal || !youtubeIframe) return;

  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([^&\n?#]+)/;
  const match = trailerUrl.match(regex);
  if (!match) {
    console.error('URL không hợp lệ:', trailerUrl);
    return;
  }

  const videoId = match[1];
  youtubeIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&color=white`;
  videoModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

export function closeVideoModal() {
  const { videoModal, youtubeIframe } = getElements();
  if (!videoModal || !youtubeIframe) return;

  youtubeIframe.src = '';
  videoModal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

export function initVideoModal() {
  if (initialized) return;

  const { videoModal } = getElements();
  if (!videoModal) return;

  const closeBtn = videoModal.querySelector('.close');
  if (closeBtn) closeBtn.addEventListener('click', closeVideoModal);

  videoModal.addEventListener('click', (e) => {
    if (e.target === videoModal) closeVideoModal();
  });

  window.openVideoModal = openVideoModal;
  window.closeVideoModal = closeVideoModal;

  initialized = true;
}