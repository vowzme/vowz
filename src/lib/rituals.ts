// Shared ritual library — used by the free "Ritual Explainer" tool and by the
// Rituals & Traditions section couples can switch on for their wedding site.
// Written for guests who have never attended this kind of wedding before.

export type RitualFaith = "hindu" | "muslim" | "sikh" | "christian" | "common";

export type Ritual = {
  id: string;
  name: string;
  alt?: string;
  faith: RitualFaith;
  emoji: string;
  short: string;
  description: string;
  guestTip: string;
  dress?: string;
  duration?: string;
};

export const FAITH_LABELS: Record<RitualFaith, string> = {
  hindu: "Hindu",
  muslim: "Muslim · Nikah",
  sikh: "Sikh · Anand Karaj",
  christian: "Christian",
  common: "Common to most weddings",
};

export const RITUALS: Ritual[] = [
  // ── Hindu ────────────────────────────────────────────────────────────
  {
    id: "roka",
    name: "Roka",
    alt: "Engagement / Sagai",
    faith: "hindu",
    emoji: "💍",
    short: "The two families formally agree to the match.",
    description:
      "The first official step. Both families meet, exchange sweets, clothes and gifts, and bless the couple. In many homes the couple also exchange rings at this point.",
    guestTip: "A short, joyful gathering. Bring sweets or a small gift if you are close family.",
    dress: "Festive Indian wear — bright colours are welcome.",
    duration: "1–2 hours",
  },
  {
    id: "ganesh-puja",
    name: "Ganesh Puja",
    faith: "hindu",
    emoji: "🪔",
    short: "A prayer to Lord Ganesha to remove obstacles.",
    description:
      "Almost every Hindu wedding begins here. The family prays to Lord Ganesha so the celebrations run smoothly and the marriage begins on an auspicious note.",
    guestTip: "Please arrive on time — this one starts at a fixed auspicious hour.",
    dress: "Traditional wear, head covered in some families.",
    duration: "45 minutes",
  },
  {
    id: "haldi",
    name: "Haldi",
    alt: "Pithi · Gaye Holud · Mangala Snanam",
    faith: "hindu",
    emoji: "💛",
    short: "Turmeric paste is applied to the couple for a glowing blessing.",
    description:
      "Family and friends smear a paste of turmeric, sandalwood and oils on the bride and groom. Turmeric is believed to purify, protect and give the skin a wedding-day glow.",
    guestTip: "Wear clothes you don't mind staining — turmeric does not wash out. Yellow is the traditional colour.",
    dress: "Yellow or simple cotton wear.",
    duration: "1–2 hours",
  },
  {
    id: "mehendi",
    name: "Mehendi",
    alt: "Mehndi · Henna night",
    faith: "common",
    emoji: "🌿",
    short: "Henna is applied to the bride's hands and feet.",
    description:
      "An artist draws intricate henna patterns on the bride, and guests get their own designs too. The groom's name is often hidden in the pattern for him to find. Music and dancing usually run alongside.",
    guestTip: "Get your henna done early — it needs a few hours to darken. Eat before, it's hard to use your hands after.",
    dress: "Bright, comfortable festive wear — green and orange are favourites.",
    duration: "3–5 hours",
  },
  {
    id: "sangeet",
    name: "Sangeet",
    faith: "common",
    emoji: "🎶",
    short: "The music and dance night for both families.",
    description:
      "The most relaxed evening of the wedding. Both families perform dances, sing, roast the couple lovingly and dance until late. Often combined with the Mehendi.",
    guestTip: "Come ready to dance. Group performances are welcome — ask the family for a slot.",
    dress: "Glamorous but comfortable — you will be on your feet.",
    duration: "4–5 hours",
  },
  {
    id: "baraat",
    name: "Baraat",
    faith: "hindu",
    emoji: "🐎",
    short: "The groom's procession arrives with music and dancing.",
    description:
      "The groom travels to the venue on a horse, in a car or a decorated carriage, surrounded by his family dancing to a live band or dhol. The bride's family welcomes them at the gate.",
    guestTip: "If you are on the groom's side, join the dancing — that is the whole point.",
    dress: "Festive wear, comfortable shoes.",
    duration: "45–90 minutes",
  },
  {
    id: "milni",
    name: "Milni",
    faith: "common",
    emoji: "🤝",
    short: "The two families formally greet each other.",
    description:
      "Matching relatives from each side — the fathers, the uncles, the brothers — meet, garland each other and embrace. It marks the joining of two families, not just two people.",
    guestTip: "Family only, but lovely to watch. Great photo moment.",
    duration: "20 minutes",
  },
  {
    id: "jaimala",
    name: "Jaimala",
    alt: "Varmala",
    faith: "hindu",
    emoji: "🌸",
    short: "The couple exchange flower garlands.",
    description:
      "The bride and groom place heavy floral garlands around each other's necks, accepting one another. Friends often lift the couple up to make it playfully difficult.",
    guestTip: "Cheer loudly. Keep the aisle clear for photographers.",
    duration: "15 minutes",
  },
  {
    id: "kanyadaan",
    name: "Kanyadaan",
    faith: "hindu",
    emoji: "🙏",
    short: "The bride's parents give her hand to the groom.",
    description:
      "One of the most emotional moments. The bride's father places her hand in the groom's and entrusts her to him, asking that she be cared for as an equal partner.",
    guestTip: "A quiet, tearful moment — please keep noise down.",
    duration: "20 minutes",
  },
  {
    id: "pheras",
    name: "Saat Phere",
    alt: "Mangal Phera · Seven vows",
    faith: "hindu",
    emoji: "🔥",
    short: "The couple circle the sacred fire seven times.",
    description:
      "The heart of a Hindu wedding. The couple walk around the holy fire seven times, each round a promise — for nourishment, strength, prosperity, happiness, family, health and lifelong friendship. Agni, the fire, is the witness.",
    guestTip: "Traditionally the longest ritual. Sit and enjoy — the priest usually explains each vow.",
    duration: "45–90 minutes",
  },
  {
    id: "sindoor-mangalsutra",
    name: "Sindoor & Mangalsutra",
    faith: "hindu",
    emoji: "❤️",
    short: "The groom marks the bride as his wife.",
    description:
      "The groom applies sindoor (vermilion) in the parting of the bride's hair and ties the mangalsutra, a sacred necklace, around her neck. The marriage is now complete.",
    guestTip: "The moment everyone applauds. Have your camera ready.",
    duration: "10 minutes",
  },
  {
    id: "vidaai",
    name: "Vidaai",
    alt: "Bidaai",
    faith: "hindu",
    emoji: "🌾",
    short: "The bride leaves her parents' home.",
    description:
      "The bride throws a handful of rice over her shoulder as thanks to her parents, then departs with her husband. It is joyful and heartbreaking at the same time.",
    guestTip: "Expect tears. Offer a hug, not a joke.",
    duration: "30 minutes",
  },
  {
    id: "griha-pravesh",
    name: "Griha Pravesh",
    faith: "hindu",
    emoji: "🏡",
    short: "The bride is welcomed into her new home.",
    description:
      "The bride enters her new home for the first time, usually tipping over a pot of rice with her right foot to invite prosperity, and is welcomed by her mother-in-law with an aarti.",
    guestTip: "Close family only in most homes.",
    duration: "30 minutes",
  },

  // ── Muslim ───────────────────────────────────────────────────────────
  {
    id: "mangni",
    name: "Mangni",
    faith: "muslim",
    emoji: "💍",
    short: "The engagement ceremony.",
    description:
      "The families exchange gifts and rings and announce the engagement. Dates and sweets are shared, and a wedding date is often fixed on the same day.",
    guestTip: "Semi-formal and warm. Small gifts are appreciated.",
    duration: "2 hours",
  },
  {
    id: "manjha",
    name: "Manjha",
    faith: "muslim",
    emoji: "💛",
    short: "The turmeric ceremony before the Nikah.",
    description:
      "Held separately at each home. Turmeric paste is applied to the bride and groom, who then traditionally stay indoors until the wedding day.",
    guestTip: "Yellow clothing is customary. Expect turmeric on you.",
    dress: "Yellow, simple.",
    duration: "2 hours",
  },
  {
    id: "nikah",
    name: "Nikah",
    faith: "muslim",
    emoji: "📜",
    short: "The marriage contract is offered and accepted.",
    description:
      "An imam or qazi conducts the ceremony. The proposal (ijab) is made and accepted (qubool) by both bride and groom, three times each, before witnesses. The Nikahnama, the marriage contract, is then signed.",
    guestTip: "Modest dress, heads covered for women in many families. Silence during the recitation.",
    dress: "Modest and formal; cover shoulders and knees.",
    duration: "45 minutes",
  },
  {
    id: "mehr",
    name: "Mehr",
    faith: "muslim",
    emoji: "🎁",
    short: "A gift promised by the groom to the bride.",
    description:
      "A sum of money or a gift agreed in the marriage contract and given by the groom to the bride. It belongs to her alone and is her right, not a dowry.",
    guestTip: "Announced during the Nikah — a moment of respect for the bride.",
    duration: "Part of the Nikah",
  },
  {
    id: "rukhsati",
    name: "Rukhsati",
    faith: "muslim",
    emoji: "🕊️",
    short: "The bride departs with her husband.",
    description:
      "The bride leaves her family home, often walking under a Quran held over her head as a blessing. Her father formally entrusts her to her husband.",
    guestTip: "A tearful farewell. Stay quiet and supportive.",
    duration: "30 minutes",
  },
  {
    id: "walima",
    name: "Walima",
    faith: "muslim",
    emoji: "🍽️",
    short: "The reception hosted by the groom's family.",
    description:
      "The celebratory feast that publicly announces the marriage. Hosted by the groom's family a day or two after the Nikah, and usually the largest gathering of the wedding.",
    guestTip: "This is the main invitation for most guests. Dress well.",
    dress: "Formal, modest.",
    duration: "3–4 hours",
  },

  // ── Sikh ─────────────────────────────────────────────────────────────
  {
    id: "kurmai",
    name: "Kurmai",
    faith: "sikh",
    emoji: "💍",
    short: "The Sikh engagement ceremony.",
    description:
      "Held at a gurdwara or at home in front of the Guru Granth Sahib. The groom receives a kara (steel bangle) and dried fruits, and the families exchange gifts.",
    guestTip: "Cover your head and remove shoes if it is held at a gurdwara.",
    duration: "1–2 hours",
  },
  {
    id: "chunni-chadhana",
    name: "Chunni Chadhana",
    faith: "sikh",
    emoji: "🧣",
    short: "The groom's family welcomes the bride.",
    description:
      "The groom's mother drapes a red chunni over the bride's head and gifts her jewellery and clothes, accepting her into the family.",
    guestTip: "Warm and informal. Family and close friends.",
    duration: "1 hour",
  },
  {
    id: "maiyan",
    name: "Maiyan / Vatna",
    faith: "sikh",
    emoji: "💛",
    short: "The turmeric and cleansing ritual.",
    description:
      "A paste of turmeric, mustard oil and barley flour is rubbed on the couple at their own homes, and folk boliyan are sung by the women of the family.",
    guestTip: "Wear old clothes. Yellow or orange is traditional.",
    duration: "2 hours",
  },
  {
    id: "anand-karaj",
    name: "Anand Karaj",
    alt: "The ceremony of bliss",
    faith: "sikh",
    emoji: "📖",
    short: "The Sikh marriage ceremony in the gurdwara.",
    description:
      "Held before the Guru Granth Sahib, usually in the morning. Hymns are sung, the couple bow to accept the marriage, and the ceremony concludes with Ardaas and the sharing of karah prasad.",
    guestTip: "Cover your head, remove your shoes, and sit on the floor — men and women often sit on separate sides. Do not turn your back to the Guru Granth Sahib.",
    dress: "Modest clothing, head covering essential. No alcohol or tobacco on the premises.",
    duration: "2 hours",
  },
  {
    id: "laavan",
    name: "Laavan Phere",
    faith: "sikh",
    emoji: "🔄",
    short: "Four rounds around the Guru Granth Sahib.",
    description:
      "The couple walk clockwise around the Guru Granth Sahib four times, once for each Laav — a hymn describing the soul's journey towards union with the divine. This is the marriage itself.",
    guestTip: "Please stay seated and quiet while the couple circle.",
    duration: "45 minutes",
  },
  {
    id: "doli",
    name: "Doli",
    faith: "sikh",
    emoji: "🚗",
    short: "The bride's departure.",
    description:
      "The bride leaves with her husband's family, throwing puffed rice over her shoulder as a blessing on the home she is leaving.",
    guestTip: "An emotional goodbye — be present, not loud.",
    duration: "30 minutes",
  },

  // ── Christian ────────────────────────────────────────────────────────
  {
    id: "roce",
    name: "Roce",
    faith: "christian",
    emoji: "🥥",
    short: "The coconut-milk blessing the night before.",
    description:
      "A Goan and Mangalorean tradition. Coconut milk is applied to the bride and groom at their homes as a cleansing blessing marking the last night of single life.",
    guestTip: "Expect to get messy and to be fed extremely well.",
    duration: "3 hours",
  },
  {
    id: "church-ceremony",
    name: "Church Ceremony",
    alt: "Nuptial Mass",
    faith: "christian",
    emoji: "⛪",
    short: "The wedding service in church.",
    description:
      "The bride walks down the aisle with her father. Readings, hymns and a homily follow, then the vows, the ring exchange and the priest's blessing. A Nuptial Mass includes Holy Communion.",
    guestTip: "Arrive 15 minutes early. Stand when the bride enters. Silence phones.",
    dress: "Formal; shoulders covered inside the church.",
    duration: "1–1.5 hours",
  },
  {
    id: "vows-rings",
    name: "Vows & Ring Exchange",
    faith: "christian",
    emoji: "💍",
    short: "The promises that make the marriage.",
    description:
      "The couple promise to love and honour each other for life, and exchange rings as the visible sign of that promise.",
    guestTip: "The photographers' moment — stay in your seat.",
    duration: "15 minutes",
  },
  {
    id: "first-dance",
    name: "Reception & First Dance",
    faith: "christian",
    emoji: "🥂",
    short: "Toasts, cake and the couple's first dance.",
    description:
      "The celebration after the ceremony: the couple's grand entry, speeches, the cutting of the cake, the first dance and then the floor opens to everyone.",
    guestTip: "Speeches are usually early in the evening — be seated for them.",
    duration: "4 hours",
  },

  // ── Common ───────────────────────────────────────────────────────────
  {
    id: "reception",
    name: "Reception",
    faith: "common",
    emoji: "✨",
    short: "The grand celebration dinner.",
    description:
      "The formal party where the couple greet every guest, photographs are taken on stage, dinner is served and the dance floor opens.",
    guestTip: "Greet the couple on stage early — the queue only grows.",
    dress: "Your best formal or festive outfit.",
    duration: "4 hours",
  },
];

export function ritualsByFaith(faith: RitualFaith | "all"): Ritual[] {
  if (faith === "all") return RITUALS;
  return RITUALS.filter((r) => r.faith === faith || r.faith === "common");
}

export function getRitual(id: string): Ritual | undefined {
  return RITUALS.find((r) => r.id === id);
}

/** Sensible starting selection when a couple first switches the section on. */
export const DEFAULT_RITUAL_SETS: Record<RitualFaith, string[]> = {
  hindu: ["ganesh-puja", "haldi", "mehendi", "sangeet", "baraat", "jaimala", "pheras", "sindoor-mangalsutra", "vidaai"],
  muslim: ["mangni", "manjha", "mehendi", "nikah", "mehr", "rukhsati", "walima"],
  sikh: ["kurmai", "maiyan", "mehendi", "milni", "anand-karaj", "laavan", "doli"],
  christian: ["roce", "church-ceremony", "vows-rings", "first-dance"],
  common: ["mehendi", "sangeet", "reception"],
};
