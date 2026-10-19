/* Vee Settings */
import Field from "@/components/ui/Field";
import PageLoader from "@/components/ui/PageLoader";
import { useAdminAuth } from "@/store/context/AdminAuthContext";
import { settingsResource, useDocument } from "@/store/tanstackStore/queries/admin";
import Panel from "@/AdminDashboard/components/Panel";
import SaveBar from "@/AdminDashboard/components/SaveBar";
import TagInput from "@/AdminDashboard/components/TagInput";
import Toggle from "@/AdminDashboard/components/Toggle";
import { useDraft } from "@/AdminDashboard/lib/useDraft";
import { cn } from "@/utils/cn";

// How much personality she shows. The wit never appears in answers about money, sizes, delivery or problems.
const TONES = [
  { id: "playful", label: "Playful", text: "A joke or a playful line in most replies." },
  { id: "balanced", label: "Balanced", text: "A touch of wit now and then." },
  { id: "straight", label: "Straight", text: "Friendly and quick, no jokes." },
];

export default function VeeSettings() {
  const doc = useDocument(settingsResource);
  if (!doc.data) return <PageLoader variant="form" />;
  return <Editor doc={doc} />;
}

function Editor({ doc }) {
  const { can } = useAdminAuth();
  const canEdit = can("vee", "edit");
  // Only Vee's own settings are edited here, so a save never touches the rest of Settings.
  const { draft, set, dirty, reset, commit } = useDraft(doc.data.assistant);

  return (
    <>
      <fieldset disabled={!canEdit} className="m-0 grid gap-6 border-0 p-0">
        {/* The Assistant: on or off, her name and her greeting */}
        <Panel title="The assistant">
          <div className="grid gap-4">
            <Toggle checked={draft.enabled} onChange={(enabled) => set("enabled", enabled)} label="Showing on the shop" hint="Off removes her button from every page." />
            <Toggle
              checked={draft.whatsappHandover ?? true}
              onChange={(val) => set("whatsappHandover", val)}
              label="WhatsApp human handoff"
              hint="Shows a 'Talk to Human' WhatsApp button in Vee's chat header and when shoppers ask to speak to a person or when Vee is unsure."
            />
            <Field label="Name" className="max-w-xs" value={draft.name} onChange={(e) => set("name", e.target.value)} />
            <Field label="Greeting" as="textarea" rows={2} value={draft.greeting} onChange={(e) => set("greeting", e.target.value)} hint="Her first message. Once a shopper has told her their name she greets them by it instead." />
          </div>
        </Panel>
        {/* Personality: the tone dial */}
        <Panel title="Personality" hint="How funny she is. Serious topics (money, sizing, delivery, problems) are always plain, whatever you pick.">
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Tone">
            {TONES.map((t) => {
              const on = (draft.tone ?? "balanced") === t.id;
              return (
                <button key={t.id} type="button" role="radio" aria-checked={on} onClick={() => set("tone", t.id)}
                  className={cn("rounded-r-lg border p-4 text-left outline-none transition-[border-color,background-color] duration-200 focus-visible:ring-2 focus-visible:ring-brand-300", on ? "border-brand-500 bg-brand-50" : "border-line hover:border-brand-200")}>
                  <strong className="block font-display">{t.label}</strong>
                  <span className="mt-1 block text-[.82rem] text-ink-3">{t.text}</span>
                </button>
              );
            })}
          </div>
        </Panel>
        {/* Suggestion Buttons: the one-tap prompts under her greeting, with a picture of how they look */}
        <Panel title="Suggestion buttons" hint="Short prompts shown under her greeting, so a shopper can start with one tap instead of typing. Four to six work best.">
          <Field label="Buttons" hint="Type one and press Enter to add it. Tap the cross to remove.">{(id) => <TagInput id={id} value={draft.chips} onChange={(chips) => set("chips", chips)} placeholder="Type a suggestion, then press Enter" />}</Field>
          {/* How they look in the chat */}
          <div className="mt-4 rounded-r-md bg-cream px-4 py-4">
            <p className="m-0 mb-2 text-[.72rem] font-semibold uppercase tracking-[0.14em] text-ink-4">What shoppers see</p>
            <p className="m-0 mb-3 max-w-[46ch] rounded-r-md bg-white px-4 py-3 text-[.92rem] text-ink-2">{draft.greeting}</p>
            <div className="flex flex-wrap gap-2">
              {draft.chips.map((c) => <span key={c} className="rounded-full border border-line-2 bg-white px-4 py-2 text-[.85rem] font-medium">{c}</span>)}
              {!draft.chips.length && <span className="text-sm text-ink-4">No buttons yet. Shoppers will just see the greeting.</span>}
            </div>
          </div>
        </Panel>
      </fieldset>
      {/* Save Bar: shown only to someone who may edit */}
      {canEdit && <SaveBar dirty={dirty} saving={doc.isSaving} onReset={reset} onSave={async () => commit((await doc.save({ assistant: draft })).assistant)} />}
    </>
  );
}
