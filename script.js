(function () {
  'use strict';

  // Elements
  const elPassword = document.getElementById('password');
  const elBtnGenerate = document.getElementById('btn-generate');
  const elBtnCopy = document.getElementById('btn-copy');
  const elBtnToggle = document.getElementById('btn-toggle');
  const elLength = document.getElementById('length');
  const elLengthNumber = document.getElementById('length-number');
  const elLengthValue = document.getElementById('length-value');
  const elLower = document.getElementById('opt-lower');
  const elUpper = document.getElementById('opt-upper');
  const elNumber = document.getElementById('opt-number');
  const elSymbol = document.getElementById('opt-symbol');
  const elAmbiguous = document.getElementById('opt-ambiguous');
  const elNoDupes = document.getElementById('opt-no-duplicates');
  const elStrengthBar = document.getElementById('strength-bar');
  const elStrengthText = document.getElementById('strength-text');
  const elEntropy = document.getElementById('entropy');
  const elMessage = document.getElementById('message');
  const elToast = document.getElementById('copy-toast');

  const STORAGE_KEY = 'pwgen-settings.v1';

  const CHARSETS = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    number: '0123456789',
    symbol: '!@#$%^&*()_+-=[]{}|;:,.<>?/~`',
  };

  const AMBIGUOUS = new Set([
    'O','0','o','I','l','1','|','S','5','B','8','G','6','Z','2'
  ]);

  // UI state for toggle button behavior:
  // 'visibility'  -> button toggles show/hide
  // 'edit-ready'  -> after Copy, button becomes "Edit"
  // 'editing'     -> user is editing, button shows "Done"
  let toggleMode = 'visibility';
  let prevInputType = 'password';

  // Crypto-safe RNG helper
  function randomInt(max) {
    // returns integer in [0, max)
    if (max <= 0) return 0;
    const arr = new Uint32Array(1);
    let x;
    // Avoid modulo bias by discarding
    const limit = Math.floor(0xFFFFFFFF / max) * max;
    do {
      crypto.getRandomValues(arr);
      x = arr[0];
    } while (x >= limit);
    return x % max;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function getOptions() {
    return {
      length: clamp(parseInt(elLength.value || '16', 10), parseInt(elLength.min, 10), parseInt(elLength.max, 10)),
      lower: elLower.checked,
      upper: elUpper.checked,
      number: elNumber.checked,
      symbol: elSymbol.checked,
      ambiguous: elAmbiguous.checked,
      noDuplicates: elNoDupes.checked,
    };
  }

  function setOptions(opts) {
    if (typeof opts.length === 'number') {
      elLength.value = String(opts.length);
      elLengthNumber.value = String(opts.length);
      elLengthValue.textContent = String(opts.length);
    }
    elLower.checked = !!opts.lower;
    elUpper.checked = !!opts.upper;
    elNumber.checked = !!opts.number;
    elSymbol.checked = !!opts.symbol;
    elAmbiguous.checked = !!opts.ambiguous;
    elNoDupes.checked = !!opts.noDuplicates;
  }

  function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
  }

  function getPool(opts) {
    let pool = '';
    if (opts.lower) pool += CHARSETS.lower;
    if (opts.upper) pool += CHARSETS.upper;
    if (opts.number) pool += CHARSETS.number;
    if (opts.symbol) pool += CHARSETS.symbol;

    if (opts.ambiguous) {
      pool = [...pool].filter(ch => !AMBIGUOUS.has(ch)).join('');
    }
    // Deduplicate in case of overlaps
    pool = Array.from(new Set(pool.split(''))).join('');
    return pool;
  }

  function generatePassword(opts) {
    const categories = [];
    if (opts.lower) categories.push(CHARSETS.lower);
    if (opts.upper) categories.push(CHARSETS.upper);
    if (opts.number) categories.push(CHARSETS.number);
    if (opts.symbol) categories.push(CHARSETS.symbol);

    // Apply ambiguous removal to categories as well
    const filterAmb = (set) => opts.ambiguous ? [...set].filter(c => !AMBIGUOUS.has(c)).join('') : set;
    const filteredCategories = categories.map(filterAmb);
    const pool = getPool(opts);

    if (pool.length === 0) {
      return { password: '', poolSize: 0 };
    }

    const length = opts.length;

    // If no-duplicates requested but pool smaller than length, we will allow duplicates with a warning.
    const noDupesEnforceable = opts.noDuplicates && pool.length >= length;

    const chars = [];

    // Ensure at least one from each selected category
    filteredCategories.forEach(set => {
      if (set.length > 0) {
        chars.push(set[randomInt(set.length)]);
      }
    });

    // Fill remaining
    while (chars.length < length) {
      const ch = pool[randomInt(pool.length)];
      if (noDupesEnforceable) {
        if (!chars.includes(ch)) chars.push(ch);
      } else {
        chars.push(ch);
      }
    }

    // Shuffle to avoid predictable category placement
    shuffle(chars);

    // If we overfilled due to categories > length (edge case), trim
    const password = chars.slice(0, length).join('');
    return { password, poolSize: pool.length };
  }

  function estimateEntropy(length, poolSize) {
    if (length <= 0 || poolSize <= 1) return 0;
    const entropy = length * Math.log2(poolSize);
    return entropy;
  }

  function strengthLabel(entropy) {
    // Rough guide based on bits of entropy
    if (entropy < 28) return { score: 0, label: 'Very Weak' };
    if (entropy < 36) return { score: 1, label: 'Weak' };
    if (entropy < 60) return { score: 2, label: 'Fair' };
    if (entropy < 128) return { score: 3, label: 'Strong' };
    return { score: 4, label: 'Very Strong' };
  }

  function updateStrengthUI(opts, currentPassword = '') {
    const poolSize = getPool(opts).length;
    // If a current password is present, use its length; otherwise use desired length for preview
    const length = currentPassword ? currentPassword.length : opts.length;
    const entropy = estimateEntropy(length, poolSize);
    const { score, label } = strengthLabel(entropy);

    // Update meter width: cap at 128 bits
    const percent = Math.max(0, Math.min(100, Math.round((Math.min(entropy, 128) / 128) * 100)));
    elStrengthBar.style.width = percent + '%';
    elStrengthBar.className = 'bar s' + score;
    elStrengthText.textContent = label;
    elEntropy.textContent = Math.round(entropy) + ' bits';
  }

  function showMessage(text, type = 'warn') {
    elMessage.textContent = text || '';
    elMessage.style.color = type === 'error' ? 'var(--danger)' : (type === 'ok' ? 'var(--ok)' : 'var(--warn)');
  }

  function clearMessage() {
    elMessage.textContent = '';
  }

  // Toggle label helper to keep button text/aria in sync with mode
  function updateToggleLabel() {
    if (!elBtnToggle) return;
    if (toggleMode === 'editing') {
      elBtnToggle.textContent = 'Done';
      elBtnToggle.setAttribute('aria-label', 'Finish editing password');
      return;
    }
    if (toggleMode === 'edit-ready') {
      elBtnToggle.textContent = 'Edit';
      elBtnToggle.setAttribute('aria-label', 'Edit password');
      return;
    }
    // visibility mode
    const isText = elPassword.type === 'text';
    elBtnToggle.textContent = isText ? 'Hide' : 'Show';
    elBtnToggle.setAttribute('aria-label', isText ? 'Hide password' : 'Show password');
  }

  function setEditAvailable(enabled) {
    // Only switch away from editing if not actively editing
    if (toggleMode === 'editing') return;
    toggleMode = enabled ? 'edit-ready' : 'visibility';
    updateToggleLabel();
  }

  function enterEditMode() {
    toggleMode = 'editing';
    prevInputType = elPassword.type;
    elPassword.readOnly = false;
    elPassword.type = 'text'; // make edits visible
    updateToggleLabel();
    // Update strength as the user types
    elPassword.addEventListener('input', handlePasswordInput);
    // Focus and select current password for quick overwrite
    elPassword.focus();
    elPassword.select();
  }

  function exitEditMode() {
    elPassword.readOnly = true;
    elPassword.type = prevInputType;
    elPassword.removeEventListener('input', handlePasswordInput);
    toggleMode = 'visibility';
    updateToggleLabel();
    updateStrengthUI(getOptions(), elPassword.value);
  }

  function handlePasswordInput() {
    clearMessage();
    updateStrengthUI(getOptions(), elPassword.value);
  }

  function generateAndRender() {
    // If editing, finish editing before generating a new password
    if (toggleMode === 'editing') {
      exitEditMode();
    }

    const opts = getOptions();

    // Validate at least one type
    if (!opts.lower && !opts.upper && !opts.number && !opts.symbol) {
      elBtnGenerate.disabled = true;
      showMessage('Select at least one character type.', 'error');
      updateStrengthUI(opts);
      elPassword.value = '';
      // Reset toggle back to visibility mode
      setEditAvailable(false);
      return;
    }
    elBtnGenerate.disabled = false;

    // Warn if no-duplicates is impossible
    const poolSize = getPool(opts).length;
    if (opts.noDuplicates && poolSize < opts.length) {
      showMessage(`“No repeated characters” requires a pool of at least ${opts.length}. Current pool: ${poolSize}. Allowing repeats.`);
    } else {
      clearMessage();
    }

    const { password } = generatePassword(opts);
    elPassword.value = password;
    updateStrengthUI({ ...opts }, password);
    saveSettings();

    // After generating a new password, normal toggle behavior
    setEditAvailable(false);
  }

  function copyPassword() {
    const text = elPassword.value || '';
    if (!text) return false;

    const onSuccess = () => {
      showToast();
      // After a successful copy, allow editing via toggle button
      setEditAvailable(true);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(onSuccess, () => fallbackCopy(text));
    } else {
      fallbackCopy(text, onSuccess);
    }
    return true;
  }

  function fallbackCopy(text, onSuccess) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      onSuccess && onSuccess();
    } catch (e) {
      showMessage('Copy failed. Select and copy manually.', 'error');
    } finally {
      document.body.removeChild(ta);
    }
  }

  let toastTimer = null;
  function showToast() {
    elToast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { elToast.hidden = true; }, 1200);
  }

  function toggleVisibility() {
    const isText = elPassword.type === 'text';
    elPassword.type = isText ? 'password' : 'text';
  }

  function onToggleClick() {
    if (toggleMode === 'editing') {
      // Finish editing
      exitEditMode();
      return;
    }
    if (toggleMode === 'edit-ready') {
      // Enter editing mode
      enterEditMode();
      return;
    }
    // Default: visibility toggle
    toggleVisibility();
    updateToggleLabel();
  }

  function syncLengthInputs(e) {
    const value = clamp(parseInt(e.target.value || '16', 10), parseInt(elLength.min, 10), parseInt(elLength.max, 10));
    elLength.value = String(value);
    elLengthNumber.value = String(value);
    elLengthValue.textContent = String(value);
  }

  function saveSettings() {
    const opts = getOptions();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(opts)); } catch {}
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const opts = JSON.parse(raw);
      setOptions({
        length: typeof opts.length === 'number' ? opts.length : 16,
        lower: !!opts.lower,
        upper: !!opts.upper,
        number: !!opts.number,
        symbol: !!opts.symbol,
        ambiguous: !!opts.ambiguous,
        noDuplicates: !!opts.noDuplicates,
      });
    } catch { /* ignore */ }
  }

  // Event bindings
  function bindEvents() {
    elBtnGenerate.addEventListener('click', generateAndRender);
    elBtnCopy.addEventListener('click', copyPassword);
    elBtnToggle.addEventListener('click', onToggleClick);

    elLength.addEventListener('input', (e) => { syncLengthInputs(e); updateStrengthUI(getOptions()); });
    elLengthNumber.addEventListener('input', (e) => { syncLengthInputs(e); updateStrengthUI(getOptions()); });

    [elLower, elUpper, elNumber, elSymbol, elAmbiguous, elNoDupes].forEach(cb => {
      cb.addEventListener('change', () => {
        updateStrengthUI(getOptions());
        saveSettings();
      });
    });

    // Enter key -> generate
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        generateAndRender();
      }
    });
  }

  // Backward compatibility with original inline handlers (if any)
  window.create = generateAndRender;
  window.copyPass = copyPassword;

  // Init
  (function init() {
    loadSettings();
    syncLengthInputs({ target: elLength });
    updateStrengthUI(getOptions());
    bindEvents();
    // Initialize toggle label in default (visibility) mode
    toggleMode = 'visibility';
    prevInputType = elPassword.type || 'password';
    updateToggleLabel();
  })();

})();