'use client'

import { LOCATIONS, DEVICES, LANGUAGES, Location, Device, Language } from '@/lib/locations'

interface LocationSelectorProps {
  value: number
  onChange: (code: number) => void
}

export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  const selected = LOCATIONS.find((l) => l.code === value) || LOCATIONS[0]

  return (
    <div className="relative">
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#C9A961]/80">
        Pays / Marché
      </label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-2.5 text-sm text-neutral-100 outline-none transition-all hover:border-[#C9A961]/50 focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20"
      >
        {LOCATIONS.map((loc) => (
          <option key={loc.code} value={loc.code}>
            {loc.flag} {loc.name}
          </option>
        ))}
      </select>
    </div>
  )
}

interface DeviceSelectorProps {
  value: string
  onChange: (id: string) => void
}

export function DeviceSelector({ value, onChange }: DeviceSelectorProps) {
  return (
    <div className="relative">
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#C9A961]/80">
        Appareil
      </label>
      <div className="flex gap-2">
        {DEVICES.map((device) => {
          const active = value === device.id
          return (
            <button
              key={device.id}
              onClick={() => onChange(device.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'border-[#C9A961] bg-[#C9A961]/10 text-[#C9A961] shadow-lg shadow-[#C9A961]/20'
                  : 'border-[#C9A961]/20 bg-[#0F172A]/30 text-neutral-400 hover:border-[#C9A961]/40 hover:text-neutral-200'
              }`}
            >
              <span className="text-lg">{device.icon}</span>
              <span>{device.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface LanguageSelectorProps {
  value: string
  onChange: (code: string) => void
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="relative">
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#C9A961]/80">
        Langue
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#C9A961]/30 bg-[#0F172A]/50 px-4 py-2.5 text-sm text-neutral-100 outline-none transition-all hover:border-[#C9A961]/50 focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  )
}
