import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { translations, supportedLanguages } from './translations';

const STORAGE_KEY = 'user-language-preference';

// Zustand store for language management
export const useLanguageStore = create((set, get) => ({
  currentLanguage: 'fr',
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
const resolvePath = (source, keys) => {
  let current = source;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return undefined;
    }
  }
  return current;
};

const applyParams = (text, params) => {
  let result = text;
  Object.keys(params).forEach((param) => {
    result = result.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
  });
  return result;
};

const translate = (key, language, params = {}) => {
  const { defaultValue, ...rest } = params;
  const keys = key.split('.');

  const localized = resolvePath(translations[language], keys);
  if (typeof localized === 'string') {
    return applyParams(localized, rest);
  }

  const fallback = resolvePath(translations.en, keys);
  if (typeof fallback === 'string') {
    return applyParams(fallback, rest);
  }

  if (typeof defaultValue === 'string') {
    return applyParams(defaultValue, rest);
  }

  return key;
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