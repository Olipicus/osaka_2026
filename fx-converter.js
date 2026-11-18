/* Osaka 2026 — ปุ่ม "แปลงเงิน เยน ⇄ บาท" ใช้ได้ทุกหน้า
   สคริปต์นี้เท modal แปลงเงิน + ปุ่มบนแถบด้านบน + CSS ที่ต้องใช้ ลงในหน้านั้นเอง
   (โค้ดชุดเดียวกับหน้าแรก index.html — หน้าไหนมี #fxModal อยู่แล้วจะข้ามให้ใช้ของเดิม)
   เรตที่แก้เซฟลง localStorage (osaka2026.fx.rate) ใช้ร่วมทั้งเว็บ แล้วยิง event
   osaka2026:fx-rate ให้ตัวแปลงราคาในเนื้อหา (¥ → ฿) ของแต่ละหน้าคำนวณใหม่ทันที */
(function () {
  'use strict';

  /* หน้าแรกมีหน้าต่างแปลงเงินของตัวเองอยู่แล้ว — ไม่ต้องฉีดซ้ำ */
  if (document.getElementById('fxModal')) return;

  /* ---------- หาที่วางปุ่มก่อน ไม่มีที่วาง = ไม่ฉีดอะไรเลย ---------- */
  var tool = document.querySelector('.tool');
  var topnav = document.querySelector('.topnav');
  var mount = null;
  if (tool) {
    var printBtn = document.getElementById('printBtn');
    mount = (printBtn && printBtn.parentNode === tool) ? printBtn : null;
  } else if (topnav) {
    mount = 'append-topnav';
  } else {
    return;
  }

  var FX_KEY = 'osaka2026.fx.rate';
  var FX_DEFAULT = 0.22;

  /* ---------- CSS (ตัวเดียวกับหน้าแรก แต่ปุ่ม/ปิด/toast สไตล์ในตัวเอง ไม่ง้อ CSS ของหน้า) ---------- */
  var css = [
    '/* fx-converter.js */',
    '.fx-btn{display:inline-flex;align-items:center;gap:7px;flex-shrink:0;min-height:36px;padding:0 12px;border:1px solid var(--rule);border-radius:8px;background:transparent;color:var(--ink-2);font-family:var(--font-sans,inherit);font-size:.78rem;cursor:pointer;transition:background .18s var(--ease),border-color .18s var(--ease)}',
    '.fx-btn:hover{background:var(--surface-2);border-color:var(--rule-strong);color:var(--ink)}',
    '.fx-btn svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}',
    '.topnav .fx-btn{min-height:32px;padding:0 10px;font-size:.8rem;border-radius:7px}',
    '@media (max-width:420px){.fx-btn{padding:0 11px}.fx-btn__t{display:none}}',
    '.fx-modal{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:18px;visibility:hidden;opacity:0;transition:opacity .25s var(--ease),visibility 0s linear .25s}',
    '.fx-modal.is-open{visibility:visible;opacity:1;transition:opacity .25s var(--ease)}',
    '.fx-backdrop{position:absolute;inset:0;background:rgba(27,34,51,.5);backdrop-filter:blur(3px);cursor:pointer}',
    '.fx-panel{position:relative;width:min(430px,100%);max-height:calc(100vh - 36px);overflow:auto;background:var(--surface);border:1px solid var(--rule-strong);border-radius:var(--radius);padding:20px 20px 16px;box-shadow:0 24px 60px -24px rgba(27,34,51,.55);transform:translateY(16px) scale(.97);transition:transform .3s var(--ease)}',
    '.fx-modal.is-open .fx-panel{transform:none}',
    '.fx-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}',
    '.fx-head h2{font-size:1.15rem;font-weight:600;margin:4px 0 0}',
    '.fx-modal .mono-label{margin:0;font-family:var(--font-mono);font-size:.68rem;letter-spacing:.09em;text-transform:uppercase;color:var(--accent-ink)}',
    '.fx-close{flex:none;display:inline-flex;align-items:center;justify-content:center;min-width:34px;min-height:34px;padding:0;border:1px solid var(--rule);border-radius:8px;background:transparent;color:var(--ink-2);cursor:pointer;transition:background .18s var(--ease),border-color .18s var(--ease)}',
    '.fx-close:hover{background:var(--surface-2);border-color:var(--rule-strong)}',
    '.fx-close svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}',
    '.fx-fields{display:grid;gap:9px}',
    '.fx-field{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:10px;border:1px solid var(--rule);border-radius:10px;background:var(--paper);padding:10px 14px}',
    '.fx-field:focus-within{border-color:var(--accent)}',
    '.fx-cur{font-family:var(--font-mono);font-size:.7rem;letter-spacing:.08em;color:var(--muted);white-space:nowrap}',
    '.fx-field input{width:100%;border:0;background:none;padding:0;text-align:right;appearance:textfield;-moz-appearance:textfield;font-family:var(--font-mono);font-size:1.3rem;font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums}',
    '.fx-field input:focus{outline:none}',
    '.fx-field input::placeholder{color:rgba(27,34,51,.25);font-weight:400}',
    '.fx-field input::-webkit-outer-spin-button,.fx-field input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}',
    '.fx-field--baht{background:var(--ink);border-color:var(--ink)}',
    '.fx-field--baht .fx-cur{color:#98a1b3}',
    '.fx-field--baht input{color:#efe7d8}',
    '.fx-field--baht input::placeholder{color:rgba(239,231,216,.3)}',
    '.fx-rate{display:flex;align-items:center;flex-wrap:wrap;gap:7px;padding:0 4px;font-size:.76rem;color:var(--muted)}',
    '.fx-rate input{width:72px;border:1px solid var(--rule);border-radius:8px;background:var(--paper);font-family:var(--font-mono);font-size:1rem;color:var(--ink);padding:3px 8px;text-align:right;font-variant-numeric:tabular-nums;appearance:textfield;-moz-appearance:textfield}',
    '.fx-rate input::-webkit-outer-spin-button,.fx-rate input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}',
    '.fx-rate input:focus{outline:none;border-color:var(--accent)}',
    '.fx-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}',
    '.fx-chips button{border:1px dashed var(--rule-strong);border-radius:999px;background:var(--paper);padding:5px 11px;font-family:var(--font-mono);font-size:.72rem;color:var(--ink-2);cursor:pointer}',
    '.fx-chips button:hover{border-color:var(--accent);color:var(--accent-ink)}',
    '.fx-hint{margin:13px 0 0;padding-top:11px;border-top:1px dashed var(--rule-strong);font-size:.72rem;color:var(--muted);line-height:1.7}',
    '.fx-hint b{font-family:var(--font-mono);font-weight:600;color:var(--ink-2)}',
    '.fx-toast{position:fixed;left:50%;bottom:22px;transform:translate(-50%,14px);z-index:1300;background:var(--ink);color:var(--paper);padding:9px 16px;border-radius:999px;font-size:.78rem;opacity:0;pointer-events:none;transition:opacity .25s var(--ease),transform .25s var(--ease)}',
    '.fx-toast.is-on{opacity:1;transform:translate(-50%,0)}',
    '@media print{.fx-modal,.fx-btn,.fx-toast{display:none !important}}'
  ].join('\n');
  var style = document.createElement('style');
  style.id = 'fx-converter-style';
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- ไอคอน i-fx / i-x (เฉพาะหน้าที่ยังไม่มี sprite นี้) ---------- */
  if (!document.getElementById('i-fx') || !document.getElementById('i-x')) {
    var sprite = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    sprite.setAttribute('style', 'display:none');
    sprite.setAttribute('aria-hidden', 'true');
    sprite.innerHTML =
      '<symbol id="i-fx" viewBox="0 0 24 24"><path d="M4 8h14"/><path d="m14 4 4 4-4 4"/><path d="M20 16H6"/><path d="m10 12-4 4 4 4"/></symbol>' +
      '<symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol>';
    document.body.appendChild(sprite);
  }

  /* ---------- ปุ่มเปิดบนแถบด้านบน ---------- */
  var fxOpenBtn = document.createElement('button');
  fxOpenBtn.type = 'button';
  fxOpenBtn.className = 'fx-btn';
  fxOpenBtn.id = 'fxOpen';
  fxOpenBtn.setAttribute('aria-haspopup', 'dialog');
  fxOpenBtn.innerHTML = '<svg aria-hidden="true"><use href="#i-fx"/></svg><span class="fx-btn__t">แปลงเงิน</span>';
  if (mount === 'append-topnav') {
    topnav.appendChild(fxOpenBtn);
  } else {
    tool.insertBefore(fxOpenBtn, mount);
  }

  /* ---------- หน้าต่างแปลงเงิน (markup เดียวกับหน้าแรก) ---------- */
  document.body.insertAdjacentHTML('beforeend',
    '<div class="fx-modal" id="fxModal" role="dialog" aria-modal="true" aria-labelledby="fxTitle" aria-describedby="fxHint">' +
      '<div class="fx-backdrop" data-fx-close aria-hidden="true"></div>' +
      '<div class="fx-panel">' +
        '<div class="fx-head">' +
          '<div>' +
            '<p class="mono-label">ตัวช่วยตอนเที่ยว</p>' +
            '<h2 id="fxTitle">แปลงเงิน เยน ⇄ บาท</h2>' +
          '</div>' +
          '<button class="fx-close" type="button" data-fx-close aria-label="ปิดหน้าต่างแปลงเงิน">' +
            '<svg aria-hidden="true"><use href="#i-x"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="fx-fields">' +
          '<label class="fx-field">' +
            '<span class="fx-cur">¥ เยน</span>' +
            '<input type="number" inputmode="decimal" min="0" step="any" id="fxYen" placeholder="0" aria-label="จำนวนเงินเยน">' +
          '</label>' +
          '<div class="fx-rate">' +
            '<span>อัตรา 1 ¥ =</span>' +
            '<input type="number" inputmode="decimal" min="0.01" step="0.01" id="fxRate" value="0.22" aria-label="อัตราแลกเปลี่ยน บาทต่อเยน">' +
            '<span>฿</span>' +
            '<button type="button" class="link-btn" id="fxRateReset">เรตมาตรฐาน</button>' +
          '</div>' +
          '<label class="fx-field fx-field--baht">' +
            '<span class="fx-cur">฿ บาท</span>' +
            '<input type="number" inputmode="decimal" min="0" step="any" id="fxBaht" placeholder="0" aria-label="จำนวนเงินบาท">' +
          '</label>' +
        '</div>' +
        '<div class="fx-chips" role="group" aria-label="ใส่จำนวนเงินด่วน">' +
          '<button type="button" data-fx-amt="100">¥100</button>' +
          '<button type="button" data-fx-amt="500">¥500</button>' +
          '<button type="button" data-fx-amt="1000">¥1,000</button>' +
          '<button type="button" data-fx-amt="5000">¥5,000</button>' +
          '<button type="button" data-fx-amt="10000">¥10,000</button>' +
        '</div>' +
        '<p class="fx-hint" id="fxHint"></p>' +
      '</div>' +
    '</div>' +
    '<div class="fx-toast" id="fxToast" role="status" aria-live="polite"></div>');

  /* ---------- ตรรกะแปลงเงิน (ชุดเดียวกับหน้าแรก) ---------- */
  var fxModal = document.getElementById('fxModal');
  var fxYen = document.getElementById('fxYen');
  var fxBaht = document.getElementById('fxBaht');
  var fxRate = document.getElementById('fxRate');
  var fxHint = document.getElementById('fxHint');
  var fxToast = document.getElementById('fxToast');
  var fxLast = 'yen';
  var fxReturnFocus = null;
  var fxToastTimer = null;

  function showToast(msg) {
    fxToast.textContent = msg;
    fxToast.classList.add('is-on');
    clearTimeout(fxToastTimer);
    fxToastTimer = setTimeout(function () { fxToast.classList.remove('is-on'); }, 2400);
  }

  function fxRateValue() {
    var r = parseFloat(fxRate.value);
    return (isFinite(r) && r > 0) ? r : FX_DEFAULT;
  }
  function fmtNum(n, dec) {
    var parts = n.toFixed(dec).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }
  function fxHintUpdate() {
    var r = fxRateValue();
    fxHint.innerHTML =
      'อ้างอิงที่เรต <b>1 ¥ = ' + r + ' ฿</b> — ' +
      '¥100 = <b>฿' + fmtNum(100 * r, 2) + '</b> · ' +
      '¥1,000 = <b>฿' + fmtNum(1000 * r, 2) + '</b> · ' +
      '¥10,000 = <b>฿' + fmtNum(10000 * r, 2) + '</b>';
  }
  function fxFromYen() {
    var yen = parseFloat(fxYen.value);
    fxBaht.value = (isFinite(yen) && yen >= 0) ? (yen * fxRateValue()).toFixed(2) : '';
    fxHintUpdate();
  }
  function fxFromBaht() {
    var baht = parseFloat(fxBaht.value);
    fxYen.value = (isFinite(baht) && baht >= 0) ? String(Math.round(baht / fxRateValue())) : '';
    fxHintUpdate();
  }
  function fxRecompute() { if (fxLast === 'baht') fxFromBaht(); else fxFromYen(); }

  (function fxLoadRate() {
    var raw = null;
    try { raw = localStorage.getItem(FX_KEY); } catch (e) {}
    if (raw) {
      var r = parseFloat(raw);
      if (isFinite(r) && r > 0) fxRate.value = r;
    }
    fxHintUpdate();
  })();

  function openFx() {
    fxReturnFocus = document.activeElement;
    if (!fxYen.value && !fxBaht.value) { fxLast = 'yen'; fxYen.value = '1000'; fxFromYen(); }
    fxModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { fxYen.focus(); if (fxYen.select) fxYen.select(); }, 60);
  }
  function closeFx() {
    fxModal.classList.remove('is-open');
    document.body.style.overflow = '';
    if (fxReturnFocus && fxReturnFocus.focus) fxReturnFocus.focus();
  }

  fxOpenBtn.addEventListener('click', openFx);
  fxModal.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('[data-fx-close]')) closeFx();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && fxModal.classList.contains('is-open')) closeFx();
  });

  fxYen.addEventListener('input', function () { fxLast = 'yen'; fxFromYen(); });
  fxBaht.addEventListener('input', function () { fxLast = 'baht'; fxFromBaht(); });
  fxRate.addEventListener('input', function () {
    var r = parseFloat(fxRate.value);
    if (isFinite(r) && r > 0) {
      try { localStorage.setItem(FX_KEY, String(r)); } catch (e) {}
      window.dispatchEvent(new Event('osaka2026:fx-rate'));
    }
    fxRecompute();
  });
  document.getElementById('fxRateReset').addEventListener('click', function () {
    fxRate.value = FX_DEFAULT;
    try { localStorage.setItem(FX_KEY, String(FX_DEFAULT)); } catch (e) {}
    window.dispatchEvent(new Event('osaka2026:fx-rate'));
    fxRecompute();
    showToast('กลับเป็นเรตมาตรฐาน 0.22 บาท/เยน');
  });
  Array.prototype.slice.call(document.querySelectorAll('#fxModal [data-fx-amt]')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      fxYen.value = btn.getAttribute('data-fx-amt');
      fxLast = 'yen';
      fxFromYen();
      fxYen.focus();
    });
  });

  /* แท็บอื่นแก้เรต → อัปเดตตามทันที */
  window.addEventListener('storage', function (e) {
    if (e.key === FX_KEY) {
      var r = parseFloat(e.newValue);
      if (isFinite(r) && r > 0) { fxRate.value = r; fxRecompute(); }
    }
  });
})();
