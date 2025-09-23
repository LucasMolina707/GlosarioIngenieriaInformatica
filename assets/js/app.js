// app.js

/**
 * Módulo principal de la aplicación.
 * Este script maneja la carga de datos, el renderizado de la UI,
 * la lógica del glosario interactivo y los eventos del usuario.
 * Sigue una estructura modular simple para evitar variables globales.
 */
(function() {
    'use strict';

    // ==========================================================================
    // 1. VARIABLES Y CACHE
    // ==========================================================================
    let glossaryData = []; // Cache para los datos del glosario
    let currentSubjectId = null; // ID de la materia actualmente renderizada

    const elements = {
        subjectArea: document.getElementById('subject-area'),
        subjectSearch: document.getElementById('subject-search'),
        autocompleteList: document.getElementById('autocomplete-list'),
        cardModal: document.getElementById('card-modal'),
        modalBody: document.getElementById('modal-body'),
        modalCloseButton: document.querySelector('.modal__close-button')
    };

    const imageCache = {}; // Cache para imágenes precargadas

    // ==========================================================================
    // 2. UTILIDADES Y FUNCIONES AUXILIARES
    // ==========================================================================

    /**
     * Crea un elemento HTML con opciones de atributos y texto.
     * @param {string} tag - El nombre de la etiqueta HTML a crear (ej. 'div', 'p').
     * @param {object} [options={}] - Opciones para el elemento.
     * @param {string} [options.className] - Clase CSS.
     * @param {string} [options.id] - ID del elemento.
     * @param {string} [options.textContent] - Texto a añadir.
     * @param {object} [options.attributes] - Objeto de atributos a establecer.
     * @param {HTMLElement[]} [options.children] - Array de elementos hijos.
     * @returns {HTMLElement} El elemento creado.
     */
    function createEl(tag, { className, id, textContent, attributes = {}, children = [] } = {}) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (id) el.id = id;
        if (textContent) el.textContent = textContent;
        for (const key in attributes) {
            el.setAttribute(key, attributes[key]);
        }
        children.forEach(child => el.appendChild(child));
        return el;
    }

    /**
     * Copia texto al portapapeles.
     * @param {string} text - El texto a copiar.
     */
    async function clipboardCopy(text) {
        try {
            await navigator.clipboard.writeText(text);
            console.log('Texto copiado al portapapeles:', text);
        } catch (err) {
            console.error('Error al copiar texto: ', err);
        }
    }

    /**
     * Debounce para limitar la frecuencia de ejecución de una función.
     * Útil para eventos de entrada como la búsqueda.
     * @param {function} fn - La función a ejecutar.
     * @param {number} ms - El tiempo de espera en milisegundos.
     * @returns {function} La función con debounce.
     */
    function debounce(fn, ms) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    /**
     * Valida si una URL de imagen existe antes de usarla.
     * @param {string} path - La ruta de la imagen.
     * @returns {Promise<string>} La ruta de la imagen si existe, o una ruta de fallback.
     */
    async function safeImageUrl(path) {
        // Devuelve la ruta cacheadada si ya fue validada
        if (imageCache[path] !== undefined) {
            return imageCache[path];
        }

        const placeholder = 'assets/images/placeholder.png';
        try {
            const response = await fetch(path, { method: 'HEAD' });
            if (response.ok) {
                imageCache[path] = path;
                return path;
            }
        } catch (error) {
            // Ignorar errores, simplemente usamos el placeholder
        }
        imageCache[path] = placeholder;
        return placeholder;
    }

    // ==========================================================================
    // 3. CARGA DE DATOS Y PRECARGA
    // ==========================================================================

    /**
     * Carga el archivo glossary.json.
     * @returns {Promise<object[]>} Los datos del glosario.
     */
    async function loadData() {
        try {
            const response = await fetch('data/glossary.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            glossaryData = data; // Caching de los datos
            return data;
        } catch (error) {
            console.error('Error al cargar los datos del glosario:', error);
            elements.subjectArea.innerHTML = `<p class="error-message">Error al cargar el contenido. Por favor, inténtelo de nuevo más tarde.</p>`;
            return [];
        }
    }

    /**
     * Precarga las imágenes para evitar parpadeos al voltear las tarjetas.
     * @param {string[]} imagePaths - Un array de rutas de imágenes.
     */
    function preloadImages(imagePaths) {
        imagePaths.forEach(path => {
            if (!imageCache[path]) {
                const img = new Image();
                img.src = path;
                imageCache[path] = path; // Marcar como precargada
            }
        });
    }


    // ==========================================================================
    // 4. RENDERIZADO DE LA UI
    // ==========================================================================

    /**
     * Renderiza la plantilla completa para una materia.
     * @param {string} subjectId - El ID de la materia a renderizar.
     */
    function renderMateria(subjectId) {
        const subject = glossaryData.find(s => s.id === subjectId);
        if (!subject) {
            console.error('Materia no encontrada:', subjectId);
            return;
        }

        currentSubjectId = subjectId;
        elements.subjectArea.innerHTML = ''; // Limpia el área de contenido

        const subjectContainer = createEl('div', { className: 'subject' });

        // 1. Cabecera de la materia
        const header = createEl('div', { className: 'subject__header' });
        header.appendChild(createEl('h2', { className: 'subject__title', textContent: `${subject.code} - ${subject.title}` }));
        if (subject.description) {
            header.appendChild(createEl('p', { className: 'subject__description', textContent: subject.description }));
        }
        subjectContainer.appendChild(header);

        // 2. Grupos de tarjetas
        const groupsContainer = createEl('div', { className: 'groups-container' });
        subject.groups.forEach(group => {
            groupsContainer.appendChild(renderGroup(group));
        });
        subjectContainer.appendChild(groupsContainer);

        elements.subjectArea.appendChild(subjectContainer);
    }

    /**
     * Renderiza un grupo de tarjetas.
     * @param {object} group - El objeto del grupo.
     * @returns {HTMLElement} El elemento del grupo.
     */
    function renderGroup(group) {
        const groupEl = createEl('section', { className: 'group', id: group.id });
        groupEl.appendChild(createEl('h3', { className: 'group__title', textContent: group.title }));
        
        // Renderiza los miembros del grupo
        if (group.members && group.members.length > 0) {
            const membersList = createEl('p', { textContent: `Miembros: ${group.members.join(', ')}`, className: 'group__members' });
            groupEl.appendChild(membersList);
        }

        const cardsGrid = createEl('div', { className: 'cards-grid' });
        group.cards.forEach(card => {
            cardsGrid.appendChild(renderCard(card));
        });

        groupEl.appendChild(cardsGrid);
        return groupEl;
    }

    /**
     * Renderiza una tarjeta individual.
     * @param {object} cardData - Los datos de la tarjeta.
     * @returns {HTMLElement} El elemento de la tarjeta.
     */
    function renderCard(cardData) {
        const cardEl = createEl('div', { className: 'card', attributes: { 'tabindex': '0', 'role': 'button', 'aria-label': `Tarjeta de ${cardData.es}` } });
        const inner = createEl('div', { className: 'card__inner' });

        // Cara frontal (Front Face)
        const front = createEl('div', { className: 'card__face card__face--front' });
        const wordFront = createEl('h4', { className: 'card__word', textContent: cardData.es });
        const imageFront = createEl('img', { 
            className: 'card__image',
            attributes: { 
                'src': `assets/images/${cardData.img}`,
                'alt': cardData.es 
            }
        });
        safeImageUrl(imageFront.src).then(url => imageFront.src = url);
        front.appendChild(wordFront);
        front.appendChild(imageFront);
        inner.appendChild(front);

        // Cara trasera (Back Face)
        const back = createEl('div', { className: 'card__face card__face--back' });
        const wordBack = createEl('h4', { className: 'card__word', textContent: cardData.en });
        const defEs = createEl('p', { className: 'card__definition', textContent: `ES: ${cardData.def_es}` });
        const defEn = createEl('p', { className: 'card__definition', textContent: `EN: ${cardData.def_en}` });
        const actions = createEl('div', { className: 'card__actions' });
        const expandBtn = createEl('button', {
            className: 'card__button',
            textContent: 'Expandir',
            attributes: { 'aria-label': `Expandir la tarjeta de ${cardData.es}` }
        });
        actions.appendChild(expandBtn);
        back.appendChild(wordBack);
        back.appendChild(defEs);
        back.appendChild(defEn);
        back.appendChild(actions);
        inner.appendChild(back);

        cardEl.appendChild(inner);

        // Manejadores de eventos para la tarjeta
        cardEl.addEventListener('click', () => handleFlip(cardEl));
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el clic se propague al flip
            handleExpand(cardData);
        });

        return cardEl;
    }

    /**
     * Renderiza el contenido del modal expandido.
     * @param {object} cardData - Los datos de la tarjeta.
     */
    async function renderModalContent(cardData) {
        elements.modalBody.innerHTML = '';
        
        const modalImage = createEl('img', {
            className: 'modal__image',
            attributes: {
                'src': `assets/images/${cardData.img}`,
                'alt': `Imagen para la palabra ${cardData.es}`
            }
        });
        // Usar la función de URL segura para el modal también
        modalImage.src = await safeImageUrl(modalImage.src);

        const wordEs = createEl('p', { className: 'modal__word-es', textContent: `ES: ${cardData.es}` });
        const wordEn = createEl('p', { className: 'modal__word-en', textContent: `EN: ${cardData.en}` });
        const defEs = createEl('p', { className: 'modal__definition-es', textContent: cardData.def_es });
        const defEn = createEl('p', { className: 'modal__definition-en', textContent: cardData.def_en });

        const actions = createEl('div', { className: 'modal__actions' });
        const copyEsBtn = createEl('button', {
            className: 'card__button',
            textContent: 'Copiar ES',
            attributes: { 'aria-label': `Copiar palabra y definición en español` }
        });
        const copyEnBtn = createEl('button', {
            className: 'card__button',
            textContent: 'Copiar EN',
            attributes: { 'aria-label': `Copiar palabra y definición en inglés` }
        });
        // Placeholder para el botón de pronunciación
        const ttsBtn = createEl('button', {
            className: 'card__button',
            textContent: 'Pronunciar',
            attributes: { 'aria-label': `Pronunciar palabra en ambos idiomas` }
        });

        actions.appendChild(copyEsBtn);
        actions.appendChild(copyEnBtn);
        actions.appendChild(ttsBtn);

        elements.modalBody.appendChild(modalImage);
        elements.modalBody.appendChild(wordEs);
        elements.modalBody.appendChild(wordEn);
        elements.modalBody.appendChild(defEs);
        elements.modalBody.appendChild(defEn);
        elements.modalBody.appendChild(actions);

        // Eventos de los botones del modal
        copyEsBtn.addEventListener('click', () => clipboardCopy(`${cardData.es}: ${cardData.def_es}`));
        copyEnBtn.addEventListener('click', () => clipboardCopy(`${cardData.en}: ${cardData.def_en}`));
        ttsBtn.addEventListener('click', () => {
            // Implementación futura con Web Speech API
            console.log('Pronunciación no implementada.');
        });
    }


    // ==========================================================================
    // 5. MANEJADORES DE EVENTOS
    // ==========================================================================

    /**
     * Maneja el evento de voltear una tarjeta.
     * @param {HTMLElement} cardEl - El elemento de la tarjeta.
     */
    function handleFlip(cardEl) {
        cardEl.classList.toggle('card--flipped');
    }

    /**
     * Maneja la apertura del modal.
     * @param {object} cardData - Los datos de la tarjeta a mostrar.
     */
    function handleExpand(cardData) {
        renderModalContent(cardData);
        elements.cardModal.classList.add('modal--visible');
        elements.cardModal.removeAttribute('hidden');
        elements.cardModal.focus(); // Mover el foco al modal para accesibilidad
    }

    /**
     * Maneja el cierre del modal.
     */
    function handleModalClose() {
        elements.cardModal.classList.remove('modal--visible');
        elements.cardModal.setAttribute('hidden', '');
    }

    /**
     * Inicializa la funcionalidad de autocompletado.
     */
    function attachAutocomplete() {
        const input = elements.subjectSearch;
        const list = elements.autocompleteList;

        const handleSearch = debounce(() => {
            const query = input.value.toLowerCase();
            list.innerHTML = ''; // Limpia la lista

            if (query.length === 0) {
                list.setAttribute('hidden', '');
                return;
            }

            const results = [];
            glossaryData.forEach(subject => {
                // Búsqueda por título de materia
                if (subject.title.toLowerCase().includes(query) || subject.code.toLowerCase().includes(query)) {
                    results.push({ type: 'subject', data: subject });
                }
                
                // Búsqueda en grupos y tarjetas
                subject.groups.forEach(group => {
                    if (group.title.toLowerCase().includes(query)) {
                        results.push({ type: 'group', data: group, subjectId: subject.id });
                    }
                    group.cards.forEach(card => {
                        if (card.es.toLowerCase().includes(query) || card.en.toLowerCase().includes(query)) {
                            results.push({ type: 'card', data: card, subjectId: subject.id, groupId: group.id });
                        }
                    });
                });
            });
            
            // Eliminar duplicados
            const uniqueResults = [...new Map(results.map(item => [JSON.stringify(item), item])).values()];

            if (uniqueResults.length > 0) {
                uniqueResults.forEach(item => {
                    const listItem = createEl('li', {
                        className: 'autocomplete__item',
                        attributes: { 'role': 'option' },
                        textContent: item.data.title || item.data.es || item.data.en
                    });
                    
                    listItem.addEventListener('click', () => {
                        input.value = item.data.title || item.data.es || item.data.en;
                        list.setAttribute('hidden', '');
                        if (item.type === 'subject' && item.data.id) {
                            renderMateria(item.data.id);
                        } else if (item.subjectId) {
                            // Si es un grupo o tarjeta, renderizar la materia y hacer scroll
                            renderMateria(item.subjectId);
                            setTimeout(() => {
                                const target = document.getElementById(item.groupId || item.data.id);
                                if (target) {
                                    target.scrollIntoView({ behavior: 'smooth' });
                                }
                            }, 50); // Pequeño delay para asegurar que el elemento existe
                        }
                    });
                    list.appendChild(listItem);
                });
                list.removeAttribute('hidden');
                input.setAttribute('aria-expanded', 'true');
            } else {
                list.setAttribute('hidden', '');
                input.setAttribute('aria-expanded', 'false');
            }
        }, 300); // 300ms de debounce

        input.addEventListener('input', handleSearch);
        input.addEventListener('focus', handleSearch); // Muestra la lista al enfocar
        
        // Manejo del teclado para accesibilidad
        input.addEventListener('keydown', (e) => {
            const items = list.querySelectorAll('.autocomplete__item:not([hidden])');
            if (items.length === 0) return;

            let activeIndex = [...items].findIndex(item => item.classList.contains('autocomplete__item--active'));

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex = (activeIndex + 1) % items.length;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = (activeIndex - 1 + items.length) % items.length;
            } else if (e.key === 'Enter') {
                e.preventDefault();
                items[activeIndex]?.click();
                return;
            }

            items.forEach((item, index) => {
                item.classList.toggle('autocomplete__item--active', index === activeIndex);
                item.setAttribute('aria-selected', index === activeIndex ? 'true' : 'false');
            });
            input.setAttribute('aria-activedescendant', items[activeIndex]?.id || '');
        });

        // Cierra la lista al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!elements.subjectSearch.contains(e.target) && !elements.autocompleteList.contains(e.target)) {
                elements.autocompleteList.setAttribute('hidden', '');
                elements.subjectSearch.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ==========================================================================
    // 6. INICIALIZACIÓN
    // ==========================================================================
    async function init() {
        // Cargar los datos al inicio
        await loadData();

        // Inicializar la funcionalidad de autocompletado
        attachAutocomplete();
        
        // Cargar por defecto la primera materia si existe
        if (glossaryData.length > 0) {
            renderMateria(glossaryData[0].id);
        }

        // Manejar el cierre del modal con el botón y la tecla Esc
        elements.modalCloseButton.addEventListener('click', handleModalClose);
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.cardModal.classList.contains('modal--visible')) {
                handleModalClose();
            }
        });
    }

    // Ejecutar la función de inicialización cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', init);

})(); // IIFE para encapsular el código
