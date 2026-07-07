// MENA/Gulf locations, devices, languages for DataForSEO API

export interface Location {
  code: number // DataForSEO location code
  name: string
  country: string
  flag: string
}

export interface Device {
  id: string
  label: string
  icon: string
}

export interface Language {
  code: string
  name: string
  flag: string
}

// MENA/Gulf locations (DataForSEO codes)
export const LOCATIONS: Location[] = [
  { code: 2504, name: 'Maroc', country: 'MA', flag: '🇲🇦' },
  { code: 2012, name: 'Algérie', country: 'DZ', flag: '🇩🇿' },
  { code: 2788, name: 'Tunisie', country: 'TN', flag: '🇹🇳' },
  { code: 2818, name: 'Égypte', country: 'EG', flag: '🇪🇬' },
  { code: 2682, name: 'Arabie Saoudite', country: 'SA', flag: '🇸🇦' },
  { code: 2784, name: 'Émirats Arabes Unis', country: 'AE', flag: '🇦🇪' },
  { code: 2634, name: 'Qatar', country: 'QA', flag: '🇶🇦' },
  { code: 2414, name: 'Koweït', country: 'KW', flag: '🇰🇼' },
  { code: 2048, name: 'Bahreïn', country: 'BH', flag: '🇧🇭' },
  { code: 2512, name: 'Oman', country: 'OM', flag: '🇴🇲' },
  { code: 2422, name: 'Liban', country: 'LB', flag: '🇱🇧' },
  { code: 2400, name: 'Jordanie', country: 'JO', flag: '🇯🇴' },
]

export const DEVICES: Device[] = [
  { id: 'desktop', label: 'Desktop', icon: '🖥️' },
  { id: 'mobile', label: 'Mobile', icon: '📱' },
  { id: 'tablet', label: 'Tablet', icon: '📲' },
]

export const LANGUAGES: Language[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
]

// Default preferences
export const DEFAULT_LOCATION = LOCATIONS[0] // Maroc
export const DEFAULT_DEVICE = DEVICES[0] // Desktop
export const DEFAULT_LANGUAGE = LANGUAGES[0] // Français

export function getLocationByCode(code: number): Location | undefined {
  return LOCATIONS.find((l) => l.code === code)
}

export function getDeviceById(id: string): Device | undefined {
  return DEVICES.find((d) => d.id === id)
}

export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code)
}
