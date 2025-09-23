/*
=================================================================================================
app.js - Lógica principal del Portal Académico
Autor: [Tu Nombre]
Fecha: [Fecha Actual]
Descripción: Este script maneja la carga de datos, renderizado dinámico,
             interacciones de usuario y accesibilidad del glosario.
=================================================================================================
*/

// Patrón Módulo IIFE para encapsular el código
(function() {
    'use strict';

    // =====================================================================
    // CACHE DE DATOS Y ELEMENTOS DEL DOM
    // =====================================================================
    let glossaryData = [];
    let currentMateria = null;

    const DOMElements = {
        dynamicContent: document.getElementById('dynamic-content'),
        searchInput: document.getElementById('search-input'),
        autocompleteList: document.getElementById('autocomplete-list'),
        modal: document.getElementById('modal'),
        modalBody: document.getElementById('modal-body'),
        modalCloseBtn: document.querySelector('.modal__close')
    };

    // =====================================================================
    // UTILIDADES GENERALES
    // =====================================================================

    /**
     * @description Crea un elemento HTML con opciones.
     * @param {string} tag - El nombre de la etiqueta HTML a crear.
     * @param {object} [options={}] - Objeto con atributos y contenido.
     * @returns {HTMLElement} El elemento HTML creado.
     */
    const createEl = (tag, options = {}) => {
        const el = document.createElement(tag);
        Object.entries(options).forEach(([key, value]) => {
            if (key === 'textContent') {
                el.textContent = value;
            } else if (key === 'className') {
                el.className = value;
            } else if (key === 'children') {
                value.forEach(child => el.appendChild(child));
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    el.dataset[dataKey] = dataValue;
                });
            } else {
                el.setAttribute(key, value);
            }
        });
        return el;
    };

    /**
     * @description Implementa un debounce para limitar la frecuencia de llamadas a una función.
     * @param {function} fn - La función a ejecutar.
     * @param {number} ms - El tiempo en milisegundos para esperar.
     * @returns {function} La función "debounced".
     */
    const debounce = (fn, ms) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), ms);
        };
    };

    /**
     * @description Copia texto al portapapeles.
     * @param {string} text - El texto a copiar.
     * @returns {Promise<void>}
     */
    const clipboardCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            console.log('Texto copiado al portapapeles');
            alert('Texto copiado al portapapeles.');
        } catch (err) {
            console.error('Error al copiar el texto:', err);
            alert('Error: No se pudo copiar el texto.');
        }
    };

    /**
     * @description Verifica la existencia de una imagen o usa un fallback.
     * @param {string} path - La ruta de la imagen original.
     * @returns {string} La ruta de la imagen o el placeholder si no existe.
     */
    const safeImageUrl = (path) => {
        // En un entorno de producción, esta función podría verificar la existencia del archivo.
        // Por ahora, asumimos que el path es correcto o usamos un placeholder.
        const basePath = 'assets/images/';
        const ext = path.split('.').pop();
        const webpPath = path.replace(`.${ext}`, '.webp');
        // Lógica simple: Si existe el webp, lo usamos.
        // En un entorno real se haria una peticion HEAD para verificar.
        return `${basePath}${path}`; // Por simplicidad, usamos la ruta base.
    };

    /**
     * @description Actualiza los metadatos de la página para SEO y Open Graph.
     * @param {object} metaData - Objeto con los nuevos metadatos.
     */
    const updatePageMetadata = (metaData) => {
        document.title = metaData.title;
        document.querySelector('meta[name="description"]').setAttribute('content', metaData.description);
        document.querySelector('meta[property="og:title"]').setAttribute('content', metaData.title);
        document.querySelector('meta[property="og:description"]').setAttribute('content', metaData.description);
        document.querySelector('meta[name="twitter:title"]').setAttribute('content', metaData.title);
        document.querySelector('meta[name="twitter:description"]').setAttribute('content', metaData.description);
    };

    // =====================================================================
    // LÓGICA DE CARGA DE DATOS
    // =====================================================================

    /**
     * @description Carga el archivo JSON del glosario.
     */
    const loadData = async () => {
        try {
            const response = await fetch('data/glossary.json');
            if (!response.ok) {
                throw new Error('No se pudo cargar glossary.json');
            }
            glossaryData = await response.json();
            console.log('Datos del glosario cargados correctamente.');
            attachAutocomplete();
        } catch (error) {
            console.error('Error al cargar los datos:', error);
            DOMElements.dynamicContent.innerHTML = `<p>Error al cargar el contenido. Por favor, revisa la consola para más detalles.</p>`;
        }
    };

    // =====================================================================
    // LÓGICA DE RENDERIZADO
    // =====================================================================

    /**
     * @description Renderiza una tarjeta del glosario.
     * @param {object} card - El objeto de la tarjeta.
     * @param {string} slug - El slug de la materia para la ruta de la imagen.
     * @returns {HTMLElement} El elemento HTML de la tarjeta.
     */
    const renderCard = (card, slug) => {
        const cardEl = createEl('div', { className: 'card', tabIndex: 0 });
        
        const cardFront = createEl('div', { className: 'card-face card-front' });
        cardFront.innerHTML = `
            <h4 class="card-front__word">${card.es}</h4>
            <img class="card-front__thumbnail" src="assets/images/${card.img}" alt="${card.es}">
            <div class="card__controls">
                <button class="card__btn js-flip-btn" aria-label="Girar tarjeta">Girar</button>
                <button class="card__btn js-expand-btn" aria-label="Ampliar información">Ampliar</button>
            </div>
        `;

        const cardBack = createEl('div', { className: 'card-face card-back' });
        cardBack.innerHTML = `
            <h4 class="card-back__word">${card.en}</h4>
            <img class="card-back__image" src="assets/images/${card.img}" alt="${card.es}">
            <p class="card-back__def-es">${card.def_es}</p>
            <p class="card-back__def-en">${card.def_en}</p>
            <div class="card__controls">
                <button class="card__btn js-flip-btn" aria-label="Girar de nuevo">Girar</button>
                <button class="card__btn js-expand-btn" aria-label="Ampliar información">Ampliar</button>
            </div>
        `;
        
        cardEl.appendChild(cardFront);
        cardEl.appendChild(cardBack);

        // Almacenar datos para acceso rápido
        cardEl.dataset.cardData = JSON.stringify(card);

        return cardEl;
    };

    /**
     * @description Renderiza un grupo de tarjetas.
     * @param {object} group - El objeto del grupo.
     * @param {string} slug - El slug de la materia.
     * @returns {HTMLElement} El elemento HTML del grupo.
     */
    const renderGroup = (group, slug) => {
        const groupSection = createEl('section', { className: 'group-section' });
        
        const header = createEl('div', { className: 'group-section__header' });
        header.innerHTML = `<h3>${group.title}</h3><span>Grupo: ${group.members.join(', ')}</span>`;
        
        const cardsContainer = createEl('div', { className: 'group-section__cards' });
        group.cards.forEach(card => cardsContainer.appendChild(renderCard(card, slug)));
        
        groupSection.appendChild(header);
        groupSection.appendChild(cardsContainer);
        
        return groupSection;
    };

    /**
     * @description Renderiza el contenido de una ventana (tab).
     * @param {object} windowData - El objeto de la ventana.
     * @param {object} materiaData - El objeto de la materia.
     * @returns {HTMLElement} El elemento HTML de la ventana.
     */
    const renderWindow = (windowData, materiaData) => {
        const windowEl = createEl('div', {
            id: `window-${windowData.id}`,
            className: 'materia__tab-content',
            role: 'tabpanel'
        });
        
        windowData.groups.forEach(groupId => {
            const group = materiaData.groups.find(g => g.id === groupId);
            if (group) {
                windowEl.appendChild(renderGroup(group, materiaData.id));
            }
        });
        
        return windowEl;
    };

    /**
     * @description Renderiza la plantilla completa de una materia.
     * @param {string} materiaId - El ID de la materia a renderizar.
     */
    const renderMateria = (materiaId) => {
        const materia = glossaryData.find(m => m.id === materiaId);
        if (!materia) {
            console.error('Materia no encontrada:', materiaId);
            DOMElements.dynamicContent.innerHTML = `<p>Lo sentimos, la materia no fue encontrada.</p>`;
            return;
        }

        currentMateria = materia;
        DOMElements.dynamicContent.innerHTML = '';
        updatePageMetadata({
            title: `${materia.title} | Portal Académico`,
            description: materia.description
        });

        const materiaContainer = createEl('div', { className: 'materia-container' });

        const header = createEl('header', { className: 'materia-header' });
        header.innerHTML = `
            <h1>${materia.code} - ${materia.title}</h1>
            <p>${materia.description}</p>
        `;
        materiaContainer.appendChild(header);

        if (materia.windows && materia.windows.length > 0) {
            const tabsContainer = createEl('div', { className: 'materia__tabs', role: 'tablist' });
            const windowsContainer = createEl('div', { className: 'materia__windows' });
            
            materia.windows.forEach((windowData, index) => {
                const tabBtn = createEl('button', {
                    className: 'materia__tab-button',
                    role: 'tab',
                    id: `tab-${windowData.id}`,
                    'aria-controls': `window-${windowData.id}`,
                    'aria-selected': index === 0 ? 'true' : 'false',
                    textContent: windowData.title
                });
                tabsContainer.appendChild(tabBtn);
                windowsContainer.appendChild(renderWindow(windowData, materia));
            });

            materiaContainer.appendChild(tabsContainer);
            materiaContainer.appendChild(windowsContainer);

            attachTabEvents(tabsContainer, windowsContainer);
            windowsContainer.querySelector('.materia__tab-content').setAttribute('aria-hidden', 'false');

        } else {
            // Si no hay 'windows', renderizar todos los grupos directamente
            materia.groups.forEach(group => {
                materiaContainer.appendChild(renderGroup(group, materia.id));
            });
        }
        
        DOMElements.dynamicContent.appendChild(materiaContainer);
        attachCardEvents();
    };

    // =====================================================================
    // MANEJADORES DE EVENTOS
    // =====================================================================

    /**
     * @description Maneja los eventos de click para voltear y expandir tarjetas.
     */
    const attachCardEvents = () => {
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', (e) => {
                const flipBtn = e.target.closest('.js-flip-btn');
                const expandBtn = e.target.closest('.js-expand-btn');

                if (flipBtn) {
                    card.classList.toggle('card--flipped');
                } else if (expandBtn) {
                    const cardData = JSON.parse(card.dataset.cardData);
                    showModal(cardData);
                } else if (e.target.closest('.card-face')) {
                    // Click en cualquier parte de la cara, excepto en los botones
                    card.classList.toggle('card--flipped');
                }
            });

            // Manejar Enter/Space para accesibilidad
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (document.activeElement === card) {
                        card.classList.toggle('card--flipped');
                    } else if (e.target.classList.contains('js-expand-btn')) {
                        const cardData = JSON.parse(card.dataset.cardData);
                        showModal(cardData);
                    }
                }
            });
        });
    };

    /**
     * @description Maneja los eventos de los tabs.
     * @param {HTMLElement} tabsContainer - El contenedor de los botones de tabs.
     * @param {HTMLElement} windowsContainer - El contenedor de los paneles de tabs.
     */
    const attachTabEvents = (tabsContainer, windowsContainer) => {
        tabsContainer.addEventListener('click', (e) => {
            const tabBtn = e.target.closest('.materia__tab-button');
            if (tabBtn) {
                const targetId = tabBtn.getAttribute('aria-controls');
                
                tabsContainer.querySelectorAll('.materia__tab-button').forEach(btn => btn.setAttribute('aria-selected', 'false'));
                windowsContainer.querySelectorAll('.materia__tab-content').forEach(win => win.setAttribute('aria-hidden', 'true'));
                
                tabBtn.setAttribute('aria-selected', 'true');
                document.getElementById(targetId).setAttribute('aria-hidden', 'false');
            }
        });
    };

    /**
     * @description Muestra el modal con la información de la tarjeta.
     * @param {object} card - El objeto de la tarjeta a mostrar.
     */
    const showModal = (card) => {
        DOMElements.modalBody.innerHTML = `
            <img class="modal-body__img" src="assets/images/${card.img}" alt="${card.es}">
            <h3 class="modal-body__word-es">${card.es}</h3>
            <h4 class="modal-body__word-en">${card.en}</h4>
            <div class="modal-body__def">
                <p><strong>Español:</strong> ${card.def_es}</p>
                <p><strong>English:</strong> ${card.def_en}</p>
            </div>
            <div class="modal-body__controls">
                <button class="modal-body__btn js-copy-es">Copiar ES</button>
                <button class="modal-body__btn js-copy-en">Copiar EN</button>
                <button class="modal-body__btn js-speak" aria-label="Pronunciar en español">🔊 ES</button>
                <button class="modal-body__btn js-speak-en" aria-label="Pronunciar en inglés">🔊 EN</button>
            </div>
        `;

        DOMElements.modal.classList.add('modal--open');
        DOMElements.modal.focus();
        
        // Manejar eventos del modal
        document.querySelector('.js-copy-es').addEventListener('click', () => clipboardCopy(card.def_es));
        document.querySelector('.js-copy-en').addEventListener('click', () => clipboardCopy(card.def_en));
        
        // Placeholder para Web Speech API
        document.querySelector('.js-speak').addEventListener('click', () => alert('Funcionalidad de pronunciación en desarrollo.'));
        document.querySelector('.js-speak-en').addEventListener('click', () => alert('Funcionalidad de pronunciación en desarrollo.'));
    };

    /**
     * @description Oculta el modal.
     */
    const hideModal = () => {
        DOMElements.modal.classList.remove('modal--open');
    };
    
    // =====================================================================
    // LÓGICA DE BÚSQUEDA Y AUTOCOMPLETE
    // =====================================================================

    /**
     * @description Filtra los datos del glosario según el término de búsqueda.
     * @param {string} query - El término de búsqueda.
     * @returns {array} Un array de resultados.
     */
    const searchGlossary = (query) => {
        const lowerQuery = query.toLowerCase();
        const results = [];
        
        glossaryData.forEach(materia => {
            // Búsqueda por materia
            if (materia.code.toLowerCase().includes(lowerQuery) || materia.title.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'materia',
                    id: materia.id,
                    text: `${materia.code} - ${materia.title}`
                });
            }
            
            // Búsqueda en grupos y tarjetas
            materia.groups.forEach(group => {
                if (group.title.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        type: 'grupo',
                        id: materia.id,
                        text: `Grupo: "${group.title}" en ${materia.code}`
                    });
                }
                group.cards.forEach(card => {
                    if (card.es.toLowerCase().includes(lowerQuery) || card.en.toLowerCase().includes(lowerQuery)) {
                        results.push({
                            type: 'tarjeta',
                            id: materia.id,
                            text: `Término: "${card.es}" en ${materia.code}`
                        });
                    }
                });
            });
        });
        
        // Limitar a los 10 primeros resultados para no saturar la UI
        return results.slice(0, 10);
    };

    /**
     * @description Actualiza la lista de autocomplete.
     * @param {array} results - El array de resultados de búsqueda.
     */
    const updateAutocompleteList = (results) => {
        DOMElements.autocompleteList.innerHTML = '';
        if (results.length === 0) {
            DOMElements.autocompleteList.setAttribute('aria-expanded', 'false');
            return;
        }

        DOMElements.autocompleteList.setAttribute('aria-expanded', 'true');
        results.forEach((result, index) => {
            const li = createEl('li', {
                role: 'option',
                id: `result-${index}`,
                textContent: result.text,
                'data-id': result.id
            });
            DOMElements.autocompleteList.appendChild(li);
        });
    };

    /**
     * @description Asocia los eventos de búsqueda y autocomplete.
     */
    const attachAutocomplete = () => {
        const debouncedSearch = debounce((e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                const results = searchGlossary(query);
                updateAutocompleteList(results);
            } else {
                updateAutocompleteList([]);
            }
        }, 300);

        DOMElements.searchInput.addEventListener('input', debouncedSearch);

        DOMElements.searchInput.addEventListener('focus', () => {
            if (DOMElements.searchInput.value.length > 2) {
                 const results = searchGlossary(DOMElements.searchInput.value);
                 updateAutocompleteList(results);
            }
        });

        DOMElements.searchInput.addEventListener('blur', (e) => {
            // Retraso para permitir el click en la lista
            setTimeout(() => {
                DOMElements.autocompleteList.setAttribute('aria-expanded', 'false');
            }, 200);
        });

        DOMElements.autocompleteList.addEventListener('mousedown', (e) => {
            const listItem = e.target.closest('li');
            if (listItem) {
                const materiaId = listItem.dataset.id;
                renderMateria(materiaId);
                DOMElements.autocompleteList.setAttribute('aria-expanded', 'false');
                DOMElements.searchInput.value = listItem.textContent;
            }
        });
    };
    
    // =====================================================================
    // INICIALIZACIÓN
    // =====================================================================

    /**
     * @description Inicializa la aplicación.
     */
    const init = () => {
        loadData();
        
        // Eventos del modal
        DOMElements.modalCloseBtn.addEventListener('click', hideModal);
        DOMEElements.modal.addEventListener('click', (e) => {
            if (e.target === DOMElements.modal) {
                hideModal();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && DOMElements.modal.classList.contains('modal--open')) {
                hideModal();
            }
        });
        
        // Manejar clics en los enlaces ancla
        document.querySelectorAll('.main-header__nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelector(link.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
            });
        });
    };

    // Lanzar la inicialización cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', init);

})(); // Fin del Patrón Módulo
