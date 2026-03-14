const sampleQuestions = [
  {
    key: 'q1',
    type: 'single-choice',
    prompt: 'Chon tu dung voi buc tranh mat troi.',
    instructions: 'Chi chon 1 dap an.',
    imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=80',
    optionsRaw: 'sun|Sun\nmoon|Moon\nstar|Star',
    correctAnswersRaw: 'sun',
    acceptedAnswersRaw: '',
    dragItemsRaw: '',
    dragTargetsRaw: ''
  },
  {
    key: 'q2',
    type: 'multiple-choice',
    prompt: 'Chon tat ca con vat song duoi nuoc.',
    instructions: 'Co the co nhieu dap an dung.',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80',
    optionsRaw: 'fish|Fish\nshark|Shark\ncat|Cat\nduck|Duck',
    correctAnswersRaw: 'fish, shark',
    acceptedAnswersRaw: '',
    dragItemsRaw: '',
    dragTargetsRaw: ''
  },
  {
    key: 'q3',
    type: 'fill-blank',
    prompt: 'Dien vao cho trong: I ___ a student.',
    instructions: '',
    optionsRaw: '',
    correctAnswersRaw: '',
    acceptedAnswersRaw: "am, 'm",
    dragItemsRaw: '',
    dragTargetsRaw: ''
  },
  {
    key: 'q4',
    type: 'drag-drop',
    prompt: 'Keo tu tieng Anh vao nghia tieng Viet dung.',
    instructions: '',
    optionsRaw: '',
    correctAnswersRaw: '',
    acceptedAnswersRaw: '',
    dragItemsRaw: 'apple|Apple\nbook|Book\ndog|Dog',
    dragTargetsRaw: 'tao|Qua tao|apple\nquyen-sach|Quyen sach|book\ncon-cho|Con cho|dog'
  }
];

const fillButton = document.getElementById('fill-sample-json');
const addQuestionButton = document.getElementById('add-question-btn');
const questionList = document.getElementById('question-list');
const form = document.getElementById('admin-exam-form');
const storage = document.getElementById('questions-json-storage');

if (questionList && form && storage) {
  let questionCounter = 0;

  const escapeHtml = (value) =>
    String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');

  const nextKey = () => {
    questionCounter += 1;
    return `q${questionCounter}`;
  };

  const normalizeImageUrl = (value) => {
    const trimmedValue = String(value || '').trim().replace(/^['"]|['"]$/g, '');

    if (!trimmedValue) {
      return '';
    }

    if (trimmedValue.includes('drive.google.com/file/d/')) {
      const match = trimmedValue.match(/\/d\/([^/]+)/);

      if (match?.[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
    }

    if (trimmedValue.includes('dropbox.com/')) {
      return trimmedValue.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
    }

    return trimmedValue.replaceAll(' ', '%20');
  };

  const getQuestionCardValues = (card) => {
    const getValue = (selector) => card.querySelector(selector)?.value?.trim() || '';

    return {
      key: getValue('[data-field="key"]'),
      type: getValue('[data-field="type"]'),
      prompt: getValue('[data-field="prompt"]'),
      instructions: getValue('[data-field="instructions"]'),
      imageUrl: getValue('[data-field="imageUrl"]'),
      optionsRaw: getValue('[data-field="optionsRaw"]'),
      correctAnswersRaw: getValue('[data-field="correctAnswersRaw"]'),
      acceptedAnswersRaw: getValue('[data-field="acceptedAnswersRaw"]'),
      dragItemsRaw: getValue('[data-field="dragItemsRaw"]'),
      dragTargetsRaw: getValue('[data-field="dragTargetsRaw"]')
    };
  };

  const updateImagePreview = (card) => {
    const imageInput = card.querySelector('[data-field="imageUrl"]');
    const previewWrap = card.querySelector('.question-builder__preview-wrap');
    const preview = card.querySelector('[data-role="image-preview"]');
    const previewState = card.querySelector('[data-role="image-preview-state"]');

    if (!imageInput || !previewWrap || !preview || !previewState) {
      return;
    }

    const url = normalizeImageUrl(imageInput.value);

    if (!url) {
      preview.removeAttribute('src');
      preview.hidden = true;
      previewWrap.hidden = true;
      previewState.hidden = false;
      previewState.textContent = 'Nhap URL de xem truoc hinh anh.';
      return;
    }

    previewWrap.hidden = false;
    previewState.hidden = false;
    previewState.textContent = 'Dang tai hinh anh...';
    preview.hidden = true;
    preview.referrerPolicy = 'no-referrer';

    if (preview.getAttribute('src') === url && preview.complete) {
      preview.hidden = false;
      previewState.hidden = true;
      return;
    }

    preview.removeAttribute('src');
    window.requestAnimationFrame(() => {
      preview.src = url;
    });

  };

  const updateTypeSections = (card) => {
    const type = card.querySelector('[data-field="type"]').value;
    const blocks = card.querySelectorAll('[data-block]');

    blocks.forEach((block) => {
      block.hidden = block.dataset.block !== type;
    });

    updateImagePreview(card);
  };

  const renderQuestionCard = (question = {}) => {
    const defaultType = question.type || 'single-choice';
    const card = document.createElement('article');
    card.className = 'question-builder__card';
    card.innerHTML = `
      <div class="question-builder__card-head">
        <h3>Cau hoi</h3>
        <button type="button" class="admin-danger" data-action="remove-question">Xoa</button>
      </div>

      <div class="question-builder__common">
        <label>
          <span>Key cau hoi</span>
          <input type="text" data-field="key" value="${escapeHtml(question.key || nextKey())}" />
        </label>

        <label>
          <span>Loai cau hoi</span>
          <select data-field="type">
            <option value="single-choice" ${defaultType === 'single-choice' ? 'selected' : ''}>single-choice</option>
            <option value="multiple-choice" ${defaultType === 'multiple-choice' ? 'selected' : ''}>multiple-choice</option>
            <option value="fill-blank" ${defaultType === 'fill-blank' ? 'selected' : ''}>fill-blank</option>
            <option value="drag-drop" ${defaultType === 'drag-drop' ? 'selected' : ''}>drag-drop</option>
          </select>
        </label>

        <label class="question-builder__full">
          <span>Noi dung cau hoi</span>
          <textarea rows="2" data-field="prompt" placeholder="Nhap noi dung cau hoi">${escapeHtml(question.prompt || '')}</textarea>
        </label>

        <label class="question-builder__full">
          <span>Huong dan (khong bat buoc)</span>
          <textarea rows="2" data-field="instructions" placeholder="Vi du: Chon 1 dap an dung">${escapeHtml(question.instructions || '')}</textarea>
        </label>

        <label class="question-builder__full">
          <span>URL hinh anh (khong bat buoc)</span>
          <input type="text" data-field="imageUrl" placeholder="https://..." value="${escapeHtml(question.imageUrl || '')}" />
        </label>

        <div class="question-builder__full question-builder__preview-wrap">
          <img data-role="image-preview" class="question-builder__preview" alt="Preview hinh cau hoi" hidden />
          <p data-role="image-preview-state" class="question-builder__preview-state">
            Nhap URL de xem truoc hinh anh.
          </p>
        </div>
      </div>

      <div class="question-builder__type" data-block="single-choice">
        <label>
          <span>Options (moi dong: key|text)</span>
          <textarea rows="4" data-field="optionsRaw" placeholder="sun|Sun\nmoon|Moon">${escapeHtml(question.optionsRaw || '')}</textarea>
        </label>
        <label>
          <span>Dap an dung (phan cach boi dau phay)</span>
          <input type="text" data-field="correctAnswersRaw" placeholder="sun" value="${escapeHtml(question.correctAnswersRaw || '')}" />
        </label>
      </div>

      <div class="question-builder__type" data-block="multiple-choice">
        <label>
          <span>Options (moi dong: key|text)</span>
          <textarea rows="4" data-field="optionsRaw" placeholder="fish|Fish\nshark|Shark\ncat|Cat">${escapeHtml(question.optionsRaw || '')}</textarea>
        </label>
        <label>
          <span>Dap an dung (phan cach boi dau phay)</span>
          <input type="text" data-field="correctAnswersRaw" placeholder="fish, shark" value="${escapeHtml(question.correctAnswersRaw || '')}" />
        </label>
      </div>

      <div class="question-builder__type" data-block="fill-blank">
        <label>
          <span>Cac dap an chap nhan (phan cach boi dau phay)</span>
          <input type="text" data-field="acceptedAnswersRaw" placeholder="am, 'm" value="${escapeHtml(question.acceptedAnswersRaw || '')}" />
        </label>
      </div>

      <div class="question-builder__type" data-block="drag-drop">
        <label>
          <span>Drag items (moi dong: key|label)</span>
          <textarea rows="4" data-field="dragItemsRaw" placeholder="apple|Apple\nbook|Book">${escapeHtml(question.dragItemsRaw || '')}</textarea>
        </label>
        <label>
          <span>Drag targets (moi dong: key|label|correctItemKey)</span>
          <textarea rows="4" data-field="dragTargetsRaw" placeholder="tao|Qua tao|apple">${escapeHtml(question.dragTargetsRaw || '')}</textarea>
        </label>
      </div>
    `;

    const typeField = card.querySelector('[data-field="type"]');
    typeField.addEventListener('change', () => updateTypeSections(card));

    const imageField = card.querySelector('[data-field="imageUrl"]');
    imageField.addEventListener('input', () => updateImagePreview(card));
    imageField.addEventListener('change', () => updateImagePreview(card));

    const previewWrap = card.querySelector('.question-builder__preview-wrap');
    const preview = card.querySelector('[data-role="image-preview"]');
    const previewState = card.querySelector('[data-role="image-preview-state"]');

    preview.addEventListener('load', () => {
      previewWrap.hidden = false;
      preview.hidden = false;
      previewState.hidden = true;
    });

    preview.addEventListener('error', () => {
      previewWrap.hidden = true;
      preview.hidden = true;
      preview.removeAttribute('src');
      previewState.hidden = false;
      previewState.textContent = 'Khong tai duoc hinh anh. Kiem tra lai URL.';
    });

    const removeButton = card.querySelector('[data-action="remove-question"]');
    removeButton.addEventListener('click', () => {
      card.remove();
    });

    updateTypeSections(card);
    questionList.appendChild(card);
  };

  const loadQuestions = (items) => {
    questionList.innerHTML = '';

    items.forEach((item) => {
      renderQuestionCard(item);
    });
  };

  const getCurrentQuestions = () => {
    const cards = Array.from(questionList.querySelectorAll('.question-builder__card'));
    return cards.map((card) => getQuestionCardValues(card));
  };

  if (fillButton) {
    fillButton.addEventListener('click', () => {
      if (questionList.children.length > 0) {
        const shouldContinue = window.confirm('Danh sach cau hoi hien tai se bi thay bang du lieu mau. Ban co muon tiep tuc?');
        if (!shouldContinue) {
          return;
        }
      }

      loadQuestions(sampleQuestions);
    });
  }

  if (addQuestionButton) {
    addQuestionButton.addEventListener('click', () => {
      renderQuestionCard({});
    });
  }

  let initialQuestions = [];

  try {
    initialQuestions = JSON.parse(storage.value || '[]');
  } catch (error) {
    initialQuestions = [];
  }

  if (!Array.isArray(initialQuestions) || initialQuestions.length === 0) {
    renderQuestionCard({});
  } else {
    loadQuestions(initialQuestions);
  }

  form.addEventListener('submit', (event) => {
    const payload = getCurrentQuestions();

    if (!payload.length) {
      event.preventDefault();
      window.alert('De thi can it nhat 1 cau hoi.');
      return;
    }

    storage.value = JSON.stringify(payload);
  });
}
