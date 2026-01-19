/*
   script.js
   This file handles the interactive elements of the website.
   It runs after the HTML has finished loading (DOMContentLoaded).
*/
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // LIGHTBOX FUNCTIONALITY
    // ==========================================

    // Select the lightbox elements from the HTML
    const lightbox = document.getElementById('lightbox'); // The dark overlay
    const lightboxImg = document.getElementById('lightbox-img'); // The container for the image
    const closeBtn = document.querySelector('.close'); // The 'X' button

    // 1. Add click listeners to all gallery and pricing images
    document.querySelectorAll('.gallery-item img, .price-img').forEach(img => {
        img.addEventListener('click', function() {
            // When an image is clicked:
            lightbox.style.display = 'block'; // Show the lightbox
            lightboxImg.src = this.src;       // Copy the clicked image's source to the lightbox
        });
    });

    // 2. Close the lightbox when the 'X' button is clicked
    closeBtn.onclick = function() {
        lightbox.style.display = 'none';
    }

    // 3. Close the lightbox when clicking outside the image (on the dark background)
    lightbox.addEventListener('click', function(e) {
        if (e.target !== lightboxImg) {
            lightbox.style.display = 'none';
        }
    });

    // ==========================================
    // DISCORD COPY-TO-CLIPBOARD
    // ==========================================

    const discordBtn = document.getElementById('discordBtn');
    const tooltip = discordBtn.querySelector('.tooltip');

    discordBtn.addEventListener('click', () => {
        // Get the username from the 'data-user' attribute in HTML
        const user = discordBtn.getAttribute('data-user');

        // Use the clipboard API to copy the text
        navigator.clipboard.writeText(user).then(() => {
            // Success! Visual feedback:
            const originalText = discordBtn.childNodes[0].textContent;

            // Change button text
            discordBtn.childNodes[0].textContent = "Copied! ";

            // Show the tooltip
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';

            // Reset after 2 seconds
            setTimeout(() => {
                discordBtn.childNodes[0].textContent = "Discord: " + user + " ";
                tooltip.style.visibility = 'hidden';
                tooltip.style.opacity = '0';
            }, 2000);
        });
    });
});
