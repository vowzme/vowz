// Universal "Our Story" templates — work for any couple.
// One is auto-applied as default; couples can pick another with one click or write their own.

export interface StoryTemplate {
  id: string;
  label: string;
  emoji: string;
  body: string;
}

export const STORY_TEMPLATES: StoryTemplate[] = [
  {
    id: "classic",
    label: "Classic",
    emoji: "💞",
    body: `Some love stories aren't meant to be told in a hurry — ours is one of them.

From quiet conversations to shared dreams, every moment has woven us closer together. Through laughter and life's little surprises, we discovered that the best journeys are the ones we take side by side.

And now, we're ready to begin the most beautiful chapter of all — together, forever.`,
  },
  {
    id: "playful",
    label: "Playful",
    emoji: "🎉",
    body: `It started with a smile, a silly joke, and a moment that lasted a little longer than expected.

Somewhere between stolen fries, late-night texts, and inside jokes only we understand, we realised something wonderful — life is just better (and funnier) together.

So here we are, partners in mischief and in love, ready to say "I do" and keep the laughter going forever.`,
  },
  {
    id: "spiritual",
    label: "Spiritual",
    emoji: "🕊️",
    body: `Some souls find each other across time, guided by a love written long before they met.

In every shared silence and every gentle word, we felt a quiet truth — that this bond was meant to be, blessed by something greater than ourselves.

Today, with grateful hearts, we step forward hand in hand to honour that blessing and begin our forever together.`,
  },
];

// Backwards-compatible default (used as initial body when the couple hasn't written their own)
export const DEFAULT_STORY = STORY_TEMPLATES[0].body;
