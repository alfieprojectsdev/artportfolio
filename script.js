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
