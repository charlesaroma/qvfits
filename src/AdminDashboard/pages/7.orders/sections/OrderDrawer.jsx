/* Order Drawer */
import { useState } from "react";
import { MessageCircle, Printer } from "lucide-react";

import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import StatusChip from "@/components/ui/StatusChip";
import { useAdminAuth } from "@/store/context/AdminAuthContext";
import { useCurrency } from "@/store/context/CurrencyContext";
import { NEXT_STATUS, transactionsResource, useAddOrderNote, useCollection, useMarkOrderPaid, useOrderEmails, useReturns, useUpdateOrderStatus } from "@/store/tanstackStore/queries/admin";
import { formatDateTime } from "@/utils/format";
import { statusLabel } from "@/utils/orderStatus";
import { whatsappLink } from "@/utils/whatsapp";
import Drawer from "@/AdminDashboard/components/Drawer";
import { printOrder } from "./printInvoice";
import OpenReturn from "./OpenReturn";

const SOURCE = { web: "From the shop", showroom: "Showroom sale", whatsapp: "WhatsApp sale", manual: "Entered by staff" };

/**
 * One order: what was bought, where it goes, the money, and its timeline.
 * The buttons offer only the next sensible steps (paid, packed, out for
 * delivery, delivered, or cancel), and every step is logged with who did it.
 */
export default function OrderDrawer({ order, settings, methods, onClose }) {
  const { can } = useAdminAuth();
  const { moneyBase } = useCurrency();
  const status = useUpdateOrderStatus();
  const markPaid = useMarkOrderPaid();
  const addNote = useAddOrderNote();
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState({ method: order?.payment ?? "mtn", reference: "", amount: "" });
  const [returning, setReturning] = useState(false);
  const txns = useCollection(transactionsResource).items.filter((t) => t.orderId === order?.id);
  const { data: allReturns = [] } = useReturns();
  const { data: emails = [] } = useOrderEmails(order?.ref);
  if (!order) return null;

  const canEdit = can("orders", "edit");
  const canPay = can("orders", "payment");
  const paid = txns.filter((t) => t.type === "payment" && t.status === "succeeded").reduce((n, t) => n + t.amount, 0);
  const refunded = txns.filter((t) => t.type === "refund" && t.status === "succeeded").reduce((n, t) => n + t.amount, 0);
  const due = Math.max(0, order.total - paid);
  const returns = allReturns.filter((r) => r.orderId === order.id);
  const openReturnAllowed = canEdit && ["delivered", "exchanged"].includes(order.status) && !returns.some((r) => !["rejected", "refunded", "exchanged"].includes(r.status));
  const zone = settings?.zones?.find((z) => z.id === order.region);
  const zoneName = zone?.name ?? order.region;
  const method = methods.find((m) => m.id === order.payment)?.label ?? order.payment;
  // Marking paid records money, so only staff who may record payments see it.
  const next = (NEXT_STATUS[order.status] ?? []).filter((s) => s !== "paid" || canPay);
  // An unpaid order holds its pieces for a while, then cancels itself (gap S1).
  const holdUntil = order.status === "pending" && order.paymentStatus === "unpaid" ? Date.parse(order.createdAt) + (settings?.unpaidHoldHours ?? 48) * 3_600_000 : null;

  return (
    <Drawer
      open
      onClose={onClose}
      wide
      title={`Order ${order.ref}`}
      subtitle={`${formatDateTime(order.createdAt)} · ${SOURCE[order.source ?? "web"] ?? "From the shop"}`}
      footer={
        <>
          <Button variant="ghost" onClick={() => printOrder(order, { settings, moneyBase, zoneName, slip: true })}><Printer className="h-4 w-4" /> Packing slip</Button>
          <Button variant="ghost" onClick={() => printOrder(order, { settings, moneyBase, zoneName })}><Printer className="h-4 w-4" /> Invoice</Button>
        </>
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StatusChip status={order.status} />
        {/* Payment status only when it says something the order status doesn't (Paid and Paid is one fact) */}
        {order.paymentStatus !== order.status && <StatusChip status={order.paymentStatus} />}
      </div>

      {/* Move it on */}
      {canEdit && next.length > 0 && (
        <section className="mb-6 rounded-r-md bg-white p-4 shadow-sh-1">
          <p className="mt-0 mb-3 text-sm font-semibold">Next step</p>
          <div className="flex flex-wrap gap-2">
            {next.map((s) => (
              <Button key={s} variant={s === "cancelled" ? "danger" : "primary"} loading={status.isPending && status.variables?.status === s}
                onClick={() => status.mutate({ id: order.id, status: s })}>
                {s === "cancelled" ? "Cancel order" : `Mark ${statusLabel(s).toLowerCase()}`}
              </Button>
            ))}
          </div>
          {next.includes("cancelled") && <p className="mt-2 mb-0 text-xs text-ink-3">Cancelling puts the pieces back in stock.</p>}
        </section>
      )}

      {/* Lines and totals */}
      <section className="mb-6">
        <h3 className="mb-2 text-base">Items</h3>
        <ul className="m-0 list-none p-0">
          {order.lines.map((l) => (
            <li key={`${l.productId}-${l.color}-${l.size}`} className="flex justify-between gap-3 border-b border-line py-2 text-sm">
              <span>{l.name} <span className="text-ink-3">· {l.color} · {l.size} · ×{l.qty}</span></span>
              <span>{moneyBase(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 grid grid-cols-[1fr_auto] gap-1 text-sm">
          <dt>Subtotal</dt><dd className="m-0 text-right">{moneyBase(order.subtotal)}</dd>
          {order.kitSaving > 0 && <><dt>Kit saving</dt><dd className="m-0 text-right">-{moneyBase(order.kitSaving)}</dd></>}
          {order.discount > 0 && <><dt>Discount{order.discountCode && ` (${order.discountCode})`}</dt><dd className="m-0 text-right">-{moneyBase(order.discount)}</dd></>}
          <dt>Delivery ({zoneName})</dt><dd className="m-0 text-right">{order.delivery ? moneyBase(order.delivery) : "Free"}</dd>
          <dt className="font-semibold">Total</dt><dd className="m-0 text-right font-semibold">{moneyBase(order.total)}</dd>
        </dl>
      </section>

      {/* Customer */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-1 text-base">Customer</h3>
          <p className="m-0 text-sm">{order.name}<br />{order.phone}{order.email && <><br />{order.email}</>}</p>
          <a className="btn btn--soft mt-2 min-h-9 px-3 text-xs" href={whatsappLink(order.phone.replace(/\D/g, "").replace(/^0/, "256"), `Hi ${order.name.split(" ")[0]}, this is QVFITS about your order ${order.ref}.`)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" /> WhatsApp them
          </a>
        </div>
        <div>
          <h3 className="mb-1 text-base">{zone?.collect ? "Collection" : "Delivery"}</h3>
          <p className="m-0 text-sm">{zoneName}{order.address && <><br />{order.address}</>}</p>
          {order.note && <p className="mt-2 mb-0 text-sm text-ink-3">“{order.note}”</p>}
        </div>
      </section>

      {/* Payment: what came in against this order, and anything still due */}
      <section className="mb-6">
        <h3 className="mb-1 text-base">Payment</h3>
        <p className="m-0 text-sm">
          {method} · {statusLabel(order.paymentStatus)}
          {due > 0 && order.status !== "cancelled" && <> · <strong className="text-warn">{moneyBase(due)} due</strong></>}
        </p>
        {holdUntil && <p className="m-0 mt-1 text-xs text-ink-3">Pieces held until {formatDateTime(new Date(holdUntil).toISOString())}. Unpaid by then, it cancels itself and the stock comes back.</p>}
        {txns.length > 0 && (
          <ul className="m-0 mt-3 grid list-none gap-1.5 p-0">
            {txns.map((t) => (
              <li key={t.id} className="flex justify-between gap-3 rounded-r-md bg-white px-3 py-2 text-sm shadow-sh-1">
                <span>{t.type === "refund" ? "Refund" : "Payment"} · {methods.find((m) => m.id === t.method)?.label ?? t.method}{t.reference && <span className="text-ink-3"> · {t.reference}</span>}<span className="block text-xs text-ink-3">{formatDateTime(t.createdAt)}</span></span>
                <strong className={t.type === "refund" ? "text-warn" : ""}>{t.type === "refund" ? "-" : ""}{moneyBase(t.amount)}</strong>
              </li>
            ))}
            {refunded > 0 && <li className="text-right text-xs text-ink-3">Kept after refunds: {moneyBase(paid - refunded)}</li>}
          </ul>
        )}
        {canPay && due > 0 && order.status !== "cancelled" && (
          <div className="mt-3 grid gap-3 rounded-r-md bg-white p-4 shadow-sh-1 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
            <Field label="Paid by" options={[{ value: "cash", label: "Cash" }, ...methods.map((m) => ({ value: m.id, label: m.label }))]} value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })} />
            <Field label="Amount (UGX)" inputMode="numeric" value={payment.amount} placeholder={String(due)} onChange={(e) => setPayment({ ...payment, amount: e.target.value.replace(/\D/g, "") })} hint="Leave empty for the full balance." />
            <Field label="Reference" value={payment.reference} onChange={(e) => setPayment({ ...payment, reference: e.target.value })} placeholder="Mobile money ID" />
            <Button loading={markPaid.isPending} onClick={() => markPaid.mutateAsync({ id: order.id, method: payment.method, reference: payment.reference, amount: payment.amount ? Number(payment.amount) : undefined }).then(() => setPayment({ ...payment, amount: "", reference: "" })).catch(() => {})}>Record payment</Button>
          </div>
        )}
      </section>

      {/* Returns on this order */}
      {(returns.length > 0 || openReturnAllowed) && (
        <section className="mb-6">
          <h3 className="mb-2 text-base">Returns</h3>
          {returns.map((r) => (
            <p key={r.id} className="m-0 mb-1.5 flex flex-wrap items-center gap-2 text-sm">
              <StatusChip status={r.status} /> {r.lines.reduce((n, l) => n + l.qty, 0)} pieces, for {r.resolution} · {r.reason}
            </p>
          ))}
          {openReturnAllowed && !returning && <Button variant="soft" onClick={() => setReturning(true)}>Open a return</Button>}
          {returning && <OpenReturn order={order} onDone={() => setReturning(false)} />}
        </section>
      )}

      {/* What the customer was told, and a WhatsApp copy for staff to send (gap O4) */}
      {emails.length > 0 && (
        <section className="mb-6">
          <h3 className="mb-2 text-base">Messages sent</h3>
          <ul className="m-0 grid list-none gap-1.5 p-0">
            {emails.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-3 rounded-r-md bg-white px-3 py-2 text-sm shadow-sh-1">
                <span>
                  <strong className="font-semibold">{m.subject}</strong>
                  <span className="block text-ink-3">{m.body}</span>
                  <span className="block text-xs text-ink-3">To {m.to} · {formatDateTime(m.createdAt)}</span>
                </span>
                {order.phone && (
                  <a className="inline-flex min-h-9 shrink-0 items-center gap-1 text-xs font-semibold text-brand-600" href={whatsappLink(order.phone.replace(/\D/g, "").replace(/^0/, "256"), `Hi ${order.name.split(" ")[0]}, ${m.body}`)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> WhatsApp
                  </a>
                )}
              </li>
            ))}
          </ul>
          <p className="m-0 mt-1.5 text-xs text-ink-3">Emails wait in Newsletter, Outbox until an email service is connected.</p>
        </section>
      )}

      {/* Timeline */}
      <section className="mb-6">
        <h3 className="mb-2 text-base">Timeline</h3>
        <ol className="m-0 grid list-none gap-2 border-l-2 border-brand-100 p-0 pl-4">
          {[...order.history].reverse().map((h, i) => (
            <li key={i} className="text-sm">
              <strong>{statusLabel(h.status)}</strong> <span className="text-ink-3">· {h.by} · {formatDateTime(h.at)}</span>
              {h.note && <p className="m-0 text-ink-3">{h.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      {/* Notes */}
      <section>
        <h3 className="mb-2 text-base">Staff notes</h3>
        {order.notes.length > 0 && (
          <ul className="m-0 mb-3 grid list-none gap-2 p-0">
            {order.notes.map((n) => <li key={n.id} className="rounded-r-md bg-white p-3 text-sm shadow-sh-1">{n.text}<p className="m-0 mt-1 text-xs text-ink-3">{n.by} · {formatDateTime(n.at)}</p></li>)}
          </ul>
        )}
        {canEdit && (
          <div className="flex gap-2">
            <input className="input flex-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only staff see this" aria-label="New note" />
            <Button variant="soft" disabled={!note.trim()} loading={addNote.isPending} onClick={() => addNote.mutateAsync({ id: order.id, text: note }).then(() => setNote(""))}>Add</Button>
          </div>
        )}
      </section>
    </Drawer>
  );
}
