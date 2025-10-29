import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './locales/en.json';
import fr from './locales/fr.json';
import so from './locales/so.json';
import am from './locales/am.json';
import om from './locales/om.json';

const STORAGE_KEY = 'user-language-preference';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  so: { translation: so },
  am: { translation: am },
  om: { translation: om }
};

const initI18n = async () => {
  let savedLanguage = null;

  try {
    savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to load saved language:', error);
  }

  const deviceLanguage = Localization.locale.split('-')[0];
  const fallbackLanguage = Object.keys(resources).includes(deviceLanguage) ? deviceLanguage : 'en';
  
  const language = savedLanguage || fallbackLanguage;

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: language,
      fallbackLng: 'en',
      
      keySeparator: '.',
      
      interpolation: {
        escapeValue: false,
      },
      
      compatibilityJSON: 'v3',
      
      react: {
        useSuspense: false,
      },
    });

  return i18n;
};

export const changeLanguage = async (language) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Failed to change language:', error);
  }
};

export const getCurrentLanguage = () => i18n.language;

export const getSupportedLanguages = () => [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' }
];

export { initI18n };
export default i18n;