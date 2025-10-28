// Compute exact travel so the fixed-size knob never leaks.
const toggle = document.getElementById('themeToggle');
const root = document.documentElement;
const pearl = toggle.querySelector('.pearl');

function computeTravel() {
  const s = getComputedStyle(toggle);
  const pad = parseFloat(s.getPropertyValue('--pad'));
  const w = parseFloat(s.getPropertyValue('--toggle-w'));
  const knob = parseFloat(s.getPropertyValue('--knob'));
  const travel = w - (pad * 2 + knob);
  pearl.style.setProperty('--travel', travel + 'px');
}
computeTravel();
addEventListener('resize', computeTravel);

// state
function setDark(v) {
  root.classList.toggle('dark', v);
  toggle.classList.toggle('is-dark', v);
  toggle.setAttribute('aria-pressed', String(v));
  localStorage.setItem('prefersDark', v ? '1' : '0');
}

// init state
const saved = localStorage.getItem('prefersDark');
setDark(saved === '1' || (saved === null && matchMedia('(prefers-color-scheme: dark)').matches));

// interaction
toggle.addEventListener('click', () => {
  toggle.classList.add('morphing');
  setDark(!toggle.classList.contains('is-dark'));
  setTimeout(() => toggle.classList.remove('morphing'), 620);
});
toggle.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle.click(); }
});
