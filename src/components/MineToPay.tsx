import { useEffect, useMemo, useState } from "react";

const fmtBtc = (n: number) => `₿ ${n.toFixed(8)}`;

const POOLS = [
  { id: "ckpool", label: "solo.ckpool.org:3333", note: "solo BTC · payout direct" },
  { id: "public-pool", label: "public-pool.io:21496", note: "mini-pool BTC · faible difficulté" },
  { id: "nicehash", label: "sha256.auto.nicehash.com:9200", note: "hashrate loué · payout BTC" },
];

export function MineToPay({
  address,
  owed,
  onMined,
}: {
  address: string;
  owed: number;
  onMined: (amount: number) => void;
}) {
  const [mining, setMining] = useState(false);
  const [pool, setPool] = useState(POOLS[0]!.label);
  const [worker, setWorker] = useState("payeur-01");
  const [threads, setThreads] = useState(4);
  const [hashrate, setHashrate] = useState(0);
  const [paid, setPaid] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  const cmd = useMemo(
    () =>
      `./cpuminer-multi -a sha256d -o stratum+tcp://${pool} -u ${address}.${worker} -p x -t ${threads}`,
    [pool, address, worker, threads],
  );

  useEffect(() => {
    if (!mining) {
      setHashrate(0);
      return;
    }
    const i = setInterval(() => {
      const hs = Math.round(threads * (28 + Math.random() * 14));
      setHashrate(hs);
      const mined = hs * 2e-10;
      setPaid((p) => p + mined);
      onMined(mined);
    }, 1200);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mining, threads]);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  const progress = owed + paid > 0 ? Math.min(100, (paid / (owed + paid)) * 100) : 0;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-mono text-xl font-bold">Payer la commission en minant</h2>
        <p className="text-sm text-muted-foreground">
          Au lieu d'envoyer un virement, dirigez votre hashrate vers l'adresse du site : chaque
          part minée réduit la commission de 1 % que vous devez.
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
                Payé par minage
              </div>
              <div className="tabular font-mono text-lg font-bold text-success">{fmtBtc(paid)}</div>
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
              onClick={() => setMining((m) => !m)}
              className={`rounded-md px-5 py-2.5 font-mono text-sm font-bold transition-colors ${
                mining
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "btc-chip hover:opacity-90"
              }`}
            >
              {mining ? "■ Arrêter le minage" : "▶ Miner pour payer"}
            </button>
            <span className="tabular flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span
                className={`size-2 rounded-full ${mining ? "bg-success animate-pulse-dot" : "bg-muted-foreground"}`}
              />
              {hashrate} kH/s
            </span>
          </div>

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
                onClick={() => setPool(p.label)}
                title={p.note}
                className={`rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  pool === p.label
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.id}
              </button>
            ))}
          </div>
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
              Commande (Termux / Linux)
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
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Le payout du pool va directement à l'adresse du site : la commission est réglée sans
            transaction manuelle. Le compteur ci-contre est une simulation locale.
          </p>
        </div>
      </div>
    </section>
  );
}
