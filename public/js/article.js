// =================================================================
// ARTICLE PAGE JAVASCRIPT
// =================================================================

document.addEventListener('DOMContentLoaded', function () {

    // =================================================================
    // SOCIAL SHARING
    // =================================================================
    const shareButtons = document.querySelectorAll('.share-btn');
    const articleTitle = document.querySelector('.article-title')?.textContent || 'Article';
    const articleUrl = window.location.href;

    shareButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            const platform = this.dataset.platform;
            shareArticle(platform, articleTitle, articleUrl);
        });
    });

    function shareArticle(platform, title, url) {
        let shareUrl = '';

        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
                break;
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
                break;
            case 'copy':
                copyToClipboard(url);
                return;
            default:
                return;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(function () {
            showMessage('Lien copié dans le presse-papiers !', 'success');
        }).catch(function (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showMessage('Lien copié !', 'success');
        });
    }

    // =================================================================
    // STICKY SUBSCRIBE CTA
    // =================================================================
    const stickySubscribe = document.getElementById('stickySubscribe');

    if (stickySubscribe) {
        window.addEventListener('scroll', function () {
            const scrollPosition = window.pageYOffset;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            // Show sticky subscribe after scrolling 50% of the page
            if (scrollPosition > (documentHeight - windowHeight) * 0.5) {
                stickySubscribe.classList.add('visible');
            } else {
                stickySubscribe.classList.remove('visible');
            }
        });
    }

    // =================================================================
    // BOOKMARK & LIKE ACTIONS
    // =================================================================
    const bookmarkBtn = document.querySelector('.meta-action[aria-label="Sauvegarder"]');
    const likeBtn = document.querySelector('.meta-action[aria-label="J\'aime"]');

    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', function () {
            this.classList.toggle('active');
            const icon = this.querySelector('i');

            if (this.classList.contains('active')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                showMessage('Article sauvegardé !', 'success');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                showMessage('Article retiré des favoris', 'info');
            }
        });
    }

    if (likeBtn) {
        likeBtn.addEventListener('click', function () {
            this.classList.toggle('active');
            const icon = this.querySelector('i');
            const countSpan = this.querySelector('span');
            let count = parseInt(countSpan.textContent);

            if (this.classList.contains('active')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                countSpan.textContent = count + 1;
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                countSpan.textContent = count - 1;
            }
        });
    }

    // =================================================================
    // COMMENT FORM
    // =================================================================
    const commentForm = document.querySelector('.comment-form');

    if (commentForm) {
        commentForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const name = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            const comment = this.querySelector('textarea').value;

            if (name && email && comment) {
                showMessage('Merci ! Votre commentaire sera publié après modération.', 'success');
                this.reset();

                // In production, send comment to backend
                // submitComment(name, email, comment);
            }
        });
    }

    // =================================================================
    // COMMENT ACTIONS (Like & Reply)
    // =================================================================
    const commentLikeButtons = document.querySelectorAll('.comment-action');

    commentLikeButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            const icon = this.querySelector('i');

            if (icon && icon.classList.contains('fa-thumbs-up')) {
                // Like button
                this.classList.toggle('active');
                const countSpan = this.querySelector('span');
                if (countSpan) {
                    let count = parseInt(countSpan.textContent);
                    countSpan.textContent = this.classList.contains('active') ? count + 1 : count - 1;
                }
            } else if (icon && icon.classList.contains('fa-reply')) {
                // Reply button
                showMessage('Fonctionnalité de réponse à venir !', 'info');
            }
        });
    });

    // =================================================================
    // READING PROGRESS BAR (optional)
    // =================================================================
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.style.cssText = `
    position: fixed;
    top: 70px;
    left: 0;
    width: 0%;
    height: 4px;
    background: var(--color-primary);
    z-index: 1000;
    transition: width 0.1s ease-out;
  `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', function () {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = window.pageYOffset;
        const progress = (scrolled / documentHeight) * 100;

        progressBar.style.width = progress + '%';
    });

    // =================================================================
    // ESTIMATED READING TIME (already in HTML, but can be calculated dynamically)
    // =================================================================
    function calculateReadingTime() {
        const articleBody = document.querySelector('.article-body');
        if (!articleBody) return 0;

        const text = articleBody.textContent;
        const wordsPerMinute = 200;
        const wordCount = text.trim().split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / wordsPerMinute);

        return readingTime;
    }

    // =================================================================
    // HELPER FUNCTION
    // =================================================================
    function showMessage(message, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;

        const colors = {
            success: 'var(--color-success)',
            error: 'var(--color-error)',
            info: 'var(--color-info)'
        };

        messageEl.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${colors[type] || colors.info};
      color: white;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-xl);
      z-index: 2000;
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
    `;

        document.body.appendChild(messageEl);

        setTimeout(function () {
            messageEl.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(function () {
                if (document.body.contains(messageEl)) {
                    document.body.removeChild(messageEl);
                }
            }, 300);
        }, 4000);
    }

});
