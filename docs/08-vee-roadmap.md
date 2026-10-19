# 08: Vee Roadmap and Advice

Where Vee (the style assistant) stands, what was advised but not built, and what to do when the backend arrives. Anything advised for Vee that is not applied goes here, so it is not lost. Rule for copy in Vee's replies: no dashes.

## Today (built)

Vee is rules, not a language model. She reads only the shop's own data (products, stock, kits, colours with their hex, the size chart, settings and the team's colour pairs) fresh on every question, and needs no AI key. See `03-data-layer.md` (assistant) for how the colour engine, outfit builder, voice and memory work, and `04-design-system.md` (Vee) for the chat and dashboard.

## Should Vee get an AI model?

Not yet. Rules are right for the jobs that must never be wrong: stock, sizes, prices, delivery, and colours that do not clash. An AI model is good at the soft part (messy requests such as "my cousin's beach wedding weekend", tone, small talk, other languages) and is bad at being exact, so it must never be the source of facts.

**When to add one:** after the backend is connected (phase 7), because the key must live on the server, never in the browser. Then:

1. Add `POST assistant/ask` on the API. The browser sends the question and the chat so far; the server calls the model.
2. The model is given **tools**, not the whole catalogue: search products, check stock and size, build an outfit (this same engine, `vee/outfit.ts`), look up delivery and policies, hand off to WhatsApp. It can only recommend what a tool returns.
3. Replies keep the same block format (text, cards, outfit, chips, link), so the widget does not change.
4. The rules engine stays as the fallback when the API is slow, down, or over budget, and as a free first answer for the common questions.
5. Guardrails: the server prices and stocks every outfit again before showing it, no personal data in prompts (name only, if she gave it), a daily spend cap, a log of every answer for review in Vee, Questions.
6. Cost: cheap models are enough here. Cache by question and by the day's stock.

## Advice not applied yet

- **Editable language.** The words Vee understands (which words mean which category or activity, colour nicknames) and some fixed answers (care, squat-proof, set versus kit) are in code. Move them to the dashboard so a new category or activity works without a code change.
- **Answer this.** In Vee, Questions, let the team write a reply to a question she missed; she uses it the next time. (Taught answers.)
- **Read the FAQ and policy pages.** She keeps her own short versions of delivery, exchanges and payment. Making her read the FAQ and legal pages removes the double upkeep.
- **Analytics.** Outfits shown, outfits added to the bag, questions missed, so the team can see whether Vee earns her keep.
- **Honest urgency.** "Only M left in this colour", only from real stock, never invented.
- **Hand-off with context.** "Talk to the team" opens WhatsApp with a short summary of what she was looking at, so the shopper does not repeat herself.
- **Her past orders and saved pieces.** When signed in, complete an outfit around what she already owns, and use her saved size.
- **Ranking.** Outfits are the best of each colour mood; they are not yet ranked by what actually sells or gets added to the bag. Use analytics for that.
- **A bolder or calmer dial.** When the colour rules allow nothing further, she says so; a wider approved-pairs list in Pairing rules gives her more to offer.
- **Other languages.** Luganda and Swahili greetings and key phrases, decided with the team.
- **Voice and image.** Later, with the AI layer: "find me this look" from a photo.
- **Accessibility.** Announce replies to screen readers (the panel is a live region; check with a real reader), and test the chat with the keyboard only.
- **Tone upkeep.** Review a sample of real replies each month; retire any joke that lands badly. The tone setting (Playful, Balanced, Straight) is the control.

## Rules to keep

- Never claim stock, a price, a delivery time or a refund she cannot see in the data.
- No jokes in answers about money, sizing, delivery, payment or a problem.
- Never comment on bodies, only on fit and comfort.
- Hand off to the team when unsure, with a way to reach them.
- Whatever she says about herself stays on the device; "Forget me" clears it.
