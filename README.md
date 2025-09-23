# Portal Académico + Glosario Interactivo

Este es un proyecto de sitio web educativo desarrollado con Vanilla HTML, CSS y JavaScript. Funciona como un portal académico con un glosario interactivo de términos clave por materia.

## 🚀 Despliegue y Uso

1.  **Clona o descarga este repositorio.**
2.  **Abre el archivo `index.html`** en tu navegador. Para una funcionalidad completa (como la carga de JSON), es recomendable usar un servidor local.
    -   **Opción 1: Python.** En la terminal, navega a la carpeta raíz del proyecto y ejecuta: `python -m http.server`
    -   **Opción 2: VS Code Live Server.** Si usas VS Code, instala la extensión "Live Server" y haz clic derecho en `index.html` > "Open with Live Server".

## 📂 Estructura del Proyecto

-   `index.html`: Página principal y única.
-   `README.md`: Este documento.
-   `data/glossary.json`: **¡El corazón de la app!** Contiene toda la información de las materias, grupos y tarjetas.
-   `assets/`: Carpeta para todos los recursos.
    -   `css/styles.css`: Hojas de estilo con variables y metodología BEM.
    -   `js/app.js`: Lógica principal de la aplicación.
    -   `images/`: Almacena todas las imágenes del proyecto.
        -   `logo/`: Logo y favicon.
        -   `seo/`: Imagen para compartir en redes sociales.
        -   `<codigo_slug>/`: Carpeta por materia (p.ej., `2093_Herramientas`). Las imágenes de las tarjetas deben ir aquí.

## ✍️ Cómo Editar el Contenido

### 1. Editar el Glosario (`data/glossary.json`)

El contenido del sitio es 100% editable desde este archivo JSON.

-   **Para añadir una nueva materia**:
    -   Añade un nuevo objeto `{ ... }` al arreglo principal.
    -   Asegúrate de que el `id` y `code` sean únicos.
    -   Crea una carpeta de imágenes correspondiente en `assets/images/` con el mismo `id` (ej. `2093_Herramientas`).

-   **Para añadir una nueva tarjeta**:
    -   Busca el array `cards` dentro del `group` de la materia que deseas editar.
    -   Añade un nuevo objeto `{ "id": "mX", "es": "...", "en": "...", ... }`.
    -   Guarda la imagen correspondiente en la carpeta de la materia (ej. `assets/images/2093_Herramientas/mX.png`). El `id` de la tarjeta debe coincidir con el nombre del archivo de la imagen.

### 2. Editar el SEO (`index.html`)

Abre `index.html` y ve a la sección `<head>`. Busca el bloque de comentarios `SEO Y METADATOS - EDITA AQUÍ`.
-   **Título y Descripción**: Edita las etiquetas `<title>` y `<meta name="description">`.
-   **Imágenes para redes**: Reemplaza `assets/images/seo/cover.png` con tu propia imagen. **Tamaños recomendados:** 1200x630px para `og:image` y `twitter:image`.

## 🖼️ Convención de Imágenes

-   **Nomenclatura**: Las imágenes de las tarjetas deben ser nombradas usando el `id` de la tarjeta en `glossary.json` (ej. `m1.png`).
-   **Ruta**: La ruta debe ser `assets/images/<codigo_slug>/<id>.<ext>`.
-   **Optimización**: Se recomienda comprimir las imágenes para mejorar el rendimiento. Se acepta `.png`, `.jpg`, `.gif` y `.webp`.

## 🤖 Accesibilidad (A11y)

-   La aplicación está diseñada con roles ARIA y navegación por teclado en mente.
-   **Atributos `alt`**: Todas las imágenes de las tarjetas tienen un `alt` que corresponde a la palabra en español (`es`).
-   **Contraste y diseño**: Se ha intentado usar un esquema de color con buen contraste.
-   **Fallbacks**: La estructura básica del `index.html` es visible incluso sin JavaScript.

---
