// Man's Best Friend — site scripts
(function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Stay request form: no server needed. It opens the visitor's email app
  // with the details filled in, addressed to Andrew.
  var form = document.getElementById('stay-request');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var lines = [
        'Name: ' + (d.get('name') || ''),
        'Phone: ' + (d.get('phone') || ''),
        'Neighborhood: ' + (d.get('area') || ''),
        'Number of dogs: ' + (d.get('dogs') || ''),
        'Drop-off date: ' + (d.get('start') || ''),
        'Pick-up date: ' + (d.get('end') || ''),
        '',
        'About my dog(s):',
        (d.get('message') || '')
      ];
      var subject = 'Boarding request from ' + (d.get('name') || 'website');
      window.location.href = 'mailto:' + form.dataset.email +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));
      var ok = document.getElementById('form-note');
      if (ok) ok.hidden = false;
    });
  }
})();
