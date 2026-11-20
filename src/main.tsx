import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

function removeInjectedNetlifyBadges() {
  const rootEl = document.getElementById('root');
  const candidates = document.querySelectorAll(
    'body > :not(#root):not(script):not(style), a[href*="netlify.com"], a[href*="netlify.app"], [id*="netlify" i], [class*="netlify" i], [data-netlify]'
  );
  candidates.forEach((el) => {
    if (rootEl && rootEl.contains(el)) return;
    const htmlEl = el as HTMLElement;
    const text = (htmlEl.textContent || '').toLowerCase();
    const idAndClass = `${htmlEl.id || ''} ${typeof htmlEl.className === 'string' ? htmlEl.className : ''}`.toLowerCase();
    const isNetlify =
      text.includes('powered by netlify') ||
      text.includes('netlify') ||
      idAndClass.includes('netlify') ||
      htmlEl.matches('a[href*="netlify.com"], a[href*="netlify.app"], [data-netlify]');
    if (isNetlify) {
      htmlEl.style.setProperty('display', 'none', 'important');
      htmlEl.remove();
    }
  });
}

if (typeof document !== 'undefined') {
  removeInjectedNetlifyBadges();
  window.addEventListener('DOMContentLoaded', removeInjectedNetlifyBadges);
  window.addEventListener('load', removeInjectedNetlifyBadges);
  const observer = new MutationObserver(() => removeInjectedNetlifyBadges());
  observer.observe(document.documentElement, { childList: true });
  if (document.body) {
    observer.observe(document.body, { childList: true });
  }
}

registerSW({
  immediate: true,
});

createRoot(document.getElementById('root')!).render(<App />);

