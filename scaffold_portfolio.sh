#!/bin/bash

# ==========================================
# CONFIGURATION
# ==========================================
SOURCE_DIR="/home/finch/Downloads/aaaaa"
TARGET_DIR="/home/finch/repos/artportfolio"
ASSETS_DIR="$TARGET_DIR/assets"

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Portfolio Scaffold...${NC}"

# 1. Create Directories
echo "Creating directories..."
mkdir -p "$ASSETS_DIR"

# 2. Copy and Sanitize Assets (Renaming for Web Safety)
echo "Copying and sanitizing assets..."

# Helper function to copy if exists
copy_asset() {
    src="$1"
    dest="$2"
    if [ -f "$SOURCE_DIR/$src" ]; then
        cp "$SOURCE_DIR/$src" "$ASSETS_DIR/$dest"
        echo "  [OK] $src -> $dest"
    else
        echo "  [MISSING] Could not find $src"
    fi
}

copy_asset "angentela_COMMISSION.png" "angentela_commission.png"
copy_asset "chib Ari.png" "chib_ari.png"
copy_asset "Esper_pfp.png" "esper_pfp.png"
copy_asset "God of the Underworld_lore_sign.png" "god_of_underworld.png"
copy_asset "House of Wrath.png" "house_of_wrath.png"
copy_asset "Into The Abyss_WIP_LINE.jpg" "into_the_abyss_wip.jpg"
copy_asset "Xie Lian.png" "xie_lian.png"

# 3. Generate HTML (Updated with new filenames)
echo "Generating index.html..."
cat << 'EOF' > "$TARGET_DIR/index.html"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bred's Commissions</title>
    <link rel="stylesheet" href="style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600&family=Inter:wght@400;500&family=Kosugi&display=swap" rel="stylesheet">
</head>
<body>

    <header class="hero">
        <div class="container">
            <img src="assets/god_of_underworld.png" alt="Bred Art Avatar" class="profile-pic">
            <h1>Bred's Commissions</h1>
            <p class="intro">
                Hello, I'm Bred! I'm a senior student doing commissions and art on the side. 
                If you like my style, I'd love to work with you! :D
            </p>
            <div class="status-badge">Status: OPEN</div>
        </div>
    </header>

    <main class="container">
        
        <section id="gallery" class="gallery-grid">
            <div class="gallery-item">
                <img src="assets/angentela_commission.png" alt="Commission Work" loading="lazy">
            </div>
            <div class="gallery-item">
                <img src="assets/house_of_wrath.png" alt="House of Wrath" loading="lazy">
            </div>
            <div class="gallery-item">
                <img src="assets/xie_lian.png" alt="Xie Lian Fanart" loading="lazy">
            </div>
            <div class="gallery-item">
                <img src="assets/into_the_abyss_wip.jpg" alt="WIP Line Art" loading="lazy">
            </div>
        </section>

        <section id="pricing" class="pricing-section">
            <h2>Commission Rates</h2>
            
            <div class="pricing-grid">
                <div class="price-card">
                    <h3>Bust / Headshot</h3>
                    <img src="assets/esper_pfp.png" alt="Headshot Example" class="price-img">
                    <ul>
                        <li><strong>Sketch:</strong> ₱80 | $5</li>
                        <li><strong>Flat:</strong> ₱150 | $8</li>
                        <li><strong>Rendered:</strong> ₱200 | $15</li>
                    </ul>
                </div>

                <div class="price-card">
                    <h3>Half Body</h3>
                    <div class="price-placeholder"></div> 
                    <ul>
                        <li><strong>Sketch:</strong> ₱100 | $7</li>
                        <li><strong>Flat:</strong> ₱200 | $15</li>
                        <li><strong>Rendered:</strong> ₱300 | $20</li>
                    </ul>
                </div>

                <div class="price-card">
                    <h3>Full Body</h3>
                    <div class="price-placeholder"></div>
                    <ul>
                        <li><strong>Sketch:</strong> ₱200 | $15</li>
                        <li><strong>Flat:</strong> ₱250 | $20</li>
                        <li><strong>Rendered:</strong> ₱500 | $40</li>
                    </ul>
                </div>

                <div class="price-card">
                    <h3>Chibi Style</h3>
                    <img src="assets/chib_ari.png" alt="Chibi Example" class="price-img">
                    <ul>
                        <li><strong>Sketch:</strong> ₱40 | $3</li>
                        <li><strong>Flat:</strong> ₱100 | $7</li>
                        <li><strong>Rendered:</strong> ₱150 | $10</li>
                    </ul>
                </div>
            </div>
            <p class="payment-note">
                <strong>Payment:</strong> GCash / Paypal / Robux<br>
                <small>(For Robux payment, ask me thru DMs)</small>
            </p>
        </section>

        <section id="tos" class="tos-section">
            <h2>Terms of Service</h2>
            <ul class="tos-list">
                <li>☼ 100% Payment Upfront</li>
                <li>☼ First come, first serve</li>
                <li>☼ Please provide at least 3 references</li>
                <li>☼ Personal use only (credit appreciated)</li>
                <li>☼ Turnaround time: 3-7 days (depending on school load)</li>
            </ul>
        </section>

        <section class="dos-donts">
            <div class="col do">
                <h3>✔ DOs</h3>
                <ul>
                    <li>Original Characters</li>
                    <li>Fanart</li>
                    <li>Ship Art</li>
                    <li>Human / Humanoid</li>
                    <li>Partial Gore / Body Horror</li>
                </ul>
            </div>
            <div class="col dont">
                <h3>✖ DON'Ts</h3>
                <ul>
                    <li>Mecha</li>
                    <li>Furry (Ask first)</li>
                    <li>NSFW</li>
                    <li>Political / Derogatory</li>
                </ul>
            </div>
        </section>

    </main>

    <footer>
        <div class="container">
            <h3>Contact Me</h3>
            <div class="social-links">
                <a href="https://instagram.com/demented.toast" target="_blank" class="btn">Instagram: @demented.toast</a>
                <button id="discordBtn" class="btn" data-user="toasted_insanity">
                    Discord: toasted_insanity 
                    <span class="tooltip">Click to copy</span>
                </button>
            </div>
            <p class="credit">Built by Finch</p>
            <p class="privacy-note">
                This site uses <a href="https://www.goatcounter.com/" target="_blank" rel="noopener">GoatCounter</a> for privacy-friendly analytics (no cookies).
            </p>
        </div>
    </footer>

    <div id="lightbox" class="lightbox">
        <span class="close">&times;</span>
        <img class="lightbox-content" id="lightbox-img">
    </div>

    <script src="script.js"></script>

    <!-- GoatCounter analytics (privacy-friendly, no cookies) -->
    <script data-goatcounter="https://ithinkandicode.goatcounter.com/count"
            async src="//gc.zgo.at/count.js"></script>
</body>
</html>
EOF

# 4. Generate CSS
echo "Generating style.css..."
cat << 'EOF' > "$TARGET_DIR/style.css"
:root {
    --bg-color: #FFFFFF;
    --card-bg: #FFFFFF;
    --text-main: #000000;
    --text-secondary: #916A5D;
    --accent: #916A5D;
    --accent-light: #7A5A4F;
    --divider: #A18278;
    --btn-bg: rgba(242,227,203,0.678);
    --btn-hover: rgba(242,227,203,0.9);
    --font-serif: 'Fraunces', Georgia, serif;
    --font-mono: 'Kosugi', monospace;
    --font-sans: 'Inter', sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background-color: var(--bg-color); color: var(--text-main); font-family: var(--font-serif); font-weight: 300; line-height: 1.6; padding-bottom: 50px; font-size: 18px; position: relative; min-height: 100vh; }
body::before { content: ''; display: block; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; pointer-events: none; background-image: url("data:image/svg+xml;charset=utf8,%3Csvg%20viewBox%3D%220%200%20512%20512%22%20width%3D%22512%22%20height%3D%22512%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.875%22%20result%3D%22noise%22%2F%3E%3CfeColorMatrix%20type%3D%22matrix%22%20values%3D%220.99609375%200%200%200%200%200%200.8515625%200%200%200%200%200%200.63671875%200%200%200%200%200%200.109375%200%22%2F%3E%3C%2Ffilter%3E%3Crect%20filter%3D%22url%28%23noise%29%22%20x%3D%220%22%20y%3D%220%22%20width%3D%22512%22%20height%3D%22512%22%20fill%3D%22transparent%22%20opacity%3D%221%22%2F%3E%3C%2Fsvg%3E"), linear-gradient(to top, rgba(112,63,63,0.753), rgba(112,63,63,0.753)), url('assets/bg.png'); background-size: 512px, auto, cover; background-position: center, 0% 0%, center; background-repeat: repeat, repeat, no-repeat; }
img { max-width: 100%; display: block; border-radius: 0.375rem; }
.container { width: 90%; max-width: 1000px; margin: 0 auto; }
main.container { background: rgba(255,255,255,0.92); padding: 40px; border-radius: 0.375rem; margin-bottom: 20px; }
.hero { text-align: center; padding: 60px 20px; background: rgba(255,255,255,0.92); margin-bottom: 20px; }
.profile-pic { width: 5.5rem; height: 5.5rem; object-fit: cover; border-radius: 50%; border: 3px solid var(--accent); margin: 0 auto 20px; }
.hero h1 { font-family: var(--font-serif); font-size: 2.5rem; font-weight: 600; margin-bottom: 10px; color: var(--accent); }
.intro { color: var(--text-secondary); font-weight: 400; }
.status-badge { display: inline-block; background: var(--btn-bg); color: var(--text-main); padding: 8px 20px; border-radius: 50px; font-family: var(--font-sans); font-weight: 500; margin-top: 15px; font-size: 0.9rem; transition: transform 0.2s ease; }
.status-badge:hover { transform: scale(1.0775); }
.gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 60px; }
.gallery-item img { width: 100%; height: 300px; object-fit: cover; transition: transform 0.3s ease, box-shadow 0.3s ease; cursor: pointer; }
.gallery-item img:hover { transform: scale(1.02); box-shadow: 0 4px 15px rgba(145,106,93,0.3); }
.pricing-section { margin-bottom: 60px; text-align: center; }
.pricing-section h2, .tos-section h2, .dos-donts h3 { font-family: var(--font-serif); font-weight: 600; margin-bottom: 30px; color: var(--accent); border-bottom: 2px solid var(--divider); display: inline-block; padding-bottom: 5px; }
.pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
.price-card { background: var(--card-bg); padding: 20px; border-radius: 0.375rem; border: 1px solid var(--divider); }
.price-card h3 { font-family: var(--font-mono); color: var(--text-secondary); font-size: 1rem; margin-bottom: 10px; }
.price-img { width: 100%; height: 150px; object-fit: cover; margin: 15px 0; border-radius: 0.375rem; }
.price-card ul { list-style: none; text-align: left; font-family: var(--font-sans); font-size: 0.9rem; }
.price-card li { padding: 8px 0; border-bottom: 1px solid var(--divider); color: var(--text-secondary); }
.price-card li strong { color: var(--text-main); }
.price-placeholder { height: 20px; }
.payment-note { margin-top: 30px; font-size: 0.9rem; color: var(--text-secondary); }
.tos-section { text-align: center; margin-bottom: 60px; }
.tos-list { list-style: none; max-width: 600px; margin: 0 auto; text-align: left; }
.tos-list li { margin-bottom: 10px; padding-left: 10px; color: var(--text-secondary); }
.dos-donts { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-bottom: 60px; }
.col { flex: 1; min-width: 250px; background: var(--card-bg); padding: 20px; border-radius: 0.375rem; border: 1px solid var(--divider); }
.col ul { list-style: none; padding-left: 20px; color: var(--text-secondary); }
.do h3 { color: #4A7A4A; font-family: var(--font-mono); }
.dont h3 { color: #A85454; font-family: var(--font-mono); }
footer { text-align: center; padding: 40px 20px; border-top: 1px solid var(--divider); background: rgba(255,255,255,0.92); }
footer h3 { font-family: var(--font-serif); color: var(--accent); margin-bottom: 20px; }
.social-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.btn { display: inline-block; background: var(--btn-bg); border: none; color: var(--text-main); padding: 12px 24px; margin: 5px; text-decoration: none; border-radius: 50px; cursor: pointer; font-family: var(--font-sans); font-weight: 500; transition: transform 0.2s ease, background 0.3s ease; position: relative; }
.btn:hover { background: var(--btn-hover); transform: scale(1.0775); }
.tooltip { visibility: hidden; background-color: var(--accent); color: #fff; text-align: center; border-radius: 50px; padding: 5px 10px; position: absolute; z-index: 1; bottom: 125%; left: 50%; margin-left: -50px; opacity: 0; transition: opacity 0.3s; font-size: 0.8rem; }
.credit { margin-top: 20px; font-size: 0.8rem; color: var(--accent-light); }
.privacy-note { margin-top: 10px; font-size: 0.75rem; color: var(--text-secondary); }
.privacy-note a { color: var(--accent); text-decoration: none; }
.privacy-note a:hover { text-decoration: underline; }
.lightbox { display: none; position: fixed; z-index: 1000; padding-top: 50px; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(112,63,63,0.9); }
.lightbox-content { margin: auto; display: block; width: 80%; max-width: 1200px; max-height: 80vh; object-fit: contain; border-radius: 0.375rem; }
.close { position: absolute; top: 15px; right: 35px; color: #f1f1f1; font-size: 40px; font-weight: bold; cursor: pointer; }
EOF

# 5. Generate JS
echo "Generating script.js..."
cat << 'EOF' > "$TARGET_DIR/script.js"
document.addEventListener('DOMContentLoaded', () => {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.close');

    document.querySelectorAll('.gallery-item img, .price-img').forEach(img => {
        img.addEventListener('click', function() {
            lightbox.style.display = 'block';
            lightboxImg.src = this.src;
        });
    });

    closeBtn.onclick = function() { lightbox.style.display = 'none'; }
    lightbox.addEventListener('click', function(e) {
        if (e.target !== lightboxImg) lightbox.style.display = 'none';
    });

    const discordBtn = document.getElementById('discordBtn');
    const tooltip = discordBtn.querySelector('.tooltip');
    discordBtn.addEventListener('click', () => {
        const user = discordBtn.getAttribute('data-user');
        navigator.clipboard.writeText(user).then(() => {
            const originalText = discordBtn.childNodes[0].textContent;
            discordBtn.childNodes[0].textContent = "Copied! ";
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
            setTimeout(() => {
                discordBtn.childNodes[0].textContent = "Discord: " + user + " ";
                tooltip.style.visibility = 'hidden';
                tooltip.style.opacity = '0';
            }, 2000);
        });
    });
});
EOF

echo -e "${GREEN}Scaffold complete at: $TARGET_DIR${NC}"