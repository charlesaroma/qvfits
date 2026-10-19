/* Bag Empty */
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

// Points to new arrivals rather than the whole shop, as the bag drawer does.
export default function BagEmpty() {
  return (
    <div className="empty">
      <ShoppingBag className="mx-auto mb-2.5 h-5 w-5 text-brand-300" aria-hidden="true" />
      <h2>Your bag is empty</h2>
      <p className="lede center mt-2">Let&apos;s find your fit. The range is this way.</p>
      <Link className="btn btn--primary" to="/shop/new">Shop new</Link>
    </div>
  );
}
