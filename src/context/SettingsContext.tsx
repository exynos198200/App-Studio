import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, Language, AISettings } from '../types';

interface SettingsContextType {
  theme: Theme;
  language: Language;
  aiSettings: AISettings;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
  setAISettings: (settings: AISettings) => void;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};

const translations = {
  en: {
    'dashboard.title': 'App Studio',
    'dashboard.subtitle': 'Professional development platform.',
    'dashboard.create': 'CREATE PROJECT',
    'dashboard.filter': 'Filter projects...',
    'dashboard.no_projects': 'No projects found',
    'dashboard.no_projects_desc': 'Start by creating a new project. Choose a template to get started quickly.',
    'dashboard.new_project': 'New Project Information',
    'dashboard.project_name': 'Project Name',
    'dashboard.select_template': 'Select Template',
    'dashboard.cancel': 'CANCEL',
    'ide.back': 'Dashboard',
    'ide.settings': 'Settings',
    'ide.build': 'Build APK',
    'ide.files': 'Files',
    'ide.preview': 'Preview',
    'ide.agent': 'AI Agent',
    'settings.title': 'Settings',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.ai_provider': 'AI Provider',
    'settings.ai_model': 'Model',
    'settings.ai_key': 'API Key',
    'settings.save': 'Save',
    'templates.empty': 'Empty Project',
    'templates.react': 'React + Vite',
    'templates.kotlin': 'Kotlin Android',
    'templates.node': 'Node.js Server',
    'agent.placeholder': 'Describe what you want to build...',
    'agent.send': 'Send',
    'agent.error': 'Error in AI response'
  },
  ru: {
    'dashboard.title': 'App Studio',
    'dashboard.subtitle': 'Профессиональная платформа разработки.',
    'dashboard.create': 'СОЗДАТЬ ПРОЕКТ',
    'dashboard.filter': 'Фильтр проектов...',
    'dashboard.no_projects': 'Проекты не найдены',
    'dashboard.no_projects_desc': 'Начните с создания нового проекта. Выберите шаблон для быстрого старта.',
    'dashboard.new_project': 'Информация о новом проекте',
    'dashboard.project_name': 'Название проекта',
    'dashboard.select_template': 'Выберите шаблон',
    'dashboard.cancel': 'ОТМЕНА',
    'ide.back': 'Панель',
    'ide.settings': 'Настройки',
    'ide.build': 'Собрать APK',
    'ide.files': 'Файлы',
    'ide.preview': 'Предпросмотр',
    'ide.agent': 'ИИ Агент',
    'settings.title': 'Настройки',
    'settings.theme': 'Тема',
    'settings.language': 'Язык',
    'settings.ai_provider': 'Провайдер ИИ',
    'settings.ai_model': 'Модель',
    'settings.ai_key': 'API Ключ',
    'settings.save': 'Сохранить',
    'templates.empty': 'Пустой проект',
    'templates.react': 'React + Vite',
    'templates.kotlin': 'Kotlin Android',
    'templates.node': 'Node.js Server',
    'agent.placeholder': 'Опишите, что вы хотите создать...',
    'agent.send': 'Отправить',
    'agent.error': 'Ошибка в ответе ИИ'
  }
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem('app_theme') as Theme || 'dark');
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('app_lang') as Language || 'en');
  const [aiSettings, setAISettings] = useState<AISettings>(() => {
    const saved = localStorage.getItem('app_ai_settings');
    return saved ? JSON.parse(saved) : { provider: 'google', model: 'gemini-1.5-flash', apiKey: '' };
  });

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app_ai_settings', JSON.stringify(aiSettings));
  }, [aiSettings]);

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <SettingsContext.Provider value={{ theme, language, aiSettings, setTheme, setLanguage, setAISettings, t }}>
      {children}
    </SettingsContext.Provider>
  );
};
