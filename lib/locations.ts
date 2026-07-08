// MENA/Gulf locations, devices, languages for DataForSEO API

export interface Location {
  code: number // DataForSEO location code
  name: string
  nameAr: string
  country: string
  flag: string
}

export interface Device {
  id: string
  label: string
  labelAr: string
  icon: string
}

export interface Language {
  code: string
  name: string
  flag: string
}

// MENA/Gulf locations (DataForSEO codes)
export const LOCATIONS: Location[] = [
  { code: 2504, name: 'Maroc', nameAr: 'المغرب', country: 'MA', flag: '🇲🇦' },
  { code: 2012, name: 'Algérie', nameAr: 'الجزائر', country: 'DZ', flag: '🇩🇿' },
  { code: 2788, name: 'Tunisie', nameAr: 'تونس', country: 'TN', flag: '🇹🇳' },
  { code: 2818, name: 'Égypte', nameAr: 'مصر', country: 'EG', flag: '🇪🇬' },
  { code: 2682, name: 'Arabie Saoudite', nameAr: 'السعودية', country: 'SA', flag: '🇸🇦' },
  { code: 2784, name: 'Émirats Arabes Unis', nameAr: 'الإمارات', country: 'AE', flag: '🇦🇪' },
  { code: 2634, name: 'Qatar', nameAr: 'قطر', country: 'QA', flag: '🇶🇦' },
  { code: 2414, name: 'Koweït', nameAr: 'الكويت', country: 'KW', flag: '🇰🇼' },
  { code: 2048, name: 'Bahreïn', nameAr: 'البحرين', country: 'BH', flag: '🇧🇭' },
  { code: 2512, name: 'Oman', nameAr: 'عُمان', country: 'OM', flag: '🇴🇲' },
  { code: 2422, name: 'Liban', nameAr: 'لبنان', country: 'LB', flag: '🇱🇧' },
  { code: 2400, name: 'Jordanie', nameAr: 'الأردن', country: 'JO', flag: '🇯🇴' },
]

export const DEVICES: Device[] = [
  { id: 'desktop', label: 'Desktop', labelAr: 'سطح المكتب', icon: '🖥️' },
  { id: 'mobile', label: 'Mobile', labelAr: 'الهاتف', icon: '📱' },
  { id: 'tablet', label: 'Tablet', labelAr: 'اللوحي', icon: '📲' },
]

export const LANGUAGES: Language[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
]

export const DEFAULT_LOCATION = LOCATIONS[0]
export const DEFAULT_DEVICE = DEVICES[0]
export const DEFAULT_LANGUAGE = LANGUAGES[0]

export function getLocationByCode(code: number): Location | undefined {
  return LOCATIONS.find((l) => l.code === code)
}
export function getDeviceById(id: string): Device | undefined {
  return DEVICES.find((d) => d.id === id)
}
export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code)
}

export function locName(l: Location, lang: string): string {
  return lang === 'ar' ? l.nameAr : l.name
}
export function deviceName(d: Device, lang: string): string {
  return lang === 'ar' ? d.labelAr : d.label
}
