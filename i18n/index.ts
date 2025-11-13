import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  en: {
    translation: {
      // Navigation & Tabs
      tabs: {
        discover: 'Winks',
        search: 'Search',
        connections: 'Connections',
        chat: 'Chat',
      },

      // Search Screen
      search: {
        title: 'Discover People',
        searchingPerfectMatch: 'Searching for nearby profiles...',
        searching: 'Searching...',
        newSearch: 'New Search',
        loading: 'Loading...',
        distance: 'm',
        noProfiles: 'No profiles available',
        checkBackLater: 'Try adjusting your filters',
      },

      // Chat Screen
      chat: {
        title: 'Chats',
        noConversations: 'No conversations yet',
        startMatching: 'Start meeting new people',
        chatsCount: 'Chats',
        now: 'now',
        minutes: 'min',
        hours: 'hrs',
        yesterday: 'yesterday',
        days: 'days',
        loading: 'Loading...',
        online: 'Online now',
        offline: 'Offline',
        messageInputPlaceholder: 'Write a message...',
        viewProfile: 'View Profile',
        unmatch: 'Unmatch',
        unmatchTitle: 'Unmatch',
        unmatchConfirm:
          'Are you sure you want to unmatch {{name}}? This cannot be undone.',
        newMatch: "It's a match! Say hi 👋",
        unmatchDetected: 'This conversation has ended.',
      },

      // Loved/Liked Screen
      loved: {
        title: 'Matches & Winks',
        matches: 'Matches',
        liked: 'You Winked',
        noMatches: 'No matches yet',
        noLiked: 'No winks yet',
        startSwiping: 'Start swiping to find matches',
        keepSwiping: 'Keep swiping to find people you like',
        message: 'Message',
        unmatch: 'Unmatch',
        personLiked: 'person winked',
        peopleLiked: 'people winked',
        oneMatch: 'match',
        multipleMatches: 'matches',
      },

      // Profile Detail
      profile: {
        title: 'Profile',
        interests: 'Interests',
        about: 'About',
        location: 'Location',
        age: 'Age',
        distance: 'Distance',
        sendMessage: 'Send Message',
        like: 'Wink',
        pass: 'Pass',
        unmatch: 'Unmatch',
      },

      // Actions & Buttons
      actions: {
        like: 'Wink',
        dislike: 'Unwink',
        message: 'Message',
        close: 'Close',
        cancel: 'Cancel',
        confirm: 'Confirm',
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
        back: 'Back',
        next: 'Next',
        skip: 'Skip',
        done: 'Done',
      },

      // Modals & Confirmations
      modals: {
        unmatchTitle: 'Unmatch',
        unmatchText:
          'Are you sure you want to unmatch? This will also delete your conversation and cannot be undone.',
        confirmUnmatch: 'Unmatch',
        matchTitle: "It's a Match!",
        matchText: 'You both like each other',
        startChatting: 'Start Chatting',
      },

      // Filter Modal
      filter: {
        title: 'Search Filters',
        apply: 'Apply',
        upTo: 'Up to',
        meters: 'm',
      },

      // Settings & Theme
      settings: {
        title: 'Settings',
        subtitle: 'Manage your account and preferences',
        account: 'ACCOUNT',
        editProfile: 'Edit Profile',
        editProfileSubtitle: 'Update your profile information',
        changePassword: 'Change Password',
        changePasswordSubtitle: 'Update your account password',
        privacySecurity: 'PRIVACY & SECURITY',
        privacySettings: 'Privacy Settings',
        privacySettingsSubtitle: 'Control who can see your profile',
        locationServices: 'Location Services',
        blockedUsers: 'Blocked Users',
        blockedUsersCount: '{{count}} blocked users',
        showOnlineStatus: 'Show Online Status',
        showOnlineStatusVisible: 'Visible to matches',
        showOnlineStatusHidden: 'Hidden',
        notifications: 'NOTIFICATIONS',
        pushNotifications: 'Push Notifications',
        messageNotifications: 'Message Notifications',
        messageNotificationsSubtitle: 'Get notified for new messages',
        matchNotifications: 'Match Notifications',
        matchNotificationsSubtitle: 'Get notified for new matches',
        appearance: 'APPEARANCE',
        darkMode: 'Dark Mode',
        language: 'Language',
        languageSubtitle: 'English (US)',
        support: 'SUPPORT',
        about: 'About',
        version: 'Version {{version}}',
        dangerZone: 'DANGER ZONE',
        logout: 'Logout',
        deleteAccount: 'Delete Account',
        deleteAccountSubtitle: 'Permanently delete your account',
        footerText: 'Made with ❤️ by MeetBridge Team',
        copyright: '© 2025 MeetBridge. All rights reserved.',
        blockedUsersTitle: 'Blocked Users',
        loadingBlockedUsers: 'Loading blocked users...',
        noBlockedUsers: 'No blocked users',
        unblock: 'Unblock',
        unblockConfirmTitle: 'Unblock User',
        unblockConfirmMessage: 'Are you sure you want to unblock {{name}}?',
        unblockSuccess: 'User unblocked successfully',
        unblockError: 'Failed to unblock user',
        saveSuccess: 'Settings saved successfully',
        saveError: 'Failed to save settings',
        updateSuccess: 'Profile updated successfully',
        updateError: 'Failed to update profile',
        deleteSuccess: 'Account deleted successfully',
        deleteError: 'Failed to delete account',
        logoutConfirmTitle: 'Logout',
        logoutConfirmMessage: 'Are you sure you want to logout?',
        deleteConfirmTitle: 'Delete Account',
        deleteConfirmMessage:
          'This action cannot be undone. All your data will be permanently deleted.',
        enabled: 'Enabled',
        disabled: 'Disabled',
        visible: 'Visible',
        hidden: 'Hidden',
      },

      // Auth & Login
      auth: {
        welcomeBack: 'Welcome back! Sign in to continue your journey',
        dontHaveAccount: "Don't have an account?",
        signUp: 'Sign Up',
        signIn: 'Sign In',
        emailAddress: 'Email Address',
        enterEmail: 'Enter your email',
        password: 'Password',
        enterPassword: 'Enter your password',
        forgotPassword: 'Forgot Password?',
        loginError: 'Login Error',
        fillAllFields: 'Please fill in all fields',
        loginFailed: 'Login Failed',
        unexpectedError: 'An unexpected error occurred',
        register: 'Register',
        createAccount: 'Create Account',
        fullName: 'Full Name',
        enterFullName: 'Enter your full name',
        confirmPassword: 'Confirm Password',
        enterConfirmPassword: 'Confirm your password',
        passwordsDontMatch: 'Passwords do not match',
        registrationFailed: 'Registration Failed',
        completeProfile: 'Complete Your Profile',
        profileCompletionRequired: 'Please complete your profile to continue',
        saveProfile: 'Save Profile',
        profileSaved: 'Profile saved successfully',
        profileSaveError: 'Failed to save profile',
        forgotPasswordTitle: 'Forgot Password',
        resetInstructions: 'Enter your email to receive reset instructions',
        sendResetEmail: 'Send Reset Email',
        resetEmailSent: 'Reset email sent successfully',
        backToLogin: 'Back to Login',
      },
    },
  },
  he: {
    translation: {
      // Navigation & Tabs
      tabs: {
        discover: 'אהבתי',
        search: 'חיפוש',
        connections: 'קשרים',
        chat: "צ'אט",
      },

      // Search Screen
      search: {
        title: 'גלה אנשים',
        searchingPerfectMatch: 'מחפש את ההתאמה המושלמת...',
        searching: 'מחפש...',
        newSearch: 'חיפוש חדש',
        loading: 'טוען...',
        distance: "מ'",
        noProfiles: 'אין פרופילים זמינים. נסה לשנות את הפילטרים.',
      },

      // Chat Screen
      chat: {
        title: 'שיחות',
        noConversations: 'אין שיחות עדיין',
        startMatching: 'התחל להכיר אנשים חדשים',
        chatsCount: 'שיחות',
        now: 'עכשיו',
        minutes: "דק'",
        hours: 'שעות',
        yesterday: 'אתמול',
        days: 'ימים',
        loading: 'טוען...',
        online: 'מחובר עכשיו',
        offline: 'לא מחובר',
        messageInputPlaceholder: 'כתוב הודעה...',
        viewProfile: 'צפה בפרופיל',
        unmatch: 'בטל התאמה',
        unmatchTitle: 'בטל התאמה',
        unmatchConfirm:
          'האם אתה בטוח שברצונך לבטל התאמה עם {{name}}? לא ניתן לבטל פעולה זו.',
        newMatch: 'יש התאמה! אמור שלום 👋',
        unmatchDetected: 'השיחה הזו הסתיימה.',
      },

      // Profile Screen
      profile: {
        title: 'פרופיל',
        interests: 'תחומי עניין',
        bio: 'אודות',
        unmatch: 'בטל התאמה',
        report: 'דווח',
        block: 'חסום',
      },

      // Connections Screen
      connections: {
        title: 'קשרים',
        matches: 'התאמות',
        posts: 'פוסטים',
        noMatches: 'אין התאמות עדיין',
        startSwiping: 'התחל להחליק כדי למצוא התאמות',
        noPosts: 'אין פוסטים עדיין',
        createPost: 'צור את הפוסט הראשון שלך',
      },

      // Modals
      modals: {
        unmatchTitle: 'בטל התאמה',
        unmatchText:
          'האם אתה בטוח שברצונך לבטל התאמה? פעולה זו תמחק גם את השיחה ולא ניתן לבטלה.',
        confirmUnmatch: 'בטל התאמה',
        matchTitle: '!יש התאמה',
        matchText: 'שניכם אהבתם אחד את השני',
        startChatting: 'התחל לשוחח',
      },

      // Filter Modal
      filter: {
        title: 'פילטרי חיפוש',
        apply: 'החל',
        upTo: 'עד',
        meters: "מ'",
      },

      // Settings & Theme
      settings: {
        title: 'הגדרות',
        subtitle: 'נהל את החשבון וההעדפות שלך',
        account: 'חשבון',
        editProfile: 'ערוך פרופיל',
        editProfileSubtitle: 'עדכן את פרטי הפרופיל שלך',
        changePassword: 'שנה סיסמה',
        changePasswordSubtitle: 'עדכן את סיסמת החשבון שלך',
        privacySecurity: 'פרטיות וביטחון',
        privacySettings: 'הגדרות פרטיות',
        privacySettingsSubtitle: 'שלוט מי יכול לראות את הפרופיל שלך',
        locationServices: 'שירותי מיקום',
        blockedUsers: 'משתמשים חסומים',
        blockedUsersCount: '{{count}} משתמשים חסומים',
        showOnlineStatus: 'הצג סטטוס מקוון',
        showOnlineStatusVisible: 'גלוי להתאמות',
        showOnlineStatusHidden: 'מוסתר',
        notifications: 'התראות',
        pushNotifications: 'התראות דחיפה',
        messageNotifications: 'התראות הודעות',
        messageNotificationsSubtitle: 'קבל התראות על הודעות חדשות',
        matchNotifications: 'התראות התאמות',
        matchNotificationsSubtitle: 'קבל התראות על התאמות חדשות',
        appearance: 'מראה',
        darkMode: 'מצב כהה',
        language: 'שפה',
        languageSubtitle: 'עברית (IL)',
        support: 'תמיכה',
        about: 'אודות',
        version: 'גרסה {{version}}',
        dangerZone: 'אזור סכנה',
        logout: 'התנתק',
        deleteAccount: 'מחק חשבון',
        deleteAccountSubtitle: 'מחק לצמיתות את החשבון שלך',
        footerText: 'נוצר באהבה ❤️ על ידי צוות MeetBridge',
        copyright: '© 2025 MeetBridge. כל הזכויות שמורות.',
        blockedUsersTitle: 'משתמשים חסומים',
        loadingBlockedUsers: 'טוען משתמשים חסומים...',
        noBlockedUsers: 'אין משתמשים חסומים',
        unblock: 'בטל חסימה',
        unblockConfirmTitle: 'בטל חסימה של משתמש',
        unblockConfirmMessage: 'האם אתה בטוח שברצונך לבטל חסימה של {{name}}?',
        unblockSuccess: 'המשתמש בוטל חסימתו בהצלחה',
        unblockError: 'נכשל בביטול חסימה של המשתמש',
        saveSuccess: 'ההגדרות נשמרו בהצלחה',
        saveError: 'נכשל בשמירת ההגדרות',
        updateSuccess: 'הפרופיל עודכן בהצלחה',
        updateError: 'נכשל בעדכון הפרופיל',
        deleteSuccess: 'החשבון נמחק בהצלחה',
        deleteError: 'נכשל במחיקת החשבון',
        logoutConfirmTitle: 'התנתק',
        logoutConfirmMessage: 'האם אתה בטוח שברצונך להתנתק?',
        deleteConfirmTitle: 'מחק חשבון',
        deleteConfirmMessage:
          'פעולה זו לא ניתנת לביטול. כל הנתונים שלך יימחקו לצמיתות.',
        enabled: 'מופעל',
        disabled: 'מבוטל',
        visible: 'גלוי',
        hidden: 'מוסתר',
      },

      // Auth & Login
      auth: {
        welcomeBack: 'ברוך שובך! התחבר כדי להמשיך במסע שלך',
        dontHaveAccount: 'אין לך חשבון?',
        signUp: 'הרשם',
        signIn: 'התחבר',
        emailAddress: 'כתובת אימייל',
        enterEmail: 'הכנס את האימייל שלך',
        password: 'סיסמה',
        enterPassword: 'הכנס את הסיסמה שלך',
        forgotPassword: 'שכחת סיסמה?',
        loginError: 'שגיאת התחברות',
        fillAllFields: 'אנא מלא את כל השדות',
        loginFailed: 'התחברות נכשלה',
        unexpectedError: 'אירעה שגיאה לא צפויה',
        register: 'הרשם',
        createAccount: 'צור חשבון',
        fullName: 'שם מלא',
        enterFullName: 'הכנס את השם המלא שלך',
        confirmPassword: 'אשר סיסמה',
        enterConfirmPassword: 'אשר את הסיסמה שלך',
        passwordsDontMatch: 'הסיסמאות לא תואמות',
        registrationFailed: 'הרשמה נכשלה',
        completeProfile: 'השלם את הפרופיל שלך',
        profileCompletionRequired: 'אנא השלם את הפרופיל שלך כדי להמשיך',
        saveProfile: 'שמור פרופיל',
        profileSaved: 'הפרופיל נשמר בהצלחה',
        profileSaveError: 'נכשל בשמירת הפרופיל',
        forgotPasswordTitle: 'שכחת סיסמה',
        resetInstructions: 'הכנס את האימייל שלך כדי לקבל הוראות איפוס',
        sendResetEmail: 'שלח אימייל איפוס',
        resetEmailSent: 'אימייל איפוס נשלח בהצלחה',
        backToLogin: 'חזור להתחברות',
      },

      // Common
      common: {
        loading: 'טוען...',
        error: 'שגיאה',
        retry: 'נסה שוב',
        noData: 'אין נתונים',
        comingSoon: 'בקרוב',
        ok: 'אישור',
        yes: 'כן',
        no: 'לא',
        cancel: 'ביטול',
        unmatch: 'בטל התאמה',
      },
    },
  },
  ru: {
    translation: {
      // Navigation & Tabs
      tabs: {
        discover: 'Нравится',
        search: 'Поиск',
        connections: 'Связь',
        chat: 'Чат',
      },

      // Search Screen
      search: {
        title: 'Найти людей',
        searchingPerfectMatch: 'Ищу подходящие профили поблизости...',
        searching: 'Поиск...',
        newSearch: 'Новый поиск',
        loading: 'Загрузка...',
        distance: 'м',
        noProfiles: 'Нет доступных профилей',
        checkBackLater: 'Попробуйте изменить фильтры',
      },

      // Chat Screen
      chat: {
        title: 'Чаты',
        noConversations: 'Пока нет разговоров',
        startMatching: 'Начните знакомиться с новыми людьми',
        chatsCount: 'Чаты',
        now: 'сейчас',
        minutes: 'мин',
        hours: 'ч',
        yesterday: 'вчера',
        days: 'дн',
        loading: 'Загрузка...',
        online: 'Онлайн',
        offline: 'Оффлайн',
        messageInputPlaceholder: 'Напишите сообщение...',
        viewProfile: 'Посмотреть профиль',
        unmatch: 'Разорвать пару',
        unmatchTitle: 'Разорвать пару',
        unmatchConfirm:
          'Вы уверены, что хотите разорвать пару с {{name}}? Это действие нельзя отменить.',
        newMatch: 'Это взаимно! Скажите привет 👋',
        unmatchDetected: 'Этот разговор закончился.',
      },

      // Modals & Confirmations
      modals: {
        unmatchTitle: 'Разорвать пару',
        unmatchText:
          'Вы уверены, что хотите разорвать пару? Это также удалит ваш разговор и не может быть отменено.',
        confirmUnmatch: 'Разорвать пару',
        matchTitle: 'Это взаимно!',
        matchText: 'Вам обоим это нравится',
        startChatting: 'Начать чат',
      },

      // Filter Modal
      filter: {
        title: 'Фильтры поиска',
        apply: 'Применить',
        upTo: 'До',
        meters: 'м',
      },

      // Settings & Theme
      settings: {
        title: 'Настройки',
        subtitle: 'Управляйте аккаунтом и предпочтениями',
        account: 'АККАУНТ',
        editProfile: 'Редактировать профиль',
        editProfileSubtitle: 'Обновить информацию профиля',
        changePassword: 'Изменить пароль',
        changePasswordSubtitle: 'Обновить пароль аккаунта',
        privacySecurity: 'КОНФИДЕНЦИАЛЬНОСТЬ И БЕЗОПАСНОСТЬ',
        privacySettings: 'Настройки конфиденциальности',
        privacySettingsSubtitle: 'Контролируйте, кто может видеть ваш профиль',
        locationServices: 'Службы геолокации',
        blockedUsers: 'Заблокированные пользователи',
        blockedUsersCount: '{{count}} заблокированных пользователей',
        showOnlineStatus: 'Показывать онлайн статус',
        showOnlineStatusVisible: 'Виден для взаимных симпатий',
        showOnlineStatusHidden: 'Скрыт',
        notifications: 'УВЕДОМЛЕНИЯ',
        pushNotifications: 'Push-уведомления',
        messageNotifications: 'Уведомления о сообщениях',
        messageNotificationsSubtitle: 'Получать уведомления о новых сообщениях',
        matchNotifications: 'Уведомления о взаимных симпатиях',
        matchNotificationsSubtitle:
          'Получать уведомления о новых взаимных симпатиях',
        appearance: 'ВНЕШНИЙ ВИД',
        darkMode: 'Темная тема',
        language: 'Язык',
        languageSubtitle: 'Русский (RU)',
        support: 'ПОДДЕРЖКА',
        about: 'О приложении',
        version: 'Версия {{version}}',
        dangerZone: 'ОПАСНАЯ ЗОНА',
        logout: 'Выйти',
        deleteAccount: 'Удалить аккаунт',
        deleteAccountSubtitle: 'Навсегда удалить аккаунт',
        footerText: 'Сделано с ❤️ командой MeetBridge',
        copyright: '© 2025 MeetBridge. Все права защищены.',
        blockedUsersTitle: 'Заблокированные пользователи',
        loadingBlockedUsers: 'Загрузка заблокированных пользователей...',
        noBlockedUsers: 'Нет заблокированных пользователей',
        unblock: 'Разблокировать',
        unblockConfirmTitle: 'Разблокировать пользователя',
        unblockConfirmMessage:
          'Вы уверены, что хотите разблокировать {{name}}?',
        unblockSuccess: 'Пользователь успешно разблокирован',
        unblockError: 'Не удалось разблокировать пользователя',
        saveSuccess: 'Настройки успешно сохранены',
        saveError: 'Не удалось сохранить настройки',
        updateSuccess: 'Профиль успешно обновлен',
        updateError: 'Не удалось обновить профиль',
        deleteSuccess: 'Аккаунт успешно удален',
        deleteError: 'Не удалось удалить аккаунт',
        logoutConfirmTitle: 'Выйти',
        logoutConfirmMessage: 'Вы уверены, что хотите выйти?',
        deleteConfirmTitle: 'Удалить аккаунт',
        deleteConfirmMessage:
          'Это действие нельзя отменить. Все ваши данные будут навсегда удалены.',
        enabled: 'Включено',
        disabled: 'Отключено',
        visible: 'Виден',
        hidden: 'Скрыт',
      },

      // Auth & Login
      auth: {
        welcomeBack:
          'Добро пожаловать обратно! Войдите, чтобы продолжить свое путешествие',
        dontHaveAccount: 'Нет аккаунта?',
        signUp: 'Регистрация',
        signIn: 'Войти',
        emailAddress: 'Адрес электронной почты',
        enterEmail: 'Введите ваш email',
        password: 'Пароль',
        enterPassword: 'Введите ваш пароль',
        forgotPassword: 'Забыли пароль?',
        loginError: 'Ошибка входа',
        fillAllFields: 'Пожалуйста, заполните все поля',
        loginFailed: 'Вход не удался',
        unexpectedError: 'Произошла непредвиденная ошибка',
        register: 'Регистрация',
        createAccount: 'Создать аккаунт',
        fullName: 'Полное имя',
        enterFullName: 'Введите ваше полное имя',
        confirmPassword: 'Подтвердить пароль',
        enterConfirmPassword: 'Подтвердите ваш пароль',
        passwordsDontMatch: 'Пароли не совпадают',
        registrationFailed: 'Регистрация не удалась',
        completeProfile: 'Завершите свой профиль',
        profileCompletionRequired:
          'Пожалуйста, завершите свой профиль, чтобы продолжить',
        saveProfile: 'Сохранить профиль',
        profileSaved: 'Профиль успешно сохранен',
        profileSaveError: 'Не удалось сохранить профиль',
        forgotPasswordTitle: 'Забыли пароль',
        resetInstructions:
          'Введите ваш email, чтобы получить инструкции по сбросу',
        sendResetEmail: 'Отправить email для сброса',
        resetEmailSent: 'Email для сброса успешно отправлен',
        backToLogin: 'Вернуться к входу',
      },

      // Common
      common: {
        loading: 'Загрузка...',
        error: 'Ошибка',
        retry: 'Попробовать снова',
        noData: 'Нет данных',
        comingSoon: 'Скоро',
        ok: 'OK',
        yes: 'Да',
        no: 'Нет',
        cancel: 'Отмена',
        unmatch: 'Разорвать пару',
      },
    },
  },
  es: {
    translation: {
      // Navigation & Tabs
      tabs: {
        discover: 'Me gusta',
        search: 'Buscar',
        connections: 'Conexiones',
        chat: 'Chat',
      },

      // Search Screen
      search: {
        title: 'Descubrir personas',
        searchingPerfectMatch: 'Buscando perfiles cercanos...',
        searching: 'Buscando...',
        newSearch: 'Nueva búsqueda',
        loading: 'Cargando...',
        distance: 'm',
        noProfiles: 'No hay perfiles disponibles',
        checkBackLater: 'Intenta ajustar tus filtros',
      },

      // Chat Screen
      chat: {
        title: 'Chats',
        noConversations: 'Aún no hay conversaciones',
        startMatching: 'Empieza a conocer gente nueva',
        chatsCount: 'Chats',
        now: 'ahora',
        minutes: 'min',
        hours: 'h',
        yesterday: 'ayer',
        days: 'días',
        loading: 'Cargando...',
        online: 'En línea',
        offline: 'Desconectado',
        messageInputPlaceholder: 'Escribe un mensaje...',
        viewProfile: 'Ver perfil',
        unmatch: 'Desparejar',
        unmatchTitle: 'Desparejar',
        unmatchConfirm:
          '¿Estás seguro de que quieres desparejar con {{name}}? Esto no se puede deshacer.',
        newMatch: '¡Es un match! Di hola 👋',
        unmatchDetected: 'Esta conversación ha terminado.',
      },

      // Modals & Confirmations
      modals: {
        unmatchTitle: 'Desparejar',
        unmatchText:
          '¿Estás seguro de que quieres desparejar? Esto también eliminará tu conversación y no se puede deshacer.',
        confirmUnmatch: 'Desparejar',
        matchTitle: '¡Es un match!',
        matchText: 'A ambos les gustáis',
        startChatting: 'Empezar a chatear',
      },

      // Filter Modal
      filter: {
        title: 'Filtros de búsqueda',
        apply: 'Aplicar',
        upTo: 'Hasta',
        meters: 'm',
      },

      // Settings & Theme
      settings: {
        title: 'Configuración',
        subtitle: 'Gestiona tu cuenta y preferencias',
        account: 'CUENTA',
        editProfile: 'Editar perfil',
        editProfileSubtitle: 'Actualizar información del perfil',
        changePassword: 'Cambiar contraseña',
        changePasswordSubtitle: 'Actualizar contraseña de la cuenta',
        privacySecurity: 'PRIVACIDAD Y SEGURIDAD',
        privacySettings: 'Configuración de privacidad',
        privacySettingsSubtitle: 'Controla quién puede ver tu perfil',
        locationServices: 'Servicios de ubicación',
        blockedUsers: 'Usuarios bloqueados',
        blockedUsersCount: '{{count}} usuarios bloqueados',
        showOnlineStatus: 'Mostrar estado en línea',
        showOnlineStatusVisible: 'Visible para matches',
        showOnlineStatusHidden: 'Oculto',
        notifications: 'NOTIFICACIONES',
        pushNotifications: 'Notificaciones push',
        messageNotifications: 'Notificaciones de mensajes',
        messageNotificationsSubtitle:
          'Recibir notificaciones de nuevos mensajes',
        matchNotifications: 'Notificaciones de matches',
        matchNotificationsSubtitle: 'Recibir notificaciones de nuevos matches',
        appearance: 'APARIENCIA',
        darkMode: 'Modo oscuro',
        language: 'Idioma',
        languageSubtitle: 'Español (ES)',
        support: 'SOPORTE',
        about: 'Acerca de',
        version: 'Versión {{version}}',
        dangerZone: 'ZONA DE PELIGRO',
        logout: 'Cerrar sesión',
        deleteAccount: 'Eliminar cuenta',
        deleteAccountSubtitle: 'Eliminar permanentemente tu cuenta',
        footerText: 'Hecho con ❤️ por el equipo de MeetBridge',
        copyright: '© 2025 MeetBridge. Todos los derechos reservados.',
        blockedUsersTitle: 'Usuarios bloqueados',
        loadingBlockedUsers: 'Cargando usuarios bloqueados...',
        noBlockedUsers: 'No hay usuarios bloqueados',
        unblock: 'Desbloquear',
        unblockConfirmTitle: 'Desbloquear usuario',
        unblockConfirmMessage:
          '¿Estás seguro de que quieres desbloquear a {{name}}?',
        unblockSuccess: 'Usuario desbloqueado exitosamente',
        unblockError: 'Error al desbloquear usuario',
        saveSuccess: 'Configuración guardada exitosamente',
        saveError: 'Error al guardar configuración',
        updateSuccess: 'Perfil actualizado exitosamente',
        updateError: 'Error al actualizar perfil',
        deleteSuccess: 'Cuenta eliminada exitosamente',
        deleteError: 'Error al eliminar cuenta',
        logoutConfirmTitle: 'Cerrar sesión',
        logoutConfirmMessage: '¿Estás seguro de que quieres cerrar sesión?',
        deleteConfirmTitle: 'Eliminar cuenta',
        deleteConfirmMessage:
          'Esta acción no se puede deshacer. Todos tus datos serán eliminados permanentemente.',
        enabled: 'Habilitado',
        disabled: 'Deshabilitado',
        visible: 'Visible',
        hidden: 'Oculto',
      },

      // Auth & Login
      auth: {
        welcomeBack:
          '¡Bienvenido de vuelta! Inicia sesión para continuar tu viaje',
        dontHaveAccount: '¿No tienes una cuenta?',
        signUp: 'Registrarse',
        signIn: 'Iniciar sesión',
        emailAddress: 'Dirección de correo electrónico',
        enterEmail: 'Ingresa tu correo electrónico',
        password: 'Contraseña',
        enterPassword: 'Ingresa tu contraseña',
        forgotPassword: '¿Olvidaste tu contraseña?',
        loginError: 'Error de inicio de sesión',
        fillAllFields: 'Por favor, completa todos los campos',
        loginFailed: 'Inicio de sesión fallido',
        unexpectedError: 'Ocurrió un error inesperado',
        register: 'Registrarse',
        createAccount: 'Crear cuenta',
        fullName: 'Nombre completo',
        enterFullName: 'Ingresa tu nombre completo',
        confirmPassword: 'Confirmar contraseña',
        enterConfirmPassword: 'Confirma tu contraseña',
        passwordsDontMatch: 'Las contraseñas no coinciden',
        registrationFailed: 'Registro fallido',
        completeProfile: 'Completa tu perfil',
        profileCompletionRequired:
          'Por favor, completa tu perfil para continuar',
        saveProfile: 'Guardar perfil',
        profileSaved: 'Perfil guardado exitosamente',
        profileSaveError: 'Error al guardar el perfil',
        forgotPasswordTitle: 'Olvidé mi contraseña',
        resetInstructions:
          'Ingresa tu correo electrónico para recibir instrucciones de restablecimiento',
        sendResetEmail: 'Enviar correo de restablecimiento',
        resetEmailSent: 'Correo de restablecimiento enviado exitosamente',
        backToLogin: 'Volver al inicio de sesión',
      },

      // Common
      common: {
        loading: 'Cargando...',
        error: 'Error',
        retry: 'Reintentar',
        noData: 'Sin datos',
        comingSoon: 'Próximamente',
        ok: 'OK',
        yes: 'Sí',
        no: 'No',
        cancel: 'Cancelar',
        unmatch: 'Desparejar',
      },
    },
  },
};

// Language detection and persistence
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem('user-language');
      if (
        savedLanguage &&
        (savedLanguage === 'en' ||
          savedLanguage === 'he' ||
          savedLanguage === 'ru' ||
          savedLanguage === 'es')
      ) {
        callback(savedLanguage);
      } else {
        callback('en'); // Default to English
      }
    } catch (error) {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('user-language', lng);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    supportedLngs: ['en', 'he', 'ru', 'es'],
    interpolation: {
      escapeValue: false,
    },
  });

// Helper to check if current language is RTL
export const isRTL = () => i18n.language === 'he';

// Helper to change language and update RTL
export const changeLanguage = async (lng: 'en' | 'he' | 'ru' | 'es') => {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem('user-language', lng);
};

export default i18n;
