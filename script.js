// script.js

let recipes = [];
let filteredRecipes = [];
const recipesPerPage = 6;
let currentPage = 1;

// Fetch the recipes JSON data
fetch('recipesJSONFormat.json')
  .then(response => response.json())
  .then(data => {
    recipes = data;
    filteredRecipes = recipes;
    populateFilters();
    setupFilters();
    displayRecipes();
    setupPagination();
  })
  .catch(error => console.error('Error loading recipes:', error));

// Populate filter options dynamically based on data
function populateFilters() {
  const kitchenFilter = document.getElementById('kitchen-filter');
  const typeFilter = document.getElementById('type-filter');

  // Extract unique kitchen names from all recipes
  const kitchens = [...new Set(recipes.flatMap(recipe => recipe.kitchen))];
  const types = [...new Set(recipes.map(recipe => recipe.type))];

  kitchens.sort(); // Optional: Sort alphabetically
  types.sort();

  // Add a default option for each filter
  addDefaultOption(kitchenFilter, 'All Kitchens');
  addDefaultOption(typeFilter, 'All Types');

  kitchens.forEach(kitchen => {
    const option = document.createElement('option');
    option.value = kitchen;
    option.textContent = kitchen;
    kitchenFilter.appendChild(option);
  });

  types.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    typeFilter.appendChild(option);
  });
}

// Helper function to add a default option to a select element
function addDefaultOption(selectElement, text) {
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = text;
  // Remove or comment out the disabled attribute
  // defaultOption.disabled = true;
  defaultOption.selected = true;
  selectElement.appendChild(defaultOption);
}


// Display recipes based on current filters and pagination
function displayRecipes() {
  const recipeList = document.getElementById('recipe-list');
  recipeList.innerHTML = '';

  const start = (currentPage - 1) * recipesPerPage;
  const end = start + recipesPerPage;
  const recipesToShow = filteredRecipes.slice(start, end);

  recipesToShow.forEach(recipe => {
    const card = createRecipeCard(recipe);
    recipeList.appendChild(card);
  });

  // If no recipes to show, display a message
  if (recipesToShow.length === 0) {
    const message = document.createElement('p');
    message.textContent = 'No recipes found matching your criteria.';
    message.style.textAlign = 'center';
    recipeList.appendChild(message);
  }
}

// Create a recipe card element
function createRecipeCard(recipe) {
  const card = document.createElement('div');
  card.className = 'recipe-card';
  card.setAttribute('tabindex', '0'); // Make card focusable for accessibility
  card.setAttribute('aria-label', `View details for ${recipe.title}`);

  const img = document.createElement('img');
  img.src = recipe.image || 'images/default-recipe.jpg'; // Use a default image if none provided
  img.alt = recipe.title;

  const content = document.createElement('div');
  content.className = 'recipe-card-content';

  const title = document.createElement('h3');
  title.textContent = recipe.title;

  const tags = document.createElement('div');
  tags.className = 'tags';

  // Add type and dietary tags
  const typeTag = document.createElement('span');
  typeTag.className = 'tag';
  typeTag.textContent = recipe.type;

  const dietaryTag = document.createElement('span');
  dietaryTag.className = 'tag';
  dietaryTag.textContent = getDietaryLabel(recipe.dietary);

  tags.appendChild(typeTag);
  tags.appendChild(dietaryTag);

  content.appendChild(title);
  content.appendChild(tags);
  card.appendChild(img);
  card.appendChild(content);

  // Add click event to expand details
  card.addEventListener('click', () => {
    showRecipeDetails(recipe);
  });

  // Add keypress event for accessibility (Enter key)
  card.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      showRecipeDetails(recipe);
    }
  });

  return card;
}

// Determine the dietary label based on the dietary object
function getDietaryLabel(dietary) {
  const labels = [];
  if (dietary.vegetarian) labels.push('Vegetarian');
  if (dietary.glutenFree) labels.push('Gluten-Free');
  if (labels.length === 0) return 'None';
  return labels.join(' & ');
}

// Show detailed recipe information using modal
function showRecipeDetails(recipe) {
  const modal = document.getElementById('recipe-modal');
  const modalHeader = modal.querySelector('.modal-header');
  const modalBody = modal.querySelector('.modal-body');
  const modalFooter = modal.querySelector('.modal-footer');

  // Populate Modal Header
  modalHeader.innerHTML = `
    <h2><i class="fas fa-utensils"></i> ${recipe.title}</h2>
  `;

  // Populate Modal Body
  let kitchenText = Array.isArray(recipe.kitchen) ? recipe.kitchen.join(', ') : recipe.kitchen;
  modalBody.innerHTML = `
    <p><strong>Kitchen:</strong> ${kitchenText}</p>
    <p><strong>Type:</strong> ${recipe.type}</p>
    <p><strong>Dietary:</strong> ${getDietaryLabel(recipe.dietary)}</p>
    <p><strong>Serves:</strong> ${recipe.serves}</p>
    <hr>
    <div class="modal-section">
      <h4><i class="fas fa-clipboard-list"></i> Ingredients</h4>
      ${formatIngredients(recipe.ingredients)}
    </div>
    <hr>
    <div class="modal-section">
      <h4><i class="fas fa-tasks"></i> Instructions</h4>
      ${formatInstructions(recipe.instructions)}
    </div>
  `;

  // Populate Modal Footer
  modalFooter.innerHTML = `
    <button id="print-button"><i class="fas fa-print"></i> Print Recipe</button>
    <button id="export-button"><i class="fas fa-file-pdf"></i> Export as PDF</button>
  `;

  // Show the modal by adding the 'show' class
  modal.classList.add('show');

  // Disable background scrolling
  document.body.style.overflow = 'hidden';

  // Reset modal-content scroll position to top after content is rendered
  const modalContent = modal.querySelector('.modal-content');

  // Use requestAnimationFrame to ensure the DOM has updated
  requestAnimationFrame(() => {
    modalContent.scrollTop = 0;
  });

  // Fallback: Use setTimeout in case requestAnimationFrame doesn't suffice
  setTimeout(() => {
    modalContent.scrollTop = 0;
  }, 0);

  // Event Listener for Close Button
  const closeButton = modal.querySelector('.close-button');
  closeButton.onclick = closeModal;

  // Event Listener for Clicking Outside the Modal Content to Close
  window.onclick = function(event) {
    if (event.target === modal) {
      closeModal();
    }
  }

  // Close modal with Esc key
  window.addEventListener('keydown', handleEscClose);

  // Print functionality
  const printButton = modalFooter.querySelector('#print-button');
  printButton.addEventListener('click', () => {
    window.print();
  });

  // Export as PDF functionality using jsPDF
  const exportButton = modalFooter.querySelector('#export-button');
  exportButton.addEventListener('click', () => {
    exportRecipeAsPDF(recipe);
  });

  // Optional: Trap focus within the modal for accessibility
  trapFocus(modal);
}

// Function to close the modal
function closeModal() {
  const modal = document.getElementById('recipe-modal');
  modal.classList.remove('show');

  // Re-enable background scrolling
  document.body.style.overflow = 'auto';

  // Remove Esc key event listener
  window.removeEventListener('keydown', handleEscClose);

  releaseFocus(); // Release focus trap
}

// Handle closing modal with Esc key
function handleEscClose(event) {
  if (event.key === 'Escape') {
    closeModal();
  }
}

// Helper function to format ingredients
function formatIngredients(ingredients) {
  if (Array.isArray(ingredients)) {
    // Ingredients is a flat array
    let list = '<ul>';
    ingredients.forEach(item => {
      list += `<li>${item}</li>`;
    });
    list += '</ul>';
    return list;
  } else if (typeof ingredients === 'object' && ingredients !== null) {
    // Ingredients have sections
    let content = '';
    for (const [section, items] of Object.entries(ingredients)) {
      content += `<h5>${capitalize(section)}</h5><ul>`;
      items.forEach(item => {
        content += `<li>${item}</li>`;
      });
      content += '</ul>';
    }
    return content;
  } else {
    // Ingredients format is unexpected
    return '<p>Ingredients information is unavailable.</p>';
  }
}

// Helper function to format instructions
function formatInstructions(instructions) {
  if (Array.isArray(instructions)) {
    // Instructions is an array
    let list = '<ol>';
    instructions.forEach(step => {
      list += `<li>${step}</li>`;
    });
    list += '</ol>';
    return list;
  } else {
    // Instructions format is unexpected
    return '<p>Instructions information is unavailable.</p>';
  }
}

// Function to capitalize the first letter of a string
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Function to sanitize file name by removing or replacing invalid characters
function sanitizeFileName(name) {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Function to export recipe as PDF using jsPDF
function exportRecipeAsPDF(recipe) {
  // Check if jsPDF is available
  if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
    alert('jsPDF library is not loaded.');
    return;
  }

  const { jsPDF } = window.jspdf; // Correctly destructure jsPDF from window.jspdf
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15; // 15mm margin
  const maxWidth = pageWidth - 2 * margin;

  let yOffset = margin;

  // Set Title
  doc.setFont('Playfair Display', 'bold');
  doc.setFontSize(18);
  doc.text(recipe.title, margin, yOffset, { maxWidth: maxWidth });
  yOffset += 10;

  // Set Subtitles
  doc.setFont('Lora', 'normal');
  doc.setFontSize(12);
  doc.text(`Kitchen: ${Array.isArray(recipe.kitchen) ? recipe.kitchen.join(', ') : recipe.kitchen}`, margin, yOffset, { maxWidth: maxWidth });
  yOffset += 7;
  doc.text(`Type: ${recipe.type}`, margin, yOffset, { maxWidth: maxWidth });
  yOffset += 7;
  doc.text(`Dietary: ${getDietaryLabel(recipe.dietary)}`, margin, yOffset, { maxWidth: maxWidth });
  yOffset += 7;
  doc.text(`Serves: ${recipe.serves}`, margin, yOffset, { maxWidth: maxWidth });
  yOffset += 10;

  // Ingredients Section
  doc.setFont('Playfair Display', 'bold');
  doc.text('Ingredients:', margin, yOffset, { maxWidth: maxWidth });
  yOffset += 7;
  doc.setFont('Lora', 'normal');

  if (Array.isArray(recipe.ingredients)) {
    // Flat ingredients
    recipe.ingredients.forEach(item => {
      const text = `- ${item}`;
      const splitText = doc.splitTextToSize(text, maxWidth - 10); // Indent by 10mm
      doc.text(splitText, margin + 10, yOffset, { maxWidth: maxWidth - 10 });
      yOffset += splitText.length * 5; // Adjust line height as needed

      if (yOffset > pageHeight - margin) { // Avoid overflow
        doc.addPage();
        yOffset = margin;
      }
    });
  } else if (typeof recipe.ingredients === 'object' && recipe.ingredients !== null) {
    // Ingredients with sections
    for (const [section, items] of Object.entries(recipe.ingredients)) {
      doc.setFont('Playfair Display', 'bold');
      const sectionTitle = `${capitalize(section)}:`;
      doc.text(sectionTitle, margin, yOffset, { maxWidth: maxWidth });
      yOffset += 7;
      doc.setFont('Lora', 'normal');

      items.forEach(item => {
        const text = `- ${item}`;
        const splitText = doc.splitTextToSize(text, maxWidth - 10); // Indent by 10mm
        doc.text(splitText, margin + 10, yOffset, { maxWidth: maxWidth - 10 });
        yOffset += splitText.length * 5; // Adjust line height as needed

        if (yOffset > pageHeight - margin) { // Avoid overflow
          doc.addPage();
          yOffset = margin;
        }
      });

      doc.setFont('Playfair Display', 'bold');
    }
  } else {
    // Ingredients format is unexpected
    doc.setFont('Lora', 'normal');
    const text = 'Ingredients information is unavailable.';
    const splitText = doc.splitTextToSize(text, maxWidth);
    doc.text(splitText, margin, yOffset, { maxWidth: maxWidth });
    yOffset += splitText.length * 5;
  }

  yOffset += 5;

  // Instructions Section
  doc.setFont('Playfair Display', 'bold');
  doc.text('Instructions:', margin, yOffset, { maxWidth: maxWidth });
  yOffset += 7;
  doc.setFont('Lora', 'normal');

  recipe.instructions.forEach((step, index) => {
    const text = `${index + 1}. ${step}`;
    const splitText = doc.splitTextToSize(text, maxWidth - 10); // Indent by 10mm
    doc.text(splitText, margin + 10, yOffset, { maxWidth: maxWidth - 10 });
    yOffset += splitText.length * 5; // Adjust line height as needed

    if (yOffset > pageHeight - margin) { // Avoid overflow
      doc.addPage();
      yOffset = margin;
    }
  });

  // Save the PDF
  doc.save(`${sanitizeFileName(recipe.title)}.pdf`);
}

// Function to clear all filters
function clearFilters() {
  // Reset all filter dropdowns to their default state
  const kitchenFilter = document.getElementById('kitchen-filter');
  const dietaryFilter = document.getElementById('dietary-filter');
  const typeFilter = document.getElementById('type-filter');
  const searchBar = document.getElementById('search-bar');

  kitchenFilter.selectedIndex = 0; // Assuming the first option is the default (e.g., "All Kitchens")
  dietaryFilter.selectedIndex = 0; // "All"
  typeFilter.selectedIndex = 0; // "All Types"
  searchBar.value = ''; // Clear the search input

  // Apply filters to update the recipe list
  applyFilters();
}

// Set up filter event listeners
function setupFilters() {
  const kitchenFilter = document.getElementById('kitchen-filter');
  const dietaryFilter = document.getElementById('dietary-filter');
  const typeFilter = document.getElementById('type-filter');
  const searchBar = document.getElementById('search-bar');
  const clearFiltersButton = document.getElementById('clear-filters');

  kitchenFilter.addEventListener('change', applyFilters);
  dietaryFilter.addEventListener('change', applyFilters);
  typeFilter.addEventListener('change', applyFilters);
  searchBar.addEventListener('input', applyFilters);
  clearFiltersButton.addEventListener('click', clearFilters);

  // Allow "Clear Filters" button to be triggered with Enter key
  clearFiltersButton.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      clearFilters();
    }
  });
}

// Apply filters to the recipes
function applyFilters() {
  const kitchen = document.getElementById('kitchen-filter').value;
  const dietary = document.getElementById('dietary-filter').value;
  const type = document.getElementById('type-filter').value;
  const searchQuery = document.getElementById('search-bar').value.toLowerCase();

  filteredRecipes = recipes.filter(recipe => {
    const matchesKitchen = kitchen ? recipe.kitchen.includes(kitchen) : true;
    const matchesDietary = dietary ? dietaryMatches(recipe.dietary, dietary) : true;
    const matchesType = type ? recipe.type === type : true;
    const matchesSearch = searchQuery ? recipe.title.toLowerCase().includes(searchQuery) : true;
    return matchesKitchen && matchesDietary && matchesType && matchesSearch;
  });

  currentPage = 1; // Reset to first page after filtering
  setupPagination();
  displayRecipes();
}

// Determine if a recipe's dietary information matches the selected filter
function dietaryMatches(dietaryObj, selectedDietary) {
  switch (selectedDietary) {
    case 'Vegetarian':
      return dietaryObj.vegetarian === true;
    case 'Gluten-Free':
      return dietaryObj.glutenFree === true;
    case 'Vegetarian & Gluten-Free':
      return dietaryObj.vegetarian === true && dietaryObj.glutenFree === true;
    default:
      return true;
  }
}

// Set up pagination controls
function setupPagination() {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);

  if (totalPages <= 1) return; // No need for pagination

  // Previous Button
  if (currentPage > 1) {
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Prev';
    prevButton.setAttribute('aria-label', 'Previous Page');
    prevButton.addEventListener('click', () => {
      currentPage--;
      displayRecipes();
      setupPagination();
      scrollToTop();
    });
    pagination.appendChild(prevButton);
  }

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement('button');
    button.textContent = i;
    button.setAttribute('aria-label', `Page ${i}`);
    if (i === currentPage) {
      button.disabled = true;
      button.style.backgroundColor = '#7bbfa1';
    }
    button.addEventListener('click', () => {
      currentPage = i;
      displayRecipes();
      setupPagination();
      scrollToTop();
    });
    pagination.appendChild(button);
  }

  // Next Button
  if (currentPage < totalPages) {
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.setAttribute('aria-label', 'Next Page');
    nextButton.addEventListener('click', () => {
      currentPage++;
      displayRecipes();
      setupPagination();
      scrollToTop();
    });
    pagination.appendChild(nextButton);
  }
}

// Helper function to scroll to top after pagination
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/* Accessibility: Trap Focus within Modal */
let focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
let focusableElements;
let firstFocusableElement;
let lastFocusableElement;

function trapFocus(modal) {
  focusableElements = modal.querySelectorAll(focusableElementsString);
  if (focusableElements.length === 0) return;
  firstFocusableElement = focusableElements[0];
  lastFocusableElement = focusableElements[focusableElements.length - 1];

  // Focus the first focusable element inside the modal
  firstFocusableElement.focus();

  // Add event listener to trap focus
  modal.addEventListener('keydown', handleTabKey);
}

function handleTabKey(e) {
  if (e.key !== 'Tab') return;

  if (e.shiftKey) { // Shift + Tab
    if (document.activeElement === firstFocusableElement) {
      lastFocusableElement.focus();
      e.preventDefault();
    }
  } else { // Tab
    if (document.activeElement === lastFocusableElement) {
      firstFocusableElement.focus();
      e.preventDefault();
    }
  }
}

function releaseFocus() {
  const modal = document.getElementById('recipe-modal');
  modal.removeEventListener('keydown', handleTabKey);
}
