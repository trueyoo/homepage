(function () {
  function animateCounter(el) {
    const target = parseFloat(el.dataset.target || '0', 10);
    const duration = parseInt(el.dataset.duration || '3000', 10);
    const isInt = Number.isInteger(target);
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = target * eased;
      el.textContent = isInt ? Math.round(value).toLocaleString('ko-KR') : value.toFixed(1);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = isInt ? target.toLocaleString('ko-KR') : target.toFixed(1);
      }
    }

    requestAnimationFrame(tick);
  }

  function init() {
    const counters = document.querySelectorAll('.nzp-counter');
    if (counters.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
