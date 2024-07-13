export const languages = {
    'en': 'English',
    'hu': 'Hungarian',
}

export function getLanguageCode(languageName: string) {
    return Object.keys(languages).find(key => languages[key as keyof typeof languages] === languageName);
}