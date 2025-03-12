// Constants and Variables
const SETTINGS_KEY = 'hymnSettings';
const TWO_YEARS = 1000 * 60 * 60 * 24 * 365 * 2;
const bgImages = [
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1518173946687-7b093b07772d?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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

const SWIPE_THRESHOLD = 50; // Minimum swipe distance in pixels

let currentHymnIndex = 0; // Index of the currently selected hymn
let currentSlideIndex = 0; // Index of the currently displayed slide
let slides = []; // Array of slide content for the current hymn
let fontSize = 5; // Default font size multiplier
let lineHeight = 1.0; // Default line height
let bgImageIndex = 0; // Index of the current background image

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
            adjustLineHeight(0.1);
            break;
        case "ArrowDown":
            adjustLineHeight(-0.1);
            break;
        case "r":
            if (e.altKey) {
                resetSettings();
            }
            break;
        case "f":
            updateBackground();
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

// Main Functions
function init() {
    const hymnTitles = hymns.map(hymn => hymn.title);
    $("#hymn-select").autocomplete(hymnTitles, {
        width: 360,
        selectFirst: false,
        matchContains: "word"
    }).dblclick(function() {
        $(this).val('');
        return false;
    });

    $("#hymn-select").result(function (event, data, formatted) {
        const selectedHymn = hymns.find(hymn => hymn.title === formatted);
        if (selectedHymn) {
            currentHymnIndex = hymns.indexOf(selectedHymn);
            slides = createSlides(selectedHymn);

            // TODO: rolagem do texto nao funciona dentro do elemento preview e full
            // slides = createSlidesComplete(selectedHymn);
            currentSlideIndex = 0;
            updatePreview();
            loadHymnAudio(currentHymnIndex);
        }
    });

    startButton.addEventListener("click", startPresentation);
    prevButton.addEventListener("click", previousSlide);
    nextButton.addEventListener("click", nextSlide);
    closeFullscreenButton.addEventListener("click", () => {
        if (!audioPlayer.paused) {
            audioPlayer.pause();
        }
        exitPresentation();
    });

    document.addEventListener("keydown", handleKeyPress);

    fontIncreaseButton.addEventListener("click", () => {
        if (fontSize < 8) {
            fontSize++;
            updateFontSize();
            saveSettings(); // Save settings after changing font size
        }
    });
    fontDecreaseButton.addEventListener("click", () => {
        if (fontSize > 3) {
            fontSize--;
            updateFontSize();
            saveSettings(); // Save settings after changing font size
        }
    });
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

    // Set initial font color from localStorage or color picker
    const slideContent = document.getElementById('slide-content');
    const fullscreenContent = document.getElementById('fullscreen-content');

    if (fontColorInput && slideContent && fullscreenContent) {
        const savedColor = localStorage.getItem('fontColor');
        const initialColor = savedColor || fontColorInput.value;
        slideContent.style.color = initialColor;
        fullscreenContent.style.color = initialColor;
        fontColorInput.value = initialColor;
    }

    // Initialize with a random hymn de 0 ate hymns.length - 1
    currentHymnIndex = Math.floor(Math.random() * hymns.length);
    updateSlides();
    updatePreview();
    loadHymnAudio(currentHymnIndex);
    previewContainer.classList.remove("hidden");
}

function updateSlides() {
    slides = createSlides(hymns[currentHymnIndex]);
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

function startPresentation() {
    presentationContainer.classList.remove("hidden");
    updateSlideContent();
    updateCounter();
    audioPlayer.play();
}

function exitPresentation() {
    presentationContainer.classList.add("hidden");
}

function updateFontSize() {
    slideContent.style.fontSize = `${fontSize * 0.5}rem`;
    fullscreenContent.style.fontSize = `${fontSize * 0.7}rem`;
    document.getElementById('font-size-display').textContent = `${fontSize * 0.5}rem`;
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
    console.log('updateFontColor called');
    const fontColorInput = document.getElementById('font-color');
    if (!fontColorInput) {
        console.error('Font color input not found');
        return;
    }
    const selectedColor = fontColorInput.value;
    console.log('Current selected color:', selectedColor);
    document.querySelectorAll('.slide-content').forEach(el => {
        el.style.color = selectedColor;
    });
    saveSettings();
    console.log('Font color updated to:', selectedColor);
}

function updateLineHeight() {
    const selectedLineHeight = lineHeight;
    console.log('Updating line height to:', selectedLineHeight);
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
    console.log('Updating font family to:', selectedFont);
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
    console.log('Loading hymn audio for hymn:', hymnNumber);
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
    console.log('## Creating slides for hymn:', hymn);
    const slides = [];
    const verses = hymn.verses;
    const chorus = hymn.coro;

    // First slide is the title (in white) and author
    slides.push(`<span class="title-slide">${hymn.title}</span><br><span class="author-slide text-yellow-400">${hymn.author}</span>`);

    // Process verses and add corresponding chorus after each
    if (Array.isArray(verses[0])) {
        verses.forEach((verse) => {
            // Add 2 lines per slide
            for (let i = 0; i < verse.length; i += 2) {
                const lines = verse.slice(i, i + 2);
                slides.push(`<span class="verse-slide">${lines.join('<br>')}</span>`);
            }
            // Add chorus after the verse
            if (chorus) {
                for (let i = 0; i < chorus.length; i += 2) {
                    const lines = chorus.slice(i, i + 2);
                    slides.push(`<span class="chorus-slide text-yellow-400">${lines.join('<br>')}</span>`);
                }
            }
        });
    } else {
        // Handle single verse scenario
        const lines = verses;
        slides.push(`<span class="verse-slide">${lines.join('<br>')}</span>`);
        // Add chorus if available
        if (chorus) {
            for (let i = 0; i < chorus.length; i += 2) {
                const lines = chorus.slice(i, i + 2);
                slides.push(`<span class="chorus-slide">${lines.join('<br>')}</span>`);
            }
        }
    }

    // Limit to 2 lines per slide
    const finalSlides = [];
    for (let i = 0; i < slides.length; i += 2) {
        finalSlides.push(slides[i]);
        if (i + 1 < slides.length) {
            finalSlides.push(slides[i + 1]);
        }
    }

    console.log('Final slides:', finalSlides);

    return finalSlides;
}

const COMPLETE_HYMN_FONT_FACTOR = 0.8;

function createSlidesComplete(hymn) {
    // First slide uses existing logic
    const firstSlide = createSlides(hymn)[0];

    // Second slide shows complete hymn with scroll
    let completeHymnContent = `<div style='font-size: ${COMPLETE_HYMN_FONT_FACTOR * 100}%; overflow-y: auto; height: 100%;'>`;

    // Process verses and chorus in correct order
    if (Array.isArray(hymn.verses[0])) {
        hymn.verses.forEach((verse) => {
            completeHymnContent += `<div class='complete-verse'>${verse.join('<br>')}</div>`;
            if (hymn.coro) {
                completeHymnContent += `<div class='complete-chorus'>${hymn.coro.join('<br>')}</div>`;
            }
        });
    } else {
        completeHymnContent += `<div class='complete-verse'>${hymn.verses.join('<br>')}</div>`;
        if (hymn.coro) {
            completeHymnContent += `<div class='complete-chorus'>${hymn.coro.join('<br>')}</div>`;
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
    console.log('Saving settings:', settings);
}

function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (!saved) {
            console.log('No saved settings found');
            return;
        }

        const settings = JSON.parse(saved);
        console.log('Loaded settings:', settings);

        if (settings.expires < Date.now()) {
            console.log('Settings expired');
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

        console.log('Applied settings:', settings);
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function resetSettings() {
    console.log('Configurações resetadas com sucesso!');
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

function updateVersion() {
    const versionElement = document.getElementById('version');
    const currentVersion = versionElement.innerText;
    const newVersion = currentVersion.split('.');
    newVersion[2] = parseInt(newVersion[2]) + 1; // Increment patch version
    versionElement.innerText = newVersion.join('.');
}

// Initialization
document.addEventListener("DOMContentLoaded", init);
// Initialize immediately in case DOM is already loaded
if (document.readyState === "interactive" || document.readyState === "complete") {
    init();
}

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

document.getElementById('download-mp3s').addEventListener('click', downloadMP3s);

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

document.addEventListener('DOMContentLoaded', () => {
    const clearButton = document.getElementById('clear-hymn');
    if (clearButton) {
        clearButton.addEventListener('click', function(event) {
            document.getElementById('hymn-select').value = '';
        });
    }
});

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