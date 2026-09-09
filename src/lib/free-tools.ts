// Free, no-sign-up wedding planning tools.
// Each tool = a short form + a deterministic, printable output.
// Everything runs in the browser: no login, no data stored.

import { RITUALS, type Ritual } from "@/lib/rituals";

export type ToolField = {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "multiselect" | "textarea";
  options?: string[];
  placeholder?: string;
  help?: string;
  required?: boolean;
};

export type ToolBlock = {
  heading: string;
  text?: string;
  items?: string[];
  note?: string;
};

export type ToolResult = {
  headline: string;
  summary: string;
  blocks: ToolBlock[];
};

export type FreeTool = {
  slug: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  output: string;
  minutes: number;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  fields: ToolField[];
  compute: (a: Record<string, any>) => ToolResult;
};

const arr = (v: any): string[] => (Array.isArray(v) ? v : v ? [v] : []);
const num = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

// ─────────────────────────────────────────────────────────────────────────
// 1. Wedding Menu Builder
// ─────────────────────────────────────────────────────────────────────────
const CUISINE_MENUS: Record<string, { starters: string[]; mains: string[]; breads: string[]; desserts: string[]; live: string[] }> = {
  "North Indian": {
    starters: ["Paneer tikka", "Hara bhara kebab", "Dahi ke kebab", "Tandoori mushroom", "Murgh malai tikka (non-veg)"],
    mains: ["Dal makhani", "Shahi paneer", "Sarson da saag", "Malai kofta", "Kadhai chicken (non-veg)"],
    breads: ["Butter naan", "Missi roti", "Laccha paratha", "Jeera rice", "Veg pulao"],
    desserts: ["Gulab jamun", "Moong dal halwa", "Rabri jalebi", "Kulfi falooda"],
    live: ["Chaat counter", "Tandoor counter", "Jalebi counter"],
  },
  "South Indian": {
    starters: ["Medu vada", "Banana chips & sundal", "Gobi 65", "Kara pori", "Chicken 65 (non-veg)"],
    mains: ["Sambar", "Rasam", "Avial", "Kootu", "Poriyal", "Chettinad curry (non-veg)"],
    breads: ["Steamed rice", "Ghee rice", "Appam", "Idiyappam", "Curd rice"],
    desserts: ["Payasam", "Mysore pak", "Ada pradhaman", "Boli"],
    live: ["Dosa counter", "Appam & stew counter", "Filter coffee counter"],
  },
  "Mughlai / Awadhi": {
    starters: ["Galouti kebab", "Shami kebab", "Seekh kebab", "Malai broccoli", "Murgh tikka"],
    mains: ["Nihari", "Mutton korma", "Dum ka murgh", "Subz dum biryani", "Paneer pasanda"],
    breads: ["Sheermal", "Ulte tawe ka paratha", "Roomali roti", "Awadhi biryani"],
    desserts: ["Shahi tukda", "Phirni", "Kesar kheer", "Sheer khurma"],
    live: ["Kebab counter", "Biryani dum counter"],
  },
  Bengali: {
    starters: ["Beguni", "Fish fry", "Mochar chop", "Dhokar dalna bites"],
    mains: ["Shukto", "Cholar dal", "Chingri malai curry", "Kosha mangsho", "Aloo posto"],
    breads: ["Luchi", "Basanti pulao", "Ghee bhaat"],
    desserts: ["Mishti doi", "Rosogolla", "Sandesh", "Payesh"],
    live: ["Phuchka counter", "Kathi roll counter"],
  },
  "Gujarati / Jain": {
    starters: ["Khaman dhokla", "Patra", "Khandvi", "Methi muthiya"],
    mains: ["Undhiyu", "Sev tameta", "Gujarati dal", "Bhindi sambhariya"],
    breads: ["Puri", "Thepla", "Bajra rotla", "Khichdi & kadhi"],
    desserts: ["Basundi", "Shrikhand", "Mohanthal", "Ghari"],
    live: ["Fafda-jalebi counter", "Pav bhaji counter (Jain option)"],
  },
  "Kerala / Syrian Christian": {
    starters: ["Kappa & chilli", "Banana fritters", "Beef ularthiyathu (non-veg)", "Fish molly bites"],
    mains: ["Avial", "Olan", "Thoran", "Fish curry", "Chicken stew"],
    breads: ["Appam", "Idiyappam", "Malabar parotta", "Kerala red rice"],
    desserts: ["Palada payasam", "Ela ada", "Banana halwa"],
    live: ["Appam counter", "Karimeen grill counter"],
  },
  "Continental mix": {
    starters: ["Bruschetta", "Cheese platter", "Grilled vegetable skewers", "Chicken satay"],
    mains: ["Penne arrabbiata", "Herb-roast vegetables", "Grilled fish with lemon butter", "Stroganoff"],
    breads: ["Garlic bread", "Herb rice", "Buttered mash"],
    desserts: ["Tiramisu", "Chocolate mousse", "Fruit tart"],
    live: ["Pasta counter", "Grill station", "Mocktail bar"],
  },
};

const PLATE_TIER: Record<string, { starters: number; mains: number; desserts: number; live: number; note: string }> = {
  "Simple & warm": { starters: 3, mains: 4, desserts: 2, live: 1, note: "Fewer dishes, larger portions — guests remember taste, not variety." },
  "Balanced": { starters: 5, mains: 6, desserts: 3, live: 2, note: "The most common Indian wedding spread." },
  "Grand": { starters: 8, mains: 9, desserts: 5, live: 4, note: "Add a second serving line for every 150 guests or the queues will hurt." },
};

const menuBuilder: FreeTool = {
  slug: "wedding-menu-builder",
  name: "Wedding Menu Builder",
  emoji: "🍽️",
  tagline: "Build a function-by-function menu you can hand straight to your caterer.",
  description:
    "Tell us your functions, guest count, cuisine and dietary needs. You get a dish-by-dish menu brief for each function, quantity guidance and the exact questions to ask your caterer.",
  output: "Menu brief + caterer question list",
  minutes: 3,
  seoTitle: "Free Indian Wedding Menu Planner — Build a Caterer-Ready Menu | Vowz",
  seoDescription:
    "Free wedding menu builder for Indian weddings. Pick your functions, cuisine and dietary needs and get a printable menu brief and caterer questions. No sign-up.",
  keywords: ["indian wedding menu list", "wedding food menu planner", "wedding catering menu india", "sangeet menu ideas"],
  fields: [
    { id: "functions", label: "Which functions need a menu?", type: "multiselect", required: true, options: ["Haldi", "Mehendi", "Sangeet", "Wedding lunch", "Wedding dinner", "Reception", "Walima", "Next-day brunch"] },
    { id: "guests", label: "Guests at the largest function", type: "number", placeholder: "300", required: true },
    { id: "cuisine", label: "Main cuisine", type: "select", required: true, options: Object.keys(CUISINE_MENUS) },
    { id: "tier", label: "How big should the spread be?", type: "select", required: true, options: Object.keys(PLATE_TIER) },
    { id: "dietary", label: "Dietary needs in your guest list", type: "multiselect", options: ["Pure vegetarian only", "Jain (no onion & garlic)", "Halal", "Vegan guests", "Nut allergies", "No beef or pork", "Diabetic-friendly options", "Kids' menu"] },
  ],
  compute: (a) => {
    const guests = num(a.guests, 200);
    const cuisine = a.cuisine || "North Indian";
    const m = CUISINE_MENUS[cuisine] || CUISINE_MENUS["North Indian"];
    const tierKey = a.tier || "Balanced";
    const tier = PLATE_TIER[tierKey] || PLATE_TIER["Balanced"];
    const diet = arr(a.dietary);
    const functions = arr(a.functions);
    const pureVeg = diet.includes("Pure vegetarian only");

    const pick = (list: string[], n: number) =>
      list.filter((d) => !pureVeg || !/non-veg|chicken|fish|mutton|beef|prawn|karimeen|murgh|seekh|galouti|shami|nihari|kosha|stroganoff|satay/i.test(d)).slice(0, n);

    const blocks: ToolBlock[] = [];

    (functions.length ? functions : ["Wedding dinner"]).forEach((fn) => {
      const light = /Haldi|Mehendi|brunch/i.test(fn);
      const s = light ? Math.max(2, tier.starters - 2) : tier.starters;
      const mn = light ? Math.max(3, tier.mains - 2) : tier.mains;
      const d = light ? Math.max(1, tier.desserts - 1) : tier.desserts;
      blocks.push({
        heading: `${fn} menu`,
        items: [
          `Starters (${s}): ${pick(m.starters, s).join(", ")}`,
          `Mains (${mn}): ${pick(m.mains, mn).join(", ")}`,
          `Rice & breads: ${m.breads.slice(0, light ? 2 : 3).join(", ")}`,
          `Desserts (${d}): ${m.desserts.slice(0, d).join(", ")}`,
          `Live counters: ${m.live.slice(0, light ? 1 : tier.live).join(", ") || "None"}`,
        ],
      });
    });

    blocks.push({
      heading: "Quantity guidance",
      items: [
        `Cater for ${Math.round(guests * 1.1)} plates at your largest function — always add 10% over your confirmed count.`,
        `Serving counters needed: about ${Math.max(2, Math.ceil(guests / 100))} (one per 100 guests) to keep queues under 10 minutes.`,
        `Water and welcome-drink stations: ${Math.max(2, Math.ceil(guests / 150))}.`,
        `Service staff: roughly ${Math.max(6, Math.ceil(guests / 25))} for buffet, ${Math.max(10, Math.ceil(guests / 12))} for sit-down service.`,
        `Plan ${Math.ceil(guests * 0.15)} extra desserts — dessert always runs out first.`,
      ],
      note: tier.note,
    });

    if (diet.length) {
      blocks.push({
        heading: "Dietary instructions for your caterer",
        items: diet.map((d) => {
          if (d === "Jain (no onion & garlic)") return "Jain: separate kitchen section, no onion, garlic, potato or root vegetables. Label these dishes clearly and keep serving spoons separate.";
          if (d === "Halal") return "Halal: ask for a halal certificate for all meat, and keep halal and non-halal preparation completely separate.";
          if (d === "Vegan guests") return "Vegan: at least two mains without ghee, butter, paneer, curd or cream — ask the chef to use oil instead of ghee.";
          if (d === "Nut allergies") return "Nut allergy: label every dish that contains cashew, almond or peanut paste. Indian gravies almost always have cashew — ask.";
          if (d === "No beef or pork") return "No beef or pork: confirm in writing, including for stocks and starters.";
          if (d === "Diabetic-friendly options") return "Diabetic: one sugar-free dessert and unsweetened drinks at every function.";
          if (d === "Kids' menu") return "Kids: a small counter with plain rice, curd, fries, pasta and non-spicy paneer keeps families happy.";
          return "Pure vegetarian: confirm the entire kitchen is vegetarian for the day, including oil and stocks.";
        }),
      });
    }

    blocks.push({
      heading: "Ask your caterer these before you sign",
      items: [
        "What is the final per-plate price including taxes, service charge and transport?",
        "How many staff will you bring, and is that included in the price?",
        "Is a tasting session included, and when can we do it?",
        "What happens if the guest count changes 48 hours before — what is the cut-off?",
        "Do you charge extra for live counters, extra hours, or a second serving line?",
        "Who supplies crockery, chafing dishes and the buffet setup?",
        "What is your plan if a dish runs out mid-service?",
        "Can we donate untouched surplus food, and will you help coordinate it?",
      ],
    });

    return {
      headline: `${cuisine} menu for ${guests} guests`,
      summary: `A ${tierKey.toLowerCase()} ${cuisine} spread across ${functions.length || 1} function${functions.length === 1 ? "" : "s"}, with quantity guidance and caterer questions.`,
      blocks,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────
// 2. Sangeet Song Finder
// ─────────────────────────────────────────────────────────────────────────
const SONGS: Record<string, Record<string, string[]>> = {
  "Bollywood classic": {
    "Bride entry": ["Din Shagna Da", "Mere Haath Mein", "Banno Tera Swagger", "Navrai Majhi"],
    "Groom entry": ["Aaj Mere Yaar Ki Shaadi Hai", "Sher Aaya Sher", "Dulhe Ka Sehra"],
    "Bride's family": ["Gallan Goodiyaan", "Nachde Ne Saare", "Cutiepie", "Ladki Beautiful Kar Gayi Chull"],
    "Groom's family": ["London Thumakda", "Aankh Marey", "Badri Ki Dulhania", "Kar Gayi Chull"],
    "Couple dance": ["Tum Se Hi", "Raabta", "Pehla Nasha", "Tera Ban Jaunga"],
    "Grandparents & kids": ["Bole Chudiyan", "Chota Bacha", "Aaj Ki Party"],
    Baraat: ["Kala Chashma", "Dilliwaali Girlfriend", "Baby Ko Bass Pasand Hai"],
    "Finale (everyone)": ["Ye Desh Hai Veer Jawano Ka", "Balam Pichkari", "Saturday Saturday"],
  },
  "Punjabi high energy": {
    "Bride entry": ["Din Shagna Da", "Madhaniya", "Sadke Jaawan"],
    "Groom entry": ["Jugni", "Sher Aaya Sher", "Munda Sohna Hai"],
    "Bride's family": ["Nachde Ne Saare", "Laung Laachi", "Morni Banke"],
    "Groom's family": ["Kala Chashma", "High Rated Gabru", "Wakhra Swag"],
    "Couple dance": ["Sanu Ek Pal Chain", "Ve Maahi", "Mehram"],
    "Grandparents & kids": ["Kudi Nu Nachne De", "Gud Naal Ishq Mitha"],
    Baraat: ["Bhangra Paa Le", "Tunak Tunak Tun", "Naach Meri Rani"],
    "Finale (everyone)": ["Proper Patola", "Lamberghini", "Jai Jai Shivshankar"],
  },
  "Retro 90s": {
    "Bride entry": ["Chand Chhupa Badal Mein", "Din Shagna Da (unplugged)"],
    "Groom entry": ["Aaj Mere Yaar Ki Shaadi Hai", "Yeh Ladka Hai Allah"],
    "Bride's family": ["Didi Tera Devar Deewana", "Chunari Chunari", "Mehndi Laga Ke Rakhna"],
    "Groom's family": ["Dhol Bajne Laga", "Le Gayi", "Ek Ladki Ko Dekha"],
    "Couple dance": ["Tujhe Dekha To", "Kuch Kuch Hota Hai", "Pehla Nasha"],
    "Grandparents & kids": ["Bole Chudiyan", "Maiyya Yashoda"],
    Baraat: ["Aisa Zakhm Diya Hai", "Goron Ki Na Kaalon Ki"],
    "Finale (everyone)": ["It's The Time To Disco", "Koi Mil Gaya"],
  },
  "South Indian hits": {
    "Bride entry": ["Kanmani Anbodu", "Nenjukkul Peidhidum", "Mounam Pesiyadhe"],
    "Groom entry": ["Vaathi Coming", "Danga Maari Oodhari", "Ramuloo Ramulaa"],
    "Bride's family": ["Rowdy Baby", "Jimikki Kammal", "Butta Bomma"],
    "Groom's family": ["Aalaporan Thamizhan", "Naa Ready", "Bujji Thalli"],
    "Couple dance": ["Munbe Vaa", "Malare", "Samajavaragamana"],
    "Grandparents & kids": ["Jimikki Kammal", "Chinna Chinna Aasai"],
    Baraat: ["Vaathi Coming", "Bommali", "Kaavaalaa"],
    "Finale (everyone)": ["Why This Kolaveri Di", "Naatu Naatu"],
  },
  "Sufi & romantic": {
    "Bride entry": ["Ranjha", "Kesariya", "Rangisari"],
    "Groom entry": ["Ik Vaari Aa", "Khairiyat"],
    "Bride's family": ["Ghoomar", "Mast Malang Jhoom", "Rangisari"],
    "Groom's family": ["Kun Faya Kun", "Afreen Afreen"],
    "Couple dance": ["Tera Yaar Hoon Main", "Raataan Lambiyan", "Tum Se Hi"],
    "Grandparents & kids": ["Chaudhary", "Dama Dam Mast Qalandar"],
    Baraat: ["Jugni Ji", "Dama Dam Mast Qalandar"],
    "Finale (everyone)": ["Kesariya", "Ilahi"],
  },
  "Global mix": {
    "Bride entry": ["A Thousand Years", "Perfect — Ed Sheeran", "Din Shagna Da"],
    "Groom entry": ["Can't Stop The Feeling", "Sher Aaya Sher"],
    "Bride's family": ["Uptown Funk", "Gallan Goodiyaan", "Levitating"],
    "Groom's family": ["Despacito", "Kala Chashma", "Shape Of You"],
    "Couple dance": ["All Of Me", "Perfect", "Tum Se Hi"],
    "Grandparents & kids": ["Baby Shark (for the little ones)", "Bole Chudiyan"],
    Baraat: ["Jai Ho", "Kala Chashma"],
    "Finale (everyone)": ["Naatu Naatu", "Dance The Night"],
  },
};

const sangeetFinder: FreeTool = {
  slug: "sangeet-song-finder",
  name: "Sangeet Song Finder",
  emoji: "🎶",
  tagline: "A song for every moment, matched to how confident your dancers are.",
  description:
    "Pick your performance moments and your family's vibe. You get a moment-by-moment song list, running order, timings and a realistic rehearsal plan.",
  output: "Song list + running order + rehearsal plan",
  minutes: 2,
  seoTitle: "Sangeet Song List Generator — Free Dance Song Ideas by Moment | Vowz",
  seoDescription:
    "Free sangeet song finder. Choose your moments and vibe and get a printable sangeet song list, running order and rehearsal plan. No sign-up needed.",
  keywords: ["sangeet songs list", "sangeet dance songs", "bride entry song", "baraat songs", "wedding dance playlist india"],
  fields: [
    { id: "moments", label: "Which moments need a song?", type: "multiselect", required: true, options: ["Bride entry", "Groom entry", "Bride's family", "Groom's family", "Couple dance", "Grandparents & kids", "Baraat", "Finale (everyone)"] },
    { id: "vibe", label: "Your family's vibe", type: "select", required: true, options: Object.keys(SONGS) },
    { id: "level", label: "How much have your dancers practised?", type: "select", required: true, options: ["Never danced before", "A few rehearsals", "Confident performers"] },
    { id: "length", label: "How long should the whole performance run?", type: "select", options: ["30 minutes", "45 minutes", "60 minutes", "90 minutes"] },
  ],
  compute: (a) => {
    const vibe = a.vibe || "Bollywood classic";
    const bank = SONGS[vibe] || SONGS["Bollywood classic"];
    const moments = arr(a.moments).length ? arr(a.moments) : ["Bride entry", "Couple dance", "Finale (everyone)"];
    const level = a.level || "A few rehearsals";
    const totalMin = parseInt(a.length || "45", 10);
    const perAct = Math.max(2, Math.floor(totalMin / Math.max(1, moments.length)));
    const cut = level === "Never danced before" ? "90 seconds" : level === "A few rehearsals" ? "2 minutes" : "2.5–3 minutes";

    const blocks: ToolBlock[] = moments.map((mo, i) => ({
      heading: `${i + 1}. ${mo}`,
      items: (bank[mo] || bank["Finale (everyone)"] || []).map((s, j) => `${j === 0 ? "★ First choice: " : "Backup: "}${s}`),
      note: `Roughly ${perAct} minutes on stage. Cut each track to ${cut}.`,
    }));

    blocks.push({
      heading: "Running order that actually works",
      items: [
        "Open with the highest-energy group act — never open with a slow couple dance.",
        "Alternate: group act → duo or solo → group act. It keeps the room awake.",
        "Put the grandparents and kids third or fourth, while everyone is still seated and watching.",
        "The couple's dance goes second-last, right before the finale.",
        "Finish with one song where everybody is pulled onto the floor.",
      ],
    });

    blocks.push({
      heading: "Rehearsal plan",
      items:
        level === "Never danced before"
          ? [
              "4 weeks out: pick songs and lock the running order. Do not change them after this.",
              "3 weeks out: one choreographer session per group. Keep the steps to 6 repeatable moves.",
              "2 weeks out: two rehearsals. Record on a phone and watch it back — it fixes more than any correction.",
              "1 week out: full run in order, in the shoes you will actually wear.",
              "Day before: one relaxed run-through at the venue if you can get access.",
            ]
          : level === "A few rehearsals"
            ? [
                "3 weeks out: lock songs and the order.",
                "2 weeks out: two full rehearsals with the real music edit.",
                "1 week out: run-through with entries and exits, timed.",
                "Day before: sound check with the DJ using your exact audio file.",
              ]
            : [
                "2 weeks out: lock songs, hand the final audio to the DJ as one continuous file.",
                "1 week out: full dress run with entries, exits and lighting cues.",
                "Day before: stage and sound check at the venue.",
              ],
      note: "Send the DJ one single audio file with all the edits already in it, in the exact order. This one step prevents most sangeet disasters.",
    });

    blocks.push({
      heading: "Tell the DJ",
      items: [
        "Provide the final edited audio at least 48 hours before, and carry a copy on a pen drive and on a phone.",
        "Agree hand signals for 'start', 'cut the music' and 'go louder'.",
        "Ask for a wireless mic for the compere and a stage monitor so dancers can hear.",
        "Confirm what happens if the power trips — is there a generator on standby?",
      ],
    });

    return {
      headline: `${vibe} sangeet — ${moments.length} acts, ${totalMin} minutes`,
      summary: `A moment-by-moment song list for a ${vibe.toLowerCase()} sangeet, sized for dancers who are ${level.toLowerCase()}.`,
      blocks,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────
// 3. Vendor Question List
// ─────────────────────────────────────────────────────────────────────────
const VENDOR_Q: Record<string, { questions: string[]; redFlags: string[]; contract: string[] }> = {
  Photographer: {
    questions: [
      "Will the photographer we meet today be the person shooting our wedding? Name them in the contract.",
      "How many photographers and videographers are in the team per function?",
      "How many edited photos do we get, and how many raw files?",
      "What is the delivery timeline for the teaser, the full album and the film?",
      "Can we see one complete wedding gallery, not just highlights?",
      "What happens if the lead photographer falls ill?",
      "How many hours per function are included, and what is the overtime rate?",
      "Do you charge for travel, stay and food for the team?",
      "Do we get printing rights and a physical album?",
      "How long do you keep our backups?",
    ],
    redFlags: [
      "Only shows a highlight reel and refuses to share a full wedding gallery.",
      "Won't name the actual shooters in the contract.",
      "No mention of a backup camera body or backup drives.",
      "Delivery timeline is vague — 'a few months'.",
    ],
    contract: ["Named lead shooter", "Exact deliverables and counts", "Delivery dates with a penalty clause", "Overtime rate per hour", "Backup and data-retention policy", "Cancellation and refund terms"],
  },
  Caterer: {
    questions: [
      "What is the final per-plate cost including GST, service charge and transport?",
      "Is a tasting included, and how many people can attend?",
      "How many service staff per 100 guests?",
      "When is the final headcount cut-off, and what is the charge if the count rises on the day?",
      "Are live counters, extra hours and a second serving line included?",
      "Who supplies crockery, chafing dishes and the buffet decor?",
      "How do you handle Jain, vegan, halal and allergy requests?",
      "What is your plan when a dish runs out mid-service?",
      "Can untouched surplus food be donated?",
    ],
    redFlags: ["Refuses a tasting", "Price quoted without taxes", "Vague staff numbers", "No written menu"],
    contract: ["Locked per-plate price with taxes", "Exact menu, dish by dish", "Staff count", "Headcount cut-off time", "Overtime and extra-plate rate"],
  },
  Venue: {
    questions: [
      "What exactly is included — chairs, tables, generator, parking, rooms, sound?",
      "What time can our decorator enter, and what time must everything be out?",
      "Is there a noise cut-off time or a licence needed for music after 10pm?",
      "Are outside caterers and decorators allowed, or is there a royalty fee?",
      "How much power is available in kVA, and is there a backup generator?",
      "How many parking spaces, and is valet included?",
      "How many bathrooms, and are they cleaned during the event?",
      "What is the wet-weather plan for an outdoor area?",
      "What is the cancellation and date-change policy?",
    ],
    redFlags: ["'Royalty' charges revealed late", "No written setup and teardown times", "No backup power", "No written wet-weather plan"],
    contract: ["Inclusions list", "Setup and vacate times", "Power and generator", "Royalty or outside-vendor fees", "Date-change policy"],
  },
  Decorator: {
    questions: [
      "Can we see a real photo of this exact setup at a past wedding, not a reference image?",
      "Are the flowers fresh or artificial, and which ones exactly?",
      "What is the size of the stage, mandap and entrance in feet?",
      "How many hours before the event will setup be finished?",
      "Is lighting, draping, sound and power distribution included?",
      "What is the cost if we add a second entrance or extend the stage later?",
      "Who removes everything afterwards, and when?",
    ],
    redFlags: ["Only shows Pinterest-style reference images", "No dimensions in the quote", "Setup finishing 'just before' guests arrive"],
    contract: ["Itemised list with quantities", "Flower type and quantity", "Setup completion time", "Change-of-scope pricing"],
  },
  "Makeup artist": {
    questions: [
      "Is a trial included, and when can we do it?",
      "Which brands do you use, and are they suitable for sensitive skin?",
      "How long will you take per function, and how many people can you do?",
      "Will you stay for touch-ups, and until what time?",
      "Do you travel to the venue, and is travel and stay charged extra?",
      "Do you bring an assistant for the family's hair and makeup?",
    ],
    redFlags: ["No trial offered", "Cannot name products", "One artist promising 8 faces before 8am"],
    contract: ["Trial included or priced", "Arrival time per function", "Touch-up hours", "Number of additional faces included"],
  },
  "DJ / Band": {
    questions: [
      "What sound and lighting equipment is included, in writing?",
      "Do you provide wireless mics for the compere and speeches?",
      "Will you play our exact sangeet audio file, and can we do a sound check?",
      "What is the noise cut-off at our venue, and have you worked there before?",
      "Is a backup mixer and power backup available?",
      "What is the overtime rate after the agreed end time?",
    ],
    redFlags: ["No sound check offered", "No backup equipment", "Won't accept your own audio edit"],
    contract: ["Equipment list", "Sound-check slot", "End time and overtime rate", "Backup equipment clause"],
  },
  "Mehendi artist": {
    questions: [
      "Is the henna natural, and how many hours before will you apply it for the darkest colour?",
      "How many hours will the bridal design take?",
      "How many assistants come for the guests, and how many guests can they cover per hour?",
      "Do you charge per hour, per guest, or a flat fee?",
      "Can we see photos of bridal work you did personally?",
    ],
    redFlags: ["Chemical 'black henna'", "One artist for 100 guests", "No bridal portfolio of their own"],
    contract: ["Bridal design time", "Number of assistants", "Guest coverage per hour", "Natural henna guarantee"],
  },
  Videographer: {
    questions: [
      "Do we get a teaser, a highlight film and a full-length film? How long is each?",
      "Do you shoot with drones, and do you handle permissions?",
      "How many camera operators per function?",
      "Do you record the ceremony audio separately with a lapel mic?",
      "What is the delivery timeline for each deliverable?",
    ],
    redFlags: ["No separate audio recording", "Single operator for a full wedding", "No sample full-length film"],
    contract: ["Deliverables and lengths", "Crew size", "Delivery dates", "Drone permissions responsibility"],
  },
  "Wedding planner": {
    questions: [
      "Is your fee a flat amount or a percentage of the total budget?",
      "Do you take commissions from vendors? Disclose them.",
      "Who from your team will be physically present on each day?",
      "How many weddings are you handling on our dates?",
      "Will you give us the vendor contracts directly?",
      "What is your escalation plan when something goes wrong on the day?",
    ],
    redFlags: ["Won't disclose vendor commissions", "Handling several weddings the same weekend", "Refuses to share direct vendor contracts"],
    contract: ["Fee structure", "Commission disclosure", "Named on-site team", "Scope: what is not included"],
  },
};

const vendorQuestions: FreeTool = {
  slug: "vendor-question-list",
  name: "Vendor Question List",
  emoji: "📋",
  tagline: "The questions that save you money — before you pay the advance.",
  description:
    "Choose a vendor and get the exact questions to ask, the red flags to walk away from, and the clauses that must be in the contract.",
  output: "Question list + red flags + contract checklist",
  minutes: 2,
  seoTitle: "Questions to Ask Wedding Vendors — Free Printable Checklist | Vowz",
  seoDescription:
    "Free list of questions to ask your wedding photographer, caterer, venue, decorator and DJ, plus red flags and contract must-haves. No sign-up.",
  keywords: ["questions to ask wedding photographer", "wedding vendor checklist", "wedding venue questions", "caterer questions india"],
  fields: [
    { id: "vendor", label: "Which vendor are you meeting?", type: "select", required: true, options: Object.keys(VENDOR_Q) },
    { id: "stage", label: "Where are you in the process?", type: "select", options: ["First enquiry", "Comparing quotes", "About to pay the advance"] },
    { id: "worries", label: "What worries you most?", type: "multiselect", options: ["Hidden charges", "Quality not matching the sample", "Overtime charges", "Cancellation & refunds", "Late delivery", "Team swapped on the day"] },
  ],
  compute: (a) => {
    const vendor = a.vendor || "Photographer";
    const v = VENDOR_Q[vendor] || VENDOR_Q.Photographer;
    const worries = arr(a.worries);
    const stage = a.stage || "First enquiry";

    const blocks: ToolBlock[] = [
      { heading: `Ask your ${vendor.toLowerCase()} these`, items: v.questions },
      { heading: "Walk away if you see this", items: v.redFlags },
      { heading: "Must be written into the contract", items: v.contract },
    ];

    if (worries.length) {
      const extra: Record<string, string> = {
        "Hidden charges": "Ask for one final figure that includes taxes, travel, stay, food for the crew and overtime. Get it on the quote, not on WhatsApp.",
        "Quality not matching the sample": "Ask to see one full, unedited job from the last three months — not a curated highlight.",
        "Overtime charges": "Fix the per-hour overtime rate in writing and note the exact agreed end time.",
        "Cancellation & refunds": "Ask what you get back if you cancel 90, 30 and 7 days out, and what happens if they cancel on you.",
        "Late delivery": "Add a delivery date with a penalty — even a small one changes behaviour.",
        "Team swapped on the day": "Name the individuals in the contract and add a clause that any substitute must be agreed by you in writing.",
      };
      blocks.push({ heading: "Because of what worries you", items: worries.map((w) => extra[w]).filter(Boolean) });
    }

    blocks.push({
      heading: stage === "About to pay the advance" ? "Before you transfer money" : "Payment discipline",
      items: [
        "Never pay more than 25–30% as the booking advance.",
        "Pay to a business account, not a personal UPI, and always take a receipt with GST if applicable.",
        "Keep the final 20% payable only after delivery.",
        "Put the full payment schedule with dates in the contract.",
        "Save every WhatsApp confirmation — screenshots have settled many disputes.",
      ],
    });

    return {
      headline: `${vendor} — what to ask before you book`,
      summary: `${v.questions.length} questions, ${v.redFlags.length} red flags and the contract clauses that protect you.`,
      blocks,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────
// 4. Ritual Explainer
// ─────────────────────────────────────────────────────────────────────────
const FAITH_CHOICES = ["Hindu", "Muslim · Nikah", "Sikh · Anand Karaj", "Christian"];
const FAITH_KEY: Record<string, string> = {
  Hindu: "hindu",
  "Muslim · Nikah": "muslim",
  "Sikh · Anand Karaj": "sikh",
  Christian: "christian",
};

const ritualExplainer: FreeTool = {
  slug: "wedding-ritual-explainer",
  name: "Wedding Ritual Explainer",
  emoji: "🪔",
  tagline: "Explain every ceremony to guests who have never attended one.",
  description:
    "Pick your traditions and get a plain-English explanation of each ritual — what happens, what it means, what to wear and how long it lasts. Print it, WhatsApp it, or put it straight on your wedding website.",
  output: "Guest-friendly ceremony guide",
  minutes: 2,
  seoTitle: "Indian Wedding Rituals Explained for Guests — Free Guide Maker | Vowz",
  seoDescription:
    "Free ritual explainer for Hindu, Muslim, Sikh and Christian weddings. Generate a printable guest guide to Haldi, Mehendi, Nikah, Pheras and Anand Karaj. No sign-up.",
  keywords: ["indian wedding rituals explained", "hindu wedding ceremony meaning", "nikah ceremony explained", "anand karaj explained", "haldi ceremony meaning"],
  fields: [
    { id: "faith", label: "Which tradition is your wedding?", type: "select", required: true, options: FAITH_CHOICES },
    { id: "rituals", label: "Which ceremonies do you want explained?", type: "multiselect", options: [], help: "Choose the ones on your invitation. Leave blank for the usual set." },
    { id: "audience", label: "Who is this for?", type: "select", options: ["Guests new to our traditions", "Guests travelling from abroad", "Everyone on the guest list"] },
  ],
  compute: (a) => {
    const faithKey = FAITH_KEY[a.faith] || "hindu";
    const chosen = arr(a.rituals);
    const pool: Ritual[] = RITUALS.filter((r) => r.faith === faithKey || r.faith === "common");
    const list = chosen.length ? pool.filter((r) => chosen.includes(r.name)) : pool.slice(0, 9);
    const audience = a.audience || "Guests new to our traditions";

    const blocks: ToolBlock[] = list.map((r) => ({
      heading: `${r.emoji} ${r.name}${r.alt ? ` (${r.alt})` : ""}`,
      text: r.description,
      items: [
        `What it means in one line: ${r.short}`,
        r.dress ? `What to wear: ${r.dress}` : "What to wear: festive clothing.",
        r.duration ? `How long: ${r.duration}` : "How long: about an hour.",
        `Guest tip: ${r.guestTip}`,
      ],
    }));

    blocks.push({
      heading: audience === "Guests travelling from abroad" ? "Extra notes for guests flying in" : "General notes for guests",
      items:
        audience === "Guests travelling from abroad"
          ? [
              "Indian weddings run over several days — check which functions your invitation covers.",
              "Timings often shift by an hour. Arrive for the ceremony times exactly, and relax about the parties.",
              "Remove shoes before entering a temple, gurdwara or mosque, and cover your head where asked.",
              "Cash gifts in an envelope are normal and welcome; ending the amount in 1 (₹501, ₹1,001) is considered auspicious.",
              "Do not wear white or black to a Hindu ceremony; avoid red at a Christian one — that is the bride's colour.",
            ]
          : [
              "Ceremony times are fixed by the priest — please be punctual for those.",
              "Photography is welcome except where the family asks you to pause.",
              "Cash gifts in an envelope are the norm; the family will have a gift table.",
              "Tell the family in advance about any dietary needs.",
            ],
    });

    return {
      headline: `${a.faith || "Hindu"} wedding — ceremonies explained`,
      summary: `${list.length} ceremonies explained in plain language, with dress codes, timings and guest tips.`,
      blocks,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────
// 5. Hidden Cost Check
// ─────────────────────────────────────────────────────────────────────────
const HIDDEN_COSTS: { label: string; pct: number; note: string; key: string }[] = [
  { key: "GST & service charges", label: "GST and service charges", pct: 0.09, note: "Venue, catering and decor are usually quoted before tax. 18% GST on many services adds up fast." },
  { key: "Vendor travel, stay & food", label: "Vendor travel, stay and food", pct: 0.03, note: "Photographers, makeup artists and planners charge for travel, hotel rooms and crew meals." },
  { key: "Overtime charges", label: "Overtime charges", pct: 0.03, note: "Indian weddings always run late. Venue, DJ and photography overtime is billed by the hour." },
  { key: "Extra plates on the day", label: "Extra plates on the day", pct: 0.05, note: "Uninvited guests, drivers and vendor staff eat too — budget 10% more plates than your confirmed count." },
  { key: "Tips & staff gratuity", label: "Tips and staff gratuity", pct: 0.015, note: "Venue staff, drivers, band, priest and helpers — keep envelopes ready in cash." },
  { key: "Priest, rituals & puja items", label: "Priest, rituals and puja items", pct: 0.02, note: "Dakshina, samagri, flowers, coconuts and the fees for smaller ceremonies at home." },
  { key: "Gifts for the other family", label: "Gifts for the other family and guests", pct: 0.04, note: "Milni gifts, return gifts, welcome hampers for outstation guests." },
  { key: "Transport & valet", label: "Guest transport, parking and valet", pct: 0.02, note: "Buses between hotel and venue, valet, fuel and driver allowances." },
  { key: "Last-minute decor add-ons", label: "Last-minute decor add-ons", pct: 0.03, note: "The second entrance, the extra flower wall, the selfie corner — always added in the final week." },
  { key: "Outfit alterations & accessories", label: "Outfit alterations and accessories", pct: 0.025, note: "Fittings, blouse stitching, footwear, dupatta setting, jewellery rental and safety pins by the hundred." },
  { key: "Trials & pre-wedding shoot", label: "Trials and pre-wedding shoot", pct: 0.02, note: "Makeup trials, menu tastings, outfit rentals and location fees for the pre-wedding shoot." },
  { key: "Power backup & generators", label: "Power backup and generators", pct: 0.015, note: "Outdoor venues almost always need a hired generator and fuel, billed separately." },
];

const hiddenCostCheck: FreeTool = {
  slug: "hidden-wedding-cost-check",
  name: "Hidden Cost Check",
  emoji: "🧾",
  tagline: "Find the 15–25% of your wedding budget nobody quotes you.",
  description:
    "Enter your budget and what you have already accounted for. We show you the costs that appear in the final two weeks, what they typically add up to, and a realistic revised budget.",
  output: "Hidden-cost estimate + revised budget split",
  minutes: 3,
  seoTitle: "Hidden Wedding Costs Calculator India — Free Budget Reality Check | Vowz",
  seoDescription:
    "Free hidden wedding cost calculator. See the GST, overtime, extra plates, tips and last-minute costs most couples forget, and get a realistic revised budget. No sign-up.",
  keywords: ["hidden wedding costs", "indian wedding budget calculator", "wedding budget breakdown india", "how much does an indian wedding cost"],
  fields: [
    { id: "budget", label: "Your total wedding budget (₹)", type: "number", placeholder: "1500000", required: true },
    { id: "guests", label: "Expected guests", type: "number", placeholder: "300", required: true },
    { id: "city", label: "Where is the wedding?", type: "select", required: true, options: ["Metro (Mumbai, Delhi, Bengaluru)", "Tier-2 city", "Home town / small town", "Destination (out of state)"] },
    { id: "covered", label: "Which of these have you already budgeted for?", type: "multiselect", options: HIDDEN_COSTS.map((h) => h.key) },
  ],
  compute: (a) => {
    const budget = num(a.budget, 1000000);
    const guests = num(a.guests, 250);
    const covered = arr(a.covered);
    const city = a.city || "Tier-2 city";
    const cityMult = city.startsWith("Metro") ? 1.25 : city.startsWith("Destination") ? 1.35 : city.startsWith("Tier-2") ? 1 : 0.85;

    const missing = HIDDEN_COSTS.filter((h) => !covered.includes(h.key));
    const rows = missing.map((h) => {
      const amt = budget * h.pct * cityMult;
      return { ...h, amt };
    });
    const hiddenTotal = rows.reduce((s, r) => s + r.amt, 0);
    const revised = budget + hiddenTotal;
    const perGuest = revised / Math.max(1, guests);

    const split: [string, number][] = [
      ["Venue & stay", 0.2],
      ["Catering", 0.28],
      ["Decor & flowers", 0.13],
      ["Photography & video", 0.11],
      ["Outfits & jewellery rental", 0.1],
      ["Music, DJ & entertainment", 0.05],
      ["Makeup & grooming", 0.04],
      ["Invitations & website", 0.02],
      ["Transport & logistics", 0.03],
      ["Buffer (keep untouched)", 0.04],
    ];

    return {
      headline: `${inr(hiddenTotal)} of costs you have not budgeted yet`,
      summary: `On a ${inr(budget)} budget in a ${city.toLowerCase()} wedding, expect roughly ${inr(hiddenTotal)} in costs that are not in any quote — about ${Math.round((hiddenTotal / budget) * 100)}% extra.`,
      blocks: [
        {
          heading: "Costs missing from your budget",
          items: rows.length
            ? rows.map((r) => `${r.label} — around ${inr(r.amt)}. ${r.note}`)
            : ["Nothing missing — you have accounted for all the usual surprises. That is rare, well done."],
        },
        {
          heading: "Your realistic numbers",
          items: [
            `Budget you planned: ${inr(budget)}`,
            `Likely hidden costs: ${inr(hiddenTotal)}`,
            `Realistic total: ${inr(revised)}`,
            `Real cost per guest: ${inr(perGuest)} — cutting 20 guests saves you about ${inr(perGuest * 20)}.`,
          ],
          note: "The single fastest way to cut an Indian wedding budget is the guest list, not the decor.",
        },
        {
          heading: `Suggested split of ${inr(revised)}`,
          items: split.map(([k, p]) => `${k}: ${inr(revised * p)} (${Math.round(p * 100)}%)`),
        },
        {
          heading: "Three rules that keep budgets honest",
          items: [
            "Ask every vendor for one final figure including taxes, travel and overtime — refuse quotes without it.",
            "Keep 5% of the budget in a separate account and do not touch it until the last week.",
            "Track payments the moment you make them. Most overspends are simply forgotten advances.",
          ],
        },
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────
// 6. Guest Message Writer
// ─────────────────────────────────────────────────────────────────────────
const guestMessageWriter: FreeTool = {
  slug: "guest-message-writer",
  name: "Guest Message Writer",
  emoji: "💬",
  tagline: "Ready-to-send WhatsApp wording for every wedding announcement.",
  description:
    "Save the date, invitation, RSVP nudge, travel details, thank-you notes — written in your tone and language, ready to copy into WhatsApp.",
  output: "3 copy-paste WhatsApp messages",
  minutes: 2,
  seoTitle: "Wedding WhatsApp Message Writer — Free Invitation Wording | Vowz",
  seoDescription:
    "Free wedding message generator. Get save-the-date, invitation, RSVP reminder and thank-you wording for WhatsApp in English, Hindi or Hinglish. No sign-up.",
  keywords: ["wedding invitation message whatsapp", "save the date message", "wedding rsvp reminder message", "wedding thank you message"],
  fields: [
    { id: "purpose", label: "What are you sending?", type: "select", required: true, options: ["Save the date", "Wedding invitation", "RSVP reminder", "Travel & logistics", "Thank you after the wedding", "Change of plan"] },
    { id: "tone", label: "Tone", type: "select", required: true, options: ["Warm & traditional", "Short & modern", "Playful", "Formal"] },
    { id: "language", label: "Language", type: "select", required: true, options: ["English", "Hinglish", "English + Hindi (both)"] },
    { id: "names", label: "Couple's names", type: "text", placeholder: "Aarav & Priya", required: true },
    { id: "date", label: "Wedding date", type: "text", placeholder: "14 February 2027" },
    { id: "venue", label: "Venue / city", type: "text", placeholder: "Taj Lake Palace, Udaipur" },
    { id: "link", label: "Your wedding website link", type: "text", placeholder: "vowz.me/site/aarav-priya" },
  ],
  compute: (a) => {
    const names = a.names || "Aarav & Priya";
    const date = a.date || "our wedding day";
    const venue = a.venue || "the venue";
    const link = a.link ? String(a.link) : "";
    const linkLine = link ? `\n\nAll details & RSVP: ${link}` : "";
    const purpose = a.purpose || "Wedding invitation";
    const tone = a.tone || "Warm & traditional";
    const lang = a.language || "English";

    const en: Record<string, string[]> = {
      "Save the date": [
        `Save the date! 💍\n\n${names} are getting married on ${date} at ${venue}.\n\nFormal invitation to follow — for now, please keep the date free. We cannot imagine the day without you.${linkLine}`,
        `It's official — ${names}, ${date}. 🎉\n\n${venue}. Block your calendar, book your leave, start choosing the outfit.${linkLine}`,
        `With joy in our hearts, we ask you to save ${date} for the wedding of ${names} at ${venue}. Your blessings mean everything to us.${linkLine}`,
      ],
      "Wedding invitation": [
        `With the blessings of our families, we invite you to the wedding of ${names} on ${date} at ${venue}.\n\nYour presence would make our celebration complete. 🙏${linkLine}`,
        `You're invited! 💐\n\n${names} • ${date} • ${venue}\n\nFunction timings, directions and RSVP are all on our wedding page.${linkLine}`,
        `Two families, one celebration. ${names} are tying the knot on ${date} at ${venue}, and we would love for you to be there.${linkLine}`,
      ],
      "RSVP reminder": [
        `A gentle reminder 💐 — we're finalising numbers with the caterer this week. If you haven't confirmed yet, please do let us know whether you can join us on ${date}.${linkLine}`,
        `Hi! Just a quick nudge — could you confirm your RSVP for ${names}' wedding? It takes 30 seconds and helps us plan seating and food.${linkLine}`,
        `We'd hate to miss you. RSVPs close soon for ${date} — please confirm when you get a moment. 🙏${linkLine}`,
      ],
      "Travel & logistics": [
        `Travel details for ${names}' wedding 🧳\n\nDates: ${date}\nVenue: ${venue}\n\nNearest airport, hotel options, function timings and directions are all on our wedding page. Do tell us your arrival time so we can arrange pick-up.${linkLine}`,
        `Getting to us: ${venue}, ${date}. Hotel block, shuttle timings and a map are on the website — please check before you book.${linkLine}`,
        `A quick note for our outstation guests — please share your travel dates with us so we can plan your stay and transfers. All the information is here.${linkLine}`,
      ],
      "Thank you after the wedding": [
        `Thank you 💕\n\nHaving you at our wedding meant more to us than we can put into words. Thank you for your blessings, your presence and your love.\n\n— ${names}`,
        `From both our families — thank you for celebrating with us on ${date}. The photos are up on our page, do have a look and add yours.${linkLine}`,
        `We're still recovering from the dancing. 😄 Thank you for making our wedding what it was.\n\nWith love, ${names}`,
      ],
      "Change of plan": [
        `An important update about ${names}' wedding 🙏\n\nThere has been a change to the plan for ${date}. Please check the latest timings and venue details on our page before you travel. Apologies for the short notice.${linkLine}`,
        `Please note a change: the details for ${date} at ${venue} have been updated. The website always carries the latest version.${linkLine}`,
        `Small change of plan for the wedding — everything is updated online. Do have a quick look, and call us if anything is unclear.${linkLine}`,
      ],
    };

    let msgs = en[purpose] || en["Wedding invitation"];

    if (tone === "Short & modern") msgs = msgs.map((m) => m.split("\n\n").slice(0, 2).join("\n\n"));
    if (tone === "Playful") msgs = msgs.map((m) => m + "\n\n(Bring your dancing shoes. You have been warned. 💃)");
    if (tone === "Formal") msgs = msgs.map((m) => m.replace(/😄|🎉|💃/g, "").replace(/Hi!/g, "Dear guest,"));

    const hindiVersions: Record<string, string> = {
      "Save the date": `${names} की शादी ${date} को ${venue} में तय हुई है। कृपया यह तारीख़ अपने लिए सुरक्षित रखें — आपकी उपस्थिति हमारे लिए बहुत मायने रखती है। 🙏`,
      "Wedding invitation": `सादर निमंत्रण 🙏\n\n${names} के विवाह समारोह में ${date} को ${venue} पर आपका सपरिवार स्वागत है। आपके आशीर्वाद की प्रतीक्षा में।`,
      "RSVP reminder": `नमस्ते 🙏 कृपया बता दीजिए कि आप ${date} को हमारे साथ शामिल हो पाएँगे या नहीं — इससे हमें व्यवस्था करने में सुविधा होगी।`,
      "Travel & logistics": `यात्रा की जानकारी: ${venue}, ${date}. ठहरने और आने-जाने की पूरी जानकारी हमारी वेबसाइट पर उपलब्ध है।`,
      "Thank you after the wedding": `हमारे विवाह में शामिल होने और आशीर्वाद देने के लिए हृदय से धन्यवाद। 🙏\n— ${names}`,
      "Change of plan": `सूचना: ${date} के कार्यक्रम में कुछ बदलाव हुआ है। कृपया आने से पहले नई जानकारी अवश्य देख लें। 🙏`,
    };

    const blocks: ToolBlock[] = msgs.map((m, i) => ({
      heading: `Option ${i + 1}`,
      text: lang === "Hinglish" ? m.replace(/Thank you/g, "Thank you so much").replace(/blessings/g, "aashirwad") : m,
    }));

    if (lang === "English + Hindi (both)") {
      blocks.push({ heading: "हिन्दी संस्करण", text: hindiVersions[purpose] + (link ? `\n\n${link}` : "") });
    }

    blocks.push({
      heading: "Sending tips",
      items: [
        "Send to small groups, not one giant broadcast — WhatsApp limits broadcast lists to 256 contacts.",
        "Always include one link where the details live, so a change of plan does not mean 300 new messages.",
        "Send the invitation 6–8 weeks before, the RSVP reminder 3 weeks before, and travel details 10 days before.",
        "Address elders individually. A forwarded group message to an uncle is remembered for years.",
      ],
    });

    return {
      headline: `${purpose} — ready to send`,
      summary: `Three versions in a ${tone.toLowerCase()} tone that you can copy straight into WhatsApp.`,
      blocks,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────
// 7. Final Week Checklist
// ─────────────────────────────────────────────────────────────────────────
const finalWeekChecklist: FreeTool = {
  slug: "final-week-wedding-checklist",
  name: "Final Week Checklist",
  emoji: "✅",
  tagline: "A day-by-day plan for the seven days that decide everything.",
  description:
    "The last week is when things break. Get a dated, hour-by-hour checklist from seven days out to the morning after, built around your functions.",
  output: "Dated day-by-day checklist",
  minutes: 2,
  seoTitle: "Wedding Week Checklist — Free Day-by-Day Plan for the Last 7 Days | Vowz",
  seoDescription:
    "Free final-week wedding checklist. A dated day-by-day plan from seven days out to the morning after, built around your functions. No sign-up.",
  keywords: ["wedding week checklist", "final week wedding to do list", "wedding day timeline", "indian wedding checklist"],
  fields: [
    { id: "date", label: "Main wedding date", type: "date", required: true },
    { id: "functions", label: "Functions in the final week", type: "multiselect", options: ["Haldi", "Mehendi", "Sangeet", "Wedding ceremony", "Reception", "Walima", "Next-day brunch"] },
    { id: "role", label: "Who is this checklist for?", type: "select", options: ["Bride", "Groom", "Parent / family", "Friend running the show"] },
    { id: "outstation", label: "Are outstation guests coming?", type: "select", options: ["Yes, many", "A few", "No"] },
  ],
  compute: (a) => {
    const base = a.date ? new Date(a.date) : new Date(Date.now() + 7 * 864e5);
    const fmt = (offset: number) => {
      const d = new Date(base.getTime() + offset * 864e5);
      return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    };
    const functions = arr(a.functions);
    const outstation = a.outstation || "A few";
    const role = a.role || "Bride";

    const blocks: ToolBlock[] = [
      {
        heading: `7 days out — ${fmt(-7)}`,
        items: [
          "Confirm the final guest count with the caterer in writing.",
          "Call every vendor and re-confirm arrival time, contact person and what they are bringing.",
          "Send the final schedule to both families on one WhatsApp group.",
          outstation !== "No" ? "Share hotel, pickup and shuttle details with outstation guests." : "Confirm local guest transport and parking.",
          "Withdraw the cash you will need for tips and last-minute payments, and split it into labelled envelopes.",
          "Charge and test every power bank, camera and speaker you own.",
        ],
      },
      {
        heading: `6 days out — ${fmt(-6)}`,
        items: [
          "Final outfit trial for every function — with the shoes, jewellery and dupatta pinned as they will be worn.",
          "Pack a separate bag per function, labelled, with accessories inside.",
          "Give the photographer your must-have shot list and family group list.",
          "Confirm the priest, timings and the list of puja items someone must buy.",
        ],
      },
      {
        heading: `5 days out — ${fmt(-5)}`,
        items: [
          "Hand over responsibilities: one person for vendors, one for guests, one for cash and gifts. Write the names down.",
          "Print the schedule, vendor contacts and seating notes — phones die, paper does not.",
          "Confirm makeup artist arrival time for every function, working backwards from when you must be ready.",
          "Check the wet-weather plan if anything is outdoors.",
        ],
      },
      {
        heading: `4 days out — ${fmt(-4)}`,
        items: [
          "Last salon appointments: hair, nails, facial. Nothing new or experimental this close.",
          "Sangeet full run-through in the actual shoes, with the final audio file.",
          "Hand the DJ the final audio on a pen drive and email it as backup.",
          "Confirm decor setup and vacate times with the venue in writing.",
        ],
      },
      {
        heading: `3 days out — ${fmt(-3)}`,
        items: [
          "Pay any remaining advances and collect receipts.",
          "Assemble welcome hampers and return gifts, and count them against the guest list.",
          "Pack an emergency kit: safety pins, double-sided tape, painkillers, band-aids, stain remover, needle and thread, a phone charger, a snack bar.",
          "Start sleeping properly. Everything from here is better on rest.",
        ],
      },
      {
        heading: `2 days out — ${fmt(-2)}`,
        items: [
          "Mehendi day for many couples — eat properly before, and keep your phone somewhere someone else can answer it.",
          "Do a venue walkthrough with the decorator and the venue manager together.",
          "Confirm that every vendor has the venue address pinned, and the on-site contact number.",
          "Keep the wedding-day outfit hanging, steamed and untouched.",
        ],
      },
      {
        heading: `1 day out — ${fmt(-1)}`,
        items: [
          functions.includes("Sangeet") ? "Sangeet tonight — finish by midnight, however good it is." : "Keep tonight light. No new plans.",
          "Lay out tomorrow's outfit, jewellery, footwear and documents in one place.",
          "Hand the cash envelopes and the vendor list to the person managing payments.",
          "Set three alarms. Ask one person to physically wake you.",
          "Drink water, eat dinner, and be in bed by 11pm. This is the single best decision of the week.",
        ],
      },
      {
        heading: `Wedding day — ${fmt(0)}`,
        items: [
          "Eat breakfast. Every couple who skips it regrets it by the pheras.",
          "Keep your phone with one trusted person, not with you.",
          "Makeup and dressing: start earlier than you think, it always overruns by 45 minutes.",
          "Take five minutes alone together before the ceremony. You will remember that more than the decor.",
          "Assign one person to collect gifts, envelopes and the cake knife at the end of the night.",
        ],
      },
      {
        heading: `The morning after — ${fmt(1)}`,
        items: [
          "Collect outfits, jewellery and rented items and return what must go back.",
          "Settle final vendor payments and take receipts.",
          "Ask the photographer for the teaser timeline in writing.",
          "Open your wedding album page so guests can upload their photos while they still remember to.",
          "Send a thank-you message to everyone who helped. Then sleep.",
        ],
      },
    ];

    if (role === "Friend running the show") {
      blocks.unshift({
        heading: "Your job in one line",
        text: "You are the buffer. Nobody should reach the couple with a problem in the last 48 hours — everything comes to you first, and only genuine decisions go to them.",
      });
    }

    return {
      headline: `Your final week — ${fmt(-7)} to ${fmt(1)}`,
      summary: `A dated plan for the last seven days, built around ${functions.length || "your"} function${functions.length === 1 ? "" : "s"}.`,
      blocks,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────
// 8. Wedding Day Timeline Planner
// ─────────────────────────────────────────────────────────────────────────
const dayTimeline: FreeTool = {
  slug: "wedding-day-timeline",
  name: "Wedding Day Timeline Planner",
  emoji: "⏱️",
  tagline: "An hour-by-hour plan for the wedding day you can print and hand to every vendor.",
  description:
    "Give us your ceremony time and what happens around it. You get a realistic hour-by-hour running order with buffers built in, plus who needs to be told what.",
  output: "Hour-by-hour running order",
  minutes: 3,
  seoTitle: "Free Wedding Day Timeline Planner (Hour by Hour) | Vowz",
  seoDescription:
    "Build a free hour-by-hour Indian wedding day timeline. Enter your muhurat or ceremony time and get a printable running order for the couple, family and vendors.",
  keywords: ["wedding day timeline", "wedding running order", "muhurat timeline", "indian wedding schedule", "wedding day plan"],
  fields: [
    { id: "ceremony", label: "Ceremony / muhurat start time", type: "text", placeholder: "19:30", required: true, help: "24-hour time works best, e.g. 19:30." },
    { id: "tradition", label: "Kind of ceremony", type: "select", options: ["Hindu", "Muslim · Nikah", "Sikh · Anand Karaj", "Christian", "Civil / registry"], required: true },
    { id: "baraat", label: "Is there a baraat or procession?", type: "select", options: ["Yes", "No"] },
    { id: "reception", label: "Reception on the same day?", type: "select", options: ["Yes", "No"] },
    { id: "photos", label: "Couple portrait session", type: "select", options: ["Before the ceremony", "After the ceremony", "Skip it"] },
    { id: "guests", label: "Guest count", type: "number", placeholder: "300" },
  ],
  compute: (a) => {
    const parse = (s: string) => {
      const m = String(s || "").match(/(\d{1,2})[:.\s]?(\d{2})?\s*(am|pm)?/i);
      if (!m) return 19 * 60 + 30;
      let h = Number(m[1]);
      const mi = Number(m[2] || 0);
      const ap = (m[3] || "").toLowerCase();
      if (ap === "pm" && h < 12) h += 12;
      if (ap === "am" && h === 12) h = 0;
      return ((h * 60 + mi) % 1440 + 1440) % 1440;
    };
    const fmt = (mins: number) => {
      const t = ((mins % 1440) + 1440) % 1440;
      const h = Math.floor(t / 60);
      const m = t % 60;
      const ap = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
    };

    const c = parse(a.ceremony);
    const guests = num(a.guests, 250);
    const big = guests > 350;
    const tradition = a.tradition || "Hindu";
    const rows: string[] = [];
    const at = (offset: number, what: string) => rows.push(`${fmt(c + offset)} — ${what}`);

    at(-300, "Bride's and groom's makeup and hair begin (allow 3 hours for the couple, 1 hour per family member).");
    at(-240, "Photographer and videographer arrive for getting-ready shots.");
    at(-210, "Decorator finishes the mandap/stage. Walk it yourself and check the lighting.");
    at(-180, "Caterer sets up. Confirm the final plate count in person, not on WhatsApp.");
    if (a.photos === "Before the ceremony") at(-150, "Couple portrait session (45 minutes, protected — nobody interrupts).");
    at(-120, "Guests start arriving. Welcome drinks and snacks open.");
    if (a.baraat === "Yes") {
      at(-90, "Baraat assembles at the gathering point. Band, horse or car ready.");
      at(-60, `Baraat procession begins${big ? " — allow 45 minutes, it always runs long with a big crowd" : ""}.`);
      at(-20, "Milni / welcome at the venue gate, garlands and family introductions.");
    } else {
      at(-45, "Family seated, ushers guide guests to the ceremony area.");
    }
    at(-10, "Couple in place. Sound check the mic one final time.");
    at(0, `${tradition === "Muslim · Nikah" ? "Nikah begins" : tradition === "Sikh · Anand Karaj" ? "Anand Karaj begins" : tradition === "Christian" ? "Church ceremony begins" : tradition === "Civil / registry" ? "Registry ceremony begins" : "Ceremony begins at the muhurat"}.`);
    const cerLen = tradition === "Muslim · Nikah" ? 45 : tradition === "Civil / registry" ? 30 : tradition === "Christian" ? 60 : 90;
    at(cerLen, "Ceremony ends. Blessings and immediate family photos.");
    if (a.photos === "After the ceremony") at(cerLen + 15, "Couple portrait session (45 minutes).");
    at(cerLen + 30, `Group photos with extended family — ${big ? "expect 60 minutes at this size" : "allow 40 minutes"}. Have a named list ready.`);
    at(cerLen + 60, "Dinner service opens. Couple eats first, quietly, before greeting tables.");
    if (a.reception === "Yes") {
      at(cerLen + 90, "Reception stage opens. Guest greetings and gifting line.");
      at(cerLen + 150, "Speeches, cake or first dance if you are having one.");
      at(cerLen + 210, "Music peaks — the last hour is when the dance floor actually fills.");
    }
    at(cerLen + (a.reception === "Yes" ? 260 : 150), "Vendors wind down. One family member stays back to settle payments and collect gifts.");
    at(cerLen + (a.reception === "Yes" ? 300 : 180), "Vidaai / farewell, then the couple leaves.");

    return {
      headline: `Your wedding day running order — ceremony at ${fmt(c)}`,
      summary: `Built backwards from your ceremony time for roughly ${guests} guests, with the buffers most timelines forget.`,
      blocks: [
        { heading: "Hour by hour", items: rows },
        {
          heading: "Give a copy to these people",
          items: [
            "Photographer and videographer — they plan their crew shifts around it.",
            "Caterer — so dinner opens when guests are actually free, not mid-ceremony.",
            "Decorator and sound/DJ team — setup deadlines are the ones that slip.",
            "Two family coordinators, one on each side, who answer vendor calls instead of you.",
            "Makeup artist — the earliest call time on the sheet is theirs.",
          ],
        },
        {
          heading: "Where days usually run late",
          items: [
            "Makeup runs over. Add 30 minutes to whatever the artist promises.",
            "The baraat starts late almost every time. Announce it 30 minutes earlier than you need it.",
            "Group photos have no natural end. A named shot list is the only fix.",
            "Guests arrive in the last 20 minutes before the ceremony, all at once — plan parking for that spike.",
          ],
          note: "Print this and stick a copy at the makeup room, the entrance desk and the catering counter.",
        },
      ],
    };
  },
};

export const FREE_TOOLS: FreeTool[] = [
  menuBuilder,
  sangeetFinder,
  vendorQuestions,
  ritualExplainer,
  hiddenCostCheck,
  guestMessageWriter,
  finalWeekChecklist,
  dayTimeline,
];

export function getFreeTool(slug: string): FreeTool | undefined {
  return FREE_TOOLS.find((t) => t.slug === slug);
}
