export const PROVIDER_LANGUAGES = [
    "English", "Spanish", "French", "German", "Chinese", "Arabic", "Bengali", "Hindi", "Portuguese", "Russian", "Japanese",
    "Albanian", "Armenian", "Azerbaijani", "Belarusian", "Bosnian", "Bulgarian", "Croatian", "Czech", "Danish", "Dutch",
    "Estonian", "Finnish", "Georgian", "Greek", "Hungarian", "Icelandic", "Irish", "Italian", "Kazakh", "Latvian",
    "Lithuanian", "Luxembourgish", "Macedonian", "Maltese", "Moldovan", "Montenegrin", "Norwegian", "Polish", "Romanian",
    "Serbian", "Slovak", "Slovenian", "Swedish", "Turkish", "Ukrainian"
] as const;

export type IProviderLanguage = (typeof PROVIDER_LANGUAGES)[number];
