const allChip = document.querySelector('.tag-chip--all');
const tagChips = document.querySelectorAll('.tag-chip:not(.tag-chip--all)');
const items = document.querySelectorAll('#post-list .post-item');
const noResults = document.getElementById('no-results');
const active = new Set();

allChip.addEventListener('click', () => {
  active.clear();
  tagChips.forEach(c => c.setAttribute('aria-pressed', 'false'));
  allChip.setAttribute('aria-pressed', 'true');
  filterPosts();
});

tagChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const tag = chip.dataset.tag;
    if (active.has(tag)) {
      active.delete(tag);
      chip.setAttribute('aria-pressed', 'false');
    } else {
      active.add(tag);
      chip.setAttribute('aria-pressed', 'true');
    }
    allChip.setAttribute('aria-pressed', active.size === 0 ? 'true' : 'false');
    filterPosts();
  });
});

function filterPosts() {
  let visible = 0;
  items.forEach(item => {
    const tags = item.dataset.tags ? item.dataset.tags.split(',') : [];
    const match = active.size === 0 || [...active].some(t => tags.includes(t));
    item.hidden = !match;
    if (match) visible++;
  });
  noResults.hidden = visible > 0;
}
