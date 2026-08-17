(function () {
  'use strict';

  // Fill this in once Percussion 101 has a business email set up.
  var COMPANY_EMAIL = '';

  var USERS_KEY = 'percussion101_users';
  var CURRENT_USER_KEY = 'percussion101_currentUser';
  var TABS = ['home', 'about', 'calendar', 'booking', 'contact', 'login'];

  var WEEKDAY_SLOTS = ['3:30 PM', '4:30 PM', '5:30 PM', '6:30 PM'];
  var SATURDAY_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM'];
  var WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  var todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  var viewYear = todayDate.getFullYear();
  var viewMonth = todayDate.getMonth();
  var selectedDateKey = null;

  // ---------- Tabs / routing ----------

  function showTab(tab) {
    if (TABS.indexOf(tab) === -1) tab = 'home';

    document.querySelectorAll('.tab-panel').forEach(function (panel) {
      panel.classList.toggle('active', panel.dataset.tab === tab);
    });

    document.querySelectorAll('[data-tab-link]').forEach(function (link) {
      link.classList.toggle('active', link.dataset.tabLink === tab);
    });

    var nav = document.getElementById('mainNav');
    if (nav) nav.classList.remove('open');

    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

    if (tab === 'calendar') renderCalendar();
  }

  function currentTabFromHash() {
    var hash = window.location.hash.replace('#', '');
    return TABS.indexOf(hash) !== -1 ? hash : 'home';
  }

  window.addEventListener('hashchange', function () {
    showTab(currentTabFromHash());
  });

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('year').textContent = new Date().getFullYear();

    document.querySelectorAll('[data-tab-link]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var tab = link.dataset.tabLink;
        window.location.hash = tab;
        showTab(tab);
      });
    });

    var navToggle = document.getElementById('navToggle');
    var mainNav = document.getElementById('mainNav');
    navToggle.addEventListener('click', function () {
      var open = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    setupContactEmail();
    setupCalendar();
    setupAccount();

    showTab(currentTabFromHash());
  });

  // ---------- Contact email placeholder ----------

  function setupContactEmail() {
    var el = document.getElementById('contactEmailValue');
    if (!el) return;
    if (COMPANY_EMAIL) {
      el.textContent = COMPANY_EMAIL;
      el.classList.remove('contact-placeholder');
      el.outerHTML = '<a href="mailto:' + COMPANY_EMAIL + '" class="contact-value" id="contactEmailValue">' + COMPANY_EMAIL + '</a>';
    }
  }

  function setupAccount() {
    var loginButton = document.getElementById('loginButton');
    var registerButton = document.getElementById('registerButton');
    var logoutButton = document.getElementById('logoutButton');
    var profileButton = document.getElementById('profileButton');
    var headerLoginButton = document.getElementById('headerLoginButton');

    if (loginButton) loginButton.addEventListener('click', handleLogin);
    if (registerButton) registerButton.addEventListener('click', handleRegister);
    if (logoutButton) logoutButton.addEventListener('click', function () {
      clearCurrentUser();
      clearTawkVisitor();
      renderAccountPanel('signedOut');
    });
    var profileMenu = document.getElementById('profileMenu');
    var viewProfileBtn = document.getElementById('viewProfileBtn');
    var signOutBtn = document.getElementById('signOutBtn');

    if (profileButton) profileButton.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!profileMenu) return;
      var isOpen = profileMenu.hidden === false;
      profileMenu.hidden = isOpen;
    });
    if (viewProfileBtn) viewProfileBtn.addEventListener('click', function () {
      if (profileMenu) profileMenu.hidden = true;
      window.location.hash = 'login';
      showTab('login');
    });
    if (signOutBtn) signOutBtn.addEventListener('click', function () {
      if (profileMenu) profileMenu.hidden = true;
      clearCurrentUser();
      clearTawkVisitor();
      renderAccountPanel('signedOut');
    });
    if (headerLoginButton) headerLoginButton.addEventListener('click', function () {
      window.location.hash = 'login';
      showTab('login');
    });

    document.addEventListener('click', function () {
      if (profileMenu) profileMenu.hidden = true;
    });
    if (profileMenu) {
      profileMenu.addEventListener('click', function (event) {
        event.stopPropagation();
      });
    }

    renderAccountPanel();
  }

  function getUsers() {
    var stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getCurrentUser() {
    var stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  function setCurrentUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  function clearCurrentUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  // ---------- Tawk secure visitor integration ----------
  // Attach a server-signed visitor hash and load the Tawk widget.
  function loadTawkEmbed() {
    if (document.querySelector('script[data-tawk-widget]')) return;
    (function() {
      var s1 = document.createElement('script');
      s1.setAttribute('data-tawk-widget', '1');
      s1.async = true;
      s1.src = 'https://embed.tawk.to/6a791c521a0a1d1d4760a402/1jvkhd949';
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');
      document.head.appendChild(s1);
    })();
  }

  async function attachTawkSecure(user) {
    if (!user || !user.email) return;
    try {
      var q = new URLSearchParams({ id: user.email });
      var res = await fetch('/api/tawk-hash?' + q, { credentials: 'same-origin' });
      if (!res.ok) { loadTawkEmbed(); return; }
      var data = await res.json();
      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_API.visitor = {
        name: user.name || '',
        email: user.email || '',
        hash: data.hash || ''
      };

      var existing = document.querySelector('script[data-tawk-widget]');
      if (!existing) {
        // Load the widget after setting visitor so Tawk picks up the signed visitor hash.
        loadTawkEmbed();
      } else {
        // If widget already loaded, try setting attributes; if not supported, reload the script.
        if (window.Tawk_API && typeof window.Tawk_API.setAttributes === 'function') {
          try { window.Tawk_API.setAttributes({ name: user.name, email: user.email }, function(){}); } catch (e) {}
        } else {
          // remove and re-insert to force re-init with visitor
          existing.parentNode.removeChild(existing);
          loadTawkEmbed();
        }
      }
    } catch (e) {
      loadTawkEmbed();
    }
  }

  function clearTawkVisitor() {
    try {
      // Remove any server-signed visitor and reload anonymous widget
      if (document.querySelector('script[data-tawk-widget]')) {
        document.querySelector('script[data-tawk-widget]').parentNode.removeChild(document.querySelector('script[data-tawk-widget]'));
      }
      if (window.Tawk_API) {
        try { window.Tawk_API.visitor = {}; } catch (e) {}
      }
      loadTawkEmbed();
    } catch (e) {}
  }

  function findUserByEmail(email) {
    var users = getUsers();
    return users.find(function (user) {
      return user.email.toLowerCase() === email.toLowerCase();
    });
  }

  function showAccountAlert(elementId, message) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
  }

  function handleLogin(event) {
    event.preventDefault();
    showAccountAlert('loginAlert', '');
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showAccountAlert('loginAlert', 'Please enter both email and password.');
      return;
    }

    var user = findUserByEmail(email);
    if (!user || user.password !== password) {
      showAccountAlert('loginAlert', 'Email or password is incorrect.');
      return;
    }

    setCurrentUser(user);
    renderAccountPanel('loggedIn');
    try { attachTawkSecure(getCurrentUser()); } catch (e) {}
  }

  function handleRegister(event) {
    event.preventDefault();
    showAccountAlert('registerAlert', '');
    var name = document.getElementById('registerName').value.trim();
    var email = document.getElementById('registerEmail').value.trim();
    var password = document.getElementById('registerPassword').value;

    if (!name || !email || !password) {
      showAccountAlert('registerAlert', 'All fields are required to create an account.');
      return;
    }

    if (findUserByEmail(email)) {
      showAccountAlert('registerAlert', 'An account with that email already exists.');
      return;
    }

    var users = getUsers();
    var newUser = {
      name: name,
      email: email.toLowerCase(),
      password: password,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);
    renderAccountPanel('registered');
    try { attachTawkSecure(getCurrentUser()); } catch (e) {}
  }

  function updateLoginHeader() {
    var profileButton = document.getElementById('profileButton');
    var headerLoginButton = document.getElementById('headerLoginButton');
    var profileMenu = document.getElementById('profileMenu');
    var user = getCurrentUser();
    if (headerLoginButton) {
      headerLoginButton.hidden = !!user;
      headerLoginButton.style.display = user ? 'none' : 'inline-flex';
    }
    if (profileButton) {
      profileButton.hidden = !user;
      profileButton.style.display = user ? 'inline-flex' : 'none';
      if (user) {
        var initials = (user.name || '').split(' ').filter(Boolean).slice(0, 2).map(function (part) { return part.charAt(0).toUpperCase(); }).join('');
        var profileInitials = document.getElementById('profileInitials');
        if (profileInitials) profileInitials.textContent = initials || 'U';
        profileButton.title = 'Logged in as ' + user.name;
      }
    }
    if (profileMenu) {
      profileMenu.hidden = !user;
    }
  }

  function renderAccountPanel() {
    var user = getCurrentUser();
    var loginPanel = document.getElementById('loginPanel');
    var registerPanel = document.getElementById('registerPanel');
    var profileSummary = document.getElementById('profileSummary');
    var accountMessage = document.getElementById('accountMessage');

    if (!loginPanel || !registerPanel || !profileSummary || !accountMessage) return;

    if (user) {
      loginPanel.hidden = true;
      registerPanel.hidden = true;
      profileSummary.hidden = false;
      accountMessage.textContent = 'You are signed in. Manage your membership details and sign out when you are finished.';

      document.getElementById('profileName').textContent = user.name;
      document.getElementById('profileEmail').textContent = user.email;
      document.getElementById('profileCreated').textContent = new Date(user.createdAt).toLocaleDateString();
    } else {
      loginPanel.hidden = false;
      registerPanel.hidden = false;
      profileSummary.hidden = true;
      accountMessage.textContent = 'Use the forms to sign in or create a new account. Your data is stored locally in this browser.';
    }

    showAccountAlert('loginAlert', '');
    showAccountAlert('registerAlert', '');
    updateLoginHeader();
  }

  // ---------- Calendar ----------

  function dateKey(y, m, d) {
    return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }

  function slotsForDate(date) {
    var day = date.getDay();
    if (day === 0) return [];
    if (day === 6) return SATURDAY_SLOTS;
    return WEEKDAY_SLOTS;
  }

  function setupCalendar() {
    document.getElementById('prevMonth').addEventListener('click', function () {
      viewMonth -= 1;
      if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
      renderCalendar();
    });
    document.getElementById('nextMonth').addEventListener('click', function () {
      viewMonth += 1;
      if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
      renderCalendar();
    });
  }

  function renderCalendar() {
    var grid = document.getElementById('calendarGrid');
    var label = document.getElementById('calMonthLabel');
    label.textContent = MONTH_NAMES[viewMonth] + ' ' + viewYear;

    grid.innerHTML = '';

    WEEKDAY_NAMES.forEach(function (wd) {
      var el = document.createElement('div');
      el.className = 'cal-weekday';
      el.textContent = wd;
      grid.appendChild(el);
    });

    var firstDay = new Date(viewYear, viewMonth, 1);
    var startOffset = firstDay.getDay();
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    for (var i = 0; i < startOffset; i++) {
      var empty = document.createElement('div');
      empty.className = 'cal-day empty';
      grid.appendChild(empty);
    }

    var minBookable = new Date(todayDate);
    minBookable.setDate(minBookable.getDate() + 1);

    for (var d = 1; d <= daysInMonth; d++) {
      var thisDate = new Date(viewYear, viewMonth, d);
      thisDate.setHours(0, 0, 0, 0);
      var key = dateKey(viewYear, viewMonth, d);
      var slots = slotsForDate(thisDate);
      var isPast = thisDate < minBookable;
      var isToday = thisDate.getTime() === todayDate.getTime();
      var isAvailable = slots.length > 0 && !isPast;

      var cell = document.createElement('div');
      cell.className = 'cal-day' + (isAvailable ? ' available' : '') + (isPast ? ' past' : '') + (isToday ? ' today' : '') + (key === selectedDateKey ? ' selected' : '');
      cell.textContent = d;
      cell.dataset.date = key;

      if (isAvailable) {
        cell.addEventListener('click', function (e) {
          selectedDateKey = e.currentTarget.dataset.date;
          renderCalendar();
          renderDayTimes(selectedDateKey);
        });
      }

      grid.appendChild(cell);
    }

    if (selectedDateKey) renderDayTimes(selectedDateKey);
  }

  function renderDayTimes(key) {
    var container = document.getElementById('dayTimes');
    var parts = key.split('-').map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    var slots = slotsForDate(date);

    var dateLabel = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

    if (slots.length === 0) {
      container.innerHTML = '<h3>' + dateLabel + '</h3><p>No lessons available this day.</p>';
      return;
    }

    var html = '<h3>' + dateLabel + '</h3><div class="time-slot-list">';
    slots.forEach(function (time) {
      html += '<button type="button" class="time-slot-btn" data-time="' + time + '">' + time + '</button>';
    });
    html += '</div><div class="book-call-note" id="bookCallNote"></div>';

    container.innerHTML = html;

    container.querySelectorAll('.time-slot-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.time-slot-btn').forEach(function (b) {
          b.classList.remove('selected');
        });
        btn.classList.add('selected');

        var note = document.getElementById('bookCallNote');
        note.innerHTML =
          '<p>Reserve <strong>' + dateLabel + ' at ' + btn.dataset.time + '</strong> by calling or texting:</p>' +
          '<a class="btn btn-primary" href="tel:+14693907997">Call +1 (469) 390-7997</a>';
      });
    });
  }
})();
