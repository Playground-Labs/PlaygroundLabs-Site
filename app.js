/* Playground Labs — shared behaviour: entrance/scroll reveals, nav hover-preview,
   pulsing/clickable wordmark dot, home scroll cue, contact form. Vanilla, no deps.
   Reveals are gated on a `.js` class (set in <head>) so content stays visible if
   JS never runs; prefers-reduced-motion collapses all motion to static. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function reveal(el) { el.classList.add('in'); }

  ready(function () {
    var anims = Array.prototype.slice.call(document.querySelectorAll('.anim'));

    if (reduce) {
      anims.forEach(reveal); // everything visible immediately, no motion
    } else {
      // Entrance: fire on load after each element's data-enter delay.
      anims.filter(function (el) { return el.hasAttribute('data-enter'); })
           .forEach(function (el) {
             setTimeout(function () { reveal(el); }, +el.getAttribute('data-enter') || 0);
           });

      // Scroll reveal via IntersectionObserver (robust in a real browser).
      var scrollEls = anims.filter(function (el) { return el.hasAttribute('data-reveal'); });
      if (scrollEls.length) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            var el = e.target, d = +el.getAttribute('data-reveal-delay') || 0;
            setTimeout(function () { reveal(el); }, d);
            io.unobserve(el);
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        scrollEls.forEach(function (el) { io.observe(el); });
      }
    }

    // ----- Wordmark dot: ambient pulse + click "bounce" easter egg -----
    var dot = document.querySelector('[data-dot]');
    if (dot) {
      dot.addEventListener('click', function (e) {
        e.preventDefault();   // dot lives inside the home link; don't navigate
        e.stopPropagation();
        if (reduce) return;
        dot._bouncing = true;
        var anim = dot.animate([
          { transform: 'scale(1)' },
          { transform: 'scaleX(0.7) scaleY(1.35) translateY(-10px)', offset: 0.15 },
          { transform: 'scaleX(1.35) scaleY(0.6) translateY(6px)', offset: 0.35 },
          { transform: 'scaleX(0.85) scaleY(1.18) translateY(-9px)', offset: 0.6 },
          { transform: 'scaleX(1.06) scaleY(0.95) translateY(2px)', offset: 0.85 },
          { transform: 'scale(1)', offset: 1 }
        ], { duration: 450, easing: 'ease-out' });
        anim.onfinish = function () { dot._bouncing = false; dot.style.transform = 'scale(1)'; dot.style.opacity = '1'; };
      });
      if (!reduce) {
        var on = false;
        setInterval(function () {
          if (dot._bouncing) return;
          on = !on;
          dot.style.opacity = on ? '0.35' : '1';
          dot.style.transform = on ? 'scale(0.65)' : 'scale(1)';
        }, 2000);
      }
    }

    // ----- Nav hover-preview panel (injected; hidden by default so no FOUC) -----
    var links = document.querySelector('.nav-links');
    if (links) {
      var panel = document.createElement('div');
      panel.className = 'nav-preview';
      panel.innerHTML =
        '<div class="nav-preview__pane nav-preview__apps">' +
          miniCard('#0D1117', '#fff', 'Drift', 'Travel Journal', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.3)', '-3deg') +
          miniCard('#F0EBE1', '#3D2B1F', 'Nook', 'Reading Tracker', 'rgba(60,40,20,0.2)', 'rgba(60,40,20,0.3)', '2deg') +
          miniCard('#101A28', '#fff', 'Tempo', 'Workout Timer', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.3)', '-2deg') +
        '</div>' +
        '<div class="nav-preview__pane nav-preview__team">' +
          '<div class="mini-team-name">Brandon<br>Wilcox</div>' +
          '<div class="mini-team-role">Founder</div>' +
        '</div>';
      links.appendChild(panel);

      var appsPane = panel.querySelector('.nav-preview__apps');
      var teamPane = panel.querySelector('.nav-preview__team');
      var sizes = { apps: { w: 330, h: 128 }, team: { w: 220, h: 110 } };
      var hideT = null;

      function show(which) {
        clearTimeout(hideT);
        var s = sizes[which] || sizes.apps;
        panel.style.width = s.w + 'px';
        panel.style.height = s.h + 'px';
        panel.classList.add('show');
        appsPane.classList.toggle('show', which === 'apps');
        teamPane.classList.toggle('show', which === 'team');
      }
      function hide() { hideT = setTimeout(function () { panel.classList.remove('show'); }, 130); }
      function clear() { clearTimeout(hideT); panel.classList.remove('show'); }

      Array.prototype.forEach.call(links.querySelectorAll('a[data-preview]'), function (a) {
        var p = a.getAttribute('data-preview');
        a.addEventListener('mouseenter', function () { p === 'clear' ? clear() : show(p); });
      });
      links.addEventListener('mouseleave', hide);
    }

    // ----- Home scroll cue: bobbing chevron, disappears after first scroll -----
    var cue = document.querySelector('.scroll-cue');
    if (cue && !reduce) {
      var chev = cue.querySelector('.chevron');
      var up = false;
      var chevInt = setInterval(function () {
        if (chev) { up = !up; chev.style.transform = up ? 'translateY(3px)' : 'translateY(0)'; }
      }, 550);
      var onScroll = function () {
        if (window.scrollY > 40) {
          cue.classList.add('hidden');
          clearInterval(chevInt);
          window.removeEventListener('scroll', onScroll);
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // ----- Contact form (UI only, no backend) -----
    var form = document.querySelector('.form');
    if (form) {
      var btn = form.querySelector('.btn-send');
      var label = btn ? btn.textContent : '';
      var sent = false, sentT = null;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (sent || !btn) return;
        sent = true;
        btn.textContent = 'Sent — thank you! ✓';
        clearTimeout(sentT);
        sentT = setTimeout(function () { sent = false; btn.textContent = label; }, 2500);
      });
    }
  });

  function miniCard(bg, fg, name, cat, platC, catC, rot) {
    return '<div class="mini-card" style="background:' + bg + ';transform:rotate(' + rot + ');">' +
      '<span class="m-plat" style="color:' + platC + '">iOS</span>' +
      '<div><div class="m-name" style="color:' + fg + '">' + name + '</div>' +
      '<div class="m-cat" style="color:' + catC + '">' + cat + '</div></div></div>';
  }
})();
