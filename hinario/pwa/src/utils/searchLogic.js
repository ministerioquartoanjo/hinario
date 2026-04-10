/**
 * Shared search and autocomplete logic for both main app and remote control
 */
export const searchLogic = {
    /**
     * Filter hymns based on a search term
     */
    filterHinos(hinos, term, limit = 10) {
        if (!term) return [];
        const cleanTerm = term.toLowerCase().trim();
        return hinos.filter(h => 
            h.numero.toString().includes(cleanTerm) || 
            (h.titulo && h.titulo.toLowerCase().includes(cleanTerm)) ||
            (h.letras && h.letras.some(l => l && l.texto && l.texto.toLowerCase().includes(cleanTerm)))
        ).slice(0, limit);
    },

    /**
     * Common keydown handling for autocomplete lists
     */
    handleKeyboardNavigation(event, selectedIndex, listLength) {
        if (listLength === 0) return selectedIndex;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                return (selectedIndex + 1) % listLength;
            case 'ArrowUp':
                event.preventDefault();
                return (selectedIndex - 1 + listLength) % listLength;
            case 'Escape':
                return -1;
            default:
                return selectedIndex;
        }
    }
};
