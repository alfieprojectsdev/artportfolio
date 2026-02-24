
import { JSDOM } from 'jsdom';

// Setup basic DOM
const itemCount = 2000;
const filterCount = 10;
const html = `
<!DOCTYPE html>
<html>
<body>
  <div id="filters">
    ${Array.from({ length: filterCount }, (_, i) =>
      `<button class="filter-btn" data-filter="cat-${i}">Filter ${i}</button>`
    ).join('')}
    <button class="filter-btn" data-filter="all">All</button>
  </div>
  <div id="gallery">
    ${Array.from({ length: itemCount }, (_, i) =>
      `<div class="gallery-item" data-category="cat-${i % filterCount}">Item ${i}</div>`
    ).join('')}
  </div>
</body>
</html>
`;

function runUnoptimized() {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Attach listeners
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      // This is the unoptimized part: querying DOM inside handler
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.gallery-item').forEach(item => {
        item.classList.toggle('hidden', filter !== 'all' && item.dataset.category !== filter);
      });
    });
  });

  // Benchmark
  const start = performance.now();
  const btns = document.querySelectorAll('.filter-btn');
  // Click every button once
  for (let i = 0; i < btns.length; i++) {
    btns[i].click();
  }
  const end = performance.now();
  return end - start;
}

function runOptimized() {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Cache selectors outside
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Use cached collections
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      galleryItems.forEach(item => {
        item.classList.toggle('hidden', filter !== 'all' && item.dataset.category !== filter);
      });
    });
  });

  // Benchmark
  const start = performance.now();
  const btns = document.querySelectorAll('.filter-btn');
  for (let i = 0; i < btns.length; i++) {
    btns[i].click();
  }
  const end = performance.now();
  return end - start;
}

console.log(`Running benchmark with ${itemCount} items and ${filterCount} filters...`);
console.log('--- Unoptimized ---');
const unoptTime = runUnoptimized();
console.log(`Total time: ${unoptTime.toFixed(2)}ms`);

console.log('--- Optimized ---');
const optTime = runOptimized();
console.log(`Total time: ${optTime.toFixed(2)}ms`);

console.log(`\nImprovement: ${(unoptTime / optTime).toFixed(2)}x faster`);
