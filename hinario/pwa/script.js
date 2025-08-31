// Constants and Variables
const SETTINGS_KEY = 'hymnSettings';
const TWO_YEARS = 1000 * 60 * 60 * 24 * 365 * 2;
const bgImages = [
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1738760479351-b25b4e35106a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1739361133037-77be66a4ea6a?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1739054239615-02944e9c338b?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=1918&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1506260408121-e353d10b87c7?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1479030160180-b1860951d696?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1549228167-511375f69159?q=80&w=1952&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1612278675615-7b093b07772d?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=1918&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
];

const SWIPE_THRESHOLD = 150; // Minimum swipe distance in pixels

let currentHymnIndex = 0; // Index of the currently selected hymn
let currentSlideIndex = 0; // Index of the currently displayed slide
let slides = []; // Array of slide content for the current hymn
let fontSize = 5; // Default font size multiplier
let lineHeight = 1.0; // Default line height
let bgImageIndex = 0; // Index of the current background image
let savedSlidePosition = 0; // Variável para armazenar a posição do slide

// Playlist state
let playlistActive = false;
let playlistOrder = [];
let playlistPosition = 0;

// DOM Elements
const hymnSelect = document.getElementById("hymn-select"); // Input for selecting a hymn
const startButton = document.getElementById("start-button"); // Button to start the presentation
const prevButton = document.getElementById("prev-button"); // Button to go to the previous slide
const nextButton = document.getElementById("next-button"); // Button to go to the next slide
const slideContent = document.getElementById("slide-content"); // Element to display the current slide content
const slideCounter = document.getElementById("slide-counter"); // Element to display the current slide number
const previewContainer = document.getElementById("preview-container"); // Container for hymn preview
const presentationContainer = document.getElementById("presentation-container"); // Full-screen presentation container
const fullscreenContent = document.getElementById("fullscreen-content"); // Content displayed in full-screen mode
const fullscreenCounter = document.getElementById("fullscreen-counter"); // Slide counter in full-screen mode
const closeFullscreenButton = document.getElementById("close-fullscreen"); // Button to close full-screen mode
const fontIncreaseButton = document.getElementById("font-increase"); // Button to increase font size
const fontDecreaseButton = document.getElementById("font-decrease"); // Button to decrease font size
const bgToggleButton = document.getElementById("bg-slides-toggle"); // Button to toggle background
const bgImage = document.getElementById("bg-image"); // Background image for the presentation
const fullscreenBgImage = document.getElementById("fullscreen-bg-image"); // Background image in full-screen mode
const fontColorInput = document.getElementById("font-color"); // Input for selecting font color
const lineHeightInput = document.getElementById("line-height"); // Input for adjusting line height
const fontSelector = document.getElementById("font-selector"); // Selector for choosing font family
const audioSource = document.getElementById("audio-source"); // Source element for audio playback
const audioPlayer = document.getElementById("hymn-audio"); // Audio player element
const lineHeightDecreaseButton = document.getElementById("line-height-decrease");
const lineHeightIncreaseButton = document.getElementById("line-height-increase");
const completeCheckbox = document.getElementById('complete-checkbox');
const slideshowIcon = document.getElementById("slideshow-icon");
const randomHymnButton = document.getElementById('random-hymn');
const playlistIcon = document.getElementById('playlist-icon');
const playlistStopIcon = document.getElementById('playlist-stop-icon');
const fsNextHymnButton = document.getElementById('fs-next-hymn');
const fsStopPlaylistButton = document.getElementById('fs-stop-playlist');

// Utility Functions
function rgbToHex(rgb) {
    if (!rgb) return '#FFFFFF';
    if (rgb.startsWith('#')) return rgb;

    // Extract RGB values from rgb(r,g,b) string
    const [r, g, b] = rgb.match(/\d+/g).map(Number);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function adjustLineHeight(increment) {
    const selectedLineHeight = parseFloat(lineHeightInput.value);
    let newLineHeight = selectedLineHeight + increment;
    newLineHeight = Math.min(Math.max(newLineHeight, 0.8), 2);
    lineHeightInput.value = newLineHeight.toFixed(1);
    updateLineHeight();
    saveSettings();
}

// Event Handlers
function handleKeyPress(e) {
    switch (e.key) {
        case "ArrowRight":
        case " ":
            nextSlide();
            break;
        case "ArrowLeft":
            previousSlide();
            break;
        case "PageUp":
            nextHymn();
            break;
        case "PageDown":
            previousHymn();
            break;
        case "Escape":
            exitPresentation();
            break;
        case "+":
            increaseFontSize();
            break;
        case "-":
            decreaseFontSize();
            break;
        case "ArrowUp":
            if (e.shiftKey) {
                adjustLineHeight(0.1); // Shift + Seta para cima
            }
            break;
        case "ArrowDown":
            if (e.shiftKey) {
                adjustLineHeight(-0.1); // Shift + Seta para baixo
            }
            break;
        case "r":
            if (e.altKey) {
                resetSettings();
            }
            break;
        case "f":
            updateBackground();
            break;
        case "c":
            toggleCheckboxCompleto();
            break;
        case "Home":
            goToFirstSlide();
            break;
    }
}

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].clientX;
    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
        if (swipeDistance > 0) {
            previousSlide();
        } else {
            nextSlide();
        }
    }
}

function handleTouchMove(e) {
    if (!startX || !startY) return;

    const diffX = e.touches[0].clientX - startX;
    const diffY = e.touches[0].clientY - startY;

    // Bloqueia apenas se movimento for predominantemente horizontal
    if (Math.abs(diffX) > Math.abs(diffY)) {
        e.preventDefault(); // Permite apenas bloqueio horizontal
    }
}

// Main Functions
function init() {
    const hymnTitles = hymns.map(hymn => hymn.title);
    $("#hymn-select").autocomplete(hymnTitles, {
        width: 360,
        selectFirst: false,
        matchContains: "word"
    }).dblclick(function () {
        $(this).val('');
        return false;
    });

    $("#hymn-select").result(function (event, data, formatted) {
        const selectedHymn = hymns.find(hymn => hymn.title === formatted);
        if (selectedHymn) {
            currentHymnIndex = hymns.indexOf(selectedHymn);
            slides = createSlides(selectedHymn);
            currentSlideIndex = 0;
            updatePreview();
            loadHymnAudio(currentHymnIndex);
        }
    });

    startButton.addEventListener("click", startPresentation);
    prevButton.addEventListener("click", previousSlide);
    nextButton.addEventListener("click", nextSlide);
    closeFullscreenButton.addEventListener("click", () => {
        // If in random playlist mode, behave like the stop button
        if (typeof playlistActive !== 'undefined' && playlistActive) {
            stopRandomPlaylist();
        } else {
            exitPresentation();
        }
    });

    document.addEventListener("keydown", handleKeyPress);

    const incBtn = document.getElementById('font-increase');
    const decBtn = document.getElementById('font-decrease');
    if (incBtn) {
        incBtn.addEventListener("click", () => {
            // Allow up to 5rem (units 20 at 0.25rem per unit)
            if (fontSize < 20) {
                fontSize++;
                updateFontSize();
                saveSettings(); // Save settings after changing font size
            }
        });
    }
    if (decBtn) {
        decBtn.addEventListener("click", () => {
            // Allow down to 1rem (units 4 at 0.25rem per unit)
            if (fontSize > 4) {
                fontSize--;
                updateFontSize();
                saveSettings(); // Save settings after changing line height
            }
        });
    }
    bgToggleButton.addEventListener("click", updateBackground);
    fontColorInput.addEventListener("input", updateFontColor);
    lineHeightDecreaseButton.addEventListener("click", () => {
        if (lineHeight > 0.8) {
            lineHeight -= 0.1;
            updateLineHeight();
            saveSettings(); // Save settings after changing line height
        }
    });
    lineHeightIncreaseButton.addEventListener("click", () => {
        if (lineHeight < 2) {
            lineHeight += 0.1;
            updateLineHeight();
            saveSettings(); // Save settings after changing line height
        }
    });
    fontSelector.addEventListener("change", updateFontFamily);

    // Load saved settings first so UI reflects persisted state
    loadSettings();

    // Initialize font size state from current inline style or default to 2rem (units=8)
    const slideContent = document.getElementById('slide-content');
    const fullscreenContent = document.getElementById('fullscreen-content');
    const currentFontSizeRem = slideContent?.style?.fontSize?.endsWith('rem')
        ? parseFloat(slideContent.style.fontSize)
        : NaN;
    if (!isNaN(currentFontSizeRem)) {
        fontSize = Math.round(currentFontSizeRem / 0.25); // convert back to units
    } else {
        fontSize = 8;
        updateFontSize();
    }

    if (fontColorInput && slideContent && fullscreenContent) {
        const savedColor = localStorage.getItem('fontColor');
        const initialColor = savedColor || fontColorInput.value;
        slideContent.style.color = initialColor;
        fullscreenContent.style.color = initialColor;
        fontColorInput.value = initialColor;
    }

    // Saved settings already applied above

    // Initialize with a random hymn de 0 ate hymns.length - 1
    currentHymnIndex = Math.floor(Math.random() * hymns.length);
    updateSlides();
    updatePreview();
    loadHymnAudio(currentHymnIndex);
    previewContainer.classList.remove("hidden");

    completeCheckbox.addEventListener('change', changeCheckboxStateCompleto);

    slideshowIcon.addEventListener('click', startBackgroundSlideshow);

    // Random hymn button: use delegation so clicks on inner <i> are captured
    const triggerRandom = () => {
        const randomIndex = Math.floor(Math.random() * hymns.length);
        currentHymnIndex = randomIndex;
        const selectedHymn = hymns[currentHymnIndex];
        // Update input value to reflect chosen hymn
        const input = document.getElementById('hymn-select');
        if (input) input.value = selectedHymn.title;
        // Reset slide position
        currentSlideIndex = 0;
        updateSlides();
        updatePreview();
        loadHymnAudio(currentHymnIndex);
        // Ensure preview is visible
        previewContainer.classList.remove('hidden');
    };
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#random-hymn');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            triggerRandom();
        }
    });

    // Playlist controls: attach after DOM is ready
    if (playlistIcon) {
        playlistIcon.addEventListener('click', (e) => {
            e.preventDefault();
            startRandomPlaylist();
        });
    }
    if (playlistStopIcon) {
        playlistStopIcon.addEventListener('click', (e) => {
            e.preventDefault();
            stopRandomPlaylist();
        });
    }

    // Auto-advance when audio ends in playlist mode
    if (audioPlayer) {
        audioPlayer.addEventListener('ended', () => {
            if (playlistActive) advancePlaylist();
        });
    }

    // Fullscreen small controls
    if (fsNextHymnButton) {
        fsNextHymnButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (playlistActive) {
                advancePlaylist();
            } else {
                nextHymn();
            }
        });
    }
    if (fsStopPlaylistButton) {
        fsStopPlaylistButton.addEventListener('click', (e) => {
            e.preventDefault();
            stopRandomPlaylist();
        });
    }

    // Set random background image on startup
    bgImageIndex = Math.floor(Math.random() * bgImages.length);
    updateBackground();

    // Initialize top drawer for settings
    setupTopDrawer();
}

// Fire event to change checkbox state
function toggleCheckboxCompleto() {
    completeCheckbox.checked = !completeCheckbox.checked;
    changeCheckboxStateCompleto();
}

function changeCheckboxStateCompleto() {
    if(completeCheckbox.checked) {
        savedSlidePosition = currentSlideIndex;
        currentSlideIndex=0;
    } else {
        currentSlideIndex = savedSlidePosition;
    }
    updateSlides();
    updatePreview();
}

function updateSlides() {
    slides = completeCheckbox.checked ? createSlidesComplete(hymns[currentHymnIndex]) : createSlides(hymns[currentHymnIndex]);
}

function updatePreview() {
    updateSlides();
    updateSlideContent();
    updateCounter();
}

function updateSlideContent() {
    if (slides.length === 0) return;

    const content = slides[currentSlideIndex];
    // Fade out and in for transition
    slideContent.style.opacity = "0";
    fullscreenContent.style.opacity = "0";

    setTimeout(() => {
        slideContent.innerHTML = content;
        fullscreenContent.innerHTML = content;
        slideContent.style.opacity = "1";
        fullscreenContent.style.opacity = "1";

        // If in presentation with complete mode, and at slide 2 (index 1),
        // focus the scrollable container so Arrow Up/Down work without click
        if (!presentationContainer.classList.contains('hidden') && completeCheckbox.checked && currentSlideIndex === 1) {
            const scroller = fullscreenContent.querySelector('.complete-scroll');
            if (scroller) {
                if (!scroller.hasAttribute('tabindex')) scroller.setAttribute('tabindex', '0');
                try { scroller.focus({ preventScroll: false }); } catch (_) { scroller.focus(); }
            }
        }
    }, 300);
}

function updateCounter() {
    slideCounter.textContent = `${currentSlideIndex + 1}/${slides.length}`;
    fullscreenCounter.textContent = `${currentSlideIndex + 1}/${slides.length}`;
}

function previousSlide() {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        updateSlideContent();
        updateCounter();
    }
}

function nextSlide() {
    if (currentSlideIndex < slides.length - 1) {
        currentSlideIndex++;
        updateSlideContent();
        updateCounter();
    }
}

function nextHymn() {
    // Avança para o próximo hino com wrap-around
    currentHymnIndex = (currentHymnIndex + 1) % hymns.length;
    currentSlideIndex = 0; // Reinicia para o primeiro slide
    updateSlides();
    updatePreview();
    loadHymnAudio(currentHymnIndex);
}

function previousHymn() {
    // Retrocede para o hino anterior com wrap-around
    currentHymnIndex = (currentHymnIndex - 1 + hymns.length) % hymns.length;
    currentSlideIndex = 0; // Reinicia para o primeiro slide
    updateSlides();
    updatePreview();
    loadHymnAudio(currentHymnIndex);
}

// --- Random Playlist Controls ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startRandomPlaylist() {
    // Build and shuffle full hymn index list
    playlistOrder = shuffleArray(Array.from({ length: hymns.length }, (_, i) => i));
    playlistPosition = 0;
    playlistActive = true;

    // Toggle icons
    if (playlistIcon) playlistIcon.classList.add('hidden');
    if (playlistStopIcon) playlistStopIcon.classList.remove('hidden');
    if (fsStopPlaylistButton) fsStopPlaylistButton.classList.remove('hidden');
    if (fsNextHymnButton) fsNextHymnButton.classList.remove('hidden');

    // Force complete mode in presentation
    if (completeCheckbox && !completeCheckbox.checked) {
        completeCheckbox.checked = true;
        changeCheckboxStateCompleto();
    }

    // Start presentation if not active
    const isPresentationActive = !presentationContainer.classList.contains('hidden');
    // Load and play the first hymn in the shuffled list
    playCurrentInPlaylist(() => {
        if (!isPresentationActive) {
            startPresentation();
        } else {
            // Ensure audio starts if already in presentation
            safeAutoplayAudio();
        }
    });
}

function stopRandomPlaylist() {
    playlistActive = false;
    playlistOrder = [];
    playlistPosition = 0;

    // Toggle icons
    if (playlistIcon) playlistIcon.classList.remove('hidden');
    if (playlistStopIcon) playlistStopIcon.classList.add('hidden');
    if (fsStopPlaylistButton) fsStopPlaylistButton.classList.add('hidden');
    if (fsNextHymnButton) fsNextHymnButton.classList.add('hidden');

    // Stop audio and exit presentation, go back to main view
    try {
        if (audioPlayer && !audioPlayer.paused) audioPlayer.pause();
        if (audioPlayer) audioPlayer.currentTime = 0;
    } catch (_) {}
    exitPresentation();
}

function safeAutoplayAudio() {
    if (!audioPlayer) return;
    const tryPlay = () => {
        const p = audioPlayer.play();
        if (p && typeof p.catch === 'function') {
            p.catch(() => {});
        }
    };
    // Try immediately; also ensure play after source loads
    const onLoaded = () => {
        audioPlayer.removeEventListener('loadeddata', onLoaded);
        tryPlay();
    };
    audioPlayer.addEventListener('loadeddata', onLoaded, { once: true });
    tryPlay();
}

function playCurrentInPlaylist(afterLoadCb) {
    if (!playlistActive || playlistOrder.length === 0) return;
    const idx = playlistOrder[playlistPosition % playlistOrder.length];
    currentHymnIndex = idx;
    const selectedHymn = hymns[currentHymnIndex];

    // Reflect in input and UI
    const input = document.getElementById('hymn-select');
    if (input) input.value = selectedHymn.title;
    currentSlideIndex = 0;
    updateSlides();
    updatePreview();

    // Load audio then autoplay
    Promise.resolve(loadHymnAudio(currentHymnIndex)).finally(() => {
        safeAutoplayAudio();
        if (typeof afterLoadCb === 'function') afterLoadCb();
    });
}

function advancePlaylist() {
    if (!playlistActive) return;
    playlistPosition = (playlistPosition + 1) % playlistOrder.length;
    playCurrentInPlaylist();
}

function startPresentation() {
    // Ensure complete mode is on in presentation per requirement
    if (completeCheckbox && !completeCheckbox.checked) {
        completeCheckbox.checked = true;
        changeCheckboxStateCompleto();
    }
    presentationContainer.classList.remove("hidden");
    updateSlideContent();
    updateCounter();
    // In playlist mode or manual, try to play; ignore autoplay errors
    safeAutoplayAudio();
}

function exitPresentation() {
    try {
        if (audioPlayer && !audioPlayer.paused) {
            audioPlayer.pause();
        }
        if (audioPlayer) {
            audioPlayer.currentTime = 0;
        }
    } catch (e) {
        // noop: best-effort stop
    }
    presentationContainer.classList.add("hidden");
    // Ensure fullscreen playlist controls are hidden when leaving presentation
    if (fsStopPlaylistButton) fsStopPlaylistButton.classList.add('hidden');
    if (fsNextHymnButton) fsNextHymnButton.classList.add('hidden');
}

function updateFontSize() {
    // Re-query targets to avoid stale refs
    const preview = document.getElementById('slide-content');
    const fullscreen = document.getElementById('fullscreen-content');
    const display = document.getElementById('font-size-display');
    if (preview) preview.style.fontSize = `${fontSize * 0.25}rem`;
    if (fullscreen) fullscreen.style.fontSize = `${fontSize * 0.35}rem`;
    if (display) display.textContent = `${fontSize * 0.25}rem`;
}

function updateBackground() {
    const bgImage = document.getElementById('bg-image');
    const fullscreenBgImage = document.getElementById('fullscreen-bg-image');
    bgImageIndex = (bgImageIndex + 1) % bgImages.length;
    bgImage.src = bgImages[bgImageIndex];
    fullscreenBgImage.src = bgImages[bgImageIndex];

    // Save settings including current background image
    saveSettings();
}

function updateFontColor() {
    const fontColorInput = document.getElementById('font-color');
    if (!fontColorInput) {
        console.error('Font color input not found');
        return;
    }
    const selectedColor = fontColorInput.value;
    document.querySelectorAll('.slide-content').forEach(el => {
        el.style.color = selectedColor;
    });
    saveSettings();
}

function updateLineHeight() {
    const selectedLineHeight = lineHeight;
    document.querySelectorAll('.slide-content').forEach(el => {
        if (el) {
            el.style.lineHeight = selectedLineHeight;
        }
    });
    document.getElementById('line-height-display').textContent = selectedLineHeight.toFixed(1);
    saveSettings();
}

function updateFontFamily() {
    const selectedFont = fontSelector.value;
    document.querySelectorAll('.slide-content').forEach(el => {
        if (el) {
            el.style.fontFamily = selectedFont;
        }
    });
    saveSettings();
}

async function loadHymnAudio(hymnNumber) {
    if (!('caches' in window)) {
        // Fallback to direct loading if Cache API not available
        const audioElement = document.getElementById('hymn-audio');
        audioElement.src = `mp3/${hymnNumber}.mp3`;
        return;
    }

    hymnNumber = hymnNumber + 1;
    const audioElement = document.getElementById('hymn-audio');
    const sourceElement = document.getElementById('audio-source');
    const mp3Url = `https://raw.githubusercontent.com/ministerioquartoanjo/hinario/refs/heads/desenv/media/${String(hymnNumber).padStart(3, '0')}-piano.mp3`;

    const cache = await caches.open('mp3-cache');
    const cachedResponse = await cache.match(mp3Url);

    if (cachedResponse) {
        const cachedDate = new Date(cachedResponse.headers.get('date'));
        const threeYearsInMs = 3 * 365 * 24 * 60 * 60 * 1000; // 3 anos em milissegundos
        if (Date.now() - cachedDate.getTime() > threeYearsInMs) {
            await cache.delete(mp3Url); // Remove o arquivo expirado
        } else {
            const blob = await cachedResponse.blob();
            sourceElement.src = URL.createObjectURL(blob);
            audioElement.load();
            return;
        }
    }

    // Se o arquivo não estiver no cache ou tiver expirado, baixa novamente
    const response = await fetch(mp3Url);
    if (!response.ok) throw new Error(`Falha ao baixar: ${mp3Url}`);
    const blob = await response.blob();
    await cache.put(mp3Url, new Response(blob, { headers: { 'date': new Date().toUTCString() } }));
    sourceElement.src = URL.createObjectURL(blob);
    audioElement.load();
}

/**
 * Cria um array de slides para o hino informado.
 * @param {object} hymn - Hino a ser processado.
 * @returns {array} Array de slides com conteúdo do hino.
 */
function createSlides(hymn) {
    const slides = [];
    const verses = hymn.verses;
    const chorus = hymn.coro;

    // First slide is the title (in white) and author
    slides.push(`<span class="title-slide text-white">${hymn.title}</span><br><span class="author-slide text-yellow-400">${hymn.author}</span>`);

    // Process verses and add corresponding chorus after each
    if (Array.isArray(verses[0])) {
        verses.forEach((verse, verseIndex) => {
            // Add verse lines (2 per slide)
            for (let i = 0; i < verse.length; i += 2) {
                const lines = verse.slice(i, i + 2);
                if (Array.isArray(lines)) {
                    slides.push(`<span class="verse-slide">${lines.join('<br>')}</span>`);
                }
            }

            // Add corresponding chorus after the verse (2 per slide)
            if (chorus && Array.isArray(chorus[0]) && chorus[verseIndex]) {
                const currentChorus = chorus[verseIndex];
                for (let i = 0; i < currentChorus.length; i += 2) {
                    const lines = currentChorus.slice(i, i + 2);
                    if (Array.isArray(lines)) {
                        slides.push(`<span class="chorus-slide text-yellow-400">${lines.join('<br>')}</span>`);
                    }
                }
            } else if (chorus && !Array.isArray(chorus[0])) {
                // Single chorus case
                for (let i = 0; i < chorus.length; i += 2) {
                    const lines = chorus.slice(i, i + 2);
                    if (Array.isArray(lines)) {
                        slides.push(`<span class="chorus-slide text-yellow-400">${lines.join('<br>')}</span>`);
                    }
                }
            }
        });
    } else {
        // Single verse case
        for (let i = 0; i < verses.length; i += 2) {
            const lines = verses.slice(i, i + 2);
            if (Array.isArray(lines)) {
                slides.push(`<span class="verse-slide">${lines.join('<br>')}</span>`);
            }
        }
        // Add chorus if exists
        if (chorus) {
            for (let i = 0; i < chorus.length; i += 2) {
                const lines = chorus.slice(i, i + 2);
                if (Array.isArray(lines)) {
                    slides.push(`<span class="chorus-slide text-yellow-400">${lines.join('<br>')}</span>`);
                }
            }
        }
    }

    return slides;
}

const COMPLETE_HYMN_FONT_FACTOR = 0.8;

function createSlidesComplete(hymn) {
    // First slide uses existing logic
    const firstSlide = `<span class="title-slide text-white">${hymn.title}</span><br><span class="author-slide text-yellow-400">${hymn.author}</span>`;

    // Second slide shows complete hymn with scroll
    let completeHymnContent = `<div class='complete-scroll' tabindex='0' style='font-size: ${COMPLETE_HYMN_FONT_FACTOR * 100}%; overflow-y: auto; height: 100%;'>`;

    // Process verses and chorus in correct order
    if (Array.isArray(hymn.verses[0])) {
        hymn.verses.forEach((verse, index) => {
            completeHymnContent += `<div class='complete-verse text-left'>${verse.join('<br>')}</div>`;
            // Add corresponding chorus if available
            if (hymn.coro && Array.isArray(hymn.coro[0]) && hymn.coro[index]) {
                completeHymnContent += `<div class='complete-chorus text-left text-yellow-400'>${hymn.coro[index].join('<br>')}</div>`;
            } else if (hymn.coro && !Array.isArray(hymn.coro[0])) {
                completeHymnContent += `<div class='complete-chorus text-left text-yellow-400'>${hymn.coro.join('<br>')}</div>`;
            }
        });
    } else {
        completeHymnContent += `<div class='complete-verse text-left'>${hymn.verses.join('<br>')}</div>`;
        if (hymn.coro) {
            completeHymnContent += `<div class='complete-chorus text-left text-yellow-400'>${hymn.coro.join('<br>')}</div>`;
        }
    }

    completeHymnContent += '</div>';

    return [firstSlide, completeHymnContent];
}

function goToFirstSlide() {
    currentSlideIndex = 0;
    updateSlideContent();
    updateCounter();
}

// Settings storage with debug
function saveSettings() {
    const bgImage = document.getElementById('bg-image');
    const currentBgImage = bgImage.src;
    const slideContent = document.querySelector('.slide-content');

    const settings = {
        fontSize: slideContent?.style.fontSize || '1rem',
        lineHeight: slideContent?.style.lineHeight || '1.5',
        bgColor: document.querySelector('.bg-container')?.style.backgroundColor || '',
        fontColor: rgbToHex(slideContent?.style.color || '#FFFFFF'),
        fontFamily: fontSelector.value || 'serif',
        bgImage: currentBgImage,
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (!saved) {
            return;
        }

        const settings = JSON.parse(saved);

        if (settings.expires < Date.now()) {
            localStorage.removeItem(SETTINGS_KEY);
            return;
        }

        // Apply font size
        if (settings.fontSize) {
            document.querySelectorAll('.slide-content').forEach(el => {
                el.style.fontSize = settings.fontSize;
            });
            document.getElementById('font-size-display').textContent = settings.fontSize;
        }

        // Apply line height
        if (settings.lineHeight) {
            document.querySelectorAll('.slide-content').forEach(el => {
                el.style.lineHeight = settings.lineHeight;
            });
            document.getElementById('line-height-display').textContent = settings.lineHeight;
        }

        // Apply background color
        if (settings.bgColor) {
            document.querySelectorAll('.bg-container').forEach(el => {
                el.style.backgroundColor = settings.bgColor;
            });
        }

        // Apply font color
        if (settings.fontColor) {
            document.querySelectorAll('.slide-content').forEach(el => {
                el.style.color = settings.fontColor;
            });
            fontColorInput.value = settings.fontColor;
        }

        // Apply font family
        if (settings.fontFamily) {
            document.querySelectorAll('.slide-content').forEach(el => {
                el.style.fontFamily = settings.fontFamily;
            });
            fontSelector.value = settings.fontFamily;
        }

        // Apply background image
        if (settings.bgImage) {
            const bgImage = document.getElementById('bg-image');
            const fullscreenBgImage = document.getElementById('fullscreen-bg-image');
            bgImage.src = settings.bgImage;
            fullscreenBgImage.src = settings.bgImage;
            bgImage.style.display = 'block';
            fullscreenBgImage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function resetSettings() {
    localStorage.removeItem(SETTINGS_KEY);

    // Aplicar valores padrão
    document.querySelectorAll('.slide-content').forEach(el => {
        el.style.fontSize = '1rem';
        el.style.lineHeight = '1.5';
        el.style.color = '#FFFFFF';
    });
    const bgContainer = document.querySelector('.bg-container');
    if (bgContainer) {
        bgContainer.style.backgroundColor = '';
    }
    document.getElementById('font-selector').value = 'serif';
    document.getElementById('font-size-display').textContent = '1rem';
    document.getElementById('line-height-display').textContent = '1.0';
}

// Initialization
document.addEventListener("DOMContentLoaded", init);

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        document.getElementById('info-overlay').classList.add('hidden');
    }
});

document.getElementById('info-overlay').addEventListener('click', (event) => {
    if (event.target === document.getElementById('info-overlay')) {
        document.getElementById('info-overlay').classList.add('hidden');
    }
});

// Add swipe functionality
const containers = document.querySelectorAll('#preview-container, #presentation-container');
containers.forEach(container => {
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
});

async function checkIfAllMP3sAreCached() {
    if (!('caches' in window)) return false;
    try {
        const cache = await caches.open('mp3-cache');
        const keys = await cache.keys();
        return keys.length > 0;
    } catch (error) {
        console.error('Cache check failed:', error);
        return false;
    }
}

// Info overlay handling
const infoIcon = document.getElementById('info-icon');
const infoOverlay = document.getElementById('info-overlay');
const closeOverlay = document.getElementById('close-overlay');

if (infoIcon) {
    infoIcon.addEventListener('click', () => {
        infoOverlay.classList.remove('hidden');
    });
}

if (closeOverlay) {
    closeOverlay.addEventListener('click', () => {
        infoOverlay.classList.add('hidden');
    });
}

document.getElementById('close-overlay').addEventListener('click', () => {
    document.getElementById('info-overlay').classList.add('hidden');
});

async function downloadMP3s() {
    const progressBar = document.getElementById('progress-bar');
    const downloadProgress = document.getElementById('download-progress');
    downloadProgress.classList.remove('hidden');

    const mp3Urls = Array.from({ length: 196 }, (_, i) => `https://raw.githubusercontent.com/ministerioquartoanjo/hinario/refs/heads/desenv/media/${String(i + 1).padStart(3, '0')}-piano.mp3`);
    const cache = await caches.open('mp3-cache');

    for (let i = 0; i < mp3Urls.length; i++) {
        try {
            const cachedResponse = await cache.match(mp3Urls[i]);
            if (!cachedResponse) {
                const response = await fetch(mp3Urls[i]);
                if (!response.ok) throw new Error(`Falha ao baixar: ${mp3Urls[i]}`);
                const blob = await response.blob();
                await cache.put(mp3Urls[i], new Response(blob));
            }
        } catch (error) {
            console.error(error);
        }

        const progress = ((i + 1) / mp3Urls.length) * 100;
        progressBar.style.width = `${progress}%`;
    }
}

// Wire hamburger menu actions
(function setupHamburgerMenu(){
    const menuIcon = document.getElementById('menu-icon');
    const dropdown = document.getElementById('main-menu');
    const downloadItem = document.getElementById('menu-download-mp3s');
    const menuInfoItem = document.getElementById('menu-info');

    if (!menuIcon || !dropdown) return;

    function hideMenu(){
        dropdown.classList.add('hidden');
    }

    function positionDropdown() {
        const iconRect = menuIcon.getBoundingClientRect();
        // Temporarily show to measure width if hidden
        const wasHidden = dropdown.classList.contains('hidden');
        if (wasHidden) {
            dropdown.classList.remove('hidden');
            dropdown.style.visibility = 'hidden';
        }
        const menuWidth = dropdown.offsetWidth;
        const top = iconRect.bottom + 8 + window.scrollY;
        const left = Math.max(8, iconRect.right - menuWidth + window.scrollX);
        dropdown.style.top = `${top}px`;
        dropdown.style.left = `${left}px`;
        if (wasHidden) {
            dropdown.style.visibility = '';
            dropdown.classList.add('hidden');
        }
    }

    function toggleMenu(e){
        e.stopPropagation();
        const willShow = dropdown.classList.contains('hidden');
        if (willShow) positionDropdown();
        dropdown.classList.toggle('hidden');
    }

    menuIcon.addEventListener('click', toggleMenu);

    // Download action from menu item
    if (downloadItem) {
        downloadItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof downloadMP3s === 'function') {
                hideMenu();
                downloadMP3s();
            }
        });
    }

    // Info overlay from menu item
    if (menuInfoItem) {
        const infoOverlay = document.getElementById('info-overlay');
        menuInfoItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (infoOverlay) {
                infoOverlay.classList.remove('hidden');
            } else if (typeof infoIcon !== 'undefined' && infoIcon) {
                // Fallback: simulate click on existing info icon
                infoIcon.click();
            }
            hideMenu();
        });
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!dropdown.classList.contains('hidden')) {
            const path = e.composedPath ? e.composedPath() : [];
            if (!path.includes(dropdown) && !path.includes(menuIcon)) {
                hideMenu();
            }
        }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideMenu();
    });

    // Keep aligned on scroll/resize when visible
    window.addEventListener('resize', () => {
        if (!dropdown.classList.contains('hidden')) positionDropdown();
    });
    window.addEventListener('scroll', () => {
        if (!dropdown.classList.contains('hidden')) positionDropdown();
    }, { passive: true });
})();

// Mobile-specific event listeners
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenu = document.querySelector('.mobile-menu');
    const presentationContainer = document.getElementById('presentation-container');

    // Show/hide mobile menu
    document.addEventListener('touchstart', (e) => {
        if (presentationContainer.classList.contains('hidden')) {
            mobileMenu.classList.remove('hidden');
            setTimeout(() => mobileMenu.classList.add('hidden'), 3000);
        }
    });

    // Mobile menu buttons
    document.getElementById('mobile-presentation').addEventListener('click', startPresentation);
});

function clearHymnInput() {
    const input = document.getElementById('hymn-select');
    if (!input) return;
    input.value = '';
    // Fire native events so any listeners react
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    // Notify jQuery autocomplete if present
    if (typeof $ !== 'undefined' && $("#hymn-select").length) {
        $("#hymn-select").val('');
        // Simulate keyup with empty value to refresh plugin state
        const e = jQuery.Event('keyup');
        e.which = 8; // backspace
        $("#hymn-select").trigger(e);
    }
    input.focus();
}

document.addEventListener('click', (event) => {
    const target = event.target;
    const btn = target.closest && target.closest('#clear-hymn');
    if (btn) {
        event.preventDefault();
        event.stopPropagation();
        clearHymnInput();
    }
}, true);

// Top drawer toggle for Settings panel
function setupTopDrawer() {
    const drawer = document.getElementById('top-drawer');
    const drawerContent = document.getElementById('top-drawer-content');
    const handle = document.getElementById('drawer-handle');
    const closeBtn = document.getElementById('drawer-close');
    const settings = document.querySelector('.settings');
    const settingsAnchor = document.getElementById('settings-anchor');

    if (!drawer || !drawerContent || !handle || !settings || !settingsAnchor) return;

    let isOpen = false;

    // Start with settings inside the drawer (hidden)
    if (settings.parentElement !== drawerContent) {
        drawerContent.appendChild(settings);
    }

    function positionHandleBelowDrawer() {
        const rect = drawer.getBoundingClientRect();
        handle.style.top = `${rect.height}px`;
        handle.classList.add('opened');
    }

    function positionHandleAtTop() {
        handle.style.top = '0px';
        handle.classList.remove('opened');
    }

    function setHandleIcon(up) {
        const icon = handle.querySelector('i');
        if (!icon) return;
        icon.classList.remove('fa-chevron-down', 'fa-chevron-up');
        icon.classList.add(up ? 'fa-chevron-up' : 'fa-chevron-down');
    }

    function openDrawer() {
        if (isOpen) return;
        if (settings.parentElement !== drawerContent) {
            drawerContent.appendChild(settings);
        }
        drawer.classList.add('open');
        setHandleIcon(true);
        positionHandleBelowDrawer();
        isOpen = true;
    }

    function closeDrawer() {
        if (!isOpen) return;
        drawer.classList.remove('open');
        setHandleIcon(false);
        positionHandleAtTop();
        isOpen = false;
    }

    function toggleDrawer() {
        isOpen ? closeDrawer() : openDrawer();
    }

    handle.addEventListener('click', toggleDrawer);
    if (closeBtn) closeBtn.addEventListener('click', () => isOpen ? closeDrawer() : null);

    // Optional: swipe down/up near top to open/close on touch devices
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length) {
            touchStartY = e.touches[0].clientY;
        }
    }, { passive: true });
    window.addEventListener('touchend', (e) => {
        const endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : 0;
        const diff = endY - touchStartY;
        if (!isOpen && touchStartY < 60 && diff > 30) {
            openDrawer();
        } else if (isOpen && diff < -30) {
            closeDrawer();
        }
    }, { passive: true });

    // Keep handle positioned under drawer while open on resize/orientation change
    window.addEventListener('resize', () => {
        if (isOpen) positionHandleBelowDrawer();
    });
}

function increaseFontSize() {
    if (fontSize < 8) {
        fontSize++;
        updateFontSize();
        saveSettings(); // Save settings after changing font size
    }
}

function decreaseFontSize() {
    if (fontSize > 3) {
        fontSize--;
        updateFontSize();
        saveSettings(); // Save settings after changing font size
    }
}

function setupSwipe(element) {
    let startX1 = 0, startX2 = 0;
    const threshold = 100; // Distância mínima para trocar de hino

    element.addEventListener('touchstart', e => {
        if (e.touches.length === 2) { // Dois dedos
            startX1 = e.touches[0].clientX;
            startX2 = e.touches[1].clientX;
        }
    }, { passive: true });

    element.addEventListener('touchend', e => {
        if (e.touches.length === 0 && startX1 && startX2) { // Terminou swipe com dois dedos
            const avgStart = (startX1 + startX2) / 2;
            const avgEnd = (e.changedTouches[0].clientX + e.changedTouches[1].clientX) / 2;
            const diffX = avgEnd - avgStart;

            if (Math.abs(diffX) > threshold) {
                diffX > 0 ? previousHymn() : nextHymn();
            }
            startX1 = 0;
            startX2 = 0;
        }
    }, { passive: true });
}

let slideshowInterval;

function startBackgroundSlideshow() {
    // Create fullscreen slideshow container
    const slideshowContainer = document.createElement('div');
    slideshowContainer.id = 'slideshow-container';
    slideshowContainer.className = 'fixed inset-0 z-50 bg-black flex items-center justify-center';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'absolute top-4 right-4 text-white text-2xl z-50';
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.addEventListener('click', stopBackgroundSlideshow);
    
    // Create image element
    const slideshowImage = document.createElement('img');
    slideshowImage.id = 'slideshow-image';
    slideshowImage.className = 'max-w-full max-h-full object-contain';
    
    // Append elements
    slideshowContainer.appendChild(closeButton);
    slideshowContainer.appendChild(slideshowImage);
    document.body.appendChild(slideshowContainer);
    
    // Start slideshow
    changeSlideshowImage();
    slideshowInterval = setInterval(changeSlideshowImage, 30000);
    
    // Keyboard controls
    document.addEventListener('keydown', handleSlideshowKeyPress);
}

function changeSlideshowImage() {
    const slideshowImage = document.getElementById('slideshow-image');
    const randomIndex = Math.floor(Math.random() * bgImages.length);
    slideshowImage.src = bgImages[randomIndex];
}

function stopBackgroundSlideshow() {
    clearInterval(slideshowInterval);
    const slideshowContainer = document.getElementById('slideshow-container');
    if (slideshowContainer) {
        document.removeEventListener('keydown', handleSlideshowKeyPress);
        slideshowContainer.remove();
    }
}

function handleSlideshowKeyPress(e) {
    if (e.key === 'Escape') {
        stopBackgroundSlideshow();
    } else if (e.key === 'ArrowRight' || e.key === ' ') {
        changeSlideshowImage();
    }
}
