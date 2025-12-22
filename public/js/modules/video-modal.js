export function initVideoModal() {
  const videoModal = document.getElementById("video-modal");
  const closeModal = videoModal?.querySelector(".close");
  const youtubeIframe = document.getElementById("youtubeVideo");

  function openVideoModal(trailerUrl) {
    if (!trailerUrl || !videoModal || !youtubeIframe) return;

    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = trailerUrl.match(regex);
    if (!match) {
      console.error("URL không hợp lệ:", trailerUrl);
      return;
    }

    const videoId = match[1];
    youtubeIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&color=white`;
    videoModal.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  function closeVideoModal() {
    if (videoModal && youtubeIframe) {
      videoModal.style.display = "none";
      youtubeIframe.src = "";
      document.body.style.overflow = "auto";
    }
  }

  if (closeModal) closeModal.addEventListener("click", closeVideoModal);
  if (videoModal) videoModal.addEventListener("click", (e) => {
    if (e.target === videoModal) closeVideoModal();
  });

  window.openVideoModal = openVideoModal;
  window.closeVideoModal = closeVideoModal;
}