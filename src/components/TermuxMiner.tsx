import { useMemo, useState } from "react";

const STEPS = [
  { cmd: "pkg update -y && pkg upgrade -y", note: "Met Termux à jour" },
  { cmd: "pkg install -y git cmake clang libuv openssl", note: "Dépendances de compilation" },
  { cmd: "git clone https://github.com/xmrig/xmrig.git && cd xmrig", note: "Récupère le mineur" },
  { cmd: "mkdir build && cd build && cmake .. -DWITH_HWLOC=OFF && make -j$(nproc)", note: "Compile pour ARM" },
];

export function TermuxMiner() {
  const [wallet, setWallet] = useState("bc1qexempleadresseportefeuille0000000");
  const [pool, setPool] = useState("pool.minebot.example:3333");
  const [worker, setWorker] = useState("termux-01");
  const [threads, setThreads] = useState(4);
  const [copied, setCopied] = useState<string | null>(null);

  const runCmd = useMemo(
    () => `./xmrig -o ${pool} -u ${wallet} -p ${worker} -t ${threads} -k --tls`,
    [pool, wallet, worker, threads],
  );

  const script = useMemo(
    () =>
      [
        "#!/data/data/com.termux/files/usr/bin/bash",
        "# MineBot — script de minage Termux (Android)",
        "set -e",
        "termux-wake-lock",
        ...STEPS.map((s) => s.cmd),
        runCmd,
      ].join("\n"),
    [runCmd],
  );

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-mono text-xl font-bold">Miner depuis Termux</h2>
        <p className="text-sm text-muted-foreground">
          Générez votre commande de minage Android, puis collez-la dans Termux. Les gains simulés
          alimentent le portefeuille du bot d'achat.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel space-y-3 p-5">
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Configuration
          </h3>
          <Field label="Adresse bitcoin" value={wallet} onChange={setWallet} />
          <Field label="Pool" value={pool} onChange={setPool} />
          <Field label="Nom du worker" value={worker} onChange={setWorker} />
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Threads CPU · <span className="tabular font-mono text-primary">{threads}</span>
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
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Le minage sur téléphone chauffe l'appareil, use la batterie et rapporte très peu :
            à réserver aux tests. Utilisez <span className="font-mono text-accent">termux-wake-lock</span>{" "}
            pour éviter la mise en veille.
          </p>
        </div>

        <div className="panel space-y-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Commande de lancement
            </h3>
            <button
              onClick={() => copy(runCmd, "run")}
              className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              {copied === "run" ? "copié ✓" : "copier"}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] leading-relaxed text-accent">
            {runCmd}
          </pre>

          <div className="flex items-center justify-between gap-2 pt-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Script complet
            </h3>
            <button
              onClick={() => copy(script, "script")}
              className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              {copied === "script" ? "copié ✓" : "copier"}
            </button>
          </div>
          <pre className="max-h-52 overflow-auto rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {script}
          </pre>
        </div>
      </div>

      <ol className="grid gap-3 md:grid-cols-2">
        {STEPS.map((s, i) => (
          <li key={s.cmd} className="panel flex items-start gap-3 p-4">
            <span className="btc-chip mt-0.5 flex size-6 shrink-0 items-center justify-center rounded font-mono text-[11px] font-bold">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <code className="block overflow-x-auto whitespace-pre font-mono text-[11px] text-accent">
                {s.cmd}
              </code>
              <p className="mt-1 text-[11px] text-muted-foreground">{s.note}</p>
            </div>
            <button
              onClick={() => copy(s.cmd, s.cmd)}
              className="shrink-0 rounded border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {copied === s.cmd ? "✓" : "copier"}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-input bg-background/60 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary/60"
      />
    </label>
  );
}
