// Infinite scroll for Zola paginated post lists.
//
// Zola pagination generates:
//   /                  (page 1)
//   /page/2/
//   /page/3/  ...
//
// This script watches the last post card and loads the next page
// when it scrolls into view, then appends the new cards.
//
// Requirements in your list template:
//   - A container element with id="post-list"
//   - A hidden element with id="next-page-url" and data-url="/page/2/"
//     (or empty / absent when on the last page)

(function () {
  const list = document.getElementById('post-list');
  const nextMeta = document.getElementById('next-page-url');

  // No list or already on last page — nothing to do
  if (!list || !nextMeta || !nextMeta.dataset.url) return;

  let nextUrl = nextMeta.dataset.url;
  let loading = false;

  // Sentinel element appended after the last card — when it
  // scrolls into view we trigger the next load
  const sentinel = document.createElement('div');
  sentinel.id = 'scroll-sentinel';
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'height:1px;width:100%;margin-top:2rem;';
  list.after(sentinel);

  // Spinner shown while fetching
  const spinner = document.createElement('div');
  spinner.id = 'scroll-spinner';
  spinner.setAttribute('aria-label', 'Loading more posts');
  spinner.style.cssText = [
    'display:none',
    'text-align:center',
    'padding:2rem 0',
    'color:var(--color-text-secondary,#888)',
    'font-size:0.9rem',
  ].join(';');
  spinner.textContent = 'Loading…';
  sentinel.after(spinner);

  async function loadNext() {
    if (loading || !nextUrl) return;
    loading = true;
    spinner.style.display = 'block';

    let doc;
    try {
      const res = await fetch(nextUrl);
      if (!res.ok) throw new Error(res.status);
      const html = await res.text();
      doc = new DOMParser().parseFromString(html, 'text/html');
    } catch {
      spinner.textContent = 'Could not load more posts.';
      loading = false;
      return;
    }

    // Pull new cards out of the fetched page's #post-list
    const newList = doc.getElementById('post-list');
    if (newList) {
      const fragment = document.createDocumentFragment();
      Array.from(newList.children).forEach(card => {
        fragment.appendChild(card.cloneNode(true));
      });
      list.appendChild(fragment);
    }

    // Update next URL from the fetched page's meta element
    const newMeta = doc.getElementById('next-page-url');
    nextUrl = newMeta?.dataset.url || '';

    spinner.style.display = 'none';
    loading = false;

    // If there are no more pages, remove the sentinel so the
    // observer disconnects and stops watching
    if (!nextUrl) {
      observer.disconnect();
      sentinel.remove();
      spinner.remove();
    }
  }

  const observer = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting) loadNext();
    },
    { rootMargin: '200px' } // start loading 200px before the sentinel is visible
  );

  observer.observe(sentinel);
})();
