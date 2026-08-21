import { useCallback, useEffect, useMemo, useState } from "react";

const fmtBtc = (n: number) => `₿ ${n.toFixed(8)}`;
const SATS = 1e8;

const POOLS = [
  {
    id: "ckpool",
    url: "stratum+tcp://solo.ckpool.org:3333",
    note: "Solo BTC · payout direct à l'adresse (bloc entier)",
  },
  {
    id: "public-pool",
    url: "stratum+tcp://public-pool.io:21496",
    note: "Mini-pool BTC open-source · payout direct à l'adresse",
  },
  {
    id: "nicehash",
    url: "stratum+tcp://sha256.auto.nicehash.com:9200",
    note: "Hashrate loué · payout BTC à l'adresse",
  },
];

type Chain = {
  funded_txo_sum: number;
  spent_txo_sum: number;
  tx_count: number;
};

export function MineToPay({
  address,
  owed,
  onPaid,
}: {
  address: string;
  owed: number;
  onPaid: (totalReceivedBtc: number) => void;
}) {
  const [pool, setPool] = useState(POOLS[0]!.url);
  const [worker, setWorker] = useState("payeur-01");
  const [threads, setThreads] = useState(4);
  const [copied, setCopied] = useState<string | null>(null);
  const [chain, setChain] = useState<Chain | null>(null);
  const [mempool, setMempool] = useState<Chain | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const cmd = useMemo(
    () =>
      `cpuminer -a sha256d -o ${pool} -u ${address}.${worker} -p x -t ${threads}`,
    [pool, address, worker, threads],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://mempool.space/api/address/${address}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        chain_stats: Chain;
        mempool_stats: Chain;
      };
      setChain(json.chain_stats);
      setMempool(json.mempool_stats);
      setError(null);
      setUpdatedAt(new Date().toLocaleTimeString("fr-FR"));
      onPaid((json.chain_stats.funded_txo_sum + json.mempool_stats.funded_txo_sum) / SATS);
    } catch (e) {
      setError(e instanceof Error ? e.message : "réseau indisponible");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 60_000);
    return () => clearInterval(i);
  }, [refresh]);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  const received = ((chain?.funded_txo_sum ?? 0) + (mempool?.funded_txo_sum ?? 0)) / SATS;
  const balance =
    ((chain?.funded_txo_sum ?? 0) -
      (chain?.spent_txo_sum ?? 0) +
      (mempool?.funded_txo_sum ?? 0) -
      (mempool?.spent_txo_sum ?? 0)) /
    SATS;
  const txCount = (chain?.tx_count ?? 0) + (mempool?.tx_count ?? 0);
  const progress = owed + received > 0 ? Math.min(100, (received / (owed + received)) * 100) : 0;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-mono text-xl font-bold">Payer la commission en minant (BTC réel)</h2>
        <p className="text-sm text-muted-foreground">
          Aucune simulation ici : le minage se fait avec votre propre matériel sur un pool réel,
          le payout est envoyé on-chain à l'adresse du site, et le solde ci-dessous est lu en
          direct sur la blockchain Bitcoin (mempool.space).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel glow space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Reste à payer
              </div>
              <div className="tabular font-mono text-lg font-bold text-warning">{fmtBtc(owed)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Reçu on-chain
              </div>
              <div className="tabular font-mono text-lg font-bold text-success">
                {fmtBtc(received)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Solde adresse
              </div>
              <div className="tabular font-mono text-sm">{fmtBtc(balance)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Transactions
              </div>
              <div className="tabular font-mono text-sm">{txCount}</div>
            </div>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={refresh}
              disabled={loading}
              className="btc-chip rounded-md px-5 py-2.5 font-mono text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "lecture blockchain…" : "↻ Rafraîchir on-chain"}
            </button>
            <a
              href={`https://mempool.space/address/${address}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              voir l'explorateur ↗
            </a>
          </div>

          <p className="font-mono text-[11px] text-muted-foreground">
            {error ? (
              <span className="text-destructive">erreur : {error}</span>
            ) : updatedAt ? (
              <>maj {updatedAt} · source mempool.space · auto toutes les 60 s</>
            ) : (
              "…"
            )}
          </p>

          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Threads dédiés · <span className="tabular font-mono text-primary">{threads}</span>
            </span>
            <input
              type="range"
              min={1}
              max={8}
              value={threads}
              onChange={(e) => setThreads(Number(e.target.value))}
              className="mt-1 w-full accent-primary"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {POOLS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPool(p.url)}
                title={p.note}
                className={`rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  pool === p.url
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.id}
              </button>
            ))}
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {POOLS.find((p) => p.url === pool)?.note}
          </p>
        </div>

        <div className="panel space-y-3 p-5">
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Minage réel vers l'adresse du site
          </h3>
          <p className="break-all font-mono text-[11px] text-accent">{address}</p>
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Nom du worker
            </span>
            <input
              value={worker}
              onChange={(e) => setWorker(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background/60 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary/60"
            />
          </label>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Commande (CPU / Termux / Linux)
            </span>
            <button
              onClick={() => copy(cmd, "cmd")}
              className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              {copied === "cmd" ? "copié ✓" : "copier"}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] leading-relaxed text-accent">
            {cmd}
          </pre>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              ASIC (Bitaxe / Antminer) — champs à saisir
            </span>
            <button
              onClick={() =>
                copy(`URL: ${pool}\nWorker: ${address}.${worker}\nPassword: x`, "asic")
              }
              className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              {copied === "asic" ? "copié ✓" : "copier"}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {`URL: ${pool}\nWorker: ${address}.${worker}\nPassword: x`}
          </pre>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Le payout du pool part directement vers cette adresse : dès qu'une transaction est
            diffusée, elle apparaît ci-contre (mempool puis confirmée). Un CPU/téléphone ne
            produit quasiment rien en SHA-256 : pour un revenu réel il faut un ASIC.
          </p>
        </div>
      </div>
    </section>
  );
}
