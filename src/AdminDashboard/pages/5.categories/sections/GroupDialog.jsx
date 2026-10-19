/* Shop By Group Dialog */
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import { cn } from "@/utils/cn";
import Toggle from "@/AdminDashboard/components/Toggle";

const KINDS = [
  { id: "tags", label: "Tags", hint: "Products can carry several, like Movement or Fit. It gets a filter and its own pages." },
  { id: "edits", label: "Edits", hint: "Curated links, like New or Size guide. Nothing to tag on products." },
];

/**
 * Add or edit a group. The kind is chosen once, when it is made; Category
 * is the shop's own group, so it only takes a new name and its switches.
 */
export default function GroupDialog({ value, onChange, onClose, onSave, saving }) {
  const g = value;
  // Changes one field of the group being edited.
  const set = (patch) => onChange({ ...g, ...patch });

  {/* Group Form: its name, its kind (chosen once), and where it shows */}
  return (
    <Modal
      isOpen={Boolean(g)}
      onClose={onClose}
      title={g?.id ? `Edit ${g.name}` : "New group"}
      footer={<div className="flex justify-end gap-2.5"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(g)} loading={saving} disabled={!g?.name.trim()}>Save</Button></div>}
    >
      {g && (
        <div className="grid gap-4">
          <Field label="Name" value={g.name} placeholder="Fit" onChange={(e) => set({ name: e.target.value })} autoFocus hint={`Shows as "${g.name || "Fit"}" in the Shop menu and the filters.`} />

          {/* Kind: only when making a new group; an existing group keeps the kind it was made with */}
          {!g.id && (
            <fieldset className="m-0 grid gap-2 border-0 p-0">
              <legend className="mb-1 text-sm font-semibold text-ink-2">Kind</legend>
              {KINDS.map((k) => (
                <label key={k.id} className={cn("flex cursor-pointer gap-3 rounded-r-md border p-3 transition-colors duration-150", g.kind === k.id ? "border-brand-300 bg-brand-50" : "border-line hover:bg-cream")}>
                  <input type="radio" name="group-kind" className="mt-1" checked={g.kind === k.id} onChange={() => set({ kind: k.id })} />
                  <span>
                    <strong className="block text-sm">{k.label}</strong>
                    <span className="text-[.82rem] text-ink-3">{k.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}

          {/* Where It Shows: the Shop menu, the filter drawer, and the shop at all */}
          <div className="grid gap-3 rounded-r-md bg-cream p-4">
            <Toggle checked={g.inMenu} onChange={(inMenu) => set({ inMenu })} label="Show in the Shop menu" hint="A column of its items, in this group's place." />
            <Toggle checked={g.inFilters} onChange={(inFilters) => set({ inFilters })} label="Show as a shop filter" hint={g.kind === "edits" ? "Its New, Best sellers, Sale and Kits items become choices in the Filter drawer. Order it under Filter and sort." : "A section of the Filter drawer. Order it under Filter and sort."} />
            {g.kind !== "category" && <Toggle checked={g.active} onChange={(active) => set({ active })} label="In the shop" hint="Off hides the whole group, its pages and links; products keep their tags." />}
          </div>
        </div>
      )}
    </Modal>
  );
}
