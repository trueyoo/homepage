(function () {
  function init() {
    const form = document.getElementById('nzp-lead-form');
    const statusEl = document.getElementById('nzp-lead-status');
    const submitBtn = document.getElementById('nzp-lead-submit');
    if (!form || !statusEl || !submitBtn) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('nzp-lead-name').value.trim();
      const contact = document.getElementById('nzp-lead-contact').value.trim();
      const channel = document.getElementById('nzp-lead-channel').value;
      const message = document.getElementById('nzp-lead-message').value.trim();

      if (!name || !contact) {
        statusEl.style.color = '#ffb4a8';
        statusEl.textContent = '이름과 연락처를 입력해 주세요.';
        return;
      }

      submitBtn.disabled = true;
      statusEl.style.color = 'rgba(245,240,232,.7)';
      statusEl.textContent = '신청 중...';

      try {
        const res = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, contact, channel, message }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '요청 실패');

        statusEl.style.color = '#9fe6b8';
        statusEl.textContent = '상담 신청이 접수되었어요! 영업일 기준 24시간 이내 연락드릴게요.';
        form.reset();
      } catch (err) {
        statusEl.style.color = '#ffb4a8';
        statusEl.textContent = '신청 중 오류가 발생했어요. b2b@nuzzlepuzzle.co.kr로 직접 문의해 주세요.';
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
