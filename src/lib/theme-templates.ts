// Theme-specific starter landing-page templates.
// Each of the 10 curated wedding themes ships with tradition-appropriate
// starter copy: hero subheading + tagline, story text, and event names.
// Used by /themes "Start with this template" to seed a new wedding site.

import { WEDDING_THEMES, type WeddingTheme } from "@/lib/wedding-themes";
import { PHOTO_SETS } from "@/lib/theme-demo-sites";

export type ThemeTemplate = {
  themeId: string;
  partner1: string;
  partner2: string;
  tagline: string;
  culturalBackground: string;
  howWeMet: string;
  heroSubheading: string;
  events: string[];
  storyHeading: string;
  rsvpHeading: string;
  rsvpBody: string;
  guestbookHeading: string;
  guestbookDescription: string;
  countdownLabel: string;
  travelDescription: string;
};

type Base = Omit<ThemeTemplate, "themeId" | "partner1" | "partner2" | "tagline" | "culturalBackground">;

const T: Record<string, Base> = {
  "royal-rajput": {
    howWeMet:
      "Our story began under the star-lit skies of Jaipur — one shared dance at a cousin's sangeet, and a lifetime of ras-leelas since. Today, we invite you to the palace gates of our forever.",
    heroSubheading: "With the blessings of our families, we invite you to celebrate",
    events: ["Roka & Tilak", "Mehendi", "Sangeet", "Haldi", "Baraat & Pheras", "Reception"],
    storyHeading: "Our Royal Beginning",
    rsvpHeading: "Grace Us With Your Presence",
    rsvpBody: "The palace doors open for you. Kindly RSVP so we may welcome you like royalty.",
    guestbookHeading: "Aashirwaad — Your Blessings",
    guestbookDescription: "Leave a blessing for the newlyweds — every word will be treasured.",
    countdownLabel: "Counting Down to Our Royal Union",
    travelDescription: "Udaipur & Jaipur await — palaces, lakes, and a welcome fit for royalty. We have curated havelis and heritage stays for you.",
  },
  "south-indian-temple": {
    howWeMet:
      "Our families' prayers, our grandmothers' whispers, and the fragrance of jasmine on a Chennai afternoon — that is how our love began. Bound by mantras, blessed by tradition.",
    heroSubheading: "With the blessings of the elders, we invite you to",
    events: ["Nichayathartham (Engagement)", "Pallikai Thelippu", "Mehendi", "Muhurtham (Wedding)", "Sadhya & Reception"],
    storyHeading: "Bound by Blessings",
    rsvpHeading: "Join Us at the Muhurtham",
    rsvpBody: "Kindly confirm your presence so we may prepare a warm sadhya and welcome for you.",
    guestbookHeading: "Aasirvadam — Your Blessings",
    guestbookDescription: "Bless the couple with your wishes — spoken words become life-long treasures.",
    countdownLabel: "Days to the Muhurtham",
    travelDescription: "The temples of the south, silk-woven mornings, and warm sadhya lunches await. Recommended stays are close to the mandapam.",
  },
  "modern-minimal": {
    howWeMet:
      "We met the way most modern love stories begin — over coffee, a shared playlist, and a very long conversation that hasn't ended yet.",
    heroSubheading: "Save the date",
    events: ["Cocktail Evening", "Ceremony", "Dinner & Reception", "After-Party"],
    storyHeading: "How We Got Here",
    rsvpHeading: "RSVP",
    rsvpBody: "Please let us know if you can make it — we can't wait to celebrate with you.",
    guestbookHeading: "A Note for the Couple",
    guestbookDescription: "Share a memory, a wish, or a piece of advice for the road ahead.",
    countdownLabel: "Until we say I do",
    travelDescription: "A short guide to our favourite hotels, restaurants, and coffee spots for guests visiting the city.",
  },
  "bengali-alpona": {
    howWeMet:
      "Amader golpo — our story — began like a Rabindra Sangeet: slow, deep, and full of monsoon rain. From College Street bookstalls to shared bhaar-er cha, our love found its rhythm in the little things.",
    heroSubheading: "Shubho parinoy — with our families, we invite you to",
    events: ["Aashirbaad", "Gaye Holud", "Sangeet", "Biye (Wedding)", "Bou Bhaat"],
    storyHeading: "Amader Golpo — Our Story",
    rsvpHeading: "Come, Bless Us",
    rsvpBody: "Kindly RSVP by our shubho lagna date so we may arrange a warm Bengali welcome.",
    guestbookHeading: "Ashirbaad — Blessings",
    guestbookDescription: "Leave a poem, a prayer, or a Rabindrik line for the couple.",
    countdownLabel: "Din Ginchi — Counting Down",
    travelDescription: "Kolkata's lanes, sweet shops, and heritage stays — everything you need for a warm Bengali visit.",
  },
  "goa-beach": {
    howWeMet:
      "A sunset, a beach shack, and a shared plate of prawn balchão — that is where we first laughed until the tide came in. Our love has been salt-air and sunshine ever since.",
    heroSubheading: "Toes in the sand, hearts on the shore — join us for",
    events: ["Welcome Sundowner", "Beach Mehendi", "Sangeet by the Sea", "Beach Wedding Ceremony", "Sunset Reception"],
    storyHeading: "Our Seaside Story",
    rsvpHeading: "Come Celebrate by the Sea",
    rsvpBody: "Pack light, pack breezy — and let us know you're coming so we can save you a chair in the sand.",
    guestbookHeading: "Messages in a Bottle",
    guestbookDescription: "Send us a wish — we'll keep it like a note washed up on our favourite shore.",
    countdownLabel: "Sundowns Until the Big Day",
    travelDescription: "Beach villas, boutique stays, and shack-side recommendations along the North Goa coast.",
  },
  "kerala-backwaters": {
    howWeMet:
      "In God's own country, under the shade of a coconut grove, our story began — slow like a kettuvallam drifting through Alleppey's backwaters, warm like the smell of a Sadhya on a banana leaf.",
    heroSubheading: "With the blessings of our families, we invite you to",
    events: ["Nishchayam (Engagement)", "Mehendi", "Sangeet", "Kalyanam (Wedding)", "Sadhya Lunch & Reception"],
    storyHeading: "Our Backwater Beginning",
    rsvpHeading: "Sadhya Awaits",
    rsvpBody: "Kindly confirm your presence so we may prepare a warm Sadhya and a lakeside welcome.",
    guestbookHeading: "Aashamsakal — Blessings",
    guestbookDescription: "Bless the couple in Malayalam or English — every word is a keepsake.",
    countdownLabel: "Days Until Our Kalyanam",
    travelDescription: "Houseboats, heritage stays, and backwater retreats — we've noted the most beautiful spots near the venue.",
  },
  "punjabi-anand-karaj": {
    howWeMet:
      "Sat Sri Akal! Ours is a love story sung to the beat of the dhol — dholki nights, chole-bhature mornings, and one very loud, very joyful family that adopted us both. Ik Onkar — one love, one journey.",
    heroSubheading: "With Waheguru's blessings, we invite you to",
    events: ["Roka", "Sagai", "Jaggo Night", "Mehendi", "Ladies Sangeet", "Anand Karaj", "Reception"],
    storyHeading: "Ik Onkar — Our Story",
    rsvpHeading: "Chak De — Come Celebrate!",
    rsvpBody: "Kindly RSVP so we can plan the chole-bhature, the bhangra floor, and a warm Punjabi welcome for you.",
    guestbookHeading: "Ashirwaad — Blessings",
    guestbookDescription: "Leave a shabad, a wish, or a memory — we'll carry it into our new life together.",
    countdownLabel: "Days Until the Anand Karaj",
    travelDescription: "Amritsar and beyond — heritage stays, langar-side hotels, and the warmest Punjabi welcome.",
  },
  "marwari-haveli": {
    howWeMet:
      "In the pink lanes of Jodhpur, between mirror-work walls and marigold garlands, our families found each other — and so did we. Written, we think, in the stars above the Mehrangarh.",
    heroSubheading: "With the blessings of our khandaan, we invite you to",
    events: ["Ganesh Sthapana", "Mahira Dastoor", "Mehendi", "Sangeet", "Haldi", "Pheras", "Reception"],
    storyHeading: "Padharo Mhare Des",
    rsvpHeading: "Padharo — Please Join Us",
    rsvpBody: "Kindly RSVP so we may prepare a haveli-style welcome and a marigold garland for you.",
    guestbookHeading: "Aashirwaad — Blessings",
    guestbookDescription: "Bless the couple in your own words — every message is a keepsake.",
    countdownLabel: "Days Until Our Pheras",
    travelDescription: "Jodhpur, Jaipur & Udaipur havelis — hand-picked heritage stays and airport shuttle notes.",
  },
  "christian-chapel": {
    howWeMet:
      "We met on an ordinary Sunday that turned out to be anything but. A shared hymn book, a whispered joke during the sermon, and a coffee that lasted five hours — that is where forever began.",
    heroSubheading: "Together with our families, we invite you to the wedding of",
    events: ["Engagement Blessing", "Rehearsal Dinner", "Wedding Ceremony", "Reception & Toasts"],
    storyHeading: "Two Souls, One Covenant",
    rsvpHeading: "Kindly Reply",
    rsvpBody: "Please respond by the date on the invitation so we can plan a beautiful reception for you.",
    guestbookHeading: "A Blessing for the Couple",
    guestbookDescription: "Leave a verse, a prayer, or a favourite memory for the newlyweds.",
    countdownLabel: "Days Until We Say 'I Do'",
    travelDescription: "A short guide to hotels, chapels, and dinner spots near the ceremony and reception venues.",
  },
  "boho-destination": {
    howWeMet:
      "We are wanderers who found home in each other — across deserts, across time zones, across a hundred cups of chai in a hundred different cities. Now we're pitching our tent here, together, forever.",
    heroSubheading: "Wandering hearts, finally home — join us for",
    events: ["Welcome Bonfire", "Desert Mehendi", "Sangeet Under the Stars", "Wedding Ceremony", "Long-Table Feast"],
    storyHeading: "Wandering Hearts, Finally Home",
    rsvpHeading: "Join Our Caravan",
    rsvpBody: "Let us know you're coming so we can save you a seat by the bonfire and a spot at the long table.",
    guestbookHeading: "Notes for the Nomads",
    guestbookDescription: "Leave a wish, a route, or a story for the road ahead.",
    countdownLabel: "Suns Until We Set Camp Together",
    travelDescription: "Desert camps, boho villas, and boutique tents — everything you need for a magical destination stay.",
  },
};

export function buildThemeTemplate(theme: WeddingTheme): ThemeTemplate {
  const base = T[theme.id] ?? T["modern-minimal"];
  return {
    themeId: theme.id,
    partner1: theme.sampleCouple[0],
    partner2: theme.sampleCouple[1],
    tagline: theme.sampleTagline,
    culturalBackground: theme.tradition,
    ...base,
  };
}

// Build the full sections array for a wedding_sites row from a theme template.
export function buildThemeSections(theme: WeddingTheme) {
  const tpl = buildThemeTemplate(theme);
  const photos = PHOTO_SETS[theme.id] ?? PHOTO_SETS["modern-minimal"];
  const heroImage = photos?.hero || "";
  const sampleGallery = (photos?.gallery || []).slice(0, 3);
  return [
    { id: "hero", type: "hero", title: "Hero", visible: true, data: {
      heading: `${tpl.partner1} & ${tpl.partner2}`,
      subheading: tpl.heroSubheading,
      tagline: tpl.tagline,
      // Cover / featured image — replace with your own in the editor.
      heroImage,
      coverImage: heroImage,
      backgroundImage: heroImage,
    } },
    { id: "countdown", type: "countdown", title: "Countdown", visible: true, data: { label: tpl.countdownLabel, date: "" } },
    { id: "story", type: "story", title: "Our Story", visible: true, data: { heading: tpl.storyHeading, body: tpl.howWeMet } },
    { id: "events", type: "events", title: "Wedding Events", visible: true, data: {
      heading: "Wedding Events",
      description: "Tap any event in the editor to set date, time, and venue.",
      events: tpl.events.map((name) => ({ name, date: "", time: "", venue: "", location: "" })),
    } },
    { id: "gallery", type: "gallery", title: "Photo Gallery", visible: true, data: {
      heading: "Our Moments",
      description: "Sample photos to get you started — replace them with your own in the editor.",
      images: sampleGallery,
      photos: sampleGallery,
    } },
    { id: "travel", type: "travel", title: "Travel & Stay", visible: true, data: { heading: "Travel & Stay", description: tpl.travelDescription, hotels: [{ name: "Add your recommended hotel", description: "Update with your notes for guests.", distance: "Near venue" }], directions: "Add directions, nearest airport, and transport notes here." } },
    // Gift Registry + Shagun UPI. Add your UPI VPA in the editor to accept blessings by UPI.
    { id: "registry", type: "registry", title: "Gift Registry & Shagun", visible: true, data: {
      heading: "Gift Registry & Shagun",
      description: "Your presence is our greatest gift. If you'd still like to bless us, send Shagun over UPI or pick a gift from the list.",
      upi: { vpa: "", name: `${tpl.partner1} & ${tpl.partner2}`, note: "Wedding Shagun" },
      items: [
        { name: "Honeymoon Fund", description: "Help us plan the trip of a lifetime.", link: "" },
        { name: "Home Together", description: "A little something for our first home.", link: "" },
      ],
    } },
    // Guest photo wall + wishes. Guests can upload a photo and leave a blessing.
    { id: "blessings", type: "blessings", title: "Guest Photos & Wishes", visible: true, data: {
      heading: "Share a Photo & Wish",
      description: "Upload a photo with the couple and leave a blessing — it'll appear on this page for everyone to enjoy.",
    } },
    { id: "guestbook", type: "guestbook", title: "Wishes & Blessings", visible: true, data: { heading: tpl.guestbookHeading, description: tpl.guestbookDescription } },
    { id: "rsvp", type: "rsvp", title: "RSVP", visible: true, data: {
      heading: tpl.rsvpHeading,
      body: tpl.rsvpBody,
      // Sensible default deadline hint — override in the editor.
      deadline: "",
      confirmationMessage: "Thank you! Your RSVP has been received — see you soon.",
    } },
  ];
}
