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
      app: {
        title: 'MeetBridge',
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
        noProfilesDetail:
          "We couldn't find any profiles matching your preferences. Try adjusting your filters or expanding your distance range.",
        adjustFilters: 'Adjust Filters',
        refresh: 'Refresh',
        checkBackLater: 'Try adjusting your filters',
        loadingMore: 'Loading more profiles...',
      },

      // Chat Screen
      chat: {
        title: 'Chats',
        matches: 'Matches',
        missed: 'Missed',
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

      // Connections Screen
      connections: {
        title: 'Connections',
        matches: 'Matches',
        posts: 'Posts',
        noMatches: 'No matches yet',
        startSwiping: 'Start swiping to find matches',
        noPosts: 'No posts yet',
        createPost: 'Create your first post',
        noMissedConnections: 'No missed connections yet',
        shareFirstConnection: 'Be the first to share a missed connection!',
        noSavedPosts: 'No saved posts',
        savePostsHere: 'Save posts to view them here later',
        fillRequiredFields: 'Please fill in all required fields',
        fillRequiredFieldsAndLocation:
          'Please fill in all required fields and ensure location is detected',
        postCreated: 'Post created successfully!',
        postUpdated: 'Your post has been updated!',
        postDeleted: 'Post deleted successfully',
        missedConnectionPosted: 'Your missed connection has been posted!',
        comments: {
          noComments: 'No comments yet. Be the first to comment!',
          addComment: 'Add a comment...',
          anonymous: 'Anonymous',
          public: 'Public',
          justNow: 'Just now',
          minutesAgo: '{{count}}m ago',
          hoursAgo: '{{count}}h ago',
          yesterday: 'Yesterday',
          daysAgo: '{{count}}d ago',
          signInRequired: 'Sign In Required',
          signInToComment: 'Please sign in to comment.',
          failedToSendComment: 'Failed to send comment',
          claimConnectionTitle: "That's You? 🎯",
          claimConnectionMessage:
            "By claiming this connection, you're saying you were at this location at the specified time.\n\n💡 Verification:\n• We'll check your location history (if enabled)\n• Post creator will review your claim\n• Multiple false claims may affect your credibility\n\nAre you sure you were there?",
          claimSubmitted: 'Claim Submitted! ✨',
          claimSubmittedMessage:
            "The post creator will be notified. If they confirm, you'll both be matched!",
          failedToClaim: 'Failed to claim connection',
        },
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
        /* emailAddress and enterEmail are defined later for reset flow */
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
        profileSetupDescription:
          "Let's set up your profile so you can start meeting amazing people!",
        profileCompleted: 'Profile Completed!',
        profileCompletedSubtext: 'Get ready to explore...',
        saveProfile: 'Save Profile',
        profileSaved: 'Profile saved successfully',
        profileSaveError: 'Failed to save profile',
        resetInstructions: 'Enter your email to receive reset instructions',
        sendResetEmail: 'Send Reset Email',
        resetEmailSent: 'Reset email sent successfully',
        resetEmailFailed: 'Failed to send reset email',
        forgotPasswordTitle: 'Forgot Password?',
        forgotPasswordSubtitle:
          "No worries! Enter your email and we'll send you a reset link",
        forgotPasswordSentSubtitle:
          "We've sent a password reset link to your email",
        emailAddress: 'Email Address',
        enterEmail: 'Enter your email',
        sendResetLink: 'Send Reset Link',
        emailSentTitle: 'Email Sent!',
        emailSentDescription:
          'Check your inbox and follow the instructions to reset your password.',
        sendAnotherEmail: 'Send Another Email',
        rememberPassword: 'Remember your password?',
        backToSignIn: 'Back to Sign In',
        backToLogin: 'Back to Login',
        // Validation messages
        pleaseEnterEmail: 'Please enter your email',
        invalidEmail: 'Please enter a valid email address',
        passwordTooShort: 'Password must be at least 6 characters long',
        passwordsDoNotMatch: 'Passwords do not match',
        /* validation messages defined above */
      },

      // Onboarding Tutorial
      onboarding: {
        welcomeTitle: 'Welcome to MeetBridge! 🎉',
        welcomeDescription:
          'Find meaningful connections with people nearby. Let us show you how it works!',
        discoverTitle: 'Discover Matches',
        discoverDescription:
          "Browse through profiles of people near you. Use filters to find exactly who you're looking for.",
        likeTitle: 'Like & Connect',
        likeDescription:
          "Like profiles that interest you. When they like you back, it's a match! Your matches appear in the Loved tab.",
        chatTitle: 'Start Chatting',
        chatDescription:
          'Once matched, start a conversation! Send messages, share your interests, and get to know each other.',
        locationTitle: 'Location-Based',
        locationDescription:
          'We use your location to show you people nearby. You can adjust the distance in your preferences.',
        connectionsTitle: 'Manage Connections',
        connectionsDescription:
          'View all your connections, see who liked you, and keep track of your conversations in one place.',
      },

      // Icebreaker Suggestions
      icebreakers: {
        breakTheIce: 'Break the ice 💬',
        dismiss: 'Dismiss',
      },

      // Error Boundary
      errors: {
        somethingWentWrong: 'Oops! Something went wrong',
        unexpectedError: 'An unexpected error occurred',
        tryAgain: 'Try Again',
      },

      // Interest Tag Picker
      interests: {
        maximumReached: 'Maximum Reached',
        maxInterestsMessage: 'You can select up to {{count}} interests.',
      },

      // Match Animation
      match: {
        itsAMatch: "It's a Match!",
        likedEachOther: 'You and {{name}} liked each other',
        sendMessage: 'Send Message',
      },

      // Toasts / Notifications
      toasts: {
        permissionNeededTitle: 'Permission needed',
        grantPhotoAccess: 'Grant photo access',
        photoSentTitle: 'Photo sent',
        photoSentBody: 'Photo has been sent successfully',
        photoFailedTitle: 'Failed to send photo',
        newMessageTitle: 'New Message 💬',
        newMessageBody: 'You have a new message from {{name}}',
        newCommentTitle: 'New Comment 💬',
        newCommentBody: '{{name}} commented on your post!',
        newLikeTitle: 'New Like ❤️',
        newLikeBody: '{{name}} liked your post!',
        newClaimTitle: 'New Claim! 🎯',
        newClaimBody: '{{name}} thinks they were at your missed connection!',
        chatRequestTitle: 'Chat Request Received! 💬',
        chatRequestBody:
          '{{name}} sent you a chat request. Check your notifications to respond.',
        matchToastTitle: "It's a Match! 🎉",
        matchToastBody: 'You and {{name}} liked each other!',
        userBlockedTitle: 'User Blocked',
        userBlockedBody: '{{name}} has been blocked',
        reportSubmittedTitle: 'Report Submitted',
        reportSubmittedBody: 'Your report has been submitted',
        selectReasonTitle: 'Select a Reason',
        selectReasonBody: 'Please select a reason for reporting',
        claimRejectedTitle: 'Claim Rejected',
        claimRejectedBody: 'The claim has been rejected',
        notificationDeletedTitle: 'Notification Deleted',
        notificationDeletedBody: 'The notification has been removed',
      },

      // Temp Match Modal
      tempMatch: {
        chatRequest: 'Chat Request 💬',
        missedMatchTitle: "It's a Missed Match! 🎉",
        conversationCreated:
          'Conversation created! Check your Missed tab to start chatting!',
        requestSent: 'Request Sent! ✅',
        waitingForAcceptance: 'Waiting for the other person to accept...',
        acceptFailed: 'Failed to accept request',
        requestDeclined: 'Request Declined',
        requestDeclinedMessage: 'The chat request has been declined',
        declineFailed: 'Failed to decline request',
        youLabel: 'You',
        acceptedStatus: '✓ Accepted',
        pendingStatus: '⏳ Pending',
        infoText:
          "💡 Both of you must accept to start chatting. They'll receive a notification about your request.",
        declineButton: 'Decline',
        acceptButton: 'Accept Request',
        waitingForAcceptanceWithName: 'Waiting for {{name}} to accept...',
      },

      // Comments Section
      comments: {
        commentsTitle: 'Comments',
        noComments: 'No comments yet',
        addComment: 'Add a comment',
        commentPlaceholder: 'Write a comment...',
        postComment: 'Post',
        anonymous: 'Anonymous',
        public: 'Public',
        justNow: 'Just now',
        minutesAgo: '{{count}}m ago',
        hoursAgo: '{{count}}h ago',
        daysAgo: '{{count}}d ago',
        signInRequired: 'Sign In Required',
        signInToComment: 'Please sign in to comment',
        signInToClaim: 'Please sign in to claim this connection',
        claimConnection: 'Claim Connection',
        claimSuccess: 'Connection claimed successfully!',
        claimError: 'Failed to claim connection',
        alreadyClaimed: 'This connection has already been claimed',
        claimConfirmTitle: "That's You? 🎯",
        claimConfirmMessage: 'Are you sure this is your connection?',
        claimFailed: 'Failed to claim connection',
        commentAdded: 'Comment added',
        commentError: 'Failed to add comment',
        deleteComment: 'Delete comment',
        deleteConfirmTitle: 'Delete Comment',
        deleteConfirmMessage: 'Are you sure you want to delete this comment?',
        deleteSuccess: 'Comment deleted',
        deleteError: 'Failed to delete comment',
        reportComment: 'Report comment',
        reportSuccess: 'Comment reported successfully',
        reportError: 'Failed to report comment',
        editComment: 'Edit comment',
        saveChanges: 'Save changes',
        cancelEdit: 'Cancel edit',
        editSuccess: 'Comment updated',
        editError: 'Failed to update comment',
      },

      // Common
      common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        retry: 'Retry',
        noData: 'No data',
        comingSoon: 'Coming soon',
        ok: 'OK',
        yes: 'Yes',
        no: 'No',
        cancel: 'Cancel',
        unmatch: 'Unmatch',
        failedToLike: 'Failed to like post',
        failedToSave: 'Failed to save post',
        failedToCreate: 'Failed to create post',
        failedToUpdate: 'Failed to update post',
        failedToLoadProfile: 'Failed to load user profile',
        failedToSubmitClaim: 'Failed to submit claim',
        failedToDelete: 'Failed to delete post',
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
        noProfilesDetail:
          'לא הצלחנו למצוא פרופילים התואמים את ההעדפות שלך. נסה לשנות את המסננים או להגדיל את טווח המרחק.',
        adjustFilters: 'התאם פילטרים',
        refresh: 'רענן',
        loadingMore: 'טוען פרופילים נוספים...',
      },

      // Chat Screen
      chat: {
        title: 'שיחות',
        matches: 'התאמות',
        missed: 'פספסתי',
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
        noMissedConnections: 'אין קשרים פספסים עדיין',
        shareFirstConnection: 'היה הראשון לשתף קשר פספס!',
        noSavedPosts: 'אין פוסטים שמורים',
        savePostsHere: 'שמור פוסטים כדי לראות אותם כאן מאוחר יותר',
        fillRequiredFields: 'אנא מלא את כל השדות הנדרשים',
        fillRequiredFieldsAndLocation:
          'אנא מלא את כל השדות הנדרשים וודא שמיקום זוהה',
        postCreated: 'הפוסט נוצר בהצלחה!',
        postUpdated: 'הפוסט שלך עודכן!',
        postDeleted: 'הפוסט נמחק בהצלחה',
        missedConnectionPosted: 'הקשר הפספס שלך פורסם!',
        comments: {
          noComments: 'אין תגובות עדיין. היה הראשון להגיב!',
          addComment: 'הוסף תגובה...',
          anonymous: 'אנונימי',
          public: 'ציבורי',
          justNow: 'כרגע',
          minutesAgo: 'לפני {{count}} דקות',
          hoursAgo: 'לפני {{count}} שעות',
          yesterday: 'אתמול',
          daysAgo: 'לפני {{count}} ימים',
          signInRequired: 'נדרש התחברות',
          signInToComment: 'אנא התחבר כדי להגיב.',
          failedToSendComment: 'נכשל בשליחת התגובה',
          claimConnectionTitle: 'זה אתה? 🎯',
          claimConnectionMessage:
            'על ידי תביעת קשר זה, אתה אומר שהיית במיקום זה בזמן המצוין.\n\n💡 אימות:\n• נבדוק את היסטוריית המיקום שלך (אם מופעל)\n• יוצר הפוסט יבדוק את התביעה שלך\n• תביעות שקר מרובות עלולות להשפיע על המהימנות שלך\n\nהאם אתה בטוח שהיית שם?',
          claimSubmitted: 'התביעה נשלחה! ✨',
          claimSubmittedMessage:
            'יוצר הפוסט יקבל התראה. אם הוא יאשר, שניכם תתאימו!',
          failedToClaim: 'נכשל בתביעת הקשר',
        },
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

      // Toasts / Notifications
      toasts: {
        newMessageTitle: 'הודעה חדשה 💬',
        newMessageBody: 'יש לך הודעה חדשה מ- {{name}}',
        newCommentTitle: 'תגובה חדשה 💬',
        newCommentBody: '{{name}} הגיב לפוסט שלך!',
        newLikeTitle: 'לייק חדש ❤️',
        newLikeBody: '{{name}} אהב את הפוסט שלך!',
        newClaimTitle: 'תביעה חדשה! 🎯',
        newClaimBody: '{{name}} טוען שהיה בנקודת ההשמטה שלך!',
        chatRequestTitle: 'בקשת שיחה 💬',
        chatRequestBody:
          '{{name}} שלח לך בקשת שיחה. בדוק את ההתראות שלך כדי להגיב.',
        matchToastTitle: '!יש התאמה',
        matchToastBody: 'אתה ו- {{name}} אהבתם אחד את השני!',
        userBlockedTitle: 'המשתמש חסום',
        userBlockedBody: '{{name}} נחסם',
        reportSubmittedTitle: 'דווח בהצלחה',
        reportSubmittedBody: 'הדיווח שלך נשלח',
        selectReasonTitle: 'בחר סיבה',
        selectReasonBody: 'בבקשה בחר סיבה לדיווח',
        claimRejectedTitle: 'התביעה נדחתה',
        claimRejectedBody: 'התביעה נדחתה',
        notificationDeletedTitle: 'הודעה נמחקה',
        notificationDeletedBody: 'ההודעה הוסרה',
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
        password: 'סיסמה',
        enterPassword: 'הכנס את הסיסמה שלך',
        forgotPassword: 'שכחת סיסמה?',
        loginError: 'שגיאת התחברות',
        fillAllFields: 'אנא מלא את כל השדות',
        loginFailed: 'התחברות נכשלה',
        /* unexpectedError defined above in the auth block */
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
        profileSetupDescription:
          'בואו נגדיר את הפרופיל שלך כדי שתוכל להתחיל להכיר אנשים מדהימים!',
        profileCompleted: 'הפרופיל הושלם!',
        profileCompletedSubtext: 'התכונן לחקור...',
        saveProfile: 'שמור פרופיל',
        profileSaved: 'הפרופיל נשמר בהצלחה',
        profileSaveError: 'נכשל בשמירת הפרופיל',
        resetInstructions: 'הכנס את האימייל שלך כדי לקבל הוראות איפוס',
        sendResetEmail: 'שלח אימייל איפוס',
        resetEmailSent: 'אימייל איפוס נשלח בהצלחה',
        resetEmailFailed: 'נכשל בשליחת אימייל איפוס',
        forgotPasswordTitle: 'שכחת סיסמה?',
        forgotPasswordSubtitle:
          'אין דאגה! הכנס את האימייל שלך ונשלח לך קישור איפוס',
        forgotPasswordSentSubtitle: 'שלחנו קישור איפוס סיסמה לאימייל שלך',
        emailAddress: 'כתובת אימייל',
        enterEmail: 'הכנס את האימייל שלך',
        sendResetLink: 'שלח קישור איפוס',
        emailSentTitle: 'אימייל נשלח!',
        emailSentDescription:
          'בדוק את תיבת הדואר שלך ועקוב אחר ההוראות לאיפוס הסיסמה.',
        sendAnotherEmail: 'שלח אימייל נוסף',
        rememberPassword: 'זוכר את הסיסמה?',
        backToSignIn: 'חזור להתחברות',
        backToLogin: 'חזור להתחברות',
        // Validation messages
        pleaseEnterEmail: 'אנא הכנס את האימייל שלך',
        invalidEmail: 'אנא הכנס כתובת אימייל תקינה',
        passwordTooShort: 'הסיסמה חייבת להכיל לפחות 6 תווים',
        passwordsDoNotMatch: 'הסיסמאות לא תואמות',
        unexpectedError: 'אירעה שגיאה לא צפויה',
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
        success: 'הצלחה',
        failedToLike: 'נכשל בלייק לפוסט',
        failedToSave: 'נכשל בשמירת פוסט',
        failedToCreate: 'נכשל ביצירת פוסט',
        failedToUpdate: 'נכשל בעדכון פוסט',
        failedToLoadProfile: 'נכשל בטעינת פרופיל משתמש',
        failedToSubmitClaim: 'נכשל בשליחת תביעה',
        failedToDelete: 'נכשל במחיקת פוסט',
      },

      // Onboarding Tutorial
      onboarding: {
        welcomeTitle: 'ברוך הבא ל-MeetBridge! 🎉',
        welcomeDescription:
          'מצא קשרים משמעותיים עם אנשים בקרבת מקום. בואו נראה לך איך זה עובד!',
        discoverTitle: 'גלה התאמות',
        discoverDescription:
          'עיין בפרופילים של אנשים בקרבתך. השתמש בפילטרים כדי למצוא בדיוק את מי שאתה מחפש.',
        likeTitle: 'אהב וצור קשר',
        likeDescription:
          'אהב פרופילים שמעניינים אותך. כשהם יאהבו אותך בחזרה, זו התאמה! ההתאמות שלך מופיעות בכרטיסייה Loved.',
        chatTitle: 'התחל לשוחח',
        chatDescription:
          'לאחר התאמה, התחל שיחה! שלח הודעות, שתף את התחומי העניין שלך, והכר זה את זה.',
        locationTitle: 'מבוסס מיקום',
        locationDescription:
          'אנו משתמשים במיקום שלך כדי להראות לך אנשים בקרבתך. אתה יכול להתאים את המרחק בהעדפות שלך.',
        connectionsTitle: 'נהל קשרים',
        connectionsDescription:
          'צפה בכל הקשרים שלך, ראה מי אהב אותך, ועקב אחר השיחות שלך במקום אחד.',
      },

      // Icebreaker Suggestions
      icebreakers: {
        breakTheIce: 'שבור את הקרח 💬',
        dismiss: 'סגור',
      },

      // Error Boundary
      errors: {
        somethingWentWrong: 'אופס! משהו השתבש',
        unexpectedError: 'אירעה שגיאה לא צפויה',
        tryAgain: 'נסה שוב',
      },

      // Interest Tag Picker
      interests: {
        maximumReached: 'הגעת למקסימום',
        maxInterestsMessage: 'אתה יכול לבחור עד {{count}} תחומי עניין.',
      },

      // Match Animation
      match: {
        itsAMatch: 'יש התאמה!',
        likedEachOther: 'אתה ו-{{name}} אהבתם זה את זה',
        sendMessage: 'שלח הודעה',
      },

      // Temp Match Modal
      tempMatch: {
        chatRequest: "בקשת צ'אט 💬",
        missedMatchTitle: 'זו התאמה מפספסת! 🎉',
        conversationCreated:
          'שיחה נוצרה! בדוק את הכרטיסייה Missed כדי להתחיל לשוחח!',
        requestSent: 'בקשה נשלחה! ✅',
        waitingForAcceptance: 'מחכה שהאדם השני יקבל...',
        acceptFailed: 'נכשל בקבלת הבקשה',
        requestDeclined: 'בקשה נדחתה',
        requestDeclinedMessage: "בקשת הצ'אט נדחתה",
        declineFailed: 'נכשל בדחיית הבקשה',
        youLabel: 'אתה',
        acceptedStatus: '✓ התקבל',
        pendingStatus: '⏳ ממתין',
        infoText:
          '💡 שניכם חייבים לקבל כדי להתחיל לשוחח. הם יקבלו התראה על הבקשה שלך.',
        declineButton: 'דחה',
        acceptButton: 'קבל בקשה',
        waitingForAcceptanceWithName: 'מחכה ש-{{name}} יקבל...',
      },

      // Comments Section
      comments: {
        commentsTitle: 'תגובות',
        noComments: 'אין עדיין תגובות',
        addComment: 'הוסף תגובה',
        commentPlaceholder: 'כתוב תגובה...',
        postComment: 'פרסם',
        anonymous: 'אנונימי',
        public: 'ציבורי',
        justNow: 'כרגע',
        minutesAgo: 'לפני {{count}} דק',
        hoursAgo: 'לפני {{count}} שעות',
        daysAgo: 'לפני {{count}} ימים',
        signInRequired: 'נדרש כניסה',
        signInToComment: 'היכנס כדי להגיב',
        signInToClaim: 'היכנס כדי לתבוע קשר',
        claimConnection: 'תבע קשר',
        claimSuccess: 'הקשר נתבע בהצלחה!',
        claimError: 'נכשל בתביעת הקשר',
        alreadyClaimed: 'הקשר הזה כבר נתבע',
        claimConfirmTitle: 'זה אתה? 🎯',
        claimConfirmMessage: 'אתה בטוח שזה הקשר שלך?',
        claimFailed: 'נכשל בתביעת הקשר',
        commentAdded: 'תגובה נוספה',
        commentError: 'נכשל בהוספת תגובה',
        deleteComment: 'מחק תגובה',
        deleteConfirmTitle: 'מחק תגובה',
        deleteConfirmMessage: 'אתה בטוח שברצונך למחוק את התגובה הזו?',
        deleteSuccess: 'תגובה נמחקה',
        deleteError: 'נכשל במחיקת תגובה',
        reportComment: 'דווח על תגובה',
        reportSuccess: 'תגובה דווחה בהצלחה',
        reportError: 'נכשל בדיווח על תגובה',
        editComment: 'ערוך תגובה',
        saveChanges: 'שמור שינויים',
        cancelEdit: 'בטל עריכה',
        editSuccess: 'תגובה עודכנה',
        editError: 'נכשל בעדכון תגובה',
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
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'he')) {
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
    supportedLngs: ['en', 'he'],
    interpolation: {
      escapeValue: false,
    },
  });

// Helper to check if current language is RTL
export const isRTL = () => i18n.language === 'he';

// Helper to change language and update RTL
export const changeLanguage = async (lng: 'en' | 'he') => {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem('user-language', lng);
};

export default i18n;
