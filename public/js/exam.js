const countdownElement = document.getElementById('countdown');
const examForm = document.getElementById('exam-form');

if (countdownElement && examForm) {
  const durationMinutes = Number(countdownElement.dataset.minutes || 0);
  let remainingSeconds = durationMinutes * 60;

  const renderTime = () => {
    const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
    const seconds = String(remainingSeconds % 60).padStart(2, '0');
    countdownElement.textContent = `${minutes}:${seconds}`;
  };

  renderTime();

  const timer = window.setInterval(() => {
    remainingSeconds -= 1;
    renderTime();

    if (remainingSeconds <= 0) {
      window.clearInterval(timer);
      examForm.submit();
    }
  }, 1000);
}

const dragChips = Array.from(document.querySelectorAll('.drag-chip'));
const dropZones = Array.from(document.querySelectorAll('.drop-zone'));

dragChips.forEach((chip) => {
  chip.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/plain', chip.dataset.itemKey || '');
    event.dataTransfer.effectAllowed = 'move';
  });
});

dropZones.forEach((zone) => {
  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    zone.classList.add('is-active');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('is-active');
  });

  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('is-active');

    const itemKey = event.dataTransfer.getData('text/plain');
    const chip = dragChips.find((entry) => entry.dataset.itemKey === itemKey);
    const hiddenInput = zone.querySelector('input[type="hidden"]');
    const label = zone.querySelector('.drop-zone__value');

    if (!chip || !hiddenInput || !label) {
      return;
    }

    dropZones.forEach((entry) => {
      const entryInput = entry.querySelector('input[type="hidden"]');
      const entryLabel = entry.querySelector('.drop-zone__value');

      if (entryInput && entryLabel && entryInput.value === itemKey) {
        entryInput.value = '';
        entryLabel.textContent = 'Tha vao day';
      }
    });

    hiddenInput.value = itemKey;
    label.textContent = chip.textContent.trim();

    dragChips.forEach((entry) => {
      const isUsed = dropZones.some((dropZone) => {
        const input = dropZone.querySelector('input[type="hidden"]');
        return input && input.value === entry.dataset.itemKey;
      });

      entry.classList.toggle('is-used', isUsed);
    });
  });
});