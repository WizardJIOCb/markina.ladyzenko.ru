const works = [
  { name: 'Цветочная история', image: 'bridal', category: 'Серьги', detail: 'Цветы и речной жемчуг', types: ['earrings', 'wedding'], post: '555', description: 'Цветочные серьги из холодного фарфора с речным жемчугом. Нежный акцент для особенного дня.' },
  { name: 'Винтажная роза', image: 'rose', category: 'Серьги', detail: 'Винтажное настроение', types: ['earrings'], post: '561', description: 'Рельефная роза в винтажном обрамлении. Работа из авторской серии Ирины «Винтажная роза».' },
  { name: 'Лисички', image: 'fox', category: 'Серьги', detail: 'Немного доброй иронии', types: ['earrings'], post: '515', description: 'Рыжие лисички, которые добавляют образу тепла и немного игривости.' },
  { name: 'Мальтийские кресты', image: 'cross', category: 'Серьги', detail: 'Выразительная форма', types: ['earrings'], post: '534', description: 'Декоративные серьги с мотивом мальтийского креста. В авторском канале представлены разные цветовые варианты.' },
  { name: 'Матрёшка', image: 'matryoshka', category: 'Подвеска', detail: 'Русские мотивы', types: ['pendants'], post: '524', description: 'Маленькая матрёшка как самостоятельное украшение. Деталь с узнаваемым характером.' },
  { name: 'Жуки и мухи', image: 'insects', category: 'Серьги', detail: 'Неожиданный природный мотив', types: ['earrings'], post: '558', description: 'Неожиданный природный мотив в тёмном цвете. Для тех, кому нравятся необычные акценты.' },
];
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const scrollBehavior = () => reduceMotion.matches ? 'instant' : 'smooth';
const arrow = '<svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>';
const grid = $('#works-grid');

works.forEach((work, index) => {
  const card = document.createElement('article');
  card.className = 'work-card';
  card.dataset.reveal = '';
  card.dataset.types = work.types.join(' ');
  card.style.setProperty('--reveal-delay', `${index % 3 * 80}ms`);
  card.innerHTML = `<button type="button" class="work-photo media" data-work="${index}" aria-label="Рассмотреть: ${work.name}"><img src="/assets/${work.image}.webp" alt="${work.name}, украшение Ирины Маркиной" loading="lazy" width="600" height="750"><span class="image-fallback" hidden>Фото не загрузилось. Откройте карточку, чтобы перейти к публикации.</span><span class="work-category">${work.category}</span><span class="work-open">${arrow}</span></button><div class="work-info"><div><h3>${work.name}</h3><p>${work.detail}</p></div><span>0${index + 1}</span></div>`;
  grid.append(card);
});

$$('.media img').forEach(img => {
  const media = img.closest('.media');
  const loaded = () => media.classList.add('is-loaded');
  const failed = () => {
    img.hidden = true;
    const fallback = media.querySelector('.image-fallback');
    if (fallback) fallback.hidden = false;
  };
  img.addEventListener('load', loaded, { once: true });
  img.addEventListener('error', failed, { once: true });
  if (img.complete) img.naturalWidth > 0 ? loaded() : failed();
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: .12 });
document.body.classList.add('motion-ready');
$$('[data-reveal]').forEach(el => revealObserver.observe(el));

$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  $$('[data-filter]').forEach(other => {
    const selected = other === button;
    other.classList.toggle('is-current', selected);
    other.setAttribute('aria-pressed', String(selected));
  });
  $$('.work-card').forEach(card => {
    card.hidden = filter !== 'all' && !card.dataset.types.split(' ').includes(filter);
    if (!card.hidden) {
      card.classList.add('is-visible');
      if (!reduceMotion.matches) card.animate([
        { opacity: 0, transform: 'translateY(16px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 500, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
  });
  $('#empty-state').hidden = $$('.work-card').some(card => !card.hidden);
}));

// The photograph is the story: an outfit and its corresponding piece change together.
// The page background never moves. Only the photo layers crossfade inside their clips.
const stories = [works[0], works[2], works[1]];
let currentStory = 0;
let storyTimer;
let stageVisible = false;
let manuallyPaused = false;
let hovered = false;
const stage = $('.hero-stage');
const pauseButton = $('#pause-slides');
function syncStories() {
  clearTimeout(storyTimer);
  const paused = manuallyPaused || reduceMotion.matches;
  pauseButton.setAttribute('aria-pressed', String(paused));
  pauseButton.setAttribute('aria-label', reduceMotion.matches
    ? 'Автоматическая смена фото отключена настройкой уменьшения движения'
    : paused ? 'Продолжить смену фото' : 'Приостановить смену фото');
  pauseButton.querySelector('use').setAttribute('href', paused ? '#i-play' : '#i-pause');
  pauseButton.disabled = reduceMotion.matches;
  if (!paused && stageVisible && !hovered && !document.hidden) {
    storyTimer = setTimeout(() => {
      showStory((currentStory + 1) % stories.length);
      syncStories();
    }, 5500);
  }
}
function showStory(index) {
  currentStory = index;
  $$('[data-slide-image]').forEach((image, i) => {
    image.classList.toggle('is-current', i === index);
    image.setAttribute('aria-hidden', String(i !== index));
  });
  $$('[data-detail-image]').forEach((image, i) => {
    image.classList.toggle('is-current', i === index);
    image.setAttribute('aria-hidden', String(i !== index));
  });
  $$('[data-slide]').forEach((button, i) => {
    button.classList.toggle('is-current', i === index);
    button.setAttribute('aria-pressed', String(i === index));
  });
  const work = stories[index];
  $('#hero-work-name').textContent = work.name;
  $('#slide-current').textContent = `0${index + 1}`;
  $('#hero-publication').href = `https://t.me/farfforija/${work.post}`;
  $('#hero-publication').setAttribute('aria-label', `Публикация мастера: ${work.name}`);
}
new IntersectionObserver(entries => {
  stageVisible = entries[0].isIntersecting;
  syncStories();
}, { threshold: .3 }).observe(stage);
$$('[data-slide]').forEach(button => button.addEventListener('click', () => {
  showStory(Number(button.dataset.slide));
  syncStories();
}));
pauseButton.addEventListener('click', () => { manuallyPaused = !manuallyPaused; syncStories(); });
stage.addEventListener('mouseenter', () => { hovered = true; syncStories(); });
stage.addEventListener('mouseleave', () => { hovered = false; syncStories(); });
stage.addEventListener('focusin', () => { hovered = true; syncStories(); });
stage.addEventListener('focusout', event => {
  if (!stage.contains(event.relatedTarget)) { hovered = false; syncStories(); }
});
document.addEventListener('visibilitychange', syncStories);
reduceMotion.addEventListener('change', syncStories);
showStory(0);
syncStories();

// Word activation is tied to scroll progress, rather than replaying a timed headline loop.
const tagline = $('.tagline-text');
$$('.tagline-line').forEach(line => {
  const words = line.textContent.split(' ');
  line.replaceChildren(...words.flatMap((word, index) => {
    const span = document.createElement('span');
    span.className = 'tagline-word';
    span.textContent = word;
    return index ? [document.createTextNode(' '), span] : [span];
  }));
});
const taglineWords = $$('.tagline-word');
let taglineVisible = false;
let pendingTaglineFrame = false;
function paintTagline() {
  pendingTaglineFrame = false;
  const box = tagline.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, (innerHeight * .85 - box.top) / (box.height + innerHeight * .15)));
  taglineWords.forEach((word, i) => word.classList.toggle('is-lit', reduceMotion.matches || progress >= i / taglineWords.length));
}
const taglineObserver = new IntersectionObserver(entries => {
  taglineVisible = entries[0].isIntersecting;
  if (taglineVisible) paintTagline();
});
taglineObserver.observe(tagline);
window.addEventListener('scroll', () => {
  if (taglineVisible && !pendingTaglineFrame) {
    pendingTaglineFrame = true;
    requestAnimationFrame(paintTagline);
  }
}, { passive: true });
window.addEventListener('resize', () => { if (taglineVisible) paintTagline(); });
reduceMotion.addEventListener('change', paintTagline);

const enteringDialogs = new WeakMap();
const closingDialogs = new WeakMap();
function animateDialog(dialog) {
  if (reduceMotion.matches) return;
  const animation = dialog.animate([
    { opacity: 0, transform: 'translateY(24px) scale(.985)' },
    { opacity: 1, transform: 'translateY(0) scale(1)' },
  ], { duration: 500, easing: 'cubic-bezier(.22,1,.36,1)' });
  enteringDialogs.set(dialog, animation);
  animation.finished.then(() => {
    if (enteringDialogs.get(dialog) === animation) enteringDialogs.delete(dialog);
  }).catch(() => {});
}
function closeDialog(dialog) {
  if (!dialog.open) return Promise.resolve();
  if (closingDialogs.has(dialog)) return closingDialogs.get(dialog);
  const finished = (async () => {
    if (reduceMotion.matches) { dialog.close(); return; }
    const style = getComputedStyle(dialog);
    const from = { opacity: style.opacity, transform: style.transform };
    enteringDialogs.get(dialog)?.cancel();
    enteringDialogs.delete(dialog);
    dialog.classList.add('is-closing');
    const animation = dialog.animate([
      from,
      { opacity: 0, transform: 'translateY(16px) scale(.985)' },
    ], { duration: 500, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
    try { await animation.finished; } catch { /* Finish closing if the animation is cancelled. */ }
    dialog.close();
    animation.cancel();
    dialog.classList.remove('is-closing');
  })().finally(() => closingDialogs.delete(dialog));
  closingDialogs.set(dialog, finished);
  return finished;
}
$$('[data-close]').forEach(button => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));
$$('dialog').forEach(dialog => dialog.addEventListener('cancel', event => {
  event.preventDefault();
  closeDialog(dialog);
}));
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target !== dialog || dialog.classList.contains('mobile-menu')) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
}));
const workDialog = $('#work-dialog');
let selectedWork = works[0];
$$('[data-work]').forEach(button => button.addEventListener('click', () => {
  selectedWork = works[Number(button.dataset.work)];
  $('#work-image').src = `/assets/${selectedWork.image}.webp`;
  $('#work-image').alt = selectedWork.name;
  $('#work-title').textContent = selectedWork.name;
  $('#work-type').textContent = `${selectedWork.category} · ${selectedWork.detail}`;
  $('#work-description').textContent = selectedWork.description;
  $('#work-source').href = `https://t.me/farfforija/${selectedWork.post}`;
  workDialog.showModal();
  animateDialog(workDialog);
}));
$('#choose-work').addEventListener('click', async () => {
  $('#selected-work').value = selectedWork.name;
  $('#message-result').hidden = true;
  await closeDialog(workDialog);
  $('#contact').scrollIntoView({ behavior: scrollBehavior() });
  $('#wishes').focus({ preventScroll: true });
});

const menuDialog = $('#mobile-menu');
const menuToggle = $('.menu-toggle');
menuToggle.addEventListener('click', () => {
  if (menuDialog.open) { closeDialog(menuDialog); return; }
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggle.setAttribute('aria-label', 'Закрыть меню');
  menuDialog.showModal();
  animateDialog(menuDialog);
  requestAnimationFrame(() => menuDialog.classList.add('is-open'));
});
menuDialog.addEventListener('close', () => {
  menuDialog.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
});
$$('#mobile-menu nav a').forEach(link => link.addEventListener('click', async event => {
  event.preventDefault();
  await closeDialog(menuDialog);
  if (location.hash !== link.hash) location.hash = link.hash;
  else $(link.hash)?.scrollIntoView({ behavior: scrollBehavior() });
}));
matchMedia('(min-width:801px)').addEventListener('change', event => { if (event.matches && menuDialog.open) closeDialog(menuDialog); });
const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  $$('.desktop-links a').forEach(link => {
    if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}), { rootMargin: '-20% 0px -60% 0px' });
['#works', '#maker', '#questions'].forEach(id => navObserver.observe($(id)));

$('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const wishes = $('#wishes');
  if (!wishes.value.trim()) {
    $('#wishes-error').textContent = 'Напишите несколько слов о вашем украшении, чтобы подготовить сообщение.';
    $('#wishes-error').hidden = false;
    wishes.setAttribute('aria-invalid', 'true');
    wishes.focus();
    return;
  }
  wishes.removeAttribute('aria-invalid');
  $('#wishes-error').hidden = true;
  const work = works.find(item => item.name === $('#selected-work').value);
  $('#message-text').value = [
    'Ирина, здравствуйте! Увидела ваши украшения на сайте «Фарфория».',
    `Мне интересно: ${$('#selected-work').value}.`,
    work ? `Понравилась работа: https://t.me/farfforija/${work.post}` : '',
    $('#occasion').value.trim() ? `Повод: ${$('#occasion').value.trim()}` : '',
    `Мои пожелания: ${wishes.value.trim()}`,
    'Подскажите, пожалуйста, возможность заказа, стоимость, сроки и способ получения.',
  ].filter(Boolean).join('\n\n');
  $('#message-result').hidden = false;
  $('#copy-status').textContent = 'Сообщение подготовлено. Скопируйте его и отправьте Ирине в диалоге.';
  $('#message-result').scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' });
});
$('#contact-form').addEventListener('input', event => {
  if (event.target.id !== 'message-text') $('#message-result').hidden = true;
  if (event.target.id === 'wishes' && event.target.value.trim()) {
    $('#wishes-error').hidden = true;
    event.target.removeAttribute('aria-invalid');
  }
});
$('#selected-work').addEventListener('change', () => { $('#message-result').hidden = true; });
$('#copy-message').addEventListener('click', async () => {
  const field = $('#message-text');
  try {
    await navigator.clipboard.writeText(field.value);
    $('#copy-status').textContent = 'Текст скопирован. Откройте диалог VK, вставьте сообщение и отправьте его Ирине.';
  } catch {
    field.focus();
    field.select();
    $('#copy-status').textContent = 'Не удалось скопировать автоматически. Текст выделен, скопируйте его вручную.';
  }
});

const info = {
  privacy: { title: 'Конфиденциальность', paragraphs: [
    'Текст обращения подготавливается в вашем браузере. Сайт не отправляет его Ирине автоматически и не сохраняет заявки на сервере.',
    'Веб сервер ведёт стандартный журнал обращений. Он может содержать IP адрес, время запроса, адрес страницы и сведения о браузере.',
    'Шрифт загружается из Google Fonts. Ссылки на VK, Telegram и Instagram открывают внешние сервисы, где действуют их собственные правила обработки данных.',
    'Форма не запрашивает платёжные данные. Не указывайте в ней информацию, которую не хотите передавать в личном диалоге с мастером.',
  ] },
  terms: { title: 'Условия обращения', paragraphs: [
    'На странице представлены примеры работ Ирины Маркиной. Галерея не подтверждает наличие украшения или возможность его точного повтора.',
    'Подготовка сообщения не оформляет заказ. Стоимость, материалы, сроки, оплату и способ получения необходимо согласовать непосредственно с мастером.',
    'Контакты и фотографии взяты из авторского канала «Фарфория». Уточнить актуальные условия можно по телефону +7 921 907 72 53 или в личном диалоге VK.',
  ] },
};
$$('[data-info]').forEach(button => button.addEventListener('click', () => {
  const content = info[button.dataset.info];
  $('#info-title').textContent = content.title;
  $('#info-content').replaceChildren(...content.paragraphs.map(text => {
    const p = document.createElement('p'); p.textContent = text; return p;
  }));
  $('#info-dialog').showModal();
  animateDialog($('#info-dialog'));
}));
