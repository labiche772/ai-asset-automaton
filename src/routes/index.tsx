import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MineBot BTC — Achat robotisé de UA, IA, ISP, OVH & OVC" },
      {
        name: "description",
        content:
          "Tableau de bord de démonstration : minez et achetez automatiquement des ressources UA, IA, ISP, OVH et OVC en bitcoin, avec analyse des inconvénients de l'IA.",
      },
      { property: "og:title", content: "MineBot BTC — Achat robotisé en bitcoin" },
      {
        property: "og:description",
        content:
          "Catalogue UA / IA / ISP / OVH / OVC, bot d'achat automatique en BTC simulé et panneau des inconvénients de l'IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Kind = "UA" | "IA" | "ISP" | "OVH" | "OVC";

type Resource = {
  id: string;
  kind: Kind;
  name: string;
  detail: string;
  priceBtc: number;
  stock: number;
  latency: number;
};

const KINDS: { key: Kind; label: string; hint: string }[] = [
  { key: "UA", label: "UA", hint: "User-agents & empreintes navigateur" },
  { key: "IA", label: "IA", hint: "Crédits de modèles d'intelligence artificielle" },
  { key: "ISP", label: "ISP", hint: "Proxies fournisseurs d'accès résidentiels" },
  { key: "OVH", label: "OVH", hint: "Serveurs dédiés & VPS bare-metal" },
  { key: "OVC", label: "OVC", hint: "Conteneurs de calcul à la volée" },
];

const CATALOG: Resource[] = [
  { id: "ua-01", kind: "UA", name: "Chrome 138 / Win 11", detail: "Pool rotatif · 25k empreintes", priceBtc: 0.00004, stock: 480, latency: 12 },
  { id: "ua-02", kind: "UA", name: "Safari 19 / iOS 26", detail: "Mobile · TLS fidèle", priceBtc: 0.00006, stock: 210, latency: 18 },
  { id: "ua-03", kind: "UA", name: "Firefox 142 / Linux", detail: "Desktop · canvas bruité", priceBtc: 0.000035, stock: 640, latency: 15 },
  { id: "ai-01", kind: "IA", name: "Modèle texte 70B", detail: "1M tokens · contexte 128k", priceBtc: 0.00021, stock: 95, latency: 340 },
  { id: "ai-02", kind: "IA", name: "Vision multimodale", detail: "10k images analysées", priceBtc: 0.00038, stock: 42, latency: 520 },
  { id: "ai-03", kind: "IA", name: "Embeddings haute densité", detail: "50M vecteurs", priceBtc: 0.00012, stock: 130, latency: 90 },
  { id: "isp-01", kind: "ISP", name: "ISP France · Orange", detail: "IPv4 statique · 20 ports", priceBtc: 0.00015, stock: 64, latency: 28 },
  { id: "isp-02", kind: "ISP", name: "ISP Allemagne · Telekom", detail: "Résidentiel · illimité", priceBtc: 0.00019, stock: 38, latency: 34 },
  { id: "isp-03", kind: "ISP", name: "ISP USA · Comcast", detail: "Rotation 5 min", priceBtc: 0.00023, stock: 51, latency: 88 },
  { id: "ovh-01", kind: "OVH", name: "Rise-2 · Gravelines", detail: "8 vCPU · 32 Go · 2×2 To", priceBtc: 0.00072, stock: 12, latency: 6 },
  { id: "ovh-02", kind: "OVH", name: "Advance-4 · Roubaix", detail: "16 vCPU · 64 Go · NVMe", priceBtc: 0.00131, stock: 7, latency: 8 },
  { id: "ovh-03", kind: "OVH", name: "VPS Comfort · Strasbourg", detail: "4 vCPU · 8 Go · 80 Go", priceBtc: 0.00026, stock: 44, latency: 11 },
  { id: "ovc-01", kind: "OVC", name: "Conteneur GPU L4", detail: "24 Go VRAM · à la minute", priceBtc: 0.00058, stock: 19, latency: 42 },
  { id: "ovc-02", kind: "OVC", name: "Conteneur CPU burst", detail: "32 vCPU · éphémère", priceBtc: 0.00033, stock: 76, latency: 21 },
  { id: "ovc-03", kind: "OVC", name: "Conteneur stockage froid", detail: "10 To · S3 compatible", priceBtc: 0.00017, stock: 88, latency: 65 },
];

const AI_DRAWBACKS = [
  { title: "Hallucinations", body: "Un modèle produit des réponses fausses avec la même assurance que des réponses justes. Toute décision d'achat doit rester vérifiable.", level: "Critique" },
  { title: "Coût énergétique", body: "L'inférence en continu consomme électricité et eau de refroidissement, un poste qui grossit avec l'automatisation.", level: "Élevé" },
  { title: "Biais des données", body: "Les préférences apprises reproduisent les déséquilibres des jeux d'entraînement : certains fournisseurs seront systématiquement favorisés.", level: "Élevé" },
  { title: "Opacité des décisions", body: "Difficile d'auditer pourquoi le bot a acheté telle ressource : la traçabilité doit être imposée par le code, pas par le modèle.", level: "Moyen" },
  { title: "Dépendance & fragilité", body: "Une panne d'API ou un changement de modèle casse toute la chaîne d'achat automatisée.", level: "Moyen" },
  { title: "Risques juridiques", body: "Achats autonomes, données personnelles et paiements crypto cumulent des obligations réglementaires lourdes.", level: "Critique" },
  { title: "Surface d'attaque", body: "Un bot autonome doté d'un portefeuille est une cible : injection de prompt et détournement de fonds sont réalistes.", level: "Critique" },
  { title: "Perte de compétence", body: "Déléguer l'arbitrage prix/qualité érode la capacité de l'équipe à juger une offre par elle-même.", level: "Faible" },
];

const levelClass: Record<string, string> = {
  Critique: "text-destructive border-destructive/40 bg-destructive/10",
  Élevé: "text-warning border-warning/40 bg-warning/10",
  Moyen: "text-accent border-accent/40 bg-accent/10",
  Faible: "text-muted-foreground border-border bg-muted/40",
};

const fmtBtc = (n: number) => `₿ ${n.toFixed(6)}`;

function Index() {
  const [filter, setFilter] = useState<Kind | "ALL">("ALL");
  const [botOn, setBotOn] = useState(false);
  const [maxPrice, setMaxPrice] = useState(0.0006);
  const [balance, setBalance] = useState(0.05);
  const [orders, setOrders] = useState<{ id: string; name: string; kind: Kind; price: number; at: string }[]>([]);
  const [log, setLog] = useState<string[]>(["[boot] moteur d'acquisition prêt — mode simulation"]);
  const [hashrate, setHashrate] = useState(412);
  const tick = useRef(0);

  const visible = useMemo(
    () => (filter === "ALL" ? CATALOG : CATALOG.filter((r) => r.kind === filter)),
    [filter],
  );

  const pushLog = (line: string) =>
    setLog((l) => [`[${new Date().toLocaleTimeString("fr-FR")}] ${line}`, ...l].slice(0, 40));

  const buy = (r: Resource, auto: boolean) => {
    setBalance((b) => {
      if (b < r.priceBtc) {
        pushLog(`solde insuffisant pour ${r.name}`);
        return b;
      }
      setOrders((o) =>
        [{ id: `${r.id}-${Date.now()}`, name: r.name, kind: r.kind, price: r.priceBtc, at: new Date().toLocaleTimeString("fr-FR") }, ...o].slice(0, 25),
      );
      pushLog(`${auto ? "bot" : "manuel"} · achat ${r.kind} ${r.name} — ${fmtBtc(r.priceBtc)}`);
      return b - r.priceBtc;
    });
  };

  useEffect(() => {
    const i = setInterval(() => setHashrate((h) => Math.max(180, Math.round(h + (Math.random() - 0.5) * 60))), 1500);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!botOn) return;
    const i = setInterval(() => {
      tick.current += 1;
      const pool = CATALOG.filter((r) => r.priceBtc <= maxPrice && (filter === "ALL" || r.kind === filter));
      if (pool.length === 0) {
        pushLog("aucune offre sous le seuil défini");
        return;
      }
      buy(pool[Math.floor(Math.random() * pool.length)], true);
    }, 2600);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botOn, maxPrice, filter]);

  const spent = orders.reduce((s, o) => s + o.price, 0);

  return (
    <div className="min-h-screen grid-bg">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-4">
          <div className="btc-chip flex size-9 items-center justify-center rounded-md font-mono text-lg font-bold">₿</div>
          <div className="mr-auto">
            <h1 className="font-mono text-lg font-bold tracking-tight">MineBot // acquisition autonome</h1>
            <p className="text-xs text-muted-foreground">UA · IA · ISP · OVH · OVC — réglés en bitcoin</p>
          </div>
          <div className="panel px-3 py-2 text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Portefeuille</div>
            <div className="tabular font-mono text-sm text-primary">{fmtBtc(balance)}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Hashrate simulé", v: `${hashrate} TH/s`, s: "minage fictif" },
            { l: "Achats robotisés", v: String(orders.length), s: "cette session" },
            { l: "Dépensé", v: fmtBtc(spent), s: "hors frais réseau" },
            { l: "Bot", v: botOn ? "ACTIF" : "ARRÊTÉ", s: `seuil ${fmtBtc(maxPrice)}` },
          ].map((k) => (
            <div key={k.l} className="panel p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k.l}</div>
              <div className={`tabular mt-1 font-mono text-xl font-bold ${k.l === "Bot" && botOn ? "text-success" : ""}`}>{k.v}</div>
              <div className="mt-1 text-xs text-muted-foreground">{k.s}</div>
            </div>
          ))}
        </section>

        <section className="panel glow flex flex-wrap items-center gap-4 p-5">
          <button
            onClick={() => {
              setBotOn((b) => !b);
              pushLog(botOn ? "bot arrêté" : "bot démarré — achats automatiques toutes les 2,6 s");
            }}
            className={`rounded-md px-5 py-2.5 font-mono text-sm font-bold transition-colors ${
              botOn ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "btc-chip hover:opacity-90"
            }`}
          >
            {botOn ? "■ Arrêter le bot" : "▶ Lancer le bot d'achat"}
          </button>
          <label className="flex min-w-56 flex-1 flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Prix maximum par achat · <span className="tabular font-mono text-primary">{fmtBtc(maxPrice)}</span>
            </span>
            <input
              type="range"
              min={0.00003}
              max={0.0014}
              step={0.00001}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-primary"
            />
          </label>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`size-2 rounded-full ${botOn ? "bg-success animate-pulse-dot" : "bg-muted-foreground"}`} />
            simulation — aucun bitcoin réel n'est transféré
          </span>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <FilterBtn active={filter === "ALL"} onClick={() => setFilter("ALL")} label="TOUT" />
            {KINDS.map((k) => (
              <FilterBtn key={k.key} active={filter === k.key} onClick={() => setFilter(k.key)} label={k.label} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {filter === "ALL" ? "Toutes les catégories de ressources minables." : KINDS.find((k) => k.key === filter)?.hint}
          </p>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((r) => (
              <article key={r.id} className="panel flex flex-col gap-3 p-4 transition-colors hover:border-primary/50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-accent">
                      {r.kind}
                    </span>
                    <h3 className="mt-2 font-mono text-sm font-semibold">{r.name}</h3>
                    <p className="text-xs text-muted-foreground">{r.detail}</p>
                  </div>
                  <div className="tabular text-right font-mono text-sm text-primary">{fmtBtc(r.priceBtc)}</div>
                </div>
                <div className="tabular flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span>stock {r.stock}</span>
                  <span>latence {r.latency} ms</span>
                </div>
                <button
                  onClick={() => buy(r, false)}
                  className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  Acheter en BTC
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="panel p-5">
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-muted-foreground">Journal du bot</h2>
            <ul className="mt-3 max-h-72 space-y-1 overflow-auto font-mono text-xs">
              {log.map((l, i) => (
                <li key={i} className="border-b border-border/50 pb-1 text-muted-foreground">
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel p-5">
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-muted-foreground">Commandes</h2>
            {orders.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">Aucun achat pour le moment.</p>
            ) : (
              <ul className="mt-3 max-h-72 space-y-2 overflow-auto">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 border-b border-border/50 pb-2 text-xs">
                    <span className="font-mono text-accent">{o.kind}</span>
                    <span className="mr-auto truncate">{o.name}</span>
                    <span className="tabular font-mono text-primary">{fmtBtc(o.price)}</span>
                    <span className="tabular text-muted-foreground">{o.at}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-mono text-xl font-bold">Inconvénients de l'IA</h2>
            <p className="text-sm text-muted-foreground">
              Ce que coûte réellement une chaîne d'achat pilotée par un modèle.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {AI_DRAWBACKS.map((d) => (
              <article key={d.title} className="panel p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-mono text-sm font-semibold">{d.title}</h3>
                  <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${levelClass[d.level]}`}>
                    {d.level}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{d.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-6 text-center text-xs text-muted-foreground">
        Démonstration fonctionnelle · données fictives · aucun paiement bitcoin réel
      </footer>
    </div>
  );
}

function FilterBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 font-mono text-xs font-semibold tracking-widest transition-colors ${
        active
          ? "border-primary/60 bg-primary/15 text-primary"
          : "border-border bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
