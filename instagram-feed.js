(function () {
  const ENDPOINT = '/api/instagram';
  const VISIBLE_COUNT = 6;

  const ICON_SVG = `
    <svg class="nzp-ig-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="rgba(0,0,0,.32)"/>
      <rect x="6.5" y="6.5" width="11" height="11" rx="3.2" stroke="#fff" stroke-width="1.4"/>
      <circle cx="12" cy="12" r="3" stroke="#fff" stroke-width="1.4"/>
      <circle cx="16" cy="8" r="1" fill="#fff"/>
    </svg>`;

  function renderCards(items) {
    const track = document.getElementById('nzp-ig-track');
    if (!track) return;

    if (!items || items.length === 0) {
      track.innerHTML = '<div class="nzp-ig-empty">최근 인스타그램 게시물을 불러올 수 없어요. 잠시 후 다시 시도해 주세요.</div>';
      return;
    }

    track.innerHTML = items
      .map(
        (item) => `
        <a class="nzp-ig-card" href="${item.permalink}" target="_blank" rel="noopener">
          <img src="${item.imageUrl}" alt="너즐퍼즐 인스타그램 게시물" loading="lazy">
          ${ICON_SVG}
        </a>`
      )
      .join('');
  }

  function setupArrow() {
    const wrap = document.getElementById('nzp-ig-wrap');
    const track = document.getElementById('nzp-ig-track');
    const nextBtn = document.getElementById('nzp-ig-next');
    if (!wrap || !track || !nextBtn) return;

    function scrollByPage() {
      const cardWidth = track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width : 150;
      const gap = 16;
      track.scrollBy({ left: (cardWidth + gap) * VISIBLE_COUNT, behavior: 'smooth' });
    }

    function updateArrowState() {
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      nextBtn.disabled = atEnd;
    }

    nextBtn.addEventListener('click', scrollByPage);
    track.addEventListener('scroll', updateArrowState);
    setTimeout(updateArrowState, 300);
  }

  async function loadFeed() {
    try {
      const res = await fetch(ENDPOINT);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '요청 실패');
      renderCards(data.items || []);
    } catch (err) {
      renderCards([]);
    }
    setupArrow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFeed);
  } else {
    loadFeed();
  }
})();
