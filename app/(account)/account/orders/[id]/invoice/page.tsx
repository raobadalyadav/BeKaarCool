"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import * as invoiceApi from "@/lib/api/invoice";
import { minorToRupees } from "@/lib/api/config";

const fmt = (s: string) =>
  `₹${minorToRupees(s).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

export default function InvoicePage() {
  const params = useParams();
  const orderNumber = params.id as string;
  const [doc, setDoc] = useState<invoiceApi.InvoiceDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setDoc(await invoiceApi.orderInvoice(orderNumber));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load invoice");
      }
    })();
  }, [orderNumber]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl text-center">
        <p className="text-red-600">{error}</p>
        <Link
          href={`/account/orders/${orderNumber}`}
          className="text-yellow-600 underline mt-4 inline-block"
        >
          ← Back to order
        </Link>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link
          href={`/account/orders/${orderNumber}`}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to order
        </Link>
        <Button onClick={() => window.print()} variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="bg-white border rounded-lg p-8 print:border-0 print:p-0">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Tax Invoice</h1>
            <p className="text-sm text-gray-500 mt-1">
              Invoice for order{" "}
              <span className="font-mono">{doc.orderNumber}</span>
            </p>
            <p className="text-sm text-gray-500">
              Date: {fmtDate(doc.placedAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold">{doc.sellerName}</p>
            <p className="text-xs text-gray-500 max-w-[200px]">
              {doc.sellerAddress}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              GSTIN: <span className="font-mono">{doc.sellerGstin}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase mb-1">Bill to</p>
            <p className="font-bold">{doc.buyerName}</p>
            <p className="text-gray-600">{doc.buyerAddress}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase mb-1">Place of supply</p>
            <p className="font-bold">{doc.buyerState}</p>
            <p className="text-gray-600">
              {doc.intraState ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)"}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-semibold">Item</th>
                <th className="text-left p-2 font-semibold">HSN</th>
                <th className="text-right p-2 font-semibold">Qty</th>
                <th className="text-right p-2 font-semibold">Taxable</th>
                <th className="text-right p-2 font-semibold">GST</th>
                <th className="text-right p-2 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {doc.lines.map((l, i) => {
                const gst =
                  BigInt(l.cgstMinor) + BigInt(l.sgstMinor) + BigInt(l.igstMinor);
                return (
                  <tr key={i} className="border-b">
                    <td className="p-2">{l.description}</td>
                    <td className="p-2 font-mono text-xs">{l.hsn}</td>
                    <td className="p-2 text-right">{l.quantity}</td>
                    <td className="p-2 text-right">{fmt(l.taxableMinor)}</td>
                    <td className="p-2 text-right">
                      {fmt(gst.toString())}{" "}
                      <span className="text-xs text-gray-500">
                        ({(l.taxRateBps / 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="p-2 text-right font-semibold">
                      {fmt(l.totalMinor)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6">
          <div className="w-full sm:w-1/2 space-y-1 text-sm">
            <Row label="Subtotal (taxable)" value={fmt(doc.subtotalMinor)} />
            {doc.intraState ? (
              <>
                <Row label="CGST" value={fmt(doc.cgstTotalMinor)} />
                <Row label="SGST" value={fmt(doc.sgstTotalMinor)} />
              </>
            ) : (
              <Row label="IGST" value={fmt(doc.igstTotalMinor)} />
            )}
            <Row label="Shipping" value={fmt(doc.shippingMinor)} />
            {BigInt(doc.discountMinor) > BigInt(0) && (
              <Row
                label="Discount"
                value={`− ${fmt(doc.discountMinor)}`}
                className="text-green-700"
              />
            )}
            <div className="border-t pt-2 mt-2">
              <Row
                label="Grand total"
                value={fmt(doc.grandTotalMinor)}
                className="font-bold text-base"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-xs text-gray-500 grid grid-cols-2 gap-4">
          <div>
            <p>
              <strong>Payment:</strong>{" "}
              {doc.paymentMethod.toUpperCase()} — {doc.paymentStatus}
            </p>
          </div>
          <div className="text-right">
            <p>This is a computer-generated invoice.</p>
            <p>Subject to {doc.sellerState} jurisdiction.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex justify-between ${className}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
