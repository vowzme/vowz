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
  eventVenues: string[]; // one hint per event (parallel to events[])
  eventTimes: string[];  // one hint per event (parallel to events[])
  scheduleNote: string;
  accommodations: { name: string; description: string; distance: string }[];
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
    eventVenues: ["Sheesh Mahal Courtyard", "Zenana Lawn", "Durbar Hall", "Marigold Terrace", "Palace Gates & Pheras Mandap", "Peacock Ballroom"],
    eventTimes: ["Morning tilak", "Afternoon henna", "Evening baithak", "Sunrise haldi", "Baraat at dusk", "Late-night reception"],
    scheduleNote: "Three days of royal festivities across palace courtyards. Traditional Rajputi attire encouraged.",
    accommodations: [
      { name: "Taj Lake Palace, Udaipur", description: "Heritage island palace — a room block is held for baraatis.", distance: "15 min from mandap" },
      { name: "Rambagh Palace, Jaipur", description: "Royal Rajput hospitality with courtyard suites.", distance: "20 min from venue" },
    ],
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
    eventVenues: ["Family Home — Puja Hall", "Temple Prakaram", "Kalyana Mandapam Foyer", "Kalyana Mandapam", "Banquet Hall — Banana Leaf Sadhya"],
    eventTimes: ["Morning muhurtham", "Evening ritual", "Afternoon henna", "Sunrise muhurtham lagnam", "Lunch onwards"],
    scheduleNote: "Rituals begin at the auspicious lagnam. Traditional silks and jasmine strands are most welcome.",
    accommodations: [
      { name: "ITC Grand Chola, Chennai", description: "Dravidian-inspired luxury, close to the mandapam.", distance: "10 min from venue" },
      { name: "Sterling Mahabalipuram", description: "Serene sea-side stay for out-of-town guests.", distance: "45 min drive" },
    ],
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
    eventVenues: ["Rooftop Bar", "Garden Pavilion", "Loft Ballroom", "Underground Lounge"],
    eventTimes: ["7:00 PM", "4:30 PM", "7:30 PM", "11:00 PM"],
    scheduleNote: "One day, one venue, one very good playlist. Cocktail attire.",
    accommodations: [
      { name: "The Standard Hotel", description: "Design-forward rooms within walking distance of the venue.", distance: "5 min walk" },
      { name: "Boutique City Loft", description: "Curated apartments for close friends and family.", distance: "10 min ride" },
    ],
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
    eventVenues: ["Family Thakurdalan", "Alpona Courtyard", "Rabindra Sadan Hall", "Biye Bari Mandap", "Bou Bhaat Banquet"],
    eventTimes: ["Evening blessings", "Morning holud", "Evening sangeet", "Shubho lagna (night)", "Afternoon feast"],
    scheduleNote: "Five days of Bengali ritual and rasogolla. Traditional laal-paar sarees & dhoti-panjabi welcomed.",
    accommodations: [
      { name: "The Oberoi Grand, Kolkata", description: "Colonial charm in the heart of the city.", distance: "20 min from biye bari" },
      { name: "Rajbari Bawali", description: "Heritage mansion stay for a true Bengali experience.", distance: "1 hr drive" },
    ],
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
    eventVenues: ["Vagator Cliff Deck", "Ashwem Beach Shack", "Morjim Sandbar", "Sweet Water Beach", "Sunset Point, Chapora"],
    eventTimes: ["Golden hour", "Late morning", "Evening under the stars", "4:30 PM ceremony", "Sunset onwards"],
    scheduleNote: "Three sun-soaked days by the sea. Linen, florals, and bare feet encouraged.",
    accommodations: [
      { name: "W Goa, Vagator", description: "Beachfront rooms with easy access to the ceremony.", distance: "5 min from venue" },
      { name: "Ahilya by the Sea", description: "Boutique villa stay for family and close friends.", distance: "15 min drive" },
    ],
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
    eventVenues: ["Tharavadu Nadumuttam", "Coconut Grove Lawn", "Lakeside Deck", "Kalyana Mandapam", "Banana-Leaf Sadhya Hall"],
    eventTimes: ["Morning nishchayam", "Afternoon henna", "Evening sangeet", "Sunrise muhurtham", "Lunch onwards"],
    scheduleNote: "Backwater rituals with kasavu-mundu attire and a traditional Sadhya on banana leaves.",
    accommodations: [
      { name: "Kumarakom Lake Resort", description: "Heritage lakeside cottages beside the venue.", distance: "5 min from mandapam" },
      { name: "Alleppey Houseboat Cruise", description: "One-night backwater cruise for guests who arrive early.", distance: "45 min drive" },
    ],
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
    eventVenues: ["Family Home — Baithak", "Gurdwara Prangan", "Haveli Courtyard", "Marigold Terrace", "Sangeet Ballroom", "Gurdwara Sahib", "Dhol Ballroom"],
    eventTimes: ["Morning roka", "Evening sagai", "Late night jaggo", "Afternoon henna", "Evening sangeet", "Sunrise ardaas", "Dinner & bhangra"],
    scheduleNote: "A week of Punjabi joy — from dholkis to the Anand Karaj. Bring your dancing shoes.",
    accommodations: [
      { name: "Taj Swarna, Amritsar", description: "Elegant stay a short drive from the Golden Temple.", distance: "10 min from gurdwara" },
      { name: "Ranjit's Svaasa, Amritsar", description: "Heritage boutique haveli for family and friends.", distance: "15 min drive" },
    ],
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
    eventVenues: ["Haveli Puja Room", "Nani Sa's Courtyard", "Sheesh Mahal Terrace", "Chowk Baithak", "Marigold Lawn", "Mandap Chowk", "Darbar Hall"],
    eventTimes: ["Morning puja", "Afternoon ritual", "Evening henna", "Late-night sangeet", "Morning haldi", "Sunrise pheras", "Dinner onwards"],
    scheduleNote: "Seven ceremonies across a Marwari haveli. Bandhani, safas, and heirloom polkis are the dress code.",
    accommodations: [
      { name: "Umaid Bhawan Palace, Jodhpur", description: "Royal Rajputana suites — a block is held for guests.", distance: "20 min from haveli" },
      { name: "RAAS Jodhpur", description: "Mehrangarh-facing boutique haveli stay.", distance: "10 min from venue" },
    ],
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
    eventVenues: ["Chapel Vestibule", "Vineyard Terrace", "Cathedral Sanctuary", "Grand Ballroom"],
    eventTimes: ["Sunday afternoon", "7:00 PM", "4:00 PM ceremony", "6:30 PM reception"],
    scheduleNote: "A traditional chapel service followed by dinner and toasts. Semi-formal attire.",
    accommodations: [
      { name: "The Grand Hotel", description: "Classic rooms a short drive from the chapel.", distance: "10 min from cathedral" },
      { name: "Vineyard Inn & Spa", description: "Countryside stay near the reception venue.", distance: "5 min from reception" },
    ],
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
    eventVenues: ["Camp Firepit", "Dune Majlis Tent", "Open-Air Deck under the Milky Way", "Canyon Arch", "Long-Table Under the Fairy Lights"],
    eventTimes: ["First night, dusk", "Morning henna", "Evening sangeet", "Golden-hour ceremony", "Dinner onwards"],
    scheduleNote: "Three days off the grid. Layered linens, tassels, and desert boots strongly encouraged.",
    accommodations: [
      { name: "The Serai, Jaisalmer", description: "Luxury desert tents with private decks.", distance: "On-site" },
      { name: "Suryagarh Desert Camp", description: "Boho tent stay for the wedding party.", distance: "20 min drive" },
    ],
  },
  "luxe-ivory-royale": {
    howWeMet:
      "Two families, three cities and one very long courtship of letters, late calls and stolen weekends. What began as a formal introduction over filter coffee became the most unhurried, most certain love of our lives.",
    heroSubheading: "With the blessings of our families, we request the honour of your presence",
    events: ["Invitation Tea", "Mehendi", "Sangeet Gala", "Haldi", "Wedding Ceremony", "Black-Tie Reception"],
    storyHeading: "A Heritage Love",
    rsvpHeading: "Kindly Respond",
    rsvpBody: "Seats at every function are reserved by name. Please respond so we may set a place for you.",
    guestbookHeading: "Blessings & Wishes",
    guestbookDescription: "Leave a line for the couple — every note is printed into our wedding album.",
    countdownLabel: "Until the ceremony",
    travelDescription: "Chauffeured transfers, curated suites and a concierge desk for every guest arriving from out of town.",
    eventVenues: ["The Drawing Room", "Ivory Courtyard", "Grand Ballroom", "Sunrise Terrace", "Colonnade Mandap", "The Gold Room"],
    eventTimes: ["4:00 PM", "Late morning", "8:00 PM", "7:30 AM", "Auspicious hour", "8:00 PM"],
    scheduleNote: "Three days of celebration. Ivory and gold for the day functions; black-tie for the reception.",
    accommodations: [
      { name: "The Leela Palace", description: "Suites held under the wedding name, with airport transfers.", distance: "On-site" },
      { name: "Taj Heritage Wing", description: "Heritage rooms for family arriving early.", distance: "10 min drive" },
    ],
  },
  "luxe-midnight-meenakari": {
    howWeMet:
      "A rooftop in Bombay, a monsoon that refused to stop, and a conversation that ran until the sky turned pale. We have been talking ever since — and now we would like the whole city to hear about it.",
    heroSubheading: "We invite you to an evening of jewelled celebration",
    events: ["Cocktail Soirée", "Mehendi", "Sangeet", "Haldi", "Pheras", "Midnight Reception"],
    storyHeading: "Under a Jewelled Sky",
    rsvpHeading: "Reply, Please",
    rsvpBody: "Every guest is seated by name across our functions — kindly confirm so we can print your card.",
    guestbookHeading: "Words for the Couple",
    guestbookDescription: "A wish, a memory, or a line of poetry — we'll keep them all.",
    countdownLabel: "Until the pheras",
    travelDescription: "Valet transfers, sea-facing suites and a 24-hour concierge for every guest.",
    eventVenues: ["Sapphire Lounge", "Enamel Courtyard", "Mirror Ballroom", "Garden Pavilion", "Midnight Mandap", "Sky Terrace"],
    eventTimes: ["8:00 PM", "11:00 AM", "8:30 PM", "8:00 AM", "Auspicious hour", "10:00 PM"],
    scheduleNote: "Jewel tones by night, ivory by day. Black-tie for the reception.",
    accommodations: [
      { name: "The Oberoi, Marine Drive", description: "Sea-facing suites reserved for the wedding party.", distance: "On-site" },
      { name: "Trident Nariman Point", description: "Rooms held for guests flying in.", distance: "5 min drive" },
    ],
  },
  "luxe-emerald-heirloom": {
    howWeMet:
      "Our grandmothers were friends long before we were. Two generations later, a borrowed emerald ring and one nervous afternoon later, the story came full circle — exactly as they always said it would.",
    heroSubheading: "With love and with our elders' blessings, we invite you to",
    events: ["Family Blessing", "Mehendi", "Sangeet", "Nikah / Ceremony", "Heirloom Dinner"],
    storyHeading: "An Heirloom Promise",
    rsvpHeading: "Please Reply",
    rsvpBody: "A seat is held in your name. Kindly confirm so we can welcome you properly.",
    guestbookHeading: "Duas & Blessings",
    guestbookDescription: "Leave your blessing for the couple — it will be read aloud at the dinner.",
    countdownLabel: "Until we are wed",
    travelDescription: "Curated stays, car transfers and a family host assigned to every out-of-town guest.",
    eventVenues: ["Emerald Salon", "Pearl Courtyard", "Velvet Hall", "Heirloom Pavilion", "Long Table, The Orangery"],
    eventTimes: ["6:00 PM", "Late morning", "8:00 PM", "Auspicious hour", "8:30 PM"],
    scheduleNote: "Emerald, pearl and antique gold. Heirloom jewellery warmly encouraged.",
    accommodations: [
      { name: "Rambagh Palace", description: "Heritage suites held for close family.", distance: "On-site" },
      { name: "The Lodhi, Delhi", description: "Private-pool rooms for guests arriving early.", distance: "20 min drive" },
    ],
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
      description: tpl.scheduleNote,
      events: tpl.events.map((name, i) => ({
        name,
        date: "",
        time: tpl.eventTimes[i] ?? "",
        venue: tpl.eventVenues[i] ?? "",
        location: "",
      })),
    } },
    { id: "gallery", type: "gallery", title: "Photo Gallery", visible: true, data: {
      heading: "Our Moments",
      description: "Sample photos to get you started — replace them with your own in the editor.",
      images: sampleGallery,
      photos: sampleGallery,
    } },
    { id: "travel", type: "travel", title: "Travel & Stay", visible: true, data: {
      heading: "Travel & Stay",
      description: tpl.travelDescription,
      hotels: tpl.accommodations,
      directions: "Add directions, nearest airport, and transport notes here.",
    } },
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
