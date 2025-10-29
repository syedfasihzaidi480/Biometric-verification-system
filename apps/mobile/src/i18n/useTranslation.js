import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { translations, supportedLanguages } from './translations';

const STORAGE_KEY = 'user-language-preference';

// Zustand store for language management
export const useLanguageStore = create((set, get) => ({
  currentLanguage: 'en',
  isLoading: true,
  
  setLanguage: async (language) => {
    if (translations[language]) {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, language);
        set({ currentLanguage: language });
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    }
  },
  
  initializeLanguage: async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLanguage && translations[savedLanguage]) {
        set({ currentLanguage: savedLanguage });
      }
    } catch (error) {
      console.warn('Failed to load saved language, using default:', error);
    } finally {
      set({ isLoading: false });
    }
  }
}));

// Translation helper function
const translate = (key, language, params = {}) => {
  const keys = key.split('.');
  let translation = translations[language];
  
  for (const k of keys) {
    if (translation && typeof translation === 'object') {
      translation = translation[k];
    } else {
      // Fallback to English if translation not found
      translation = translations.en;
      for (const k2 of keys) {
        if (translation && typeof translation === 'object') {
          translation = translation[k2];
        } else {
          break;
        }
      }
      break;
    }
  }
  
  if (typeof translation !== 'string') {
    return key; // Return key if no translation found
  }
  
  // Simple template replacement
  let result = translation;
  Object.keys(params).forEach(param => {
    result = result.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
  });
  
  return result;
};

// Main hook for translations
export const useTranslation = () => {
  const { currentLanguage, setLanguage, initializeLanguage, isLoading } = useLanguageStore();
  
  useEffect(() => {
    initializeLanguage();
  }, []);
  
  const t = (key, params = {}) => {
    return translate(key, currentLanguage, params);
  };
  
  const changeLanguage = async (language) => {
    await setLanguage(language);
  };
  
  const getCurrentLanguage = () => currentLanguage;
  
  const getSupportedLanguages = () => supportedLanguages;
  
  return {
    t,
    changeLanguage,
    currentLanguage,
    getCurrentLanguage,
    getSupportedLanguages,
    isLoading
  };
};

// Simple helper for getting language info
export const getLanguageInfo = (code) => {
  return supportedLanguages.find(lang => lang.code === code) || supportedLanguages[0];
};

export default useTranslation;