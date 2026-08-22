import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { TermuxMiner } from "@/components/TermuxMiner";
import { RealCheckout, type CheckoutItem } from "@/components/RealCheckout";
import { getAddressStats, getBtcMarket } from "@/lib/btc.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MineBot BTC — Achat réel de UA, IA, ISP, OVH & OVC en bitcoin" },
      {
        name: "description",
        content:
          "Paiements Bitcoin réels on-chain, cours et frais réseau en direct, commission de 1 % vérifiable sur la blockchain, et minage Android via Termux.",
      },
      { property: "og:title", content: "MineBot BTC — Paiements bitcoin réels" },
      {
        property: "og:description",
        content:
          "Catalogue UA / IA / ISP / OVH / OVC payable en BTC on-chain, vérification blockchain automatique et commission réelle de 1 %.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(marketQuery),
  component: Index,
});

const COMMISSION_ADDRESS = "bc1qmmq6s5rt8j6ydjjpqp3fdjdwhrjvjtansaqmnj";
const COMMISSION_RATE = 0.01;

const marketQuery = queryOptions({
  queryKey: ["btc-market"],
  queryFn: () => getBtcMarket(),
  refetchInterval: 60_000,
});

const addressQuery = queryOptions({
  queryKey: ["btc-address", COMMISSION_ADDRESS],
  queryFn: () => getAddressStats({ data: { address: COMMISSION_ADDRESS } }),
  refetchInterval: 60_000,
});

type Kind = "UA" | "IA" | "ISP" | "OVH" | "OVC";

type Resource = {
  id: string;
  kind: Kind;
  name: string;
  detail: string;
  priceEur: number;
  stock: number;
  latency: number;
};

type Order = {
  id: string;
  name: string;
  kind: string;
  txid: string;
  sats: number;
  feeSats: number;
  at: string;
};

const KINDS: { key: Kind; label: string; hint: string }[] = [
  { key: "UA", label: "UA", hint: "User-agents & empreintes navigateur" },
  { key: "IA", label: "IA", hint: "Crédits de modèles d'intelligence artificielle" },
  { key: "ISP", label: "ISP", hint: "Proxies fournisseurs d'accès résidentiels" },
  { key: "OVH", label: "OVH", hint: "Serveurs dédiés & VPS bare-metal" },
  { key: "OVC", label: "OVC", hint: "Conteneurs de calcul à la volée" },
];

const CATALOG: Resource[] = [
  { id: "ua-01", kind: "UA", name: "Chrome 138 / Win 11", detail: "Pool rotatif · 25k empreintes", priceEur: 4, stock: 480, latency: 12 },
  { id: "ua-02", kind: "UA", name: "Safari 19 / iOS 26", detail: "Mobile · TLS fidèle", priceEur: 6, stock: 210, latency: 18 },
  { id: "ua-03", kind: "UA", name: "Firefox 142 / Linux", detail: "Desktop · canvas bruité", priceEur: 3.5, stock: 640, latency: 15 },
  { id: "ai-01", kind: "IA", name: "Modèle texte 70B", detail: "1M tokens · contexte 128k", priceEur: 21, stock: 95, latency: 340 },
  { id: "ai-02", kind: "IA", name: "Vision multimodale", detail: "10k images analysées", priceEur: 38, stock: 42, latency: 520 },
  { id: "ai-03", kind: "IA", name: "Embeddings haute densité", detail: "50M vecteurs", priceEur: 12, stock: 130, latency: 90 },
  { id: "isp-01", kind: "ISP", name: "ISP France · Orange", detail: "IPv4 statique · 20 ports", priceEur: 15, stock: 64, latency: 28 },
  { id: "isp-02", kind: "ISP", name: "ISP Allemagne · Telekom", detail: "Résidentiel · illimité", priceEur: 19, stock: 38, latency: 34 },
  { id: "isp-03", kind: "ISP", name: "ISP USA · Comcast", detail: "Rotation 5 min", priceEur: 23, stock: 51, latency: 88 },
  { id: "ovh-01", kind: "OVH", name: "Rise-2 · Gravelines", detail: "8 vCPU · 32 Go · 2×2 To", priceEur: 72, stock: 12, latency: 6 },
  { id: "ovh-02", kind: "OVH", name: "Advance-4 · Roubaix", detail: "16 vCPU · 64 Go · NVMe", priceEur: 131, stock: 7, latency: 8 },
  { id: "ovh-03", kind: "OVH", name: "VPS Comfort · Strasbourg", detail: "4 vCPU · 8 Go · 80 Go", priceEur: 26, stock: 44, latency: 11 },
  { id: "ovc-01", kind: "OVC", name: "Conteneur GPU L4", detail: "24 Go VRAM · à la minute", priceEur: 58, stock: 19, latency: 42 },
  { id: "ovc-02", kind: "OVC", name: "Conteneur CPU burst", detail: "32 vCPU · éphémère", priceEur: 33, stock: 76, latency: 21 },
  { id: "ovc-03", kind: "OVC", name: "Conteneur stockage froid", detail: "10 To · S3 compatible", priceEur: 17, stock: 88, latency: 65 },
];

const AI_DRAWBACKS = [
  { title: "Hallucinations", body: "Un modèle produit des réponses fausses avec la même assurance que des réponses justes. Toute décision d'achat doit rester vérifiable.", level: "Critique" },
  { title: "Coût énergétique", body: "L'inférence en continu consomme électricité et eau de refroidissement, un poste qui grossit avec l'automatisation.", level: "Élevé" },
  { title: "Biais des données", body: "Les préférences apprises reproduisent les déséquilibres des jeux d'entraînement : certains fournisseurs seront systématiquement favorisés.", level: "Élevé" },
  { title: "Opacité des décisions", body: "Difficile d'auditer pourquoi le bot a acheté telle ressource : la traçabilité doit être imposée par le code, pas par le modèle.", level: "Moyen" },
  { title: "Dépendance & fragilité", body: "Une panne d'API ou un changement de modèle casse toute la chaîne d'achat automatisée.", level: "Moyen" },
  { title: "Risques juridiques", body: "Achats autonomes, données personnelles et paiements crypto cumulent des obligations réglementaires lourdes.", level: "Critique" },
  { title: "Surface d'attaque", body: "Un service doté d'un portefeuille est une cible : injection de prompt et détournement de fonds sont réalistes.", level: "Critique" },
  { title: "Perte de compétence", body: "Déléguer l'arbitrage prix/qualité érode la capacité de l'équipe à juger une offre par elle-même.", level: "Faible" },
];

const levelClass: Record<string, string> = {
  Critique: "text-destructive border-destructive/40 bg-destructive/10",
  Élevé: "text-warning border-warning/40 bg-warning/10",
  Moyen: "text-accent border-accent/40 bg-accent/10",
  Faible: "text-muted-foreground border-border bg-muted/40",
};

const fmtBtc = (sats: number) => `₿ ${(sats / 1e8).toFixed(8)}`;
const fmtEur = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const ORDERS_KEY = "minebot.orders.v1";

function Index() {
  const [filter, setFilter] = useState<Kind | "ALL">("ALL");
  const [checkout, setCheckout] = useState<CheckoutItem | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const market = useQuery(marketQuery);
  const addr = useQuery(addressQuery);
  const btcEur = market.data?.priceEur ?? 0;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      if (raw) setOrders(JSON.parse(raw) as Order[]);
    } catch {
      /* stockage indisponible */
    }
  }, []);

  const saveOrder = (o: Order) =>
    setOrders((prev) => {
      if (prev.some((p) => p.txid === o.txid)) return prev;
      const next = [o, ...prev].slice(0, 50);
      try {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
      } catch {
        /* stockage indisponible */
      }
      return next;
    });

  const visible = useMemo(
    () => (filter === "ALL" ? CATALOG : CATALOG.filter((r) => r.kind === filter)),
    [filter],
  );

  const paidSats = orders.reduce((s, o) => s + o.sats, 0);
  const feeSats = orders.reduce((s, o) => s + o.feeSats, 0);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(COMMISSION_ADDRESS);
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 1600);
    } catch {
      setCopiedAddr(false);
    }
  };

  const btcOf = (eur: number) =>
    btcEur > 0 ? `₿ ${(eur / btcEur).toFixed(8)}` : "—";

  return (
    <div className="min-h-screen grid-bg">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-4">
          <div className="btc-chip flex size-9 items-center justify-center rounded-md font-mono text-lg font-bold">₿</div>
          <div className="mr-auto">
            <h1 className="font-mono text-lg font-bold tracking-tight">MineBot // acquisition on-chain</h1>
            <p className="text-xs text-muted-foreground">UA · IA · ISP · OVH · OVC — réglés en bitcoin réel</p>
          </div>
          <div className="panel px-3 py-2 text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Cours BTC</div>
            <div className="tabular font-mono text-sm text-primary">
              {market.data ? fmtEur(market.data.priceEur) : "…"}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Bloc courant", v: market.data ? `#${market.data.blockHeight}` : "…", s: "mempool.space" },
            { l: "Frais rapides", v: market.data ? `${market.data.feeFastSatVb} sat/vB` : "…", s: `medium ${market.data?.feeMediumSatVb ?? "—"} sat/vB` },
            { l: "Reçu par le site", v: addr.data ? fmtBtc(addr.data.receivedSats) : "…", s: `${addr.data?.txCount ?? 0} transactions on-chain` },
            { l: "Vos paiements", v: fmtBtc(paidSats), s: `${orders.length} commande(s) · dont ${fmtBtc(feeSats)} de commission` },
          ].map((k) => (
            <div key={k.l} className="panel p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k.l}</div>
              <div className="tabular mt-1 font-mono text-xl font-bold">{k.v}</div>
              <div className="mt-1 text-xs text-muted-foreground">{k.s}</div>
            </div>
          ))}
        </section>

        <section className="panel glow flex flex-wrap items-center gap-3 p-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Commission réelle du site · 1 % par achat
            </h2>
            <p className="mt-1 break-all font-mono text-xs text-accent">{COMMISSION_ADDRESS}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Chaque paiement est envoyé on-chain à cette adresse : prix de la ressource + 1 % de commission.
              Solde actuel {addr.data ? fmtBtc(addr.data.balanceSats) : "…"}.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyAddress}
              className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              {copiedAddr ? "copié ✓" : "copier l'adresse"}
            </button>
            <a
              href={`https://mempool.space/address/${COMMISSION_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              explorer
            </a>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <FilterBtn active={filter === "ALL"} onClick={() => setFilter("ALL")} label="TOUT" />
            {KINDS.map((k) => (
              <FilterBtn key={k.key} active={filter === k.key} onClick={() => setFilter(k.key)} label={k.label} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {filter === "ALL" ? "Toutes les catégories de ressources disponibles." : KINDS.find((k) => k.key === filter)?.hint}
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
                  <div className="text-right">
                    <div className="tabular font-mono text-sm text-primary">{fmtEur(r.priceEur)}</div>
                    <div className="tabular font-mono text-[10px] text-muted-foreground">{btcOf(r.priceEur)}</div>
                  </div>
                </div>
                <div className="tabular flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span>stock {r.stock}</span>
                  <span>latence {r.latency} ms</span>
                </div>
                <button
                  disabled={btcEur <= 0}
                  onClick={() =>
                    setCheckout({ id: r.id, kind: r.kind, name: r.name, priceEur: r.priceEur })
                  }
                  className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-40"
                >
                  Payer en BTC
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Commandes payées (vérifiées on-chain)
          </h2>
          {orders.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">Aucun paiement enregistré sur cet appareil.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {orders.map((o) => (
                <li key={o.txid} className="flex flex-wrap items-center gap-2 border-b border-border/50 pb-2 text-xs">
                  <span className="font-mono text-accent">{o.kind}</span>
                  <span className="mr-auto truncate">{o.name}</span>
                  <span className="tabular font-mono text-primary">{fmtBtc(o.sats)}</span>
                  <span className="tabular text-muted-foreground">{o.at}</span>
                  <a
                    className="w-full truncate font-mono text-[10px] text-muted-foreground underline"
                    href={`https://mempool.space/tx/${o.txid}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {o.txid}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <TermuxMiner />

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
        Paiements Bitcoin réels on-chain · cours et frais via mempool.space · livraison des ressources effectuée manuellement
      </footer>

      {checkout && btcEur > 0 && (
        <RealCheckout
          item={checkout}
          address={COMMISSION_ADDRESS}
          commissionRate={COMMISSION_RATE}
          priceEur={btcEur}
          onClose={() => setCheckout(null)}
          onPaid={({ txid, sats, feeSats: fee }) =>
            saveOrder({
              id: checkout.id,
              name: checkout.name,
              kind: checkout.kind,
              txid,
              sats,
              feeSats: fee,
              at: new Date().toLocaleString("fr-FR"),
            })
          }
        />
      )}
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
