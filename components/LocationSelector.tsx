'use client'

import { LOCATIONS, DEVICES, LANGUAGES, locName, deviceName, citiesForCountry, cityName } from '@/lib/locations'
import { useT, usePT } from '@/lib/i18n'

const selectCls =
  'w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition-colors hover:border-[var(--text-3)] focus:border-[var(--crimson)] focus:ring-2 focus:ring-[var(--crimson)]/10'
const labelCls = 'mb-1.5 block text-xs font-medium text-[var(--text-2)]'

export function LocationSelector({ value, onChange }: { value: number; onChange: (code: number) => void }) {
  const { lang } = useT()
  const p = usePT()
  return (
    <div>
      <label className={labelCls}>{p.countryLabel}</label>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className={selectCls}>
        {LOCATIONS.map((loc) => (
          <option key={loc.code} value={loc.code}>
            {loc.flag} {locName(loc, lang)}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * City picker for precise SERP geo-targeting. Lists the cities of `country`
 * (plus a "whole country" default). Renders nothing if the country has no
 * cities, so callers can drop it in unconditionally.
 */
export function CitySelector({
  country,
  value,
  onChange,
}: {
  country: number
  value: string
  onChange: (cityId: string) => void
}) {
  const { lang } = useT()
  const p = usePT()
  const cities = citiesForCountry(country)
  if (cities.length === 0) return null
  return (
    <div>
      <label className={labelCls}>{p.cityLabel}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls} title={p.citySerpHint}>
        <option value="">📍 {p.cityAll}</option>
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {cityName(c, lang)}
          </option>
        ))}
      </select>
    </div>
  )
}

export function DeviceSelector({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { lang } = useT()
  const p = usePT()
  return (
    <div>
      <label className={labelCls}>{p.deviceLabelTitle}</label>
      <div className="flex gap-1.5">
        {DEVICES.map((device) => {
          const active = value === device.id
          return (
            <button
              key={device.id}
              type="button"
              onClick={() => onChange(device.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-[var(--crimson)] bg-[var(--crimson)]/8 text-[var(--crimson)]'
                  : 'border-[var(--line)] bg-[var(--card)] text-[var(--text-2)] hover:border-[var(--text-3)]'
              }`}
            >
              <span>{device.icon}</span>
              <span className="hidden sm:inline">{deviceName(device, lang)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function LanguageSelector({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const p = usePT()
  return (
    <div>
      <label className={labelCls}>{p.langLabel}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.name}
          </option>
        ))}
      </select>
    </div>
  )
}
