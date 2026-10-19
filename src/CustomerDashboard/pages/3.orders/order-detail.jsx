import { Link, useParams } from "react-router-dom";
import { Check } from "lucide-react";

import PageLoader from "@/components/ui/PageLoader";
import StatusChip from "@/components/ui/StatusChip";
import { useCurrency } from "@/store/context/CurrencyContext";
import { useCustomerAuth } from "@/store/context/CustomerAuthContext";
import { useCancelMyOrder, useMyOrder } from "@/store/tanstackStore/queries/account";
import { useSettings } from "@/store/tanstackStore/queries/site";
import PaymentDue from "@/components/storefront/PaymentDue";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { whatsappLink } from "@/utils/whatsapp";
import { formatDate } from "@/utils/format";
import ReturnRequest from "./ReturnRequest";

const STEPS = [
  { id: "pending", label: "Placed" },
  { id: "paid", label: "Confirmed" },
  { id: "packed", label: "Packed" },
  { id: "out_for_delivery", label: "On the way" },
  { id: "delivered", label: "Delivered" },
];
const ORDER_PROGRESS = { pending: 0, paid: 1, packed: 2, out_for_delivery: 3, delivered: 4 };

// Orders are quoted in UGX whatever currency the shop is shown in.
export default function AccountOrderDetail() {
  const { id } = useParams();
  const { customer } = useCustomerAuth();
  const { data: order, isLoading, error } = useMyOrder(customer.id, id);
  const { data: settings } = useSettings();
  const { moneyBase } = useCurrency();
  const cancel = useCancelMyOrder(customer.id);

  if (isLoading) return <PageLoader variant="form" />;
  // Another shopper's id or a stale link lands here too, not on a crash.
  if (error || !order) return <p className="text-ink-3">We couldn&apos;t find that order. <Link to="/account/orders" className="link-arrow">All orders</Link></p>;

  const activeIndex = ORDER_PROGRESS[order.status] ?? (order.status === "cancelled" || order.status === "refunded" ? -1 : 0);
  const isSpecial = order.status === "cancelled" || order.status === "refunded";

  return (
    <div className="rounded-r-lg bg-white p-6 shadow-sh-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[1.3rem]">Order {order.ref}</h2>
        <StatusChip status={order.status} />
      </div>
      <p className="mt-1 text-sm text-ink-3">Placed {formatDate(order.createdAt)}</p>

      {/* Visual Order Progress Timeline */}
      {!isSpecial && (
        <div className="my-6 rounded-r-lg border border-line-2 bg-cream/40 p-4" aria-label="Order progress">
          <div className="relative flex justify-between">
            {/* Connecting line */}
            <div className="absolute top-3 left-4 right-4 h-0.5 -translate-y-1/2 bg-line" aria-hidden="true">
              <div
                className="h-full bg-brand-500 transition-all duration-500"
                style={{ width: `${(activeIndex / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
            {STEPS.map((step, idx) => {
              const done = idx < activeIndex;
              const current = idx === activeIndex;
              return (
                <div key={step.id} className="relative z-1 flex flex-col items-center">
                  <div
                    className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold transition-all ${
                      done
                        ? "bg-brand-500 text-white"
                        : current
                        ? "border-2 border-brand-500 bg-white text-brand-600 shadow-sm"
                        : "border border-line bg-white text-ink-4"
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" /> : idx + 1}
                  </div>
                  <span
                    className={`mt-1.5 text-center text-[11px] sm:text-xs ${
                      current ? "font-bold text-brand-600" : done ? "font-medium text-ink" : "text-ink-4"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Lines: one row per product, size and colour. */}
      <ul className="mt-4 list-none p-0">
        {order.lines.map((l) => (
          <li key={`${l.productId}-${l.size}-${l.color}`} className="flex justify-between border-b border-line py-3">
            <span>{l.name} <small className="text-ink-3">· {l.color} · {l.size} · ×{l.qty}</small></span>
            <span>{moneyBase(l.price * l.qty)}</span>
          </li>
        ))}
      </ul>

      {/* Totals */}
      <dl className="mt-4 grid grid-cols-[1fr_auto] gap-1 text-[.95rem]">
        {order.kitSaving > 0 && <><dt>Kit saving</dt><dd className="m-0 text-right">−{moneyBase(order.kitSaving)}</dd></>}
        <dt>Delivery</dt><dd className="m-0 text-right">{moneyBase(order.delivery)}</dd>
        {order.discount > 0 && <><dt>Discount</dt><dd className="m-0 text-right">−{moneyBase(order.discount)}</dd></>}
        <dt className="font-semibold">Total</dt><dd className="m-0 text-right font-semibold">{moneyBase(order.total)}</dd>
      </dl>

      <PaymentDue order={order} onCancel={() => cancel.mutate(order.id)} cancelling={cancel.isPending} />
      {cancel.error && <p role="alert" className="m-0 mt-2 text-sm font-semibold text-warn">{cancel.error.message}</p>}
      <ReturnRequest order={order} customerId={customer.id} />

      {/* Dedicated WhatsApp Order Support Box */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-r-lg border border-[#c9eed3] bg-[#f4faf5] p-4">
        <div>
          <strong className="block text-sm font-semibold text-ink">Have a question about this order?</strong>
          <p className="m-0 text-xs text-ink-3">Our Kampala studio team replies on WhatsApp for timing, changes or delivery help.</p>
        </div>
        <a
          href={whatsappLink(settings?.whatsapp || "256758981959", `Hi QV team, I have a question about my order ${order.ref}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-105"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
