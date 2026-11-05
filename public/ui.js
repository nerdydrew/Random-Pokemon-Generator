document.addEventListener('DOMContentLoaded', () => {
  initDropdowns();
  initSelectAll();
  initFormOptions();
  initShinyToggle();
  renderFooterYears();
});

function initDropdowns() {
  document.querySelectorAll('.dropdown').forEach((dropdown) => {
    const button = dropdown.querySelector('button');
    const popup = dropdown.querySelector('.popup');
    if (!button || !popup) {
      return;
    }

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      closeAllDropdowns(dropdown);
      popup.classList.toggle('visible');
    });
  });

  document.addEventListener('click', (event) => {
    document.querySelectorAll('.dropdown .popup.visible').forEach((popup) => {
      if (!popup.parentElement.contains(event.target)) {
        popup.classList.remove('visible');
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllDropdowns();
    }
  });
}

function closeAllDropdowns(except) {
  document.querySelectorAll('.dropdown .popup.visible').forEach((popup) => {
    if (!except || popup.parentElement !== except) {
      popup.classList.remove('visible');
    }
  });
}

function initSelectAll() {
  document.querySelectorAll("input[type='checkbox'][data-select-all='true']").forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => {
      const target = event.target;
      const container = target.closest('.popup');
      if (!container) {
        return;
      }

      container.querySelectorAll("input[type='checkbox']:not([data-select-all])").forEach((item) => {
        item.checked = target.checked;
      });

      updateDropdownTitle(target.closest('.dropdown'));
    });
  });
}

function initFormOptions() {
  const formsCheckbox = document.getElementById('forms');
  const megasCheckbox = document.getElementById('megas');
  const gigantamaxesCheckbox = document.getElementById('gigantamaxes');

  const toggleFormSubtypes = () => {
    const disabled = !formsCheckbox.checked;
    megasCheckbox.disabled = disabled;
    gigantamaxesCheckbox.disabled = disabled;
    updateDropdownTitle(document.getElementById('formsDropdown'));
  };

  if (formsCheckbox && megasCheckbox && gigantamaxesCheckbox) {
    formsCheckbox.addEventListener('change', toggleFormSubtypes);
    toggleFormSubtypes();
  }

  document.querySelectorAll('.dropdown').forEach((dropdown) => {
    dropdown.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
      checkbox.addEventListener('change', () => updateDropdownTitle(dropdown));
    });
    updateDropdownTitle(dropdown);
  });
}

function updateDropdownTitle(dropdown) {
  if (!dropdown) {
    return;
  }

  const button = dropdown.querySelector('button');
  if (!button) {
    return;
  }

  const selectAllCheckbox = dropdown.querySelector("input[type='checkbox'][data-select-all='true']");
  const allCheckboxes = Array.from(dropdown.querySelectorAll("input[type='checkbox']:not([data-select-all])"));
  const selectedCheckboxes = allCheckboxes.filter((checkbox) => checkbox.checked && !checkbox.disabled);
  const enabledCheckboxes = allCheckboxes.filter((checkbox) => !checkbox.disabled);
  const allAreSelected = enabledCheckboxes.length > 0 && selectedCheckboxes.length === enabledCheckboxes.length;
  const allowNoSelection = button.dataset.allowNone === 'true';
  const pluralName = button.dataset.pluralName || 'Items';

  if (selectAllCheckbox) {
    selectAllCheckbox.checked = selectedCheckboxes.length > 0;
    selectAllCheckbox.indeterminate = !allAreSelected && selectedCheckboxes.length > 0;
  }

  let displayText;
  if (allowNoSelection && selectedCheckboxes.length === 0) {
    displayText = `No ${pluralName}`;
  } else if (selectedCheckboxes.length === 0 || allAreSelected) {
    displayText = button.dataset.allName || `All ${pluralName}`;
  } else if (selectedCheckboxes.length === 1) {
    displayText = getCheckboxDisplayName(selectedCheckboxes[0]);
  } else if (button.dataset.allowShowingTwo === 'true' && selectedCheckboxes.length === 2) {
    displayText = `${getCheckboxDisplayName(selectedCheckboxes[0])}, ${getCheckboxDisplayName(selectedCheckboxes[1])}`;
  } else {
    const nameForCount = button.dataset.nameForCount || pluralName;
    displayText = `${selectedCheckboxes.length} ${nameForCount}`;
  }

  button.innerText = displayText;
}

function getCheckboxDisplayName(checkbox) {
  return checkbox.dataset.shortName || checkbox.parentElement.innerText.trim();
}

function initShinyToggle() {
  const button = document.getElementById('shiny-toggler');
  const container = document.getElementById('shiny-container');

  if (!button || !container) {
    return;
  }

  button.addEventListener('click', () => {
    const hidden = container.classList.toggle('invisible');
    button.classList.toggle('is-showing', !hidden);
    button.classList.toggle('is-hiding', hidden);
  });
}

function renderFooterYears() {
  document.querySelectorAll('span[data-since]').forEach((span) => {
    span.innerText = `${span.dataset.since}-${new Date().getFullYear()}`;
  });
}
