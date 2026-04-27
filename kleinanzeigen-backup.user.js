// ==UserScript==
// @name          Kleinanzeigen Auto Clone Bot
// @namespace     https://github.com/OldRon1977/Kleinanzeigen-Anzeigen-duplizieren
// @description   Einfaches Duplizieren, Smart Neu-Einstellen und automatische Rotation der aeltesten Anzeigen.
// @icon          http://www.google.com/s2/favicons?domain=www.kleinanzeigen.de
// @copyright     2026
// @license       MIT
// @version       6.6.1
// @author        OldRon1977, ecomcodeLab
// @credits       Original-Script: J05HI https://github.com/J05HI
// @credits       Erweiterte Version: OldRon1977 https://github.com/OldRon1977
// @credits       Developer: ecomcodeLab https://github.com/ecomcodeLab
// @match         https://www.kleinanzeigen.de/*
// @match         https://kleinanzeigen.de/*
// @match         https://*.kleinanzeigen.de/*
// @homepage      https://github.com/OldRon1977/Kleinanzeigen-Anzeigen-duplizieren
// @run-at        document-idle
// @grant         GM_getValue
// @grant         GM_setValue
// ==/UserScript==

(function () {
  'use strict';

  // ============================================================
  // STORAGE HELPERS
  // ============================================================\
  function getVal(key, def) {
    try {
      var v = GM_getValue(key, def);
      return v !== undefined ? v : def;
    } catch (e) {
      var s = localStorage.getItem('ka_' + key);
      return s !== null ? JSON.parse(s) : def;
    }
  }
  function setVal(key, val) {
    try {
      GM_setValue(key, val);
    } catch (e) {
      localStorage.setItem('ka_' + key, JSON.stringify(val));
    }
  }

  // ============================================================\
  // CONFIG
  // ============================================================\
  var CONFIG = {
    NOTIFICATION_TIMEOUT_MS: 4000,
    DELETE_REQUEST_TIMEOUT_MS: 8000,
    DELETE_WAIT_BEFORE_CREATE_MS: 3000,
    INITIAL_RETRY_WAIT_MS: 500,
    MAX_RETRY_WAIT_MS: 8000,
    MAX_BUTTON_RETRIES: 5
  };

  var logger = {
    log: function (msg, data) { console.log('[KA-Bot] ' + msg, data || ''); },
    warn: function (msg, data) { console.warn('[KA-Bot] ' + msg, data || ''); },
    error: function (msg, data) { console.error('[KA-Bot] ' + msg, data || ''); }
  };

  // ============================================================\
  // SETTINGS
  // ============================================================\
  var settings = {
    waitDays: parseInt(getVal('waitDays', 7)),
    adCount: parseInt(getVal('adCount', 3)),
    renewAll: getVal('renewAll', false),
    autoStart: getVal('autoStart', false),
    waitBeforeStart: parseInt(getVal('waitBeforeStart', 10)),
    batchSize: parseInt(getVal('batchSize', 5)),
    batchPauseMin: parseInt(getVal('batchPauseMin', 5))
  };

  function saveSettings() {
    setVal('waitDays', settings.waitDays);
    setVal('adCount', settings.adCount);
    setVal('renewAll', settings.renewAll);
    setVal('autoStart', settings.autoStart);
    setVal('waitBeforeStart', settings.waitBeforeStart);
    setVal('batchSize', settings.batchSize);
    setVal('batchPauseMin', settings.batchPauseMin);
    var nextRun = calcNextRun();
    setVal('nextRunDate', nextRun);
    return nextRun;
  }

  function calcNextRun() {
    var d = new Date();
    d.setDate(d.getDate() + settings.waitDays);
    return d.toISOString().split('T')[0];
  }

  // ============================================================\
  // PAGE DETECTION
  // ============================================================\
  function isLoginPage() {
    var url = window.location.href;
    return (\
      url.includes('login.kleinanzeigen.de') ||
      url.includes('/login') ||
      url.includes('/register') ||
      url.includes('/u/login') ||
      url.includes('/u/signup')
    );
  }

  function isOverviewPage() {
    var url = window.location.href;
    if (url.includes('/m-meine-anzeigen')) return true;
    var h1 = document.querySelector('h1');
    if (h1 && h1.textContent.includes('Meine Anzeigen')) return true;
    return false;
  }

  function isEditPage() {
    var url = window.location.href;
    if (url.includes('/p-anzeige-bearbeiten')) return true;
    if (url.includes('anzeige-aufgeben') && !url.includes('bestaetigung')) return true;
    if (document.querySelector('form') && findSaveButton()) return true;
    return false;
  }

  function isSuccessPage() {
    var url = window.location.href;
    if (url.includes('p-anzeige-aufgeben-bestaetigung')) return true;
    if (url.includes('bestaetigung')) return true;
    if (url.includes('confirmation') || url.includes('success')) return true;
    var h1 = document.querySelector('h1');
    if (h1) {
      var t = h1.textContent.toLowerCase();
      if (t.includes('geschafft') || t.includes('online') || t.includes('eingestellt')) return true;
    }
    var body = document.body ? document.body.innerText : '';
    if (body.includes('Anzeige geht bald online') || body.includes('erfolgreich eingestellt')) return true;
    return false;
  }

  // ============================================================\
  // UTILITIES
  // ============================================================\
  var delay = function (ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); };

  function getExpBackoff(retryCount) {
    return Math.min(Math.pow(2, retryCount - 1) * CONFIG.INITIAL_RETRY_WAIT_MS, CONFIG.MAX_RETRY_WAIT_MS);
  }

  function waitForElement(finderFn, timeoutMs) {
    return new Promise(function (resolve) {
      var el = finderFn();
      if (el) return resolve(el);
      var interval = setInterval(function () {
        var found = finderFn();
        if (found) { clearInterval(interval); resolve(found); }
      }, 300);
      setTimeout(function () { clearInterval(interval); resolve(null); }, timeoutMs);
    });
  }

  // ============================================================\
  // STYLES \u2014 single injection, one ID
  // ============================================================\
  function ensureStyles() {
    if (document.getElementById('ka-bot-styles')) return;
    var style = document.createElement('style');
    style.id = 'ka-bot-styles';
    style.textContent = [\
      '@keyframes ka-spin{to{transform:rotate(360deg)}}',\
      '.ka-spinner{position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:2147483640}',\
      '.ka-spinner>div{width:40px;height:40px;border:4px solid #f3f3f3;border-top-color:#3498db;border-radius:50%;animation:ka-spin 1s linear infinite}',\
      '.ka-toast{position:fixed;top:20px;right:20px;padding:11px 18px;border-radius:6px;font-size:13px;font-weight:500;color:#fff;z-index:2147483645;box-shadow:0 4px 12px rgba(0,0,0,.2);font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif}',\
      '.ka-toast.error{background:#c0392b}',\
      '.ka-toast.success{background:#27ae60}',\
      '.ka-toast.info{background:#2980b9}',\
      '#ka-floating-toolbar{position:fixed;bottom:80px;right:20px;z-index:2147483644;display:flex;gap:8px;padding:10px 14px;background:#1a1a2e;border:1px solid #2d2d4e;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.5)}',\
      '.ka-tb-btn{padding:8px 16px;cursor:pointer;border:1px solid #3a3a6a;border-radius:5px;font-size:13px;font-weight:500;color:#e0e0e0;background:#16213e;transition:background .2s}',\
      '.ka-tb-btn:hover{background:#0f3460}',\
      '.ka-tb-btn:disabled{opacity:.4;cursor:not-allowed}',\
      '.ka-overview-btn{margin-left:8px;padding:3px 9px;cursor:pointer;border:1px solid #2d2d4e;border-radius:4px;background:#16213e;color:#a0a0c0;font-size:11px;vertical-align:middle;transition:background .2s}',\
      '.ka-overview-btn:hover{background:#0f3460;color:#e0e0e0}',\
      '/* ---- PANEL ---- */',\
      '#ka-panel{position:fixed;bottom:20px;right:20px;z-index:2147483646;width:300px;background:#1a1a2e;border:1px solid #2d2d4e;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.55);font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;color:#e0e0e0;font-size:13px;overflow:hidden}',\
      '#ka-ph{display:flex;align-items:center;justify-content:space-between;padding:9px 13px;background:#16213e;border-bottom:1px solid #2d2d4e;cursor:move;user-select:none}',\
      '#ka-ph-title{font-weight:700;font-size:13px;color:#a0a0c0;letter-spacing:.8px}',\
      '#ka-ph-min{background:none;border:none;color:#a0a0c0;cursor:pointer;font-size:18px;line-height:1;padding:0 2px}',\
      '#ka-ph-min:hover{color:#e0e0e0}',\
      '#ka-pb{padding:13px;display:flex;flex-direction:column;gap:9px}',\
      '.ka-row{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:6px}',\
      '.ka-row label{color:#8888aa;font-size:11px}',\
      '.ka-inp{width:100%;padding:5px 7px;background:#0f3460;border:1px solid #2d2d4e;border-radius:5px;color:#e0e0e0;font-size:13px;text-align:center;box-sizing:border-box}',\
      '.ka-inp:focus{outline:none;border-color:#4a4aaa}',\
      '.ka-rfl{display:flex;align-items:center;justify-content:space-between}',\
      '.ka-rfl label{color:#8888aa;font-size:11px}',\
      '.ka-chk{width:15px;height:15px;cursor:pointer;accent-color:#4a4aaa}',\
      '.ka-tog{width:34px;height:18px;background:#2d2d4e;border-radius:9px;position:relative;cursor:pointer;border:none;transition:background .2s;flex-shrink:0}',\
      '.ka-tog.on{background:#4a4aaa}',\
      '.ka-tog::after{content:\"\";position:absolute;top:2px;left:2px;width:14px;height:14px;background:#e0e0e0;border-radius:50%;transition:left .2s}',\
      '.ka-tog.on::after{left:18px}',\
      '.ka-divider{border:none;border-top:1px solid #2d2d4e;margin:2px 0}',\
      '.ka-meta{display:flex;align-items:center;justify-content:space-between}',\
      '.ka-meta label{color:#8888aa;font-size:11px}',\
      '.ka-meta span{font-size:11px;color:#6060a0}',\
      '.ka-btn-start{padding:8px;background:#3a3aaa;border:none;border-radius:6px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s;width:100%}',\
      '.ka-btn-start:hover{background:#4a4abb}',\
      '.ka-btn-stop{padding:8px;background:#7a2020;border:none;border-radius:6px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s;width:100%}',\
      '.ka-btn-stop:hover{background:#922626}',\
      '.ka-btn-save{padding:7px;background:#1e3a1e;border:none;border-radius:6px;color:#80b080;font-size:11px;font-weight:600;cursor:pointer;transition:background .2s;width:100%}',\
      '.ka-btn-save:hover{background:#264a26}',\
      '#ka-log{background:#0d0d1a;border-radius:5px;padding:7px;max-height:90px;overflow-y:auto;font-size:10px;color:#5050a0;font-family:monospace;line-height:1.4}',\
      '/* ---- MINIMIZED PILL ---- */',\
      '#ka-pill{position:fixed;bottom:20px;right:20px;z-index:2147483646;background:#1a1a2e;border:1px solid #2d2d4e;border-radius:8px;padding:7px 13px;cursor:pointer;color:#8888aa;font-size:11px;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.4);display:none;user-select:none}',\
      '#ka-pill:hover{background:#16213e;color:#c0c0e0}',\
      '/* ---- COUNTDOWN BANNER ---- */',\
      '.ka-banner{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#1a1a2e;border:1px solid #4a4aaa;border-radius:10px;padding:18px 26px;color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.6);text-align:center;min-width:300px}',\
      '.ka-banner h3{margin:0 0 6px;color:#a0a0ff;font-size:14px;font-weight:700}',\
      '.ka-banner p{margin:0 0 10px;font-size:12px;color:#8888aa}',\
      '.ka-banner .ka-cd{font-size:32px;font-weight:700;color:#e0e0ff;margin:6px 0}',\
      '.ka-banner-cancel{padding:7px 20px;background:#7a2020;border:none;border-radius:5px;color:#fff;font-size:12px;cursor:pointer;margin-top:6px}',\
      '.ka-banner-cancel:hover{background:#922626}'\
    ].join('');\
    document.head.appendChild(style);\
  }\
\
  // ============================================================\
  // NOTIFICATION & SPINNER\
  // ============================================================\
  function showToast(msg, type) {\
    type = type || 'info';\
    ensureStyles();\
    document.querySelectorAll('.ka-toast').forEach(function (n) { n.remove(); });\
    var n = document.createElement('div');\
    n.className = 'ka-toast ' + type;\
    n.textContent = msg;\
    document.body.appendChild(n);\
    setTimeout(function () { n.remove(); }, CONFIG.NOTIFICATION_TIMEOUT_MS);\
  }\
\
  function showSpinner(show) {\
    var ex = document.querySelector('.ka-spinner');\
    if (ex) ex.remove();\
    if (show === false) return;\
    ensureStyles();\
    var s = document.createElement('div');\
    s.className = 'ka-spinner';\
    var inner = document.createElement('div');\
    s.appendChild(inner);\
    document.body.appendChild(s);\
  }\
\
  // ============================================================\
  // CSRF & DELETE (from reference script)\
  // ============================================================\
  function getCsrfToken() {\
    var meta = document.querySelector('meta[name=\"_csrf\"], meta[name=\"csrf-token\"]');\
    if (meta) {\
      var t = meta.getAttribute('content');\
      if (t) return t;\
    }\
    var inp = document.querySelector('input[name=\"_csrf\"]');\
    if (inp && inp.value) return inp.value;\
    throw new Error('CSRF-Token nicht gefunden');\
  }\
\
  async function deleteAd(adId) {\
    if (!adId || !/^\\d{1,20}$/.test(adId)) throw new Error('Ungueltige Anzeigen-ID');\
    var controller = new AbortController();\
    var timeout = setTimeout(function () { controller.abort(); }, CONFIG.DELETE_REQUEST_TIMEOUT_MS);\
    try {\
      logger.log('Loesche Anzeige: ' + adId);\
      var response = await fetch('https://www.kleinanzeigen.de/m-anzeigen-loeschen.json?ids=' + adId, {\
        method: 'POST',\
        headers: {\
          'accept': 'application/json',\
          'x-csrf-token': getCsrfToken(),\
          'content-type': 'application/json'\
        },\
        signal: controller.signal\
      });\
      clearTimeout(timeout);\
      if (!response.ok) {\
        if (response.status === 401 || response.status === 403) throw new Error('Sitzung abgelaufen - bitte neu einloggen.');\
        throw new Error('HTTP ' + response.status);\
      }\
      logger.log('Anzeige geloescht: ' + adId);\
      return await response.json();\
    } catch (err) {\
      clearTimeout(timeout);\
      if (err.name === 'AbortError') throw new Error('Timeout beim Loeschen');\
      throw err;\
    }\
  }\
\
  // ============================================================\
  // FIND SAVE BUTTON\
  // ============================================================\
  function findSaveButton() {\
    var btns = Array.from(document.querySelectorAll('button, input[type=\"submit\"]'));\
    for (var i = 0; i < btns.length; i++) {\
      var text = btns[i].textContent.trim();\
      if (text.startsWith('Anzeige speichern') || text === 'Speichern' || btns[i].value === 'Speichern') return btns[i];\
    }\
    return null;\
  }\
\
  // ============================================================\
  // DUPLICATE (from reference script)\
  // ============================================================\
  async function duplicateAd() {\
    try {\
      logger.log('Starte Duplikat-Prozess');\
      showSpinner(true);\
      var saveBtn = await waitForElement(findSaveButton, 10000);\
      if (!saveBtn) throw new Error('Speichern-Button nicht gefunden');\
      var adIdInput = await waitForElement(function () {\
        return document.querySelector('input[name=\"adId\"], #postad-id, input[name=\"postad-id\"]');\
      }, 10000);\
      if (adIdInput) {\
        adIdInput.removeAttribute('name');\
        adIdInput.value = '';\
      }\
      showToast('Anzeige wird dupliziert...');\
      saveBtn.click();\
    } catch (err) {\
      logger.error('Duplizieren Fehler', err);\
      showToast('Fehler: ' + err.message, 'error');\
      showSpinner(false);\
      document.querySelectorAll('.ka-tb-btn').forEach(function (b) { b.disabled = false; });\
    }\
  }\
\
  // ============================================================\
  // SMART REPUBLISH (from reference script)\
  // ============================================================\
  async function smartRepublish() {\
    try {\
      logger.log('Starte Smart-Republish');\
      showSpinner(true);\
      var urlMatch = window.location.search.match(/adId=(\\d+)/);\
      if (!urlMatch) throw new Error('Keine Anzeigen-ID in URL');\
      var originalId = urlMatch[1];\
\
      showToast('Original wird geloescht...');\
      var deleteFailed = false;\
      try {\
        await deleteAd(originalId);\
        await delay(CONFIG.DELETE_WAIT_BEFORE_CREATE_MS);\
      } catch (err) {\
        deleteFailed = true;\
        logger.warn('Loeschung fehlgeschlagen', err);\
        showToast('Loeschung fehlgeschlagen - erstelle trotzdem neu.', 'error');\
        await delay(1500);\
      }\
\
      var saveBtn = await waitForElement(findSaveButton, 10000);\
      if (!saveBtn) throw new Error('Speichern-Button nicht gefunden');\
      var adIdInput = document.querySelector('input[name=\"adId\"], #postad-id, input[name=\"postad-id\"]');\
      if (adIdInput) {\
        adIdInput.removeAttribute('name');\
        adIdInput.value = '';\
      }\
      showToast(deleteFailed ? 'Erstelle neue Anzeige (Original bleibt kurz)...' : 'Erstelle neue Anzeige...');\
      saveBtn.click();\
    } catch (err) {\
      logger.error('Smart-Republish Fehler', err);\
      showToast('Fehler: ' + err.message, 'error');\
      showSpinner(false);\
      document.querySelectorAll('.ka-tb-btn').forEach(function (b) { b.disabled = false; });\
    }\
  }\
\
  // ============================================================\
  // FLOATING TOOLBAR (edit page)\
  // ============================================================\
  var toolbarRetries = 0;\
  function createEditToolbar() {\
    if (document.getElementById('ka-floating-toolbar')) return;\
    if (!document.querySelector('form')) {\
      if (toolbarRetries < CONFIG.MAX_BUTTON_RETRIES) {\
        toolbarRetries++;\
        setTimeout(createEditToolbar, getExpBackoff(toolbarRetries));\
      }\
      return;\
    }\
    ensureStyles();\
    var toolbar = document.createElement('div');\
    toolbar.id = 'ka-floating-toolbar';\
\
    var dupBtn = document.createElement('button');\
    dupBtn.type = 'button';\
    dupBtn.className = 'ka-tb-btn';\
    dupBtn.textContent = 'Duplizieren';\
    dupBtn.title = 'Kopie erstellen, Original bleibt';\
\
    var smartBtn = document.createElement('button');\
    smartBtn.type = 'button';\
    smartBtn.className = 'ka-tb-btn';\
    smartBtn.textContent = 'Smart neu einstellen';\
    smartBtn.title = 'Original loeschen & neu einstellen';\
\
    dupBtn.onclick = function (e) {\
      e.preventDefault();\
      dupBtn.disabled = true; smartBtn.disabled = true;\
      duplicateAd();\
    };\
    smartBtn.onclick = function (e) {\
      e.preventDefault();\
      if (confirm('Original-Anzeige wird geloescht und neu eingestellt.\\nAlle Bilder bleiben erhalten.\\n\\nFortfahren?')) {\
        dupBtn.disabled = true; smartBtn.disabled = true;\
        smartRepublish();\
      }\
    };\
\
    toolbar.appendChild(dupBtn);\
    toolbar.appendChild(smartBtn);\
    document.body.appendChild(toolbar);\
    logger.log('Toolbar erstellt');\
  }\
\
  // ============================================================\
  // OVERVIEW SMART BUTTONS\
  // ============================================================\
  var MARKER = 'data-ka-btn';\
  function addOverviewButtons() {\
    document.querySelectorAll('a[href*=\"/p-anzeige-bearbeiten.html?adId=\"]').forEach(function (link) {\
      if (link.hasAttribute(MARKER)) return;\
      link.setAttribute(MARKER, '1');\
      var m = link.getAttribute('href').match(/adId=(\\d+)/);\
      if (!m || !m[1]) return;\
      var adId = m[1];\
      var btn = document.createElement('button');\
      btn.type = 'button';\
      btn.className = 'ka-overview-btn';\
      btn.textContent = 'Smart neu';\
      btn.title = 'Original loeschen & neu einstellen';\
      btn.onclick = function (e) {\
        e.preventDefault(); e.stopPropagation();\
        btn.textContent = 'Geoeffnet...';\
        btn.disabled = true;\
        window.open('https://www.kleinanzeigen.de/p-anzeige-bearbeiten.html?adId=' + adId + '#smartRepublish', '_blank');\
      };\
      link.after(btn);\
    });\
  }\
\
  // ============================================================\
  // RUN STATE\
  // ============================================================\
  var runQueue = [];\
  var isRunning = false;\
  var batchCount = 0;\
  var stopRequested = false;\
\
  function setStatus(msg) {\
    logger.log('Status: ' + msg);\
    var el = document.getElementById('ka-status-val');\
    if (el) el.textContent = msg;\
    var logEl = document.getElementById('ka-log');\
    if (logEl) {\
      var now = new Date();\
      var ts = '[' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0') + '] ' + msg + '\\n';\
      logEl.textContent += ts;\
      logEl.scrollTop = logEl.scrollHeight;\
    }\
  }\
\
  function buildQueue() {\
    var ids = [];\
    document.querySelectorAll('a[href*=\"p-anzeige-bearbeiten.html?adId=\"]').forEach(function (a) {\
      var m = a.href.match(/adId=(\\d+)/);\
      if (m && m[1] && !ids.includes(m[1])) ids.push(m[1]);\
    });\
    if (ids.length === 0) { setStatus('Keine Anzeigen gefunden'); return []; }\
    if (settings.renewAll) { setStatus('Queue: alle ' + ids.length + ' Anzeigen'); return ids; }\
    var count = Math.min(settings.adCount, ids.length);\
    setStatus('Queue: ' + count + ' von ' + ids.length + ' Anzeigen');\
    return ids.slice(0, count);\
  }\
\
  async function processQueue() {\
    if (stopRequested) {\
      setStatus('Gestoppt');\
      isRunning = false;\
      setVal('isRunning', false);\
      stopRequested = false;\
      rebuildPanel();\
      return;\
    }\
    if (runQueue.length === 0) {\
      setStatus('Fertig - alle Anzeigen erneuert');\
      isRunning = false;\
      setVal('isRunning', false);\
      var nextRun = calcNextRun();\
      setVal('nextRunDate', nextRun);\
      setVal('lastAutostartRun', new Date().toISOString().split('T')[0]);\
      rebuildPanel();\n      setTimeout(function () { window.location.href = 'https://www.kleinanzeigen.de/m-meine-anzeigen.html'; }, 2000);\
      return;\
    }\
    if (batchCount >= settings.batchSize) {\
      var pauseMs = settings.batchPauseMin * 60 * 1000;\
      setStatus('Batch-Pause ' + settings.batchPauseMin + ' Min...');\
      batchCount = 0;\
      await delay(pauseMs);\
    }\
    var adId = runQueue.shift();\
    setVal('runQueue', JSON.stringify(runQueue));\
    setVal('batchCount', batchCount + 1);\
    batchCount++;\
    setStatus('Navigiere zu Anzeige ' + adId);\
    await delay(1500);\
    window.location.href = 'https://www.kleinanzeigen.de/p-anzeige-bearbeiten.html?adId=' + adId + '#autoRepublish';\
  }\
\
  async function autoRepublishCurrent() {\
    setStatus('Auto-Republish gestartet...');\
    showSpinner(true);\
    try {\
      var urlMatch = window.location.search.match(/adId=(\\d+)/);\
      if (!urlMatch) throw new Error('Keine Ad-ID in URL');\
      var originalId = urlMatch[1];\
\
      setStatus('Loesche Original ' + originalId + '...');\
      var deleteFailed = false;\
      try {\
        await deleteAd(originalId);\
        await delay(CONFIG.DELETE_WAIT_BEFORE_CREATE_MS);\
        setStatus('Original geloescht');\n      } catch (err) {\
        deleteFailed = true;\
        setStatus('Loeschung fehlgeschlagen, erstelle trotzdem...');\
        await delay(2000);\
      }\
\
      var saveBtn = await waitForElement(findSaveButton, 15000);\
      if (!saveBtn) throw new Error('Speichern-Button nicht gefunden');\
\
      var adIdInput = document.querySelector('input[name=\"adId\"], #postad-id, input[name=\"postad-id\"]');\
      if (adIdInput) { adIdInput.removeAttribute('name'); adIdInput.value = ''; }\
\
      setStatus('Klicke Speichern...');\
      showToast(deleteFailed ? 'Erstelle neu (Original bleibt kurz)...' : 'Erstelle neue Anzeige...');\
      await delay(1000);\
      saveBtn.click();\
      setStatus('Gespeichert, warte auf Bestaetigung...');\
    } catch (err) {\
      logger.error('Auto-Republish Fehler: ' + err.message);\
      setStatus('Fehler: ' + err.message);\
      showSpinner(false);\
      await delay(3000);\
      continueQueue();\
    }\
  }\
\
  function continueQueue() {\
    runQueue = JSON.parse(getVal('runQueue', '[]'));\
    batchCount = parseInt(getVal('batchCount', 0));\
    isRunning = getVal('isRunning', false);\
    if (isRunning && runQueue.length > 0) {\
      setStatus('Weiter mit naechster Anzeige...');\
      setTimeout(processQueue, 2000);\
    } else {\
      setStatus('Fertig');\
      isRunning = false;\
      setVal('isRunning', false);\
      if (isRunning) {\
        setVal('nextRunDate', calcNextRun());\
        setVal('lastAutostartRun', new Date().toISOString().split('T')[0]);\
      }\
    }\
  }\
\
  function stopRun() {\
    stopRequested = true;\
    isRunning = false;\
    runQueue = [];\
    setVal('isRunning', false);\
    setVal('runQueue', '[]');\
    setVal('batchCount', 0);\
    setStatus('Gestoppt');\
    showToast('Auto-Run gestoppt', 'error');\
    rebuildPanel();\
  }\
\
  // ============================================================\
  // START WITH COUNTDOWN (10s, cancellable)\
  // ============================================================\
  function startRunWithCountdown() {\
    if (!isOverviewPage()) {\
      window.location.href = 'https://www.kleinanzeigen.de/m-meine-anzeigen.html';\
      return;\
    }\
    showCountdownBanner(\
      settings.waitBeforeStart || 10,\
      'Manueller Start',\
      'Bot startet in...',\
      function () {\
        // Confirmed\
        runQueue = buildQueue();\
        if (runQueue.length === 0) return;\
        isRunning = true;\
        batchCount = 0;\
        stopRequested = false;\
        setVal('runQueue', JSON.stringify(runQueue));\
        setVal('batchCount', 0);\
        setVal('isRunning', true);\
        rebuildPanel();\
        processQueue();\
      },\
      function () {\
        setStatus('Start abgebrochen');\
      }\
    );\
  }\
\
  // ============================================================\
  // COUNTDOWN BANNER (shared for manual start + autostart)\
  // ============================================================\
  function showCountdownBanner(seconds, title, subtitle, onConfirm, onCancel) {\
    ensureStyles();\
    document.querySelectorAll('.ka-banner').forEach(function (b) { b.remove(); });\
\
    var banner = document.createElement('div');\
    banner.className = 'ka-banner';\
\
    var h3 = document.createElement('h3');\
    h3.textContent = title;\
    banner.appendChild(h3);\
\
    var p = document.createElement('p');\
    p.textContent = subtitle;\
    banner.appendChild(p);\
\
    var cd = document.createElement('div');\
    cd.className = 'ka-cd';\
    cd.textContent = seconds + 's';\
    banner.appendChild(cd);\
\
    var cancelBtn = document.createElement('button');\
    cancelBtn.className = 'ka-banner-cancel';\
    cancelBtn.textContent = 'Abbrechen';\
    cancelBtn.onclick = function () {\
      clearInterval(timer);\
      banner.remove();\
      onCancel();\
    };\
    banner.appendChild(cancelBtn);\
    document.body.appendChild(banner);\
\
    var remaining = seconds;\
    var timer = setInterval(function () {\
      remaining--;\
      cd.textContent = remaining + 's';\
      if (remaining <= 0) {\
        clearInterval(timer);\
        banner.remove();\
        onConfirm();\
      }\
    }, 1000);\
  }\
\
  // ============================================================\
  // PANEL \u2014 single instance, rebuilt when state changes\
  // ============================================================\
  function removePanel() {\
    var p = document.getElementById('ka-panel');\
    if (p) p.remove();\
    var pill = document.getElementById('ka-pill');\
    if (pill) pill.remove();\
  }\
\
  function rebuildPanel() {\
    removePanel();\
    buildPanel();\
  }\
\
  function buildPanel() {\
    ensureStyles();\
    if (document.getElementById('ka-panel')) return;\
\
    var minimized = getVal('panelMinimized', false);\
    var running = getVal('isRunning', false);\
\
    // ---- Minimized pill ----\
    var pill = document.createElement('div');\
    pill.id = 'ka-pill';\
    pill.style.display = minimized ? 'block' : 'none';\
    var nextForPill = settings.autoStart ? (getVal('nextRunDate', '-') || '-') : '-';\
    pill.textContent = 'KA Bot  |  Naechster Run: ' + nextForPill;\
    pill.onclick = function () {\
      pill.style.display = 'none';\
      panel.style.display = 'block';\
      setVal('panelMinimized', false);\
    };\
    document.body.appendChild(pill);\
\
    // ---- Panel ----\
    var panel = document.createElement('div');\
    panel.id = 'ka-panel';\
    panel.style.display = minimized ? 'none' : 'block';\
\
    // Header\
    var ph = document.createElement('div');\
    ph.id = 'ka-ph';\
    var phTitle = document.createElement('span');\
    phTitle.id = 'ka-ph-title';\n    phTitle.textContent = 'KA BOT';\n    var phMin = document.createElement('button');\n    phMin.id = 'ka-ph-min';\n    phMin.textContent = '\\u2212';\n    phMin.title = 'Minimieren';\n    phMin.onclick = function () {\n      panel.style.display = 'none';\n      var nd = settings.autoStart ? (getVal('nextRunDate', '-') || '-') : '-';\n      pill.textContent = 'KA Bot  |  Naechster Run: ' + nd;\n      pill.style.display = 'block';\n      setVal('panelMinimized', true);\n    };\n    ph.appendChild(phTitle);\n    ph.appendChild(phMin);\n    panel.appendChild(ph);\n\n    // Body\n    var pb = document.createElement('div');\n    pb.id = 'ka-pb';\n\n    // Row: Warte Tage + Anzahl\n    var r1 = document.createElement('div');\n    r1.className = 'ka-row';\n    r1.appendChild(mkLabel('Warte (Tage)'));\n    r1.appendChild(mkInp('ka-in-days', settings.waitDays, 1));\n    r1.appendChild(mkLabel('Anzahl Anzeigen'));\n    r1.appendChild(mkInp('ka-in-count', settings.adCount, 1));\n    pb.appendChild(r1);\n\n    // Row: Batch Size + Pause\n    var r2 = document.createElement('div');\n    r2.className = 'ka-row';\n    r2.appendChild(mkLabel('Batch Groesse'));\n    r2.appendChild(mkInp('ka-in-batch', settings.batchSize, 1));\n    r2.appendChild(mkLabel('Pause (Min)'));\n    r2.appendChild(mkInp('ka-in-pause', settings.batchPauseMin, 1));\n    pb.appendChild(r2);\n\n    // Alle erneuern\n    pb.appendChild(mkRowFull('Alle Anzeigen erneuern', mkChk('ka-in-all', settings.renewAll)));\n\n    // Auto-Start toggle\n    var autoTog = document.createElement('button');\n    autoTog.className = 'ka-tog' + (settings.autoStart ? ' on' : '');\n    autoTog.id = 'ka-in-auto';\n    autoTog.title = 'Auto-Start ein/aus';\n    autoTog.onclick = function () {\n      settings.autoStart = !settings.autoStart;\n      autoTog.className = 'ka-tog' + (settings.autoStart ? ' on' : '');\n      updateNextVal();\n    };\n    pb.appendChild(mkRowFull('Auto-Start', autoTog));\n\n    // Warte vor Start\n    var waitInp = mkInp('ka-in-wait', settings.waitBeforeStart, 5);\n    waitInp.style.width = '70px';\n    pb.appendChild(mkRowFull('Warte vor Start (s)', waitInp));\n\n    // Divider\n    var div1 = document.createElement('hr');\n    div1.className = 'ka-divider';\n    pb.appendChild(div1);\n\n    // Next Run\n    var nextRow = document.createElement('div');\n    nextRow.className = 'ka-meta';\n    var nextLbl = document.createElement('label');\n    nextLbl.textContent = 'Naechster Run';\n    var nextVal = document.createElement('span');\n    nextVal.id = 'ka-next-val';\n    nextVal.textContent = settings.autoStart ? (getVal('nextRunDate', '-') || '-') : '-';\n    nextRow.appendChild(nextLbl);\n    nextRow.appendChild(nextVal);\n    pb.appendChild(nextRow);\n\n    // Status\n    var statusRow = document.createElement('div');\n    statusRow.className = 'ka-meta';\n    var statusLbl = document.createElement('label');\n    statusLbl.textContent = 'Status';\n    var statusVal = document.createElement('span');\n    statusVal.id = 'ka-status-val';\n    statusVal.textContent = running ? 'Laeuft...' : 'Bereit';\n    statusRow.appendChild(statusLbl);\n    statusRow.appendChild(statusVal);\n    pb.appendChild(statusRow);\n\n    // Divider\n    var div2 = document.createElement('hr');\n    div2.className = 'ka-divider';\n    pb.appendChild(div2);\n\n    // Start / Stop\n    if (running) {\n      var stopBtn = document.createElement('button');\n      stopBtn.className = 'ka-btn-stop';\n      stopBtn.textContent = 'STOP';\n      stopBtn.onclick = stopRun;\n      pb.appendChild(stopBtn);\n    } else {\n      var startBtn = document.createElement('button');\n      startBtn.className = 'ka-btn-start';\n      startBtn.id = 'ka-start-btn';\n      startBtn.textContent = 'Starten';\n      startBtn.onclick = startRunWithCountdown;\n      pb.appendChild(startBtn);\n    }\n\n    // Save\n    var saveBtn2 = document.createElement('button');\n    saveBtn2.className = 'ka-btn-save';\n    saveBtn2.textContent = 'Einstellungen speichern';\n    saveBtn2.onclick = function () {\n      settings.waitDays = parseInt(document.getElementById('ka-in-days').value) || 7;\n      settings.adCount = parseInt(document.getElementById('ka-in-count').value) || 3;\n      settings.renewAll = document.getElementById('ka-in-all').checked;\n      settings.autoStart = document.getElementById('ka-in-auto').classList.contains('on');\n      settings.waitBeforeStart = parseInt(document.getElementById('ka-in-wait').value) || 10;\n      settings.batchSize = parseInt(document.getElementById('ka-in-batch').value) || 5;\n      settings.batchPauseMin = parseInt(document.getElementById('ka-in-pause').value) || 5;\n      var nr = saveSettings();\n      setStatus('Gespeichert. Naechster Run: ' + nr);\n      updateNextVal();\n    };\n    pb.appendChild(saveBtn2);\n\n    // Log\n    var logDiv = document.createElement('div');\n    logDiv.id = 'ka-log';\n    pb.appendChild(logDiv);\n\n    panel.appendChild(pb);\n    document.body.appendChild(panel);\n\n    makeDraggable(panel, ph);\n\n    function updateNextVal() {\n      var el = document.getElementById('ka-next-val');\n      if (!el) return;\n      el.textContent = settings.autoStart ? (getVal('nextRunDate', '-') || '-') : '-';\n    }\n  }\n\n  // ---- helpers ----\n  function mkLabel(txt) {\n    var l = document.createElement('label');\n    l.textContent = txt;\n    return l;\n  }\n  function mkInp(id, val, min) {\n    var i = document.createElement('input');\n    i.type = 'number';\n    i.id = id;\n    i.className = 'ka-inp';\n    i.min = String(min);\n    i.value = val;\n    return i;\n  }\n  function mkChk(id, checked) {\n    var c = document.createElement('input');\n    c.type = 'checkbox';\n    c.id = id;\n    c.className = 'ka-chk';\n    c.checked = checked;\n    return c;\n  }\n  function mkRowFull(labelTxt, control) {\n    var row = document.createElement('div');\n    row.className = 'ka-rfl';\n    row.appendChild(mkLabel(labelTxt));\n    row.appendChild(control);\n    return row;\n  }\n\n  function makeDraggable(el, handle) {\n    var ox = 0, oy = 0, sx = 0, sy = 0;\n    handle.onmousedown = function (e) {\n      e.preventDefault();\n      sx = e.clientX; sy = e.clientY;\n      document.onmouseup = function () { document.onmouseup = null; document.onmousemove = null; };\n      document.onmousemove = function (e) {\n        ox = sx - e.clientX; oy = sy - e.clientY;\n        sx = e.clientX; sy = e.clientY;\n        el.style.top = (el.offsetTop - oy) + 'px';\n        el.style.left = (el.offsetLeft - ox) + 'px';\n        el.style.bottom = 'auto'; el.style.right = 'auto';\n      };\n    };\n  }\n\n  // ============================================================\n  // AUTOSTART CHECK (once per page load)\n  // ============================================================\n  var autoStartChecked = false;\n\n  function checkAutoStart() {\n    if (autoStartChecked) return;\n    autoStartChecked = true;\n    if (!settings.autoStart) return;\n    if (getVal('isRunning', false)) return;\n\n    var scheduledDateStr = getVal('nextRunDate', '');\n    if (!scheduledDateStr) return;\n\n    var scheduledMidnight = new Date(scheduledDateStr + 'T00:00:00');\n    if (isNaN(scheduledMidnight.getTime())) return;\n\n    var now = new Date();\n    if (now < scheduledMidnight) return;\n\n    var lastRun = getVal('lastAutostartRun', '');\n    var todayStr = now.toISOString().split('T')[0];\n    if (lastRun === todayStr) return;\n\n    logger.log('Auto-Start faellig: ' + scheduledDateStr);\n    var waitSec = settings.waitBeforeStart || 10;\n\n    showCountdownBanner(\n      waitSec,\n      'KA Bot - Auto-Start',\n      'Geplanter Lauf wird gestartet...',\n      function () {\n        setVal('lastAutostartRun', todayStr);\n        if (!isOverviewPage()) {\n          setVal('pendingAutoRun', true);\n          window.location.href = 'https://www.kleinanzeigen.de/m-meine-anzeigen.html';\n        } else {\n          setVal('pendingAutoRun', false);\n          runQueue = buildQueue();\n          if (runQueue.length === 0) return;\n          isRunning = true; batchCount = 0; stopRequested = false;\n          setVal('runQueue', JSON.stringify(runQueue));\n          setVal('batchCount', 0);\n          setVal('isRunning', true);\n          rebuildPanel();\n          processQueue();\n        }\n      },\n      function () {\n        setStatus('Auto-Start abgebrochen');\n        logger.log('Auto-Start manuell abgebrochen');\n      }\n    );\n  }\n\n  // ============================================================\n  // INIT\n  // ============================================================\n  function init() {\n    if (isLoginPage()) return;\n\n    ensureStyles();\n    var hash = window.location.hash;\n\n    // --- Edit page ---\n    if (isEditPage()) {\n      if (hash === '#smartRepublish') {\n        logger.log('Smart Republish via Hash');\n        setTimeout(smartRepublish, 1500);\n        return;\n      }\n      if (hash === '#duplicate') {\n        logger.log('Duplizieren via Hash');\n        setTimeout(duplicateAd, 1500);\n        return;\n      }\n      if (hash === '#autoRepublish') {\n        logger.log('Auto-Republish via Queue');\n        setTimeout(function () {\n          buildPanel();\n          setStatus('Auto-Republish...');\n          autoRepublishCurrent();\n        }, 1500);\n        return;\n      }\n      // Normal edit: toolbar only (no extra panel to avoid overlap)\n      setTimeout(createEditToolbar, 1500);\n      return;\n    }\n\n    // --- Success page ---\n    if (isSuccessPage()) {\n      logger.log('Erfolgsseite erkannt');\n      var pendingQ = JSON.parse(getVal('runQueue', '[]'));\n      if (pendingQ.length > 0 && getVal('isRunning', false)) {\n        runQueue = pendingQ;\n        batchCount = parseInt(getVal('batchCount', 0));\n        isRunning = true;\n        buildPanel();\n        setStatus('Weiter mit naechster Anzeige...');\n        setTimeout(processQueue, 3000);\n      } else {\n        buildPanel();\n        setStatus('Fertig');\n      }\n      return;\n    }\n\n    // --- Overview page ---\n    if (isOverviewPage()) {\n      if (getVal('pendingAutoRun', false) && !getVal('isRunning', false)) {\n        setVal('pendingAutoRun', false);\n        buildPanel();\n        logger.log('Pending Auto-Run auf Uebersicht');\n        setTimeout(function () {\n          runQueue = buildQueue();\n          if (runQueue.length === 0) return;\n          isRunning = true; batchCount = 0; stopRequested = false;\n          setVal('runQueue', JSON.stringify(runQueue));\n          setVal('batchCount', 0);\n          setVal('isRunning', true);\n          rebuildPanel();\n          processQueue();\n        }, 2000);\n        return;\n      }\n\n      buildPanel();\n\n      if (getVal('isRunning', false)) {\n        runQueue = JSON.parse(getVal('runQueue', '[]'));\n        batchCount = parseInt(getVal('batchCount', 0));\n        isRunning = true;\n        setStatus('Laeuft...');\n        setTimeout(processQueue, 2000);\n        return;\n      }\n\n      // Add smart buttons + observe DOM changes\n      setTimeout(addOverviewButtons, 1500);\n      var obs_debounce;\n      var obs = new MutationObserver(function () {\n        clearTimeout(obs_debounce);\n        obs_debounce = setTimeout(addOverviewButtons, 300);\n      });\n      obs.observe(document.body, { childList: true, subtree: true });\n\n      // Autostart check after browser open delay\n      setTimeout(checkAutoStart, (settings.waitBeforeStart || 10) * 1000);\n      return;\n    }\n\n    // --- Any other kleinanzeigen page: only autostart check ---\n    setTimeout(checkAutoStart, (settings.waitBeforeStart || 10) * 1000);\n  }\n\n  if (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', init);\n  } else {\n    init();\n  }\n\n})();\n