const CONTENT_SELECTOR = 'main';
const TRANSITION_MS = 220;

let isNavigating = false;

function getMain() {
  return document.querySelector(CONTENT_SELECTOR);
}

async function navigate(url) {
  if (isNavigating) return;
  isNavigating = true;

  const current = getMain();

  current.style.transition = `opacity ${TRANSITION_MS}ms ease`;
  current.style.opacity = '0';

  let doc;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    const html = await res.text();
    doc = new DOMParser().parseFromString(html, 'text/html');
  } catch (err) {
    // fallback to normal navigation on fetch error
    window.location.href = url;
    return;
  }

  await new Promise(r => setTimeout(r, TRANSITION_MS));

  const newMain = doc.querySelector(CONTENT_SELECTOR);
  if (!newMain) {
    window.location.href = url;
    return;
  }

  current.replaceWith(newMain);
  newMain.style.opacity = '0';
  newMain.style.transition = `opacity ${TRANSITION_MS}ms ease`;

  // Force reflow so the transition actually fires
  newMain.getBoundingClientRect();
  newMain.style.opacity = '1';

  document.title = doc.title;
  history.pushState({ url }, '', url);

  // Update active nav link
  document.querySelectorAll('nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === url);
  });

  window.scrollTo({ top: 0, behavior: 'instant' });
  isNavigating = false;
}

function shouldIntercept(a) {
  if (!a) return false;
  const href = a.getAttribute('href');
  if (!href) return false;
  // Only intercept same-origin relative paths
  if (href.startsWith('http') || href.startsWith('//')) return false;
  if (href.startsWith('#') || href.startsWith('mailto:')) return false;
  // Don't intercept links that explicitly opt out
  if (a.hasAttribute('data-no-transition')) return false;
  return true;
}

document.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!shouldIntercept(a)) return;
  e.preventDefault();
  const url = new URL(a.href, window.location.origin).pathname;
  if (url === window.location.pathname) return;
  navigate(url);
});

// Handle browser back/forward
window.addEventListener('popstate', e => {
  const url = e.state?.url || window.location.pathname;
  navigate(url);
});
