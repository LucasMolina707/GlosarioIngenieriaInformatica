/**
 * Portal Académico - Glosario Interactivo
 * * Este script maneja la lógica de la aplicación:
 * - Carga datos del glosario desde un JSON.
 * - Renderiza dinámicamente el contenido de las materias.
 * - Gestiona la búsqueda (autocomplete).
 * - Controla las interacciones de las tarjetas (girar, expandir en modal).
 * * @author Gemini AI Expert Developer
 * @version 1.0.0
 */

// Usamos un patrón IIFE (Immediately Invoked Function Expression) para evitar contaminar el scope global.
(function() {
    "use strict";

    // Caché de datos para no tener que pedirlos cada vez.
    let glossaryData = null;

    // Elementos del DOM que usaremos frecuentemente.
    const DOM = {
        searchInput: document.getElementById('search-input'),
        searchResults: document.getElementById('search-results'),
        searchLiveRegion: document.getElementById('search-live-region'),
        dynamicContentArea: document.getElementById('dynamic-content-area'),
        modal: document.getElementById('card-modal'),
        modalBody: document.getElementById('modal-body'),
        modalCloseBtn: document.getElementById('modal-close-btn')
    };
    
    // =====================================================================
    // == MÓDULO LOADER: Carga de datos
    // =====================================================================

    /**
     * Carga los datos del glosario desde el archivo JSON.
     * @returns {Promise<Array>} Una promesa que resuelve con los datos del glosario.
     */
    async function loadData() {
        if (glossaryData) {
            return glossaryData; // Devuelve los datos desde la caché si ya existen.
        }
        try {
            const response = await fetch('data/glossary.json');
            if (!response.ok) {
                throw new Error(`Error en la red: ${response.statusText}`);
            }
            glossaryData = await response.json();
            return glossaryData;
        } catch (error) {
            console.error('Error al cargar el glosario:', error);
            DOM.dynamicContentArea.innerHTML = `<p class="error">No se pudo cargar el contenido. Por favor, intente de nuevo más tarde.</p>`;
            return []; // Retorna un array vacío para evitar errores posteriores.
        }
    }
    
    // =====================================================================
    // == MÓDULO RENDERER: Creación de HTML dinámico
    // =====================================================================
    
    /**
     * Renderiza el contenido completo de una materia seleccionada.
     * @param {string} materiaId - El ID de la materia a renderizar (ej. "2093_Herramientas").
     */
    function renderMateria(materiaId) {
        const materia = glossaryData.find(m => m.id === materiaId);
        if (!materia) {
            console.error(`Materia con id "${materiaId}" no encontrada.`);
            return;
        }
        
        // Actualiza metadatos del documento
        document.title = `${materia.title} | Portal Académico`;
        document.querySelector('meta[name="description"]').setAttribute('content', materia.description);
        // Opcional: Actualizar URL con hash
        // window.location.hash = `#/${materiaId}`;

        const windowsHTML = materia.windows.map((window, index) => `
            <button class="materia__tab ${index === 0 ? 'materia__tab--active' : ''}" role="tab" aria-selected="${index === 0}" aria-controls="window-${window.id}" data-target="window-${window.id}">
                ${window.title}
            </button>
        `).join('');

        const contentHTML = materia.windows.map((window, index) => {
            const groupsInWindow = materia.groups.filter(g => window.groups.includes(g.id));
            const groupsHTML = groupsInWindow.map(renderGroup).join('');
            return `
                <div id="window-${window.id}" class="materia__window ${index === 0 ? 'materia__window--active' : ''}" role="tabpanel">
                    ${groupsHTML}
                </div>
            `;
        }).join('');

        const materiaHTML = `
            <article class="materia" id="${materia.id}">
                <header class="materia__header">
                    <span class="materia__code">${materia.code}</span>
                    <h2 class="materia__title">${materia.title}</h2>
                    <p class="materia__description">${materia.description}</p>
                </header>
                <div class="materia__tabs" role="tablist">
                    ${windowsHTML}
                </div>
                <div class="materia__content">
                    ${contentHTML}
                </div>
            </article>
        `;

        DOM.dynamicContentArea.innerHTML = materiaHTML;
    }

    /**
     * Renderiza un grupo de estudio con sus tarjetas.
     * @param {object} group - El objeto del grupo a renderizar.
     * @returns {string} El HTML del grupo.
     */
    function renderGroup(group) {
        const cardsHTML = group.cards.map(card => renderCard(card, group)).join('');
        return `
            <section class="materia__group" id="${group.id}">
                <h3 class="materia__group-title">${group.title}</h3>
                <div class="cards-grid">
                    ${cardsHTML}
                </div>
            </section>
        `;
    }

    /**
     * Renderiza una tarjeta individual.
     * @param {object} card - El objeto de la tarjeta.
     * @param {object} group - El grupo al que pertenece la tarjeta (para datos extra).
     * @returns {string} El HTML de la tarjeta.
     */
    function renderCard(card, group) {
        const imgPath = `assets/images/${card.img}`;
        
        // Prepara los datos para pasarlos al modal a través de atributos data-*
        const cardData = encodeURIComponent(JSON.stringify(card));

        return `
            <div class="card" role="region" aria-label="Tarjeta de estudio para ${card.es}">
                <div class="card__inner">
                    <div class="card__front">
                        <h4 class="card__term">${card.es}</h4>
                        <img src="${imgPath}" alt="${card.es}" class="card__thumbnail" loading="lazy" onerror="this.src='assets/images/placeholder.png'; this.onerror=null;">
                        <div class="card__actions">
                            <button class="card__btn js-flip-btn" aria-label="Girar tarjeta">Girar</button>
                            <button class="card__btn js-expand-btn" aria-label="Ampliar tarjeta" data-card='${cardData}'>Ampliar</button>
                        </div>
                    </div>
                    <div class="card__back">
                        <h4 class="card__term card__term--en">${card.en}</h4>
                        <p class="card__def"><strong>ES:</strong> ${card.def_es.substring(0, 50)}...</p>
                        <p class="card__def"><strong>EN:</strong> ${card.def_en.substring(0, 50)}...</p>
                        <div class="card__actions">
                            <button class="card__btn js-flip-btn" aria-label="Girar tarjeta">Girar</button>
                            <button class="card__btn js-expand-btn" aria-label="Ampliar tarjeta" data-card='${cardData}'>Ampliar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza el contenido del modal con los datos de una tarjeta.
     * @param {object} card - El objeto de la tarjeta.
     */
    function renderModal(card) {
        const imgPath = `assets/images/${card.img}`;
        const modalHTML = `
            <div class="modal-card">
                <img src="${imgPath}" alt="${card.es}" class="modal-card__image" onerror="this.src='assets/images/placeholder.png'; this.onerror=null;">
                <div class="modal-card__details">
                    <h3 id="modal-title" class="modal-card__term">${card.es}</h3>
                    <p class="modal-card__term--en">${card.en}</p>
                    <div class="modal-card__def">
                        <h4>Definición (ES)</h4>
                        <p>${card.def_es}</p>
                    </div>
                    <div class="modal-card__def">
                        <h4>Definition (EN)</h4>
                        <p>${card.def_en}</p>
                    </div>
                </div>
                <div class="modal-card__controls">
                    <button class="modal-card__btn" data-clipboard-text="${card.es}">Copiar ES</button>
                    <button class="modal-card__btn" data-clipboard-text="${card.en}">Copiar EN</button>
                    <button class="modal-card__btn" title="Función de pronunciación no implementada aún.">Pronunciación</button>
                </div>
            </div>
        `;
        DOM.modalBody.innerHTML = modalHTML;
    }


    // =====================================================================
    // == MÓDULO EVENTS: Manejo de interacciones del usuario
    // =====================================================================

    /**
     * Inicializa todos los manejadores de eventos.
     */
    function attachEventListeners() {
        // --- Búsqueda (Autocomplete) ---
        DOM.searchInput.addEventListener('input', debounce(handleSearch, 300));
        DOM.searchInput.addEventListener('keydown', handleSearchKeystrokes);
        DOM.searchResults.addEventListener('click', handleSearchResultClick);
        document.addEventListener('click', (e) => { // Cierra resultados si se hace clic fuera
            if (!DOM.searchInput.contains(e.target)) {
                clearSearchResults();
            }
        });
        
        // --- Interacciones delegadas en el área dinámica (para tarjetas y tabs) ---
        DOM.dynamicContentArea.addEventListener('click', (e) => {
            // Girar tarjeta
            const flipBtn = e.target.closest('.js-flip-btn');
            if (flipBtn) handleFlip(flipBtn);
            
            // Expandir tarjeta
            const expandBtn = e.target.closest('.js-expand-btn');
            if (expandBtn) handleExpand(expandBtn);
            
            // Pestañas (Tabs)
            const tab = e.target.closest('.materia__tab');
            if (tab) handleTabClick(tab);
        });
        
        // --- Modal ---
        DOM.modalCloseBtn.addEventListener('click', closeModal);
        DOM.modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal__overlay')) closeModal();
        });
        DOM.modal.addEventListener('keydown', handleModalKeystrokes);
        DOM.modalBody.addEventListener('click', handleModalControls);
    }

    /** Maneja la entrada en el campo de búsqueda. */
    function handleSearch(e) {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 2) {
            clearSearchResults();
            return;
        }

        const results = [];
        glossaryData.forEach(materia => {
            // Buscar por título o código de materia
            if (materia.title.toLowerCase().includes(query) || materia.code.toLowerCase().includes(query)) {
                results.push({ type: 'materia', text: `${materia.code} - ${materia.title}`, id: materia.id });
            }
            // Buscar dentro de grupos y tarjetas
            materia.groups.forEach(group => {
                if (group.title.toLowerCase().includes(query) && !results.some(r => r.text === group.title)) {
                    results.push({ type: 'grupo', text: `${group.title} (en ${materia.title})`, materiaId: materia.id, groupId: group.id });
                }
                group.cards.forEach(card => {
                    if ((card.es.toLowerCase().includes(query) || card.en.toLowerCase().includes(query)) && !results.some(r => r.text === card.es)) {
                         results.push({ type: 'tarjeta', text: `${card.es} / ${card.en}`, materiaId: materia.id, groupId: group.id, cardId: card.id });
                    }
                });
            });
        });

        renderSearchResults(results.slice(0, 10)); // Limitar a 10 resultados
    }

    /** Maneja la navegación por teclado en los resultados de búsqueda. */
    function handleSearchKeystrokes(e) {
        const items = DOM.searchResults.querySelectorAll('li');
        if (items.length === 0) return;

        let activeIndex = -1;
        items.forEach((item, index) => {
            if (item.getAttribute('aria-selected') === 'true') {
                activeIndex = index;
            }
        });

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % items.length;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + items.length) % items.length;
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex > -1) {
                items[activeIndex].click();
            }
        } else if (e.key === 'Escape') {
            clearSearchResults();
        }

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            items.forEach((item, index) => {
                item.setAttribute('aria-selected', index === activeIndex);
            });
        }
    }
    
    /** Maneja el clic en un resultado de la búsqueda. */
    function handleSearchResultClick(e) {
        const item = e.target.closest('li');
        if (!item) return;

        const materiaId = item.dataset.materiaId;
        renderMateria(materiaId);
        
        // Opcional: scroll al grupo o tarjeta si se seleccionó
        if (item.dataset.groupId) {
            setTimeout(() => {
                const element = document.getElementById(item.dataset.groupId);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }

        clearSearchResults();
        DOM.searchInput.value = '';
    }

    /** Gira la tarjeta. */
    function handleFlip(button) {
        const card = button.closest('.card');
        card.classList.toggle('card--flipped');
    }

    /** Abre el modal con la información de la tarjeta. */
    function handleExpand(button) {
        const cardData = JSON.parse(decodeURIComponent(button.dataset.card));
        renderModal(cardData);
        openModal();
    }

    /** Cambia entre las pestañas (ventanas) de una materia. */
    function handleTabClick(tab) {
        const targetId = tab.dataset.target;
        const parent = tab.closest('.materia');

        // Desactivar todos los tabs y ventanas
        parent.querySelectorAll('.materia__tab').forEach(t => t.classList.remove('materia__tab--active'));
        parent.querySelectorAll('.materia__window').forEach(w => w.classList.remove('materia__window--active'));

        // Activar el tab y la ventana seleccionados
        tab.classList.add('materia__tab--active');
        document.getElementById(targetId).classList.add('materia__window--active');
    }
    
    /** Maneja los botones dentro del modal (copiar, etc.). */
    function handleModalControls(e) {
        const button = e.target.closest('[data-clipboard-text]');
        if (button) {
            clipboardCopy(button.dataset.clipboardText);
            const originalText = button.textContent;
            button.textContent = '¡Copiado!';
            setTimeout(() => button.textContent = originalText, 1500);
        }
    }
    
    /** Maneja el teclado dentro del modal (cierre y focus trap). */
    function handleModalKeystrokes(e) {
        if (e.key === 'Escape') closeModal();

        // Focus trap
        if (e.key === 'Tab') {
            const focusableElements = DOM.modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    }


    // =====================================================================
    // == MÓDULO UTILS: Funciones de ayuda
    // =====================================================================

    /**
     * Limpia y oculta la lista de resultados de búsqueda.
     */
    function clearSearchResults() {
        DOM.searchResults.innerHTML = '';
        DOM.searchInput.parentElement.setAttribute('aria-expanded', 'false');
    }
    
    /**
     * Muestra los resultados de la búsqueda.
     * @param {Array} results - Array de objetos de resultado.
     */
    function renderSearchResults(results) {
        if (results.length === 0) {
            DOM.searchResults.innerHTML = `<li class="search-combobox__result-item--no-results">No se encontraron resultados.</li>`;
        } else {
            DOM.searchResults.innerHTML = results.map(r => `
                <li class="search-combobox__result-item" role="option" data-materia-id="${r.materiaId || r.id}" data-group-id="${r.groupId || ''}">
                    ${r.text}
                </li>
            `).join('');
        }
        DOM.searchInput.parentElement.setAttribute('aria-expanded', 'true');
        DOM.searchLiveRegion.textContent = `${results.length} resultados encontrados.`;
    }

    /** Abre el modal. */
    function openModal() {
        DOM.modal.hidden = false;
        DOM.modalCloseBtn.focus(); // Foco inicial
    }

    /** Cierra el modal. */
    function closeModal() {
        DOM.modal.hidden = true;
    }

    /**
     * Copia un texto al portapapeles.
     * @param {string} text - El texto a copiar.
     */
    function clipboardCopy(text) {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Error al copiar al portapapeles:', err);
        });
    }

    /**
     * Retrasa la ejecución de una función (útil para eventos como 'input').
     * @param {Function} func - La función a ejecutar.
     * @param {number} delay - El tiempo de espera en milisegundos.
     * @returns {Function} La nueva función "debounced".
     */
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // =====================================================================
    // == INICIALIZACIÓN
    // =====================================================================
    
    /**
     * Función principal que inicializa la aplicación.
     */
    async function init() {
        await loadData();
        attachEventListeners();
    }

    // Ejecuta la inicialización cuando el DOM esté listo.
    document.addEventListener('DOMContentLoaded', init);

})();
