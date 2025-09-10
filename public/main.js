async function fetchBooks() {
  const res = await fetch('/api/books');
  if (!res.ok) throw new Error('Failed to load');
  return await res.json();
}

async function publishBook(title) {
  const res = await fetch('/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  if (!res.ok) throw new Error('Failed to publish');
  return await res.json();
}

async function voteBook(id, score) {
  const res = await fetch(`/api/books/${id}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score })
  });
  if (!res.ok) throw new Error('Failed to vote');
  return await res.json();
}

function render(books) {
  const empty = document.getElementById('empty');
  const list = document.getElementById('list');
  list.innerHTML = '';
  if (!books || books.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  books.forEach((b) => {
    const li = document.createElement('li');
    li.className = 'card';
    const left = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = b.title;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `Средняя: ${b.average} | Голосов: ${b.votesCount}`;
    left.appendChild(title);
    left.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'actions';
    for (let s = 1; s <= 5; s++) {
      const btn = document.createElement('button');
      btn.className = 'star';
      btn.title = `Оценить на ${s}`;
      btn.textContent = s;
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          const updated = await voteBook(b.id, s);
          meta.textContent = `Средняя: ${updated.average} | Голосов: ${updated.votesCount}`;
        } catch (e) {
          alert('Не удалось отправить голос');
        } finally {
          btn.disabled = false;
        }
      });
      actions.appendChild(btn);
    }

    li.appendChild(left);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

async function bootstrap() {
  const form = document.getElementById('publish-form');
  const titleInput = document.getElementById('title-input');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) return;
    form.querySelector('button').disabled = true;
    try {
      await publishBook(title);
      titleInput.value = '';
      const books = await fetchBooks();
      render(books);
    } catch (e) {
      alert('Не удалось опубликовать книгу');
    } finally {
      form.querySelector('button').disabled = false;
    }
  });

  try {
    const books = await fetchBooks();
    render(books);
  } catch (e) {
    console.error(e);
  }
}

bootstrap();


