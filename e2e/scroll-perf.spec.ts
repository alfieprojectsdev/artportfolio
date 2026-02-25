import { test, expect } from '@playwright/test';

test('measure scroll event handler calls', async ({ page }) => {
  await page.goto('/');

  // Wait for the script to load and the function to be available
  await page.waitForFunction(() => typeof window.updateScrollElements === 'function');

  // Monkey patch updateScrollElements to count calls
  await page.evaluate(() => {
    window.scrollCallCount = 0;
    const originalUpdate = window.updateScrollElements;
    window.updateScrollElements = function() {
      window.scrollCallCount++;
      originalUpdate();
    };
    // We don't need to re-attach the event listener because the page's event listener
    // calls updateScrollElements(), which we just replaced.
  });

  // Scroll down 2000px in steps
  await page.evaluate(async () => {
    return new Promise((resolve) => {
      let currentScroll = 0;
      const maxScroll = 2000;
      const step = 20; // Scroll by 20px each step

      function scrollStep() {
        // Simulate high frequency scroll events
        // We dispatch 'scroll' event 5 times per frame
        for (let i = 0; i < 5; i++) {
            currentScroll += (step / 5);
            // We need to actually scroll so the values change
            window.scrollTo(0, currentScroll);
            window.dispatchEvent(new Event('scroll'));
        }

        if (currentScroll <= maxScroll) {
          requestAnimationFrame(scrollStep);
        } else {
          resolve(null);
        }
      }
      requestAnimationFrame(scrollStep);
    });
  });

  // Wait a bit for any pending events
  await page.waitForTimeout(500);

  const callCount = await page.evaluate(() => window.scrollCallCount);
  console.log(`Scroll handler called ${callCount} times`);

  // We expect it to be called roughly once per scroll event.
  // With rAF loop, we are scrolling every frame.
  // Browser scroll events fire asynchronously and might fire more often or throttled depending on implementation.
  // But establishing a baseline is key.
});
