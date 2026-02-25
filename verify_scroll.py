from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the homepage
            # Assuming server is running on localhost:4321
            page.goto("http://localhost:4321")

            # Wait for content to load
            page.wait_for_selector(".hero")

            # Initial state: floating nav and back-to-top should be hidden
            # Actually, .floating-nav has transform: translateY(-100%) by default
            # But the class .visible removes it.
            # We can check for the class .visible

            # Scroll down to trigger visibility
            page.evaluate("window.scrollTo(0, 1000)")

            # Wait for transition
            time.sleep(1)

            # Verify floating nav has class 'visible'
            nav = page.locator("#floatingNav")
            if "visible" in nav.get_attribute("class"):
                print("Floating nav is visible")
            else:
                print("Floating nav is NOT visible")

            # Verify back to top button has class 'visible'
            btn = page.locator("#backToTop")
            if "visible" in btn.get_attribute("class"):
                print("Back to top button is visible")
            else:
                print("Back to top button is NOT visible")

            # Take screenshot
            page.screenshot(path="verification_scroll.png")
            print("Screenshot saved to verification_scroll.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
