/* Shop By Groups */
import { useState } from "react";
import { Plus } from "lucide-react";

import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import PageLoader from "@/components/ui/PageLoader";
import { useAdminAuth } from "@/store/context/AdminAuthContext";
import {
  categoriesResource,
  groupsResource,
  productsResource,
  termsResource,
  useCollection,
  useReassignCategory,
} from "@/store/tanstackStore/queries/admin";
import { targetHref } from "@/utils/shopTargets";
import PageHeader from "@/AdminDashboard/components/PageHeader";
import GroupCard from "./GroupCard";
import GroupDialog from "./GroupDialog";
import ItemDialog from "./ItemDialog";

/**
 * The storefront's "Shop by" groups and their items, one card each, in the
 * order the Shop menu shows them. Category is the shop's own group (a
 * product has one); the others are tags (a product can have several) or
 * edits (curated links such as New). Any group can be added.
 */
export default function ShopBy() {
  const groups = useCollection(groupsResource);
  const categories = useCollection(categoriesResource);
  const terms = useCollection(termsResource);
  const products = useCollection(productsResource);
  const reassign = useReassignCategory();
  const { can } = useAdminAuth();
  const canEdit = can("categories", "edit");
  const canDelete = can("categories", "delete");

  const [groupDialog, setGroupDialog] = useState(null);
  const [itemDialog, setItemDialog] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [moveTo, setMoveTo] = useState("");

  if (groups.isLoading || categories.isLoading || terms.isLoading) return <PageLoader variant="list" />;

  // What the address builders need to turn an item into its shop address.
  const lookup = { groups: groups.items, categories: categories.items, terms: terms.items, products: products.items };
  // Categories live in their own table; the items of every other group share one.
  const tableOf = (g) => (g.kind === "category" ? categories : terms);
  const itemsOf = (g) => (g.kind === "category" ? categories.items : terms.items.filter((t) => t.groupId === g.id));
  const countOf = (g, x) =>
    g.kind === "category" ? products.items.filter((p) => p.categoryId === x.id).length
      : g.kind === "tags" ? products.items.filter((p) => p.termIds.includes(x.id)).length
        : null;
  const pathOf = (g, x) =>
    targetHref(g.kind === "category" ? { categories: [x.id] } : g.kind === "tags" ? { terms: [x.id] } : x.target ?? {}, lookup);

  // Moves an item (or a group) one place and saves the new order.
  const reorder = (table, list, i, by) => {
    const ids = list.map((x) => x.id);
    const [id] = ids.splice(i, 1);
    ids.splice(i + by, 0, id);
    table.reorder(ids);
  };

  // Saves a new group or the edits to one.
  const saveGroup = async (data) => {
    if (data.id) await groups.update(data.id, data);
    else await groups.create(data);
    setGroupDialog(null);
  };

  // Saves a new item or the edits to one. The photo is a view field, so only the stored picture goes back.
  const saveItem = async ({ group, value }) => {
    // The view carries the resolved photo; only the stored picture is saved.
    const { photo: _photo, ...data } = value;
    const table = tableOf(group);
    if (data.id) await table.update(data.id, data);
    else await table.create(group.kind === "category" ? data : { ...data, groupId: group.id });
    setItemDialog(null);
  };

  // Deleting a category with products moves them to the one chosen first; the service refuses anything still in use.
  const remove = async () => {
    const { group, item } = removing;
    if (!item) await groups.remove(group.id);
    else {
      if (group.kind === "category" && countOf(group, item) && moveTo) await reassign.mutateAsync({ from: item.id, to: moveTo });
      await tableOf(group).remove(item.id);
    }
    setRemoving(null);
    setMoveTo("");
  };

  const removingCount = removing?.item ? countOf(removing.group, removing.item) : 0;

  return (
    <>
      {/* Page Header */}
      <PageHeader
        lede="Each group is a way into the shop: a column in the Shop menu, a filter and its own addresses, made from the names. Products pick their category and tags on the product form."
        action={canEdit && <Button onClick={() => setGroupDialog({ name: "", kind: "tags", inMenu: true, inFilters: true, active: true })}><Plus className="h-4 w-4" aria-hidden="true" /> Add group</Button>}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
        {/* Groups: one card each, in the order the Shop menu shows them */}
        {groups.items.map((g, i) => (
          <GroupCard
            key={g.id}
            group={g}
            items={itemsOf(g)}
            countOf={(x) => countOf(g, x)}
            pathOf={(x) => pathOf(g, x)}
            canEdit={canEdit}
            canDelete={canDelete}
            first={i === 0}
            last={i === groups.items.length - 1}
            onMove={(by) => reorder(groups, groups.items, i, by)}
            onToggle={(patch) => groups.update(g.id, patch)}
            onEdit={() => setGroupDialog(g)}
            onDelete={() => setRemoving({ group: g })}
            onMoveItem={(j, by) => reorder(tableOf(g), itemsOf(g), j, by)}
            onAddItem={() => setItemDialog({ group: g, value: g.kind === "edits" ? { name: "", target: {}, active: true } : { name: "", description: "", image: null, photo: null, active: true } })}
            onEditItem={(x) => setItemDialog({ group: g, value: x })}
            onDeleteItem={(x) => setRemoving({ group: g, item: x })}
          />
        ))}
      </div>

      {/* Group Form */}
      <GroupDialog value={groupDialog} onChange={setGroupDialog} onClose={() => setGroupDialog(null)} onSave={saveGroup} saving={groups.isSaving} />
      {/* Item Form */}
      <ItemDialog dialog={itemDialog} onChange={setItemDialog} onClose={() => setItemDialog(null)} onSave={saveItem} saving={categories.isSaving || terms.isSaving} />

      {/* Delete: what happens depends on whether anything uses it */}
      <Modal isOpen={Boolean(removing)} onClose={() => setRemoving(null)} title={`Delete ${removing?.item?.name ?? removing?.group?.name ?? ""}`} size="sm">
        {removing && (
          <div className="grid gap-4">
            {!removing.item ? (
              <p className="m-0 text-ink-2">
                {itemsOf(removing.group).length
                  ? `${removing.group.name} still has ${itemsOf(removing.group).length} items. Delete them first, then the group.`
                  : `${removing.group.name} is empty. Its column leaves the Shop menu.`}
              </p>
            ) : removing.group.kind === "category" && removingCount ? (
              <>
                <p className="m-0 text-ink-2">{removingCount} products are in this category. Move them first:</p>
                <Field label="Move them to" options={[{ value: "", label: "Pick a category" }, ...categories.items.filter((c) => c.id !== removing.item.id).map((c) => ({ value: c.id, label: c.name }))]} value={moveTo} onChange={(e) => setMoveTo(e.target.value)} />
              </>
            ) : removingCount ? (
              <p className="m-0 text-ink-2">{removingCount} products carry {removing.item.name}. Take it off them on the product form first, or switch it off instead.</p>
            ) : (
              <p className="m-0 text-ink-2">Nothing uses it. If a link elsewhere opens it, you will be told which one to change first.</p>
            )}
            <Button
              variant="danger"
              block
              onClick={remove}
              loading={groups.isRemoving || categories.isRemoving || terms.isRemoving || reassign.isPending}
              disabled={
                (!removing.item && itemsOf(removing.group).length > 0) ||
                (removing.item && removing.group.kind === "category" && removingCount > 0 && !moveTo) ||
                (removing.item && removing.group.kind === "tags" && removingCount > 0)
              }
            >
              Delete
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
