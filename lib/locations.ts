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

// A city for precise SERP geo-targeting. DataForSEO keyword *volumes* are only
// country-level, so cities refine the SERP / difficulty / rank landscape only,
// via `location_coordinate` (no fragile city-code lookup needed).
export interface City {
  id: string
  name: string
  nameAr: string
  countryCode: number // parent Location.code
  coordinate: string // "latitude,longitude" for DataForSEO location_coordinate
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

// Major cities per market, for city-level SERP targeting. Coordinates are
// city-center lat,long (a stable fact — no API lookup). Morocco is covered in
// depth (primary market); other markets list their top hubs.
export const CITIES: City[] = [
  // Maroc
  { id: 'casablanca', name: 'Casablanca', nameAr: 'الدار البيضاء', countryCode: 2504, coordinate: '33.5731,-7.5898' },
  { id: 'rabat', name: 'Rabat', nameAr: 'الرباط', countryCode: 2504, coordinate: '34.0209,-6.8417' },
  { id: 'marrakech', name: 'Marrakech', nameAr: 'مراكش', countryCode: 2504, coordinate: '31.6295,-7.9811' },
  { id: 'fes', name: 'Fès', nameAr: 'فاس', countryCode: 2504, coordinate: '34.0331,-5.0003' },
  { id: 'tanger', name: 'Tanger', nameAr: 'طنجة', countryCode: 2504, coordinate: '35.7595,-5.8340' },
  { id: 'agadir', name: 'Agadir', nameAr: 'أكادير', countryCode: 2504, coordinate: '30.4278,-9.5981' },
  // Algérie
  { id: 'alger', name: 'Alger', nameAr: 'الجزائر العاصمة', countryCode: 2012, coordinate: '36.7538,3.0588' },
  { id: 'oran', name: 'Oran', nameAr: 'وهران', countryCode: 2012, coordinate: '35.6969,-0.6331' },
  // Tunisie
  { id: 'tunis', name: 'Tunis', nameAr: 'تونس العاصمة', countryCode: 2788, coordinate: '36.8065,10.1815' },
  // Égypte
  { id: 'cairo', name: 'Le Caire', nameAr: 'القاهرة', countryCode: 2818, coordinate: '30.0444,31.2357' },
  { id: 'alexandria', name: 'Alexandrie', nameAr: 'الإسكندرية', countryCode: 2818, coordinate: '31.2001,29.9187' },
  // Arabie Saoudite
  { id: 'riyadh', name: 'Riyad', nameAr: 'الرياض', countryCode: 2682, coordinate: '24.7136,46.6753' },
  { id: 'jeddah', name: 'Djeddah', nameAr: 'جدة', countryCode: 2682, coordinate: '21.4858,39.1925' },
  // Émirats
  { id: 'dubai', name: 'Dubaï', nameAr: 'دبي', countryCode: 2784, coordinate: '25.2048,55.2708' },
  { id: 'abudhabi', name: 'Abu Dhabi', nameAr: 'أبو ظبي', countryCode: 2784, coordinate: '24.4539,54.3773' },
  // Qatar
  { id: 'doha', name: 'Doha', nameAr: 'الدوحة', countryCode: 2634, coordinate: '25.2854,51.5310' },
  // Koweït
  { id: 'kuwaitcity', name: 'Koweït', nameAr: 'مدينة الكويت', countryCode: 2414, coordinate: '29.3759,47.9774' },
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

export function citiesForCountry(code: number): City[] {
  return CITIES.filter((c) => c.countryCode === code)
}
export function getCityById(id: string): City | undefined {
  return CITIES.find((c) => c.id === id)
}

export function locName(l: Location, lang: string): string {
  return lang === 'ar' ? l.nameAr : l.name
}
export function cityName(c: City, lang: string): string {
  return lang === 'ar' ? c.nameAr : c.name
}
export function deviceName(d: Device, lang: string): string {
  return lang === 'ar' ? d.labelAr : d.label
}
