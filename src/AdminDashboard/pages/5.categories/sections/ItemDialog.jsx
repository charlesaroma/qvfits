/* Shop By Item Dialog */
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import ImageUploader from "@/AdminDashboard/components/ImageUploader";
import LinkPicker from "@/AdminDashboard/components/LinkPicker";
import Toggle from "@/AdminDashboard/components/Toggle";

/**
 * Add or edit one item of a group. A category or a tag has a picture and a
 * line that heads its shop page; its web address is made from its name. An
 * edit is a name and what it opens (New, Bras for running…).
 */
export default function ItemDialog({ dialog, onChange, onClose, onSave, saving }) {
  const group = dialog?.group;
  const x = dialog?.value;
  // Changes one field of the item being edited.
  const set = (patch) => onChange({ ...dialog, value: { ...x, ...patch } });

  {/* Item Form: an Edits item is a name and what it opens; a category or a tag also has a picture and a line for its page */}
  return (
    <Modal
      isOpen={Boolean(dialog)}
      onClose={onClose}
      title={x?.id ? `Edit ${x.name}` : `Add to ${group?.name ?? ""}`}
      footer={<div className="flex justify-end gap-2.5"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(dialog)} loading={saving} disabled={!x?.name.trim()}>Save</Button></div>}
    >
      {/* Edits Item: its link is picked, never typed */}
      {x && group.kind === "edits" && (
        <div className="grid gap-4">
          <Field label="Name" value={x.name} placeholder="New" onChange={(e) => set({ name: e.target.value })} autoFocus />
          <LinkPicker label="Shows" value={x} onChange={set} />
          <div className="grid gap-3 rounded-r-md bg-cream p-4">
            <Toggle checked={x.active} onChange={(active) => set({ active })} label="In the Shop menu" />
            <Toggle checked={Boolean(x.inHeader)} onChange={(inHeader) => set({ inHeader })} label="In the top bar" hint="A link after Shop in the header." />
          </div>
        </div>
      )}

      {/* Category Or Tag: its web address is made from its name */}
      {x && group.kind !== "edits" && (
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <ImageUploader single label="Picture" value={x.photo ? [x.photo] : []} onChange={(photos) => set({ image: photos[0] ?? null, photo: photos[0] ?? null })} />
          <div className="grid content-start gap-4">
            <Field label="Name" value={x.name} placeholder={group.kind === "category" ? "Bras" : "High support"} onChange={(e) => set({ name: e.target.value })} autoFocus />
          </div>
          <Field className="sm:col-span-2" label="Description" as="textarea" rows={2} value={x.description} onChange={(e) => set({ description: e.target.value })} hint="Heads its shop page, under the title." />
          <div className="grid gap-3 rounded-r-md bg-cream p-4 sm:col-span-2">
            <Toggle checked={x.active} onChange={(active) => set({ active })} label="Show in the shop" hint="Off hides its page, menu link and filter chip; products keep it." />
            {group.kind === "category" && <Toggle checked={Boolean(x.inHeader)} onChange={(inHeader) => set({ inHeader })} label="In the top bar" hint="A link after Shop in the header." />}
          </div>
        </div>
      )}
    </Modal>
  );
}
