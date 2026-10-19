/* Mobile Menu Shop */
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Flame, Layers, LayoutGrid, Plus, Ruler, Scissors, Shirt, Sparkles, Tag } from "lucide-react";

import { useNavigation } from "@/store/tanstackStore/queries/site";
import { cn } from "@/utils/cn";

// A small icon for each group heading and for the "edits" shortcuts, picked by name.
// Anything unknown falls back to a tag, so a group the admin adds still gets one.
const GROUP_ICON = { category: Shirt, movement: Activity, edits: Sparkles, fabric: Scissors };
const LINK_ICON = { "shop everything": LayoutGrid, "new": Sparkles, "best sellers": Flame, "shop the kit": Layers, "size guide": Ruler };

// "Shop" opens in place with the same groups as the desktop mega menu. Each
// group is a title and a wrap of pills, so a long list reads as a cloud to
// scan, not a wall of text; the shortcut group (edits) carries icons.
export default function MobileMenuShop() {
  const [open, setOpen] = useState(false);
  const { data: nav } = useNavigation();
  const id = useId();

  return (
    <div>
      <button type="button" className="mmenu__link" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        Shop
        <Plus className={cn("h-5 w-5 transition-transform duration-300", open && "rotate-45")} aria-hidden="true" />
      </button>
      {open && (
        <div id={id} className="mmenu__shop">
          {nav?.shopMenu.columns.map((c) => {
            const GroupIcon = GROUP_ICON[c.title.toLowerCase()] ?? Tag;
            return (
              <section key={c.id} aria-label={c.title}>
                <h3 className="mmenu__group"><GroupIcon className="h-4 w-4" aria-hidden="true" />{c.title}</h3>
                <div className="mmenu__pills">
                  {c.links.map((l) => {
                    const LinkIcon = LINK_ICON[l.title.toLowerCase()];
                    return (
                      <Link key={l.id} to={l.href} className="mmenu__pill">
                        {LinkIcon && <LinkIcon className="h-4 w-4" aria-hidden="true" />}
                        {l.title}
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
