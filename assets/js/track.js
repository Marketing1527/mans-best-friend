// Lightweight, cookie-free page and click tracking for the /admin dashboard.
(function () {
  if (navigator.webdriver || /^\/(admin|reviews-admin)/.test(location.pathname)) return;
  var params = new URLSearchParams(location.search);
  var utm = params.get('utm_source') || params.get('ref') || '';
  function send(data) {
    data.path = location.pathname;
    data.w = window.innerWidth;
    var body = JSON.stringify(data);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))) return;
    } catch (e) {}
    try { fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }); } catch (e) {}
  }
  send({ type: 'pageview', ref: document.referrer, utm: utm });

  function labelFor(a) {
    var href = (a.getAttribute('href') || '').toLowerCase();
    if (href.indexOf('tel:') === 0) return 'Call';
    if (href.indexOf('sms:') === 0) return 'Text';
    if (href.indexOf('mailto:') === 0) return 'Email';
    if (href.indexOf('writereview') > -1) return 'Google review';
    if (href.indexOf('maps.google') > -1 || href.indexOf('google.com/maps') > -1) return 'Google Maps';
    if (href === '/review' || href.indexOf('review.html') > -1) return 'Leave a review';
    if (href.indexOf('marketingsvc.com') > -1) return 'Essential Marketing link';
    if (/\bbtn\b/.test(a.className)) return (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) || 'Button';
    return null;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var label = labelFor(a);
    if (label) send({ type: 'click', label: label });
  }, true);
})();
