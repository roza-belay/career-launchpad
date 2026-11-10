import type { CvContent } from "@/lib/cv";

/** Printable A4-style CV. Shows only what the user wrote. */
export function CvSheet({ cv }: { cv: CvContent }) {
  const contact = [cv.phone, cv.email].filter(Boolean);
  return (
    <article className="cv-sheet mx-auto w-full max-w-[210mm] rounded-xl border bg-paper p-10 font-sans text-[10.5pt] leading-relaxed text-paper-foreground shadow-sm">
      <header className="border-b border-paper-accent/30 pb-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">{cv.name}</h1>
        {cv.headline && <p className="mt-1 font-medium text-paper-accent">{cv.headline}</p>}
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-paper-muted">
          {contact.map((c) => <span key={c}>{c}</span>)}
          {cv.links.filter((l) => l.label).map((l, i) => l.url
            ? <a key={i} href={l.url} target="_blank" rel="noreferrer" className="text-paper-accent underline">{l.label}</a>
            : <span key={i}>{l.label}</span>)}
        </p>
      </header>
      {cv.profile && (
        <section className="mt-5">
          <H>{cv.profileTitle}</H>
          {cv.profile.split(/\n\s*\n/).map((p, i) => <p key={i} className="mt-2 whitespace-pre-line">{p}</p>)}
        </section>
      )}
      {cv.sections.map((s, si) => (
        <section key={si} className="mt-5">
          <H>{s.title}</H>
          {s.entries.map((e, ei) => (
            <div key={ei} className="cv-entry mt-2.5">
              {e.heading && <h3 className="font-semibold">{e.heading}</h3>}
              {e.sub && <p className="text-[9.5pt] text-paper-muted">{e.sub}</p>}
              {e.text && <p className="mt-1 whitespace-pre-line">{e.text}</p>}
              {e.bullets.length > 0 && <ul className="mt-1 list-disc space-y-0.5 pl-5">{e.bullets.map((b, bi) => <li key={bi}>{b}</li>)}</ul>}
            </div>
          ))}
        </section>
      ))}
      {cv.footer && <p className="mt-6 text-paper-muted italic">{cv.footer}</p>}
    </article>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-[11pt] font-bold uppercase tracking-wider text-paper-accent">{children}</h2>;
}
