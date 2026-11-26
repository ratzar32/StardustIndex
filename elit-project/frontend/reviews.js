// ---------- silent anonymous ID ----------
function getAnonId() {
    let id = localStorage.getItem('elit_uid');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('elit_uid', id);
    }
    return id;
}

// ---------- star review widget ----------
const CHAPTER_ID = 'chapter-1';
// Point this at your deployed backend once it's live (Express + MongoDB Atlas).
const API_URL = 'https://stardustindex.onrender.com/api/review';

document.addEventListener('DOMContentLoaded', () => {
    const starRow = document.getElementById('starRow');
    const submitBtn = document.getElementById('submitBtn');
    const commentBox = document.getElementById('commentBox');
    const statusEl = document.getElementById('reviewStatus');

    if (!starRow) return; // no review widget on this page

    let selectedScore = null;
    const stars = [];

    function paintStars(upTo) {
        stars.forEach((s, i) => s.classList.toggle('on', i < upTo));
    }

    for (let i = 1; i <= 10; i++) {
        const star = document.createElement('button');
        star.type = 'button';
        star.className = 'star-btn';
        star.textContent = '★';
        star.setAttribute('aria-label', i + ' out of 10');

        star.addEventListener('mouseenter', () => paintStars(i));
        star.addEventListener('mouseleave', () => paintStars(selectedScore || 0));
        star.addEventListener('click', () => {
            selectedScore = i;
            paintStars(i);
            submitBtn.disabled = false;
        });

        stars.push(star);
        starRow.appendChild(star);
    }

    submitBtn.addEventListener('click', async () => {
        if (selectedScore === null) return;
        submitBtn.disabled = true;
        statusEl.textContent = 'Sending…';

        const payload = {
            chapterId: CHAPTER_ID,
            anonId: getAnonId(),
            score: selectedScore,
            comment: commentBox.value.trim()
        };

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('bad response');
            statusEl.textContent = 'Thanks!';
        } catch (err) {
            // Backend not wired up yet, or the request failed — keep the review
            // locally so nothing is lost.
            localStorage.setItem('elit_review_' + CHAPTER_ID, JSON.stringify(payload));
            statusEl.textContent = 'Saved locally.';
        } finally {
            submitBtn.disabled = false;
        }
    });
});
