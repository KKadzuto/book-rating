function getOrCreateClientId() {
  const key = 'client_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    localStorage.setItem(key, id);
  }
  return id;
}

async function fetchStats() {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to load stats');
  return await res.json();
}

async function fetchBooks() {
  const res = await fetch('/api/books');
  if (!res.ok) throw new Error('Failed to load books');
  return await res.json();
}

async function publishBook(formData) {
  const res = await fetch('/api/books', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Failed to publish');
  return await res.json();
}

async function voteBook(id, score, clientId) {
  const res = await fetch(`/api/books/${id}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-Id': clientId },
    body: JSON.stringify({ score })
  });
  if (res.status === 409) return { already: true };
  if (!res.ok) throw new Error('Failed to vote');
  return await res.json();
}

function renderViewer(book) {
  const cover = document.getElementById('cover');
  const title = document.getElementById('title');
  const meta = document.getElementById('meta');
  if (!book) {
    cover.style.display = 'none';
    title.textContent = 'Пока нет книг';
    meta.textContent = 'Опубликуйте первую книгу';
    return;
  }
  cover.style.display = 'block';
  cover.src = `/api/books/${book.id}/image`;
  cover.alt = book.title;
  cover.onerror = () => { cover.style.display = 'none'; };
  title.textContent = book.title;
  const avg = book.avg_rating !== null ? Number(book.avg_rating).toFixed(2) : '—';
  meta.textContent = `Средняя: ${avg} • Голосов: ${book.votes}`;
}

function renderStats(rows) {
  const table = document.getElementById('statsTable');
  table.innerHTML = '';
  if (!rows || rows.length === 0) {
    table.textContent = 'Нет данных';
    return;
  }
  const header = document.createElement('div');
  header.className = 'row head';
  header.innerHTML = '<div>Название</div><div>Средняя</div><div>Голоса</div>';
  table.appendChild(header);
  rows.forEach((r) => {
    const row = document.createElement('div');
    row.className = 'row';
    const avg = r.avg_rating !== null ? Number(r.avg_rating).toFixed(2) : '—';
    row.innerHTML = `<div>${r.title}</div><div>${avg}</div><div>${r.votes}</div>`;
    table.appendChild(row);
  });
}

async function bootstrap() {
  const clientId = getOrCreateClientId();
  const openBtn = document.getElementById('openPublish');
  const rateBtn = document.getElementById('rate');
  const nextBtn = document.getElementById('next');
  const langButtons = document.querySelectorAll('.lang-switch button');

  // Publish dialog
  const dialog = document.getElementById('publishDialog');
  const form = document.getElementById('publishForm');
  openBtn.addEventListener('click', () => dialog.showModal());
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    try {
      await publishBook(data);
      form.reset();
      dialog.close();
      // refresh lists
      const stats = await fetchStats();
      renderStats(stats);
      books = await fetchBooks();
      currentIndex = 0;
      renderViewer(books[0]);
    } catch (e) {
      alert('Не удалось опубликовать книгу');
    }
  });

  // Load initial
  let books = await fetchBooks();
  let currentIndex = 0;
  renderViewer(books[0]);
  const stats = await fetchStats();
  renderStats(stats);

  // i18n
  const dict = {
    kk: {
      title_app: 'Кітаптар', publish_button: 'Жариялау', rate_button: 'Бағалау', next_button: 'Келесі',
      stats_title: 'Статистика', publish_title: 'Кітапты жариялау', field_title: 'Атауы', field_image: 'Сурет (міндетті емес)',
      cancel: 'Болдырмау', publish_submit: 'Жариялау', rate_title: 'Кітапты бағалаңыз',
      empty_title: 'Әзірге кітап жоқ', empty_sub: 'Алғашқы кітапты жариялаңыз', already_voted: 'Сіз бұл кітапқа дауыс бердіңіз'
    },
    ru: {
      title_app: 'Книги', publish_button: 'Опубликовать', rate_button: 'Оценить', next_button: 'Следующая',
      stats_title: 'Статистика', publish_title: 'Опубликовать книгу', field_title: 'Название', field_image: 'Фото (необязательно)',
      cancel: 'Отмена', publish_submit: 'Опубликовать', rate_title: 'Оцените книгу',
      empty_title: 'Пока нет книг', empty_sub: 'Опубликуйте первую книгу', already_voted: 'Вы уже голосовали за эту книгу'
    },
    en: {
      title_app: 'Books', publish_button: 'Publish', rate_button: 'Rate', next_button: 'Next',
      stats_title: 'Statistics', publish_title: 'Publish a book', field_title: 'Title', field_image: 'Image (optional)',
      cancel: 'Cancel', publish_submit: 'Publish', rate_title: 'Rate the book',
      empty_title: 'No books yet', empty_sub: 'Publish the first one', already_voted: 'You have already voted for this book'
    }
  };
  function applyLanguage(lang) {
    const lng = dict[lang] ? lang : 'kk';
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[lng][key]) el.textContent = dict[lng][key];
    });
  }
  const savedLang = localStorage.getItem('lang') || 'kk';
  applyLanguage(savedLang);
  langButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      localStorage.setItem('lang', lang);
      applyLanguage(lang);
    });
  });

  // Rate via modal
  const rateDialog = document.getElementById('rateDialog');
  const rateForm = document.getElementById('rateForm');
  const rateButtons = rateForm.querySelectorAll('button[data-score]');
  let rateOpen = false;
  rateBtn.addEventListener('click', () => {
    if (rateOpen) return;
    rateOpen = true;
    rateDialog.showModal();
  });
  rateForm.addEventListener('close', () => { rateOpen = false; });
  rateForm.addEventListener('reset', () => { rateDialog.close(); });
  rateButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const score = Number(btn.getAttribute('data-score'));
      const book = books[currentIndex];
      if (!book) return;
      const result = await voteBook(book.id, score, clientId);
      if (result && result.already) {
        alert('Вы уже голосовали за эту книгу');
      }
      rateDialog.close();
      // refresh
      books = await fetchBooks();
      renderViewer(books[currentIndex]);
      const statsNow = await fetchStats();
      renderStats(statsNow);
    });
  });

  // Next
  nextBtn.addEventListener('click', () => {
    if (!books || books.length === 0) return;
    currentIndex = (currentIndex + 1) % books.length;
    renderViewer(books[currentIndex]);
  });

  // Auto-refresh
  setInterval(async () => {
    try {
      const [booksNow, statsNow] = await Promise.all([fetchBooks(), fetchStats()]);
      books = booksNow;
      if (books[currentIndex]) {
        renderViewer(books[currentIndex]);
      } else {
        currentIndex = 0;
        renderViewer(books[0]);
      }
      renderStats(statsNow);
    } catch {}
  }, 10000);
}

bootstrap();


