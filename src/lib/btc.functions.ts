import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MEMPOOL = "https://mempool.space/api";

export type BtcMarket = {
  priceEur: number;
  priceUsd: number;
  feeFastSatVb: number;
  feeMediumSatVb: number;
  blockHeight: number;
  fetchedAt: string;
};

/** Cours BTC + frais réseau réels (mempool.space, source publique). */
export const getBtcMarket = createServerFn({ method: "GET" }).handler(
  async (): Promise<BtcMarket> => {
    const [pricesRes, feesRes, tipRes] = await Promise.all([
      fetch(`${MEMPOOL}/v1/prices`),
      fetch(`${MEMPOOL}/v1/fees/recommended`),
      fetch(`${MEMPOOL}/blocks/tip/height`),
    ]);
    if (!pricesRes.ok || !feesRes.ok || !tipRes.ok) {
      throw new Error("Service de données Bitcoin indisponible");
    }
    const prices = (await pricesRes.json()) as { EUR: number; USD: number };
    const fees = (await feesRes.json()) as {
      fastestFee: number;
      halfHourFee: number;
    };
    const height = Number(await tipRes.text());
    return {
      priceEur: prices.EUR,
      priceUsd: prices.USD,
      feeFastSatVb: fees.fastestFee,
      feeMediumSatVb: fees.halfHourFee,
      blockHeight: height,
      fetchedAt: new Date().toISOString(),
    };
  },
);

export type AddressStats = {
  address: string;
  receivedSats: number;
  balanceSats: number;
  txCount: number;
  mempoolSats: number;
};

/** Solde réel on-chain de l'adresse de commission. */
export const getAddressStats = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ address: z.string().min(20) }).parse(d))
  .handler(async ({ data }): Promise<AddressStats> => {
    const res = await fetch(`${MEMPOOL}/address/${data.address}`);
    if (!res.ok) throw new Error("Adresse introuvable sur le réseau");
    const j = (await res.json()) as {
      chain_stats: {
        funded_txo_sum: number;
        spent_txo_sum: number;
        tx_count: number;
      };
      mempool_stats: { funded_txo_sum: number; spent_txo_sum: number };
    };
    return {
      address: data.address,
      receivedSats: j.chain_stats.funded_txo_sum,
      balanceSats: j.chain_stats.funded_txo_sum - j.chain_stats.spent_txo_sum,
      txCount: j.chain_stats.tx_count,
      mempoolSats:
        j.mempool_stats.funded_txo_sum - j.mempool_stats.spent_txo_sum,
    };
  });

export type PaymentStatus = {
  paid: boolean;
  confirmations: number;
  txid: string | null;
  receivedSats: number;
};

/**
 * Vérifie un paiement réel : cherche une sortie exacte (montant unique en sats)
 * vers l'adresse, dans le mempool ou confirmée.
 */
export const checkPayment = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        address: z.string().min(20),
        expectedSats: z.number().int().positive(),
        createdAt: z.number().int(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<PaymentStatus> => {
    const [tipRes, txsRes] = await Promise.all([
      fetch(`${MEMPOOL}/blocks/tip/height`),
      fetch(`${MEMPOOL}/address/${data.address}/txs`),
    ]);
    if (!txsRes.ok || !tipRes.ok) {
      return { paid: false, confirmations: 0, txid: null, receivedSats: 0 };
    }
    const tip = Number(await tipRes.text());
    const txs = (await txsRes.json()) as Array<{
      txid: string;
      status: { confirmed: boolean; block_height?: number; block_time?: number };
      vout: Array<{ scriptpubkey_address?: string; value: number }>;
      firstSeen?: number;
    }>;

    for (const tx of txs) {
      const seen = tx.status.block_time ? tx.status.block_time * 1000 : Date.now();
      if (tx.status.confirmed && seen < data.createdAt - 60_000) continue;
      const out = tx.vout.find(
        (v) =>
          v.scriptpubkey_address === data.address && v.value === data.expectedSats,
      );
      if (out) {
        const confirmations =
          tx.status.confirmed && tx.status.block_height
            ? tip - tx.status.block_height + 1
            : 0;
        return {
          paid: true,
          confirmations,
          txid: tx.txid,
          receivedSats: out.value,
        };
      }
    }
    return { paid: false, confirmations: 0, txid: null, receivedSats: 0 };
  });
