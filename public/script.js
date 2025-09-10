async function fetchBooks() {
  const res = await fetch('/api/books');
  const books = await res.json();
  const container = document.getElementById('books');
  container.innerHTML = '';
  if (!books.length) {
    const empty = document.createElement('div');
    empty.style.opacity = '0.7';
    empty.textContent = 'Пока нет книг. Нажмите «Опубликовать книгу».';
    container.appendChild(empty);
    return;
  }
  for (const b of books) {
    const card = document.createElement('div');
    card.className = 'card';
    const imgSrc = `/api/books/${b.id}/image`;
    const hasImage = true; // попробуем загрузить; если 404 — скроем
    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = b.title;
    img.addEventListener('error', () => { img.style.display = 'none'; });
    card.appendChild(img);

    const content = document.createElement('div');
    content.className = 'content';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = b.title;
    const meta = document.createElement('div');
    meta.className = 'meta';
    const avg = b.avg_rating !== null ? Number(b.avg_rating).toFixed(2) : '—';
    meta.textContent = `Средняя: ${avg} • Голосов: ${b.votes}`;
    const rate = document.createElement('div');
    rate.className = 'rate';
    for (let i = 1; i <= 5; i++) {
      const btn = document.createElement('button');
      btn.textContent = String(i);
      btn.addEventListener('click', async () => {
        await fetch(`/api/books/${b.id}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: i }),
        });
        fetchBooks();
      });
      rate.appendChild(btn);
    }
    content.appendChild(title);
    content.appendChild(meta);
    content.appendChild(rate);
    card.appendChild(content);

    container.appendChild(card);
  }
}

function initPublishDialog() {
  const dialog = document.getElementById('publishDialog');
  const openBtn = document.getElementById('openPublish');
  const form = document.getElementById('publishForm');
  openBtn.addEventListener('click', () => dialog.showModal());
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const res = await fetch('/api/books', { method: 'POST', body: formData });
    if (res.ok) {
      form.reset();
      dialog.close();
      fetchBooks();
    }
  });
}

initPublishDialog();
fetchBooks();


