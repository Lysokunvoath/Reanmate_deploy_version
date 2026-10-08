// Only real video players render inline; any other link (e.g. an EBC lesson
// page) opens on its own site instead of loading the whole page in an iframe.
const EMBEDDABLE_HOSTS = ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com"];

function isEmbeddable(url: string) {
  try {
    const { hostname, pathname } = new URL(url);
    return EMBEDDABLE_HOSTS.includes(hostname) && pathname.startsWith("/embed/");
  } catch {
    return false;
  }
}

function sourceName(url: string) {
  try {
    return new URL(url).hostname.endsWith("ebc.edu.kh") ? "EBC" : null;
  } catch {
    return null;
  }
}

export default function VideoEmbed({
  embedUrl,
  credit,
  title,
}: {
  embedUrl: string;
  credit: string;
  title: string;
}) {
  const external = embedUrl && !isEmbeddable(embedUrl);
  const source = external ? sourceName(embedUrl) : null;

  return (
    <div id="lesson-video" className="ui-card overflow-hidden">
      {embedUrl && !external ? (
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full bg-black"
        />
      ) : (
        <div className="relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden bg-primary-dark px-5 text-white">
          <p className="absolute left-4 top-4 rounded-full bg-black/25 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-gold">
            {source ?? "MoEYS"}
          </p>
          <p className="max-w-xs text-center text-sm font-medium leading-relaxed">{title}</p>
          {external ? (
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-btn mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cta px-5 py-2.5 text-sm font-semibold text-white hover:bg-cta-dark"
            >
              ▶ {source ? `មើលវីដេអូនៅលើគេហទំព័រ ${source}` : "មើលវីដេអូ"}
            </a>
          ) : (
            <p className="mt-2 max-w-xs text-center text-xs leading-relaxed text-white/55">
              វីដេអូមេរៀនផ្លូវការនឹងបង្ហាញនៅទីនេះ។ សូមអានសង្ខេបខាងក្រោមជាមុនសិន។
            </p>
          )}
          {external && (
            <p className="mt-2 max-w-xs text-center text-xs leading-relaxed text-white/55">
              វីដេអូនឹងបើកនៅផ្ទាំងថ្មី។
            </p>
          )}
        </div>
      )}
      <p className="border-t border-line px-4 py-2.5 text-xs leading-relaxed text-ink-muted">
        {credit}
      </p>
    </div>
  );
}
