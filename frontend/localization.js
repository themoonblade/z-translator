// Localization Manager
class LocalizationManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('language') || 'fr';
        this.translations = {};
    }

    async init() {
        // Load all available translations
        const languages = ['fr', 'en', 'de', 'es', 'pt', 'it'];
        
        for (const lang of languages) {
            try {
                const response = await fetch(`text-${lang}.json`);
                if (response.ok) {
                    this.translations[lang] = await response.json();
                }
            } catch (error) {
                console.error(`Error loading translation for ${lang}:`, error);
            }
        }
    }

    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('language', lang);
            this.updatePageContent();
        }
    }

    getLanguage() {
        return this.currentLanguage;
    }

    getText(path) {
        const keys = path.split('.');
        let value = this.translations[this.currentLanguage];

        for (const key of keys) {
            value = value?.[key];
            if (!value) {
                return path; // Return path if translation not found
            }
        }

        return value;
    }

    updatePageContent() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const text = this.getText(key);
            
            // Handle placeholder attributes
            if (element.placeholder !== undefined) {
                element.placeholder = text;
            } 
            // Handle title attributes
            else if (element.title && element.getAttribute('data-has-title') === 'true') {
                element.title = text;
            } 
            // Handle textContent for regular elements
            else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                if (element.placeholder !== undefined) {
                    element.placeholder = text;
                }
            }
            else {
                element.textContent = text;
            }
        });

        // Update all elements with data-i18n-html attribute
        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            const text = this.getText(key);
            element.innerHTML = text;
        });

        // Dispatch event so other scripts know language changed
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: this.currentLanguage } }));
    }
}

// Create global instance
const i18n = new LocalizationManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await i18n.init();
    i18n.updatePageContent();
});
