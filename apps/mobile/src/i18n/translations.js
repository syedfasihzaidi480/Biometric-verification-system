// English translations
export const en = {
  common: {
    continue: 'Continue',
    back: 'Back',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    error: 'Error',
    success: 'Success',
    loading: 'Loading...',
    retry: 'Try Again',
    close: 'Close',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit'
  },
  onboarding: {
    welcome: 'Welcome to Voice Biometrics',
    subtitle: 'Secure identity verification made simple',
    getStarted: 'Get Started',
    selectLanguage: 'Select Your Language',
    languagePrompt: 'Choose your preferred language for the app'
  },
  registration: {
    title: 'Create Account',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    phoneNumber: 'Phone Number',
    phoneNumberPlaceholder: 'Enter your phone number',
    email: 'Email (Optional)',
    emailPlaceholder: 'Enter your email address',
    dateOfBirth: 'Date of Birth',
    createAccount: 'Create Account',
    phoneRequired: 'Phone number is required',
    nameRequired: 'Full name is required',
    validPhone: 'Please enter a valid phone number',
    validEmail: 'Please enter a valid email address',
    terms: 'By continuing, you agree to our Terms of Service and Privacy Policy'
  },
  voiceEnrollment: {
    title: 'Voice Enrollment',
    subtitle: 'Record your voice to create your unique voice profile',
    instructions: 'Please read the following text clearly:',
    sampleScript: 'My voice is my passport. Verify me with my unique voice signature. This is sample {{number}} of {{total}}.',
    startRecording: 'Start Recording',
    stopRecording: 'Stop Recording',
    recordAgain: 'Record Again',
    sample: 'Sample',
    of: 'of',
    processing: 'Processing your voice...',
    enrollmentComplete: 'Voice enrollment complete!',
    matchScore: 'Match Score: {{score}}%',
    qualityGood: 'Voice quality: Good',
    qualityPoor: 'Voice quality: Poor - Please try again',
    consent: {
      title: 'Voice Biometric Consent',
      message: 'We need your consent to collect and process your voice biometric data for identity verification purposes.',
      understand: 'I understand that my voice will be processed for verification',
      agree: 'I Agree'
    }
  },
  voiceLogin: {
    title: 'Voice Verification',
    subtitle: 'Verify your identity with your voice',
    instructions: 'Please say the following phrase:',
    loginScript: 'My voice is my passport. Verify my identity now.',
    startVerification: 'Start Verification',
    verifying: 'Verifying your voice...',
    verificationSuccess: 'Voice verified successfully!',
    verificationFailed: 'Voice verification failed. Please try again.',
    attemptsLeft: '{{attempts}} attempts remaining'
  },
  liveness: {
    title: 'Liveness Check',
    subtitle: 'Take a selfie to verify you are a real person',
    instructions: {
      ready: 'Position your face in the center of the screen',
      blink: 'Please blink your eyes',
      turnLeft: 'Turn your head slightly to the left',
      turnRight: 'Turn your head slightly to the right',
      smile: 'Please smile',
      lookStraight: 'Look straight at the camera'
    },
    takeSelfie: 'Take Selfie',
    retakeSelfie: 'Retake Selfie',
    processing: 'Analyzing your photo...',
    livenessScore: 'Liveness Score: {{score}}%',
    livenessSuccess: 'Liveness check passed!',
    livenessFailed: 'Liveness check failed. Please ensure good lighting and look directly at the camera.',
    consent: {
      title: 'Facial Liveness Consent',
      message: 'We need your consent to capture and analyze your facial image for liveness detection.',
      understand: 'I understand that my facial image will be analyzed',
      agree: 'I Agree'
    }
  },
  document: {
    title: 'Document Upload',
    subtitle: 'Upload a photo of your identity document',
    selectDocumentType: 'Select Document Type',
    documentTypes: {
      id_card: 'ID Card',
      passport: 'Passport',
      drivers_license: 'Driver\'s License',
      national_id: 'National ID',
      other: 'Other'
    },
    takePhoto: 'Take Photo',
    selectFromLibrary: 'Choose from Library',
    browseFiles: 'Browse Files',
    retakePhoto: 'Retake Photo',
    uploadDocument: 'Upload Document',
    processing: 'Processing document...',
    extractedText: 'Extracted Information:',
    tamperDetected: 'Warning: Potential document tampering detected',
    uploadSuccess: 'Document uploaded successfully!',
    uploadFailed: 'Document upload failed. Please try again.',
    instructions: {
      position: 'Position the document within the frame',
      lighting: 'Ensure good lighting',
      clear: 'Make sure the document is clear and readable',
      flat: 'Keep the document flat'
    }
  },
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome, {{name}}',
    verificationStatus: 'Verification Status',
    status: {
      pending: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected'
    },
    completedSteps: 'Completed Steps',
    steps: {
      voiceEnrollment: 'Voice Enrollment',
      voiceVerification: 'Voice Verification',
      livenessCheck: 'Liveness Check',
      documentUpload: 'Document Upload'
    },
    viewDetails: 'View Details',
    startVerification: 'Start Verification'
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    changeLanguage: 'Change Language',
    account: 'Account',
    profile: 'Profile',
    privacy: 'Privacy',
    security: 'Security',
    help: 'Help & Support',
    about: 'About',
    version: 'Version',
    logout: 'Sign Out'
  },
  errors: {
    network: 'Network error. Please check your connection.',
    server: 'Server error. Please try again later.',
    fileUpload: 'File upload failed. Please try again.',
    audioRecording: 'Audio recording failed. Please check permissions.',
    cameraAccess: 'Camera access denied. Please enable camera permissions.',
    microphoneAccess: 'Microphone access denied. Please enable microphone permissions.',
    invalidFile: 'Invalid file format.',
    fileTooLarge: 'File is too large.',
    sessionExpired: 'Session expired. Please log in again.',
    userNotFound: 'User not found.',
    invalidCredentials: 'Invalid credentials.',
    accountLocked: 'Account temporarily locked. Please try again later.'
  },
  permissions: {
    camera: {
      title: 'Camera Permission Required',
      message: 'We need access to your camera to take photos of your documents and for liveness detection.'
    },
    microphone: {
      title: 'Microphone Permission Required', 
      message: 'We need access to your microphone to record your voice for verification.'
    },
    allowAccess: 'Allow Access',
    openSettings: 'Open Settings'
  }
};

// French translations
export const fr = {
  common: {
    continue: 'Continuer',
    back: 'Retour',
    cancel: 'Annuler',
    save: 'Enregistrer',
    edit: 'Modifier',
    delete: 'Supprimer',
    confirm: 'Confirmer',
    yes: 'Oui',
    no: 'Non',
    ok: 'OK',
    error: 'Erreur',
    success: 'Succès',
    loading: 'Chargement...',
    retry: 'Réessayer',
    close: 'Fermer',
    next: 'Suivant',
    previous: 'Précédent',
    submit: 'Soumettre'
  },
  onboarding: {
    welcome: 'Bienvenue dans Voice Biometrics',
    subtitle: 'Vérification d\'identité sécurisée simplifiée',
    getStarted: 'Commencer',
    selectLanguage: 'Sélectionnez votre langue',
    languagePrompt: 'Choisissez votre langue préférée pour l\'application'
  },
  registration: {
    title: 'Créer un compte',
    fullName: 'Nom complet',
    fullNamePlaceholder: 'Entrez votre nom complet',
    phoneNumber: 'Numéro de téléphone',
    phoneNumberPlaceholder: 'Entrez votre numéro de téléphone',
    email: 'Email (Optionnel)',
    emailPlaceholder: 'Entrez votre adresse email',
    dateOfBirth: 'Date de naissance',
    createAccount: 'Créer un compte',
    phoneRequired: 'Le numéro de téléphone est requis',
    nameRequired: 'Le nom complet est requis',
    validPhone: 'Veuillez entrer un numéro de téléphone valide',
    validEmail: 'Veuillez entrer une adresse email valide',
    terms: 'En continuant, vous acceptez nos Conditions d\'utilisation et notre Politique de confidentialité'
  },
  voiceEnrollment: {
    title: 'Inscription vocale',
    subtitle: 'Enregistrez votre voix pour créer votre profil vocal unique',
    instructions: 'Veuillez lire le texte suivant clairement:',
    sampleScript: 'Ma voix est mon passeport. Vérifiez-moi avec ma signature vocale unique. Ceci est l\'échantillon {{number}} sur {{total}}.',
    startRecording: 'Commencer l\'enregistrement',
    stopRecording: 'Arrêter l\'enregistrement',
    recordAgain: 'Enregistrer à nouveau',
    sample: 'Échantillon',
    of: 'sur',
    processing: 'Traitement de votre voix...',
    enrollmentComplete: 'Inscription vocale terminée!',
    matchScore: 'Score de correspondance: {{score}}%',
    qualityGood: 'Qualité vocale: Bonne',
    qualityPoor: 'Qualité vocale: Faible - Veuillez réessayer',
    consent: {
      title: 'Consentement biométrique vocal',
      message: 'Nous avons besoin de votre consentement pour collecter et traiter vos données biométriques vocales à des fins de vérification d\'identité.',
      understand: 'Je comprends que ma voix sera traitée pour la vérification',
      agree: 'J\'accepte'
    }
  },
  // Add more French translations here...
  settings: {
    title: 'Paramètres',
    language: 'Langue',
    changeLanguage: 'Changer de langue'
  }
};

// Somali translations
export const so = {
  common: {
    continue: 'Sii wad',
    back: 'Dib u noqo',
    cancel: 'Ka noqo',
    save: 'Kaydi',
    edit: 'Wax ka beddel',
    delete: 'Tirtir',
    confirm: 'Xaqiiji',
    yes: 'Haa',
    no: 'Maya',
    ok: 'Haye',
    error: 'Khalad',
    success: 'Guul',
    loading: 'Soo raraya...',
    retry: 'Mar kale iskuday',
    close: 'Xir',
    next: 'Xiga',
    previous: 'Ka horreyay',
    submit: 'Gudbii'
  },
  onboarding: {
    welcome: 'Kusoo dhowoow Voice Biometrics',
    subtitle: 'Xaqiijinta aqoonsiga ee badbaadada ah oo fudud',
    getStarted: 'Bilow',
    selectLanguage: 'Dooro Luqaddaada',
    languagePrompt: 'Dooro luqadda aad door bidayso ee application-ka'
  },
  registration: {
    title: 'Samee akoonti',
    fullName: 'Magaca oo dhan',
    fullNamePlaceholder: 'Gali magacaaga oo dhan',
    phoneNumber: 'Nambarka taleefanka',
    phoneNumberPlaceholder: 'Gali nambarka taleefanka',
    email: 'Email (Ikhtiyaari ah)',
    emailPlaceholder: 'Gali email-kaaga',
    dateOfBirth: 'Taariikhdii dhalashada',
    createAccount: 'Samee akoonti',
    phoneRequired: 'Nambarka taleefanka waa lagama maarmaan',
    nameRequired: 'Magaca oo dhan waa lagama maarmaan',
    validPhone: 'Fadlan geli nambar talefon sax ah',
    validEmail: 'Fadlan geli email sax ah'
  },
  settings: {
    title: 'Dejinta',
    language: 'Luqad',
    changeLanguage: 'Beddel luqadda'
  }
};

// Amharic translations
export const am = {
  common: {
    continue: 'ቀጥል',
    back: 'ተመለስ',
    cancel: 'ሰርዝ',
    save: 'አስቀምጥ',
    edit: 'አርትዕ',
    delete: 'ሰርዝ',
    confirm: 'አረጋግጥ',
    yes: 'አዎ',
    no: 'አይ',
    ok: 'ደህና',
    error: 'ስህተት',
    success: 'ስኬት',
    loading: 'በመጫን ላይ...',
    retry: 'እንደገና ሞክር',
    close: 'ዝጋ',
    next: 'ቀጣይ',
    previous: 'ያለፈው',
    submit: 'አቅርብ'
  },
  onboarding: {
    welcome: 'ወደ Voice Biometrics እንኳን በደህና መጡ',
    subtitle: 'ደህንነቱ የተጠበቀ የማንነት ማረጋገጫ ቀላል ተደርጎ',
    getStarted: 'ጀምር',
    selectLanguage: 'ቋንቋዎን ይምረጡ',
    languagePrompt: 'ለመተግበሪያው የሚመርጡትን ቋንቋ ይምረጡ'
  },
  registration: {
    title: 'መለያ ይፍጠሩ',
    fullName: 'ሙሉ ስም',
    fullNamePlaceholder: 'ሙሉ ስምዎን ያስገቡ',
    phoneNumber: 'የስልክ ቁጥር',
    phoneNumberPlaceholder: 'የስልክ ቁጥርዎን ያስገቡ',
    email: 'ኢሜይል (አማራጭ)',
    emailPlaceholder: 'የኢሜይል አድራሻዎን ያስገቡ',
    dateOfBirth: 'የትውልድ ቀን',
    createAccount: 'መለያ ፍጠር',
    phoneRequired: 'የስልክ ቁጥር ያስፈልጋል',
    nameRequired: 'ሙሉ ስም ያስፈልጋል',
    validPhone: 'እባክዎ ትክክለኛ የስልክ ቁጥር ያስገቡ',
    validEmail: 'እባክዎ ትክክለኛ ኢሜይል ያስገቡ'
  },
  settings: {
    title: 'ቅንብሮች',
    language: 'ቋንቋ',
    changeLanguage: 'ቋንቋ ይቀይሩ'
  }
};

// Oromo translations  
export const om = {
  common: {
    continue: 'Itti fufi',
    back: 'Duubatti deebi\'i',
    cancel: 'Dhiisi',
    save: 'Olkaa\'i',
    edit: 'Sirreessi',
    delete: 'Haqi',
    confirm: 'Mirkaneessi',
    yes: 'Eeyyee',
    no: 'Lakki',
    ok: 'Tole',
    error: 'Dogoggora',
    success: 'Milkaa\'ina',
    loading: 'Fe\'aa jira...',
    retry: 'Ammas yaali',
    close: 'Cufii',
    next: 'Itti aanaa',
    previous: 'Dur',
    submit: 'Galchi'
  },
  onboarding: {
    welcome: 'Baga Voice Biometrics-tti dhuftan',
    subtitle: 'Mirkaneessaa eenyummaa nageenya qabu salphaa taasifame',
    getStarted: 'Jalqabi',
    selectLanguage: 'Afaan Keetii Filadhu',
    languagePrompt: 'Application-ichaa afaan filatte filadhu'
  },
  registration: {
    title: 'Akkaawuntii uumi',
    fullName: 'Maqaa guutuu',
    fullNamePlaceholder: 'Maqaa kee guutuu galchi',
    phoneNumber: 'Lakkoofsa bilbilaa',
    phoneNumberPlaceholder: 'Lakkoofsa bilbilaa keetii galchi',
    email: 'Email (Filannoo)',
    emailPlaceholder: 'Teessoo email keetii galchi',
    dateOfBirth: 'Guyyaa dhaloota',
    createAccount: 'Akkaawuntii uumi',
    phoneRequired: 'Lakkoofsi bilbilaa barbaachisaadha',
    nameRequired: 'Maqaan guutuu barbaachisaadha',
    validPhone: 'Mee lakkoofsa bilbilaa sirrii galchi',
    validEmail: 'Mee email sirrii galchi'
  },
  settings: {
    title: 'Qindaa\'ina',
    language: 'Afaan',
    changeLanguage: 'Afaan jijjiiri'
  }
};

export const translations = { en, fr, so, am, om };

export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' }
];

export default translations;