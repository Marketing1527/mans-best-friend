// Man's Best Friend, redesign preview scripts
document.documentElement.classList.add('js');

(function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');

  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('menu-open')) {
        header.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // Hairline under the header once the page moves, via a sentinel instead of a scroll listener
  if (header && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      header.classList.toggle('scrolled', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Stay calculator: $50 per dog, per night. No other rates.
  var RATE = 50;
  var limits = { dogs: [1, 3], nights: [1, 30] };
  var state = { dogs: 1, nights: 3 };
  var sum = document.getElementById('calc-sum');
  var math = document.getElementById('calc-math');

  function render() {
    document.getElementById('dogs').textContent = state.dogs;
    document.getElementById('nights').textContent = state.nights;
    sum.textContent = '$' + (RATE * state.dogs * state.nights).toLocaleString('en-US');
    math.textContent = state.dogs + (state.dogs === 1 ? ' dog' : ' dogs') + ' for ' +
      state.nights + (state.nights === 1 ? ' night' : ' nights');
    document.querySelectorAll('[data-step]').forEach(function (b) {
      var key = b.dataset.step, dir = +b.dataset.dir;
      b.disabled = dir < 0 ? state[key] <= limits[key][0] : state[key] >= limits[key][1];
    });
  }
  document.querySelectorAll('[data-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.dataset.step;
      state[key] = Math.min(limits[key][1], Math.max(limits[key][0], state[key] + +b.dataset.dir));
      render();
    });
  });
  if (sum) render();

  // Gallery lightbox
  var links = document.querySelectorAll('.g-item');
  if (links.length && window.HTMLDialogElement) {
    var dlg = document.createElement('dialog');
    dlg.className = 'lightbox';
    dlg.innerHTML = '<button type="button" aria-label="Close photo"><i class="ph ph-x" aria-hidden="true"></i></button><img alt="">';
    document.body.appendChild(dlg);
    var big = dlg.querySelector('img');
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var img = a.querySelector('img');
        big.src = a.href;
        big.alt = img ? img.alt : '';
        dlg.showModal();
      });
    });
    dlg.addEventListener('click', function () { dlg.close(); });
  }
})();
