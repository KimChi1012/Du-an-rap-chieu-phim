export function createSlug(title) {
  if (!title) return '';

  let slug = title.toLowerCase();
  
  const vietnamese = [
    'à', 'á', 'ạ', 'ả', 'ã', 'â', 'ầ', 'ấ', 'ậ', 'ẩ', 'ẫ', 'ă', 'ằ', 'ắ', 'ặ', 'ẳ', 'ẵ',
    'è', 'é', 'ẹ', 'ẻ', 'ẽ', 'ê', 'ề', 'ế', 'ệ', 'ể', 'ễ',
    'ì', 'í', 'ị', 'ỉ', 'ĩ',
    'ò', 'ó', 'ọ', 'ỏ', 'õ', 'ô', 'ồ', 'ố', 'ộ', 'ổ', 'ỗ', 'ơ', 'ờ', 'ớ', 'ợ', 'ở', 'ỡ',
    'ù', 'ú', 'ụ', 'ủ', 'ũ', 'ư', 'ừ', 'ứ', 'ự', 'ử', 'ữ',
    'ỳ', 'ý', 'ỵ', 'ỷ', 'ỹ',
    'đ'
  ];
  
  const english = [
    'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a',
    'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e',
    'i', 'i', 'i', 'i', 'i',
    'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o',
    'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u',
    'y', 'y', 'y', 'y', 'y',
    'd'
  ];

  for (let i = 0; i < vietnamese.length; i++) {
    slug = slug.replace(new RegExp(vietnamese[i], 'g'), english[i]);
  }

  slug = slug.replace(/[^a-z0-9\s-]/g, '');
  slug = slug.replace(/[\s-]+/g, '-');
  slug = slug.replace(/^-+|-+$/g, '');
  
  return slug;
}

export function createMovieUrl(movieTitle, movieId = null) {
  const slug = createSlug(movieTitle);
  if (slug) {
    return `movie-detail.html?title=${encodeURIComponent(slug)}`;
  } else {
    return `movie-detail.html?id=${movieId}`;
  }
}

export function getMovieParamFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const title = urlParams.get('title');
  const id = urlParams.get('id');
  
  return { title, id };
}