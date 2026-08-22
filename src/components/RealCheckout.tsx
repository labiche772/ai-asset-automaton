import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { useServerFn } from "@tanstack/react-start";
import { checkPayment } from "@/lib/btc.functions";

export type CheckoutItem = {
  id: string;
  kind: string;
  name: string;
  priceEur: number;
};

type Props = {
  item: CheckoutItem;
  address: string;
  commissionRate: number;
  priceEur: number; // cours BTC/EUR réel
  onClose: () => void;
  onPaid: (info: { txid: string; sats: number; feeSats: number }) => void;
};

const satsFromEur = (eur: number, btcEur: number) =>
  Math.round((eur / btcEur) * 1e8);

export function RealCheckout({
  item,
  address,
  commissionRate,
  priceEur,
  onClose,
  onPaid,
}: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "waiting" | "mempool" | "confirmed" | "error"
  >("waiting");
  const [txid, setTxid] = useState<string | null>(null);
  const [confirmations, setConfirmations] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [left, setLeft] = useState(15 * 60);
  const createdAt = useRef(Date.now());
  const notified = useRef(false);
  const check = useServerFn(checkPayment);

  // Montant unique en sats (offset aléatoire) pour identifier ce paiement.
  const { totalSats, feeSats, baseSats } = useMemo(() => {
    const base = satsFromEur(item.priceEur, priceEur);
    const fee = Math.max(1, Math.round(base * commissionRate));
    const offset = Math.floor(Math.random() * 900) + 1;
    return { baseSats: base, feeSats: fee, totalSats: base + fee + offset };
  }, [item.priceEur, priceEur, commissionRate]);

  const btcAmount = (totalSats / 1e8).toFixed(8);
  const uri = `bitcoin:${address}?amount=${btcAmount}&label=${encodeURIComponent(
    `${item.kind} ${item.name}`,
  )}`;

  useEffect(() => {
    QRCode.toDataURL(uri, {
      margin: 1,
      width: 260,
      color: { dark: "#f7931a", light: "#00000000" },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [uri]);

  useEffect(() => {
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const r = await check({
          data: { address, expectedSats: totalSats, createdAt: createdAt.current },
        });
        if (stop) return;
        if (r.paid) {
          setTxid(r.txid);
          setConfirmations(r.confirmations);
          setStatus(r.confirmations > 0 ? "confirmed" : "mempool");
          if (!notified.current && r.txid) {
            notified.current = true;
            onPaid({ txid: r.txid, sats: totalSats, feeSats });
          }
        }
      } catch {
        if (!stop) setStatus((s) => (s === "waiting" ? "error" : s));
      }
    };
    void poll();
    const i = setInterval(poll, 12_000);
    return () => {
      stop = true;
      clearInterval(i);
    };
  }, [address, totalSats, feeSats, check, onPaid]);

  const copy = async (value: string, tag: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(tag);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  const mmss = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(
    left % 60,
  ).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-background/85 p-4 backdrop-blur">
      <div className="panel glow w-full max-w-lg space-y-4 p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Paiement Bitcoin réel · on-chain
            </div>
            <h2 className="truncate font-mono text-base font-bold">
              {item.kind} · {item.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-md border border-border px-2 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            fermer
          </button>
        </div>

        <div className="flex flex-col items-center gap-3">
          {qr ? (
            <img
              src={qr}
              alt={`QR code de paiement Bitcoin de ${btcAmount} BTC`}
              className="rounded-md border border-border bg-secondary p-2"
              width={260}
              height={260}
            />
          ) : (
            <div className="size-[260px] animate-pulse rounded-md bg-secondary" />
          )}
          <div className="tabular text-center font-mono text-lg font-bold text-primary">
            ₿ {btcAmount}
          </div>
          <div className="text-center text-xs text-muted-foreground">
            {totalSats.toLocaleString("fr-FR")} sats · ≈{" "}
            {item.priceEur.toFixed(2)} € · expire dans{" "}
            <span className="tabular font-mono">{mmss}</span>
          </div>
        </div>

        <div className="space-y-2 rounded-md border border-border bg-secondary/50 p-3 font-mono text-[11px]">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Ressource</span>
            <span className="tabular">{baseSats.toLocaleString("fr-FR")} sats</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">
              Commission site {(commissionRate * 100).toFixed(0)} %
            </span>
            <span className="tabular text-accent">
              {feeSats.toLocaleString("fr-FR")} sats
            </span>
          </div>
          <div className="flex justify-between gap-2 border-t border-border pt-2">
            <span className="text-muted-foreground">Total exact à envoyer</span>
            <span className="tabular text-primary">
              {totalSats.toLocaleString("fr-FR")} sats
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="break-all rounded-md border border-border bg-background p-2 font-mono text-[11px] text-accent">
            {address}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => copy(address, "addr")}
              className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-xs font-semibold text-primary hover:bg-primary/20"
            >
              {copied === "addr" ? "copié ✓" : "copier l'adresse"}
            </button>
            <button
              onClick={() => copy(btcAmount, "amt")}
              className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              {copied === "amt" ? "copié ✓" : "copier le montant"}
            </button>
            <a
              href={uri}
              className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              ouvrir le portefeuille
            </a>
          </div>
        </div>

        <div
          className={`rounded-md border p-3 font-mono text-xs ${
            status === "confirmed"
              ? "border-success/40 bg-success/10 text-success"
              : status === "mempool"
                ? "border-warning/40 bg-warning/10 text-warning"
                : status === "error"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-border text-muted-foreground"
          }`}
        >
          {status === "waiting" && "⧗ en attente du paiement — vérification toutes les 12 s"}
          {status === "mempool" && "◐ paiement détecté dans le mempool — 0 confirmation"}
          {status === "confirmed" &&
            `✓ paiement confirmé (${confirmations} confirmation${confirmations > 1 ? "s" : ""})`}
          {status === "error" && "réseau indisponible — nouvelle tentative en cours"}
          {txid && (
            <a
              className="mt-2 block break-all underline"
              href={`https://mempool.space/tx/${txid}`}
              target="_blank"
              rel="noreferrer"
            >
              {txid}
            </a>
          )}
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Envoyez le montant <strong>exact</strong> en une seule transaction : il
          sert d'identifiant de commande. La livraison de la ressource est
          effectuée manuellement après confirmation.
        </p>
      </div>
    </div>
  );
}
