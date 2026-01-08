// Lightweight global toast utility (TikTok-like bottom toast)
const CONTAINER_ID = 'app-global-toast-container';

function ensureStyles() {
  if (document.getElementById('toast-styles')) return;
  const style = document.createElement('style');
  style.id = 'toast-styles';
  style.innerHTML = `
  #${CONTAINER_ID} {
    position: fixed;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    z-index: 9999;
    pointer-events: none;
  }
  .app-toast {
    pointer-events: auto;
    background: rgba(0,0,0,0.9);
    color: #fff;
    padding: 10px 14px;
    border-radius: 999px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.2);
    transform: translateY(12px) scale(0.98);
    opacity: 0;
    transition: transform 260ms cubic-bezier(.2,.9,.2,1), opacity 260ms ease;
    font-weight: 600;
    max-width: 90vw;
    text-align: center;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  }
  .app-toast.success { background: linear-gradient(90deg,#2ecc71,#27ae60); }
  .app-toast.error { background: linear-gradient(90deg,#ff5c5c,#ff3b3b); }
  .app-toast.show {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  .app-toast.hide {
    transform: translateY(12px) scale(0.98);
    opacity: 0;
  }
  `;
  document.head.appendChild(style);
}

function getContainer() {
  let c = document.getElementById(CONTAINER_ID);
  if (!c) {
    c = document.createElement('div');
    c.id = CONTAINER_ID;
    document.body.appendChild(c);
  }
  return c;
}

export function showToast(message, { duration = 3000, type = 'default' } = {}) {
  if (typeof document === 'undefined') return; // SSR guard
  ensureStyles();
  const container = getContainer();
  const el = document.createElement('div');
  el.className = 'app-toast';
  if (type === 'error') el.classList.add('error');
  if (type === 'success') el.classList.add('success');
  el.textContent = message;
  container.appendChild(el);

  // force reflow then show
  requestAnimationFrame(() => {
    el.classList.add('show');
  });

  const hide = () => {
    el.classList.remove('show');
    el.classList.add('hide');
    setTimeout(() => {
      try { container.removeChild(el); } catch (e) {}
    }, 300);
  };

  const t = setTimeout(hide, duration);

  // allow click to dismiss
  el.addEventListener('click', () => {
    clearTimeout(t);
    hide();
  });
}

export default showToast;
