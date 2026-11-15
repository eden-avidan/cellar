import { useState, type ReactNode } from 'react';
import { WINE_TYPES, type WineFields } from '../data/wines.ts';

type Set = <K extends keyof WineFields>(key: K, value: WineFields[K]) => void;

const inputCls = 'w-full rounded-xl bg-white px-3 py-2.5 ring-1 ring-ink-200 outline-none focus:ring-2 focus:ring-wine-500';

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${wide ? 'col-span-2' : ''}`}>
      <span className="text-xs font-medium text-ink-500">{label}</span>
      {children}
    </label>
  );
}

function Text({ label, value, onChange, wide = true, placeholder }: { label: string; value: string; onChange: (v: string) => void; wide?: boolean; placeholder?: string }) {
  return (
    <Field label={label} wide={wide}>
      <input className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

/** Keeps the raw text while typing; reports a number, or null when empty or invalid. */
function Num({ label, value, onChange, wide = false, step = 'any', suffix }: { label: string; value: number | null; onChange: (v: number | null) => void; wide?: boolean; step?: string; suffix?: string }) {
  const [text, setText] = useState(value == null ? '' : String(value));
  return (
    <Field label={label} wide={wide}>
      <div className="relative">
        <input
          className={inputCls}
          inputMode="decimal"
          step={step}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const n = Number(e.target.value.replace(',', '.'));
            onChange(e.target.value.trim() === '' || Number.isNaN(n) ? null : n);
          }}
        />
        {suffix && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-500">{suffix}</span>}
      </div>
    </Field>
  );
}

/** Comma-separated list input. */
function List({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(value.join(', '));
  return (
    <Field label={label} wide>
      <input
        className={inputCls}
        value={text}
        placeholder="Separate with commas"
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean));
        }}
      />
    </Field>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <select className={`${inputCls} capitalize`} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Section({ title, hint, open = true, children }: { title: string; hint?: string; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group rounded-2xl bg-cream-50 p-4 ring-1 ring-ink-200/70">
      <summary className="flex cursor-pointer list-none items-center justify-between">
        <span>
          <span className="font-serif text-lg font-semibold">{title}</span>
          {hint && <span className="ml-2 text-xs text-ink-500">{hint}</span>}
        </span>
        <svg viewBox="0 0 24 24" className="size-5 text-ink-500 transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" />
        </svg>
      </summary>
      <div className="mt-4 grid grid-cols-2 gap-3">{children}</div>
    </details>
  );
}

export function WineForm({ value, onChange, fromAi }: { value: WineFields; onChange: (v: WineFields) => void; fromAi?: boolean }) {
  const set: Set = (key, v) => onChange({ ...value, [key]: v });
  const w = value;
  const est = fromAi ? 'AI estimate · edit freely' : undefined;

  return (
    <div className="flex flex-col gap-3">
      <Section title="Label">
        <Text label="Producer" value={w.producer} onChange={(v) => set('producer', v)} />
        <Text label="Wine name" value={w.wineName} onChange={(v) => set('wineName', v)} />
        <Num label="Vintage" value={w.vintage} onChange={(v) => set('vintage', v)} step="1" />
        <Select label="Type" value={w.wineType} options={WINE_TYPES} onChange={(v) => set('wineType', v as WineFields['wineType'])} />
        <Text label="Country" value={w.country} onChange={(v) => set('country', v)} wide={false} />
        <Text label="Region" value={w.region} onChange={(v) => set('region', v)} wide={false} />
        <Text label="Appellation" value={w.appellation} onChange={(v) => set('appellation', v)} wide={false} />
        <Text label="Classification" value={w.classification} onChange={(v) => set('classification', v)} wide={false} />
        <List label="Grapes" value={w.grapes} onChange={(v) => set('grapes', v)} />
        <Num label="Alcohol" value={w.alcohol} onChange={(v) => set('alcohol', v)} suffix="%" />
        <Num label="Bottle size" value={w.bottleSizeMl} onChange={(v) => set('bottleSizeMl', v)} step="1" suffix="ml" />
      </Section>

      <Section title="When to drink" hint={est}>
        <Num label="Best from (year)" value={w.drinkFrom} onChange={(v) => set('drinkFrom', v)} step="1" />
        <Num label="Best until (year)" value={w.drinkUntil} onChange={(v) => set('drinkUntil', v)} step="1" />
        <Text label="Best time to open" value={w.drinkNote} onChange={(v) => set('drinkNote', v)} />
        <Num label="Expires (year)" value={w.expiresYear} onChange={(v) => set('expiresYear', v)} step="1" />
        <Select label="Expiry source" value={w.expiresSource} options={['label', 'estimate']} onChange={(v) => set('expiresSource', v as WineFields['expiresSource'])} />
      </Section>

      <Section title="Style & serving" hint={est} open={!fromAi}>
        <Select label="Body" value={w.body} options={['light', 'medium', 'full']} onChange={(v) => set('body', v)} />
        <Select label="Sweetness" value={w.sweetness} options={['dry', 'off-dry', 'medium-sweet', 'sweet']} onChange={(v) => set('sweetness', v)} />
        <Select label="Acidity" value={w.acidity} options={['low', 'medium', 'high']} onChange={(v) => set('acidity', v)} />
        <Select label="Tannin" value={w.tannin} options={['low', 'medium', 'high']} onChange={(v) => set('tannin', v)} />
        <List label="Tasting notes" value={w.tastingNotes} onChange={(v) => set('tastingNotes', v)} />
        <List label="Food pairings" value={w.foodPairings} onChange={(v) => set('foodPairings', v)} />
        <Num label="Serve from" value={w.servingTempMin} onChange={(v) => set('servingTempMin', v)} suffix="°C" />
        <Num label="Serve to" value={w.servingTempMax} onChange={(v) => set('servingTempMax', v)} suffix="°C" />
        <Num label="Decant" value={w.decantMinutes} onChange={(v) => set('decantMinutes', v)} step="1" suffix="min" />
        <Num label="Typical price" value={w.typicalPriceIls} onChange={(v) => set('typicalPriceIls', v)} suffix="₪" />
      </Section>

      <Section title="Your details" hint="all optional">
        {w.list !== 'wishlist' && (
          <>
            <Num label="Bottles" value={w.quantity} onChange={(v) => set('quantity', v)} step="1" />
            <Text label="Storage spot" value={w.location} onChange={(v) => set('location', v)} wide={false} placeholder="Rack B, shelf 2" />
            <Num label="Price paid" value={w.pricePaid} onChange={(v) => set('pricePaid', v)} suffix="₪" />
            <Field label="Purchase date">
              <input type="date" className={inputCls} value={w.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} />
            </Field>
            <Text label="Bought at" value={w.boughtAt} onChange={(v) => set('boughtAt', v)} placeholder="Shop or winery" />
          </>
        )}
        <Field label="Notes" wide>
          <textarea className={`${inputCls} min-h-20`} value={w.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </Section>
    </div>
  );
}
