import en from '../en.json';
import fr from '../fr.json';
import so from '../so.json';
import am from '../am.json';
import om from '../om.json';
const dicts = { en, fr, so, am, om };
export function createI18n(lang) {
    const d = dicts[lang] || en;
    function t(key, params) {
        const parts = key.split('.');
        let cur = d;
        for (const p of parts)
            cur = cur?.[p];
        if (typeof cur !== 'string')
            return key;
        if (!params)
            return cur;
        return cur.replace(/{{(\w+)}}/g, (_, k) => (params[k] ?? ''));
    }
    return { t };
}
export const supportedLanguages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
    { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
    { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' }
];
