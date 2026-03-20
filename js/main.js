/**
 * NUPRESS — Main JavaScript
 * Mobile nav, sticky header, scroll animations, stats counter, form validation
 */

(function () {
  'use strict';

  /* ============================================================
     UTILITY
     ============================================================ */
  function qs(selector, context) {
    return (context || document).querySelector(selector);
  }

  function qsa(selector, context) {
    return Array.from((context || document).querySelectorAll(selector));
  }

  /* ============================================================
     STICKY NAV + TRANSPARENT HEADER
     ============================================================ */
  function initStickyNav() {
    var header = qs('#site-header');
    if (!header) return;

    function updateHeader() {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
        header.classList.remove('transparent');
      } else {
        header.classList.remove('scrolled');
        header.classList.add('transparent');
      }
    }

    // Check if we're on a page with a hero (video bg) — start transparent
    var hasHero = qs('.hero') || qs('.page-hero');
    if (hasHero) {
      header.classList.add('transparent');
    } else {
      header.classList.add('scrolled');
    }

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  /* ============================================================
     MOBILE HAMBURGER MENU
     ============================================================ */
  function initMobileMenu() {
    var hamburger = qs('.hamburger');
    var mobileMenu = qs('.mobile-menu');
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.contains('open');

      if (isOpen) {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      } else {
        mobileMenu.classList.add('open');
        hamburger.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }
    });

    // Close on nav link click
    qsa('a', mobileMenu).forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ============================================================
     ACTIVE NAV LINK
     ============================================================ */
  function initActiveNav() {
    var currentPath = window.location.pathname;
    var navLinks = qsa('#site-header a, .mobile-menu a');

    navLinks.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      // Normalize: strip trailing slash
      var linkPath = href.replace(/\/$/, '');
      var pagePath = currentPath.replace(/\/$/, '');

      if (linkPath && pagePath.endsWith(linkPath) && linkPath !== '') {
        link.classList.add('active');
      }
    });
  }

  /* ============================================================
     SCROLL-TRIGGERED FADE IN
     ============================================================ */
  function initFadeIn() {
    var els = qsa('.fade-in');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      // Fallback: show all immediately
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    els.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ============================================================
     STATS COUNTER ANIMATION
     ============================================================ */
  function initCounters() {
    var counters = qsa('[data-count]');
    if (!counters.length) return;

    function animateCounter(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals')) : 0;
      var duration = 1800;
      var start = null;

      function step(timestamp) {
        if (!start) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        // Ease out cubic
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = eased * target;

        if (decimals > 0) {
          el.textContent = prefix + current.toFixed(decimals) + suffix;
        } else {
          el.textContent = prefix + Math.round(current).toLocaleString() + suffix;
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = prefix + (decimals > 0 ? target.toFixed(decimals) : target.toLocaleString()) + suffix;
        }
      }

      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    counters.forEach(function (counter) {
      observer.observe(counter);
    });
  }

  /* ============================================================
     VIDEO HERO FALLBACK
     ============================================================ */
  function initVideoFallback() {
    var video = qs('.hero-video-bg video');
    if (!video) return;

    video.addEventListener('error', function () {
      var bg = qs('.hero-video-bg');
      if (bg) {
        bg.style.backgroundImage = "url('" + (video.getAttribute('poster') || '') + "')";
        bg.style.backgroundSize = 'cover';
        bg.style.backgroundPosition = 'center';
        video.style.display = 'none';
      }
    });

    // Try to play (handles autoplay policy gracefully)
    var playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(function () {
        // Autoplay blocked — video stays on poster frame, that's fine
      });
    }
  }

  /* ============================================================
     FILE UPLOAD DRAG & DROP
     ============================================================ */
  function initFileUpload() {
    var dropZones = qsa('.file-drop-zone');

    dropZones.forEach(function (zone) {
      var input = zone.querySelector('input[type="file"]');
      var fileList = zone.nextElementSibling;
      var uploadedFiles = [];

      if (!input) return;

      // Click zone to trigger file input
      zone.addEventListener('click', function (e) {
        if (e.target.closest('.file-item')) return;
        input.click();
      });

      // Drag events
      zone.addEventListener('dragover', function (e) {
        e.preventDefault();
        zone.classList.add('drag-over');
      });

      zone.addEventListener('dragleave', function (e) {
        if (!zone.contains(e.relatedTarget)) {
          zone.classList.remove('drag-over');
        }
      });

      zone.addEventListener('drop', function (e) {
        e.preventDefault();
        zone.classList.remove('drag-over');
        handleFiles(Array.from(e.dataTransfer.files));
      });

      // File input change
      input.addEventListener('change', function () {
        handleFiles(Array.from(input.files));
      });

      function handleFiles(newFiles) {
        newFiles.forEach(function (file) {
          // Limit: 20MB per file
          if (file.size > 20 * 1024 * 1024) {
            alert(file.name + ' exceeds the 20MB limit.');
            return;
          }
          uploadedFiles.push(file);
          addFileToList(file);
        });
      }

      function addFileToList(file) {
        if (!fileList || !fileList.classList.contains('file-list')) return;

        var item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML =
          '<span>' + escapeHtml(file.name) + ' <small>(' + formatFileSize(file.size) + ')</small></span>' +
          '<button class="file-item-remove" aria-label="Remove file" type="button">&#x2715;</button>';

        item.querySelector('.file-item-remove').addEventListener('click', function () {
          var idx = uploadedFiles.indexOf(file);
          if (idx > -1) uploadedFiles.splice(idx, 1);
          item.remove();
        });

        fileList.appendChild(item);
      }
    });
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ============================================================
     FORM VALIDATION (RFQ / Contact)
     ============================================================ */
  function initFormValidation() {
    var forms = qsa('form[data-validate]');

    forms.forEach(function (form) {
      form.addEventListener('submit', function (e) {
        var isValid = validateForm(form);
        if (!isValid) {
          e.preventDefault();
        }
      });

      // Real-time field feedback
      var fields = qsa('input, select, textarea', form);
      fields.forEach(function (field) {
        field.addEventListener('blur', function () {
          validateField(field);
        });
      });
    });
  }

  function validateForm(form) {
    var fields = qsa('[required]', form);
    var isValid = true;

    fields.forEach(function (field) {
      if (!validateField(field)) isValid = false;
    });

    return isValid;
  }

  function validateField(field) {
    var errorEl = field.parentElement.querySelector('.field-error');
    var value = field.value.trim();
    var isValid = true;
    var message = '';

    if (field.hasAttribute('required') && !value) {
      isValid = false;
      message = 'This field is required.';
    } else if (field.type === 'email' && value && !isValidEmail(value)) {
      isValid = false;
      message = 'Please enter a valid email address.';
    } else if (field.type === 'tel' && value && !isValidPhone(value)) {
      isValid = false;
      message = 'Please enter a valid phone number.';
    }

    if (!isValid) {
      field.classList.add('invalid');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('visible');
      }
    } else {
      field.classList.remove('invalid');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
      }
    }

    return isValid;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {
    return /^[\d\s\+\-\(\)]{7,}$/.test(phone);
  }

  /* ============================================================
     SMOOTH SCROLL FOR ANCHOR LINKS
     ============================================================ */
  function initSmoothScroll() {
    qsa('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var target = qs(link.getAttribute('href'));
        if (target) {
          e.preventDefault();
          var headerHeight = parseInt(getComputedStyle(document.documentElement)
            .getPropertyValue('--header-height')) || 80;
          var top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });
  }

  /* ============================================================
     INIT ALL
     ============================================================ */
  function init() {
    initStickyNav();
    initMobileMenu();
    initActiveNav();
    initFadeIn();
    initCounters();
    initVideoFallback();
    initFileUpload();
    initFormValidation();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
