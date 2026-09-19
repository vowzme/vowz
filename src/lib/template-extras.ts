/**
 * Additional wedding website templates.
 *
 * The first 35 templates are hand-written in `TemplatesSection.tsx`. These 65
 * extras are built from per-template seed data (couple, city, venue, story,
 * hotels) expanded with style-aware event schedules, galleries and photography
 * so every design previews with realistic content.
 */

export interface ExtraTemplate {
  name: string;
  colors: [string, string, string];
  style: string;
  couple: string;
  partner1: string;
  partner2: string;
  tagline: string;
  weddingDate: string;
  venue: string;
  location: string;
  story: string;
  couplePhoto: string;
  heroPhoto: string;
  events: { name: string; date: string; time: string; venue: string }[];
  guestbookMessages: { name: string; message: string }[];
  travelInfo: { hotels: { name: string; distance: string }[]; directions: string };
  galleryPhotos: { label: string; url: string }[];
}

const U = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop`;

/** Photography pools, grouped by mood. */
const PHOTOS: Record<string, { couple: string[]; hero: string[]; gallery: string[] }> = {
  indian: {
    couple: ["1604017011826-d3b4c23f8914", "1583089892943-e02e5b017b6a", "1606216794074-735e91aa2c92"],
    hero: ["1524492412937-b28074a5d7da", "1519167758481-83f550bb49b3", "1591604466107-ec97de577aff"],
    gallery: [
      "1583089892943-e02e5b017b6a",
      "1606216794074-735e91aa2c92",
      "1519167758481-83f550bb49b3",
      "1524492412937-b28074a5d7da",
      "1520854221256-17451cc331bf",
      "1511285560929-80b456fea0bc",
      "1591604466107-ec97de577aff",
    ],
  },
  garden: {
    couple: ["1529636798458-92182e662485", "1519741497674-611481863552", "1537633552985-df8429e8048b"],
    hero: ["1464366400600-7168b8af9bc3", "1469371670807-013ccf25f16a", "1510076857177-7470076d4098"],
    gallery: [
      "1464366400600-7168b8af9bc3",
      "1529636798458-92182e662485",
      "1478146059778-26028b07395a",
      "1507504031003-b417219a0fde",
      "1511285560929-80b456fea0bc",
      "1469371670807-013ccf25f16a",
      "1535254973040-607b474cb50d",
    ],
  },
  beach: {
    couple: ["1537633552985-df8429e8048b", "1519741497674-611481863552", "1529636798458-92182e662485"],
    hero: ["1507525428034-b723cf961d3e", "1505118380757-91f5f5632de0", "1509233725247-49e657c54213"],
    gallery: [
      "1507525428034-b723cf961d3e",
      "1505118380757-91f5f5632de0",
      "1509233725247-49e657c54213",
      "1519741497674-611481863552",
      "1520854221256-17451cc331bf",
      "1511285560929-80b456fea0bc",
      "1535254973040-607b474cb50d",
    ],
  },
  modern: {
    couple: ["1519741497674-611481863552", "1529636798458-92182e662485", "1522413452208-996ff3f3e740"],
    hero: ["1465495976277-4387d4b0b4c6", "1519225421980-715cb0215aed", "1507504031003-b417219a0fde"],
    gallery: [
      "1519225421980-715cb0215aed",
      "1507504031003-b417219a0fde",
      "1522413452208-996ff3f3e740",
      "1520854221256-17451cc331bf",
      "1535254973040-607b474cb50d",
      "1511285560929-80b456fea0bc",
      "1465495976277-4387d4b0b4c6",
    ],
  },
  heritage: {
    couple: ["1606216794074-735e91aa2c92", "1604017011826-d3b4c23f8914", "1519741497674-611481863552"],
    hero: ["1519167758481-83f550bb49b3", "1524492412937-b28074a5d7da", "1478146059778-26028b07395a"],
    gallery: [
      "1524492412937-b28074a5d7da",
      "1478146059778-26028b07395a",
      "1606216794074-735e91aa2c92",
      "1520854221256-17451cc331bf",
      "1519167758481-83f550bb49b3",
      "1511285560929-80b456fea0bc",
      "1535254973040-607b474cb50d",
    ],
  },
};

const GALLERY_LABELS = [
  "Hero Moment",
  "Couple Portrait",
  "Venue",
  "Decor Details",
  "Celebration",
  "First Dance",
  "Golden Hour",
];

/** Event blueprints keyed by celebration flow. */
const FLOWS: Record<string, { name: string; offset: number; time: string; where: (venue: string) => string }[]> = {
  indian: [
    { name: "Haldi Ceremony", offset: -2, time: "10:00 AM", where: () => "Family Residence" },
    { name: "Mehendi Afternoon", offset: -2, time: "4:00 PM", where: (v) => `${v} Courtyard` },
    { name: "Sangeet Night", offset: -1, time: "7:00 PM", where: (v) => `${v} Banquet Lawn` },
    { name: "Wedding Ceremony", offset: 0, time: "10:30 AM", where: (v) => v },
    { name: "Reception Dinner", offset: 0, time: "7:30 PM", where: (v) => `${v} Grand Hall` },
  ],
  christian: [
    { name: "Welcome Dinner", offset: -1, time: "7:00 PM", where: (v) => `${v} Terrace` },
    { name: "Church Ceremony", offset: 0, time: "11:00 AM", where: (v) => v },
    { name: "Reception & Dinner", offset: 0, time: "6:00 PM", where: (v) => `${v} Ballroom` },
  ],
  destination: [
    { name: "Arrival Sundowner", offset: -1, time: "6:00 PM", where: (v) => `${v} Deck` },
    { name: "Beach Ceremony", offset: 0, time: "5:00 PM", where: (v) => `${v} Shoreline` },
    { name: "Starlight Dinner", offset: 0, time: "8:00 PM", where: (v) => `${v} Courtyard` },
    { name: "Farewell Brunch", offset: 1, time: "11:00 AM", where: (v) => `${v} Garden` },
  ],
  modern: [
    { name: "Cocktail Hour", offset: -1, time: "7:30 PM", where: (v) => `${v} Rooftop` },
    { name: "Wedding Ceremony", offset: 0, time: "4:30 PM", where: (v) => v },
    { name: "Dinner & Dancing", offset: 0, time: "7:00 PM", where: (v) => `${v} Atrium` },
  ],
};

const WISHES = [
  (a: string, b: string) => `${a} and ${b}, watching you two together is the best kind of joy. Here's to forever!`,
  (a: string) => `${a}, we have known you since school — so proud of the family you are starting. ❤️`,
  (_a: string, b: string) => `${b}, you are going to be the most radiant one in the room. Congratulations!`,
  (a: string, b: string) => `Wishing ${a} & ${b} a lifetime of easy mornings and loud, happy evenings.`,
];

const WISHERS = ["The Menon Family", "Priya & Karan", "Aunt Rosy", "College Crew", "Neha", "Daniel & Ruth", "Grandma", "The Neighbours"];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Seed {
  name: string;
  style: string;
  colors: [string, string, string];
  p1: string;
  p2: string;
  tagline: string;
  /** [year, monthIndex, day] */
  date: [number, number, number];
  venue: string;
  location: string;
  story: string;
  hotels: [string, string][];
  directions: string;
  mood: keyof typeof PHOTOS;
  flow: keyof typeof FLOWS;
}

const SEEDS: Seed[] = [
  { name: "Saffron Mandap", style: "Traditional", colors: ["#7B1E24", "#E0B354", "#FFF7EA"], p1: "Aditya", p2: "Ishita", tagline: "Blessed beginnings, boundless love", date: [2027, 0, 24], venue: "Shree Ram Mandap", location: "Ahmedabad, Gujarat", story: "Aditya and Ishita grew up two streets apart but only met at a Navratri garba in 2023. Nine days of dancing turned into three years of belonging.", hotels: [["Hyatt Regency", "3 km"], ["Courtyard Ahmedabad", "5 km"]], directions: "Fly into Ahmedabad (AMD); the mandap is a 25-minute drive from the airport.", mood: "indian", flow: "indian" },
  { name: "Temple Bells", style: "Regional", colors: ["#6B2737", "#D9A441", "#FFF3E2"], p1: "Karthik", p2: "Divya", tagline: "Two families, one blessing", date: [2027, 3, 11], venue: "Sri Meenakshi Kalyana Mandapam", location: "Madurai, Tamil Nadu", story: "A shared auto ride during a temple festival, a spilled bag of jasmine, and a conversation that never really ended.", hotels: [["Heritage Madurai", "2 km"], ["Fortune Pandiyan", "4 km"]], directions: "Fly into Madurai (IXM); the mandapam is 15 minutes from the airport.", mood: "indian", flow: "indian" },
  { name: "Kerala Kasavu", style: "Regional", colors: ["#0F5132", "#D4AF37", "#FDF8EC"], p1: "Vishnu", p2: "Lakshmi", tagline: "Gold borders, greener promises", date: [2027, 1, 14], venue: "Backwater Heritage Villa", location: "Alappuzha, Kerala", story: "They met on a houseboat their families had booked back to back. By sunset, both boats were tied together and dinner was shared.", hotels: [["Lake Palace Resort", "1 km"], ["Ramada Alleppey", "6 km"]], directions: "Fly into Kochi (COK); the villa is a 90-minute drive south.", mood: "indian", flow: "indian" },
  { name: "Punjabi Phulkari", style: "Traditional", colors: ["#B02A37", "#F0A202", "#FFF6E5"], p1: "Gurpreet", p2: "Simran", tagline: "Dhol, dance and a lifetime", date: [2026, 10, 21], venue: "Anand Karaj Gurudwara Hall", location: "Amritsar, Punjab", story: "Simran beat Gurpreet at a college bhangra competition. He asked her to teach him the steps; she is still teaching him.", hotels: [["Taj Swarna", "4 km"], ["Hyatt Amritsar", "6 km"]], directions: "Fly into Amritsar (ATQ); the hall is 20 minutes from the airport.", mood: "indian", flow: "indian" },
  { name: "Bengali Alpona", style: "Regional", colors: ["#8C1C13", "#E6B325", "#FFF8E7"], p1: "Arnab", p2: "Rituparna", tagline: "Shubho bibaho, shubho jibon", date: [2027, 1, 6], venue: "Rajbari Heritage House", location: "Kolkata, West Bengal", story: "Two bookshop regulars who kept reserving the same Tagore edition until the shopkeeper introduced them.", hotels: [["The Oberoi Grand", "5 km"], ["ITC Royal Bengal", "8 km"]], directions: "Fly into Kolkata (CCU); the rajbari is a 40-minute drive.", mood: "heritage", flow: "indian" },
  { name: "Marathi Shalu", style: "Regional", colors: ["#7A1C27", "#EFC050", "#FFF6EC"], p1: "Omkar", p2: "Sayali", tagline: "Shubh mangal savdhan", date: [2027, 4, 2], venue: "Shaniwar Lawns", location: "Pune, Maharashtra", story: "They trained for the same half-marathon and finished holding hands at the last kilometre.", hotels: [["Conrad Pune", "3 km"], ["JW Marriott Pune", "5 km"]], directions: "Fly into Pune (PNQ); the lawns are 30 minutes away.", mood: "indian", flow: "indian" },
  { name: "Telugu Pellikuturu", style: "Regional", colors: ["#5C1A1B", "#DDAA33", "#FFF4E4"], p1: "Sai", p2: "Harika", tagline: "Bound by mantras and mischief", date: [2027, 6, 18], venue: "Sri Venkateswara Convention", location: "Hyderabad, Telangana", story: "Cousins introduced them at a Sankranti lunch; they argued about biryani for an hour and never stopped talking.", hotels: [["Park Hyatt", "4 km"], ["Novotel HICC", "7 km"]], directions: "Fly into Hyderabad (HYD); the hall is a 35-minute drive.", mood: "indian", flow: "indian" },
  { name: "Kannada Antarpat", style: "Regional", colors: ["#6E1B32", "#E3B23C", "#FFF7EB"], p1: "Rohit", p2: "Ananya", tagline: "A curtain lifts, a life begins", date: [2027, 10, 8], venue: "Lalbagh Kalyana Mantapa", location: "Bengaluru, Karnataka", story: "Both volunteered for a lake clean-up drive; the muddiest Sunday of their lives became the best one.", hotels: [["The Leela Palace", "6 km"], ["Taj MG Road", "8 km"]], directions: "Fly into Bengaluru (BLR); allow an hour by road.", mood: "indian", flow: "indian" },
  { name: "Rajput Darbar", style: "Grand", colors: ["#3B1F2B", "#C9A227", "#F7ECD9"], p1: "Yuvraj", p2: "Bhavna", tagline: "Royal roots, modern hearts", date: [2027, 11, 3], venue: "Chandra Mahal Palace", location: "Jodhpur, Rajasthan", story: "A photography workshop in the blue city — she was the model for his assignment, and he has not stopped photographing her since.", hotels: [["Umaid Bhawan", "2 km"], ["RAAS Jodhpur", "3 km"]], directions: "Fly into Jodhpur (JDH); the palace is 20 minutes away.", mood: "heritage", flow: "indian" },
  { name: "Awadhi Chikankari", style: "Traditional", colors: ["#4A3C31", "#CBA135", "#FDF6E9"], p1: "Faizan", p2: "Zoya", tagline: "Stitched with care, worn with pride", date: [2027, 2, 20], venue: "Nawab Mahal Lawns", location: "Lucknow, Uttar Pradesh", story: "They met at a chikankari workshop where both were the worst students in the room.", hotels: [["Taj Mahal Lucknow", "4 km"], ["Renaissance Lucknow", "6 km"]], directions: "Fly into Lucknow (LKO); the lawns are a 30-minute drive.", mood: "heritage", flow: "indian" },
  { name: "Nikah Emerald", style: "Traditional", colors: ["#124E3A", "#D8B863", "#FBF6EA"], p1: "Imran", p2: "Ayesha", tagline: "In the name of love and mercy", date: [2027, 5, 12], venue: "Gulistan Banquet", location: "Hyderabad, Telangana", story: "Their mothers were college roommates; the two of them finally met at a family iftar and stayed talking until fajr.", hotels: [["Taj Krishna", "3 km"], ["Marriott Hyderabad", "5 km"]], directions: "Fly into Hyderabad (HYD); the banquet is 40 minutes from the airport.", mood: "heritage", flow: "indian" },
  { name: "Walima Rose", style: "Grand", colors: ["#6D213C", "#E0A458", "#FFF3EA"], p1: "Bilal", p2: "Mariam", tagline: "A feast for family and friends", date: [2027, 8, 26], venue: "Rose Court Hall", location: "Kozhikode, Kerala", story: "Bilal ran a bakery; Mariam reviewed it badly online. He invited her back for a second opinion.", hotels: [["Hyatt Regency", "2 km"], ["Gateway Calicut", "5 km"]], directions: "Fly into Kozhikode (CCJ); the hall is a 25-minute drive.", mood: "heritage", flow: "indian" },
  { name: "Chapel Ivory", style: "Romantic", colors: ["#2F3E46", "#C9B27C", "#FAF7F2"], p1: "Ryan", p2: "Elena", tagline: "Promised before family and faith", date: [2027, 4, 22], venue: "St. Anne's Chapel", location: "Fort Kochi, Kerala", story: "Choir practice, two off-key voices, one shared hymn book. The rest was inevitable.", hotels: [["Brunton Boatyard", "1 km"], ["Xandari Harbour", "2 km"]], directions: "Fly into Kochi (COK); the chapel is a 60-minute drive.", mood: "garden", flow: "christian" },
  { name: "Cathedral Bells", style: "Grand", colors: ["#25313C", "#B08D57", "#F6F2EA"], p1: "Michael", p2: "Sarah", tagline: "Faith, family, forever", date: [2027, 7, 7], venue: "Holy Trinity Cathedral", location: "Bandra, Mumbai", story: "They met volunteering at a Sunday soup kitchen and have cooked together every weekend since.", hotels: [["Taj Lands End", "2 km"], ["Sofitel BKC", "6 km"]], directions: "Fly into Mumbai (BOM); the cathedral is 30 minutes from the terminal.", mood: "heritage", flow: "christian" },
  { name: "Vineyard Vows", style: "Destination", colors: ["#4A5D3A", "#C8A96A", "#FAF6EC"], p1: "Thomas", p2: "Claire", tagline: "Aged like the best things are", date: [2027, 9, 2], venue: "Sula Vineyards Estate", location: "Nashik, Maharashtra", story: "A wine tasting where both picked the same unfashionable bottle and defended it to the sommelier.", hotels: [["The Source at Sula", "0 km"], ["Radisson Blu Nashik", "12 km"]], directions: "Fly into Mumbai (BOM); the estate is a four-hour scenic drive.", mood: "garden", flow: "christian" },
  { name: "Lakeside Chapel", style: "Romantic", colors: ["#33454F", "#CBB279", "#F9F6F0"], p1: "Peter", p2: "Anna", tagline: "Still waters, steady love", date: [2027, 5, 5], venue: "Lakeview Chapel", location: "Naini Lake, Nainital", story: "A rowboat, a rainstorm and one borrowed umbrella that neither of them returned.", hotels: [["The Naini Retreat", "1 km"], ["Shervani Hilltop", "3 km"]], directions: "Fly into Pantnagar (PGH); the chapel is a 90-minute drive uphill.", mood: "garden", flow: "christian" },
  { name: "Goan Sunset", style: "Destination", colors: ["#1C4E68", "#F0B67F", "#FFF8F0"], p1: "Dean", p2: "Naomi", tagline: "Salt air and slow forever", date: [2027, 0, 17], venue: "Casa Del Mar", location: "Ashwem, Goa", story: "Two solo travellers who kept ending up at the same beach shack until they gave in and shared a table.", hotels: [["W Goa", "3 km"], ["Taj Holiday Village", "12 km"]], directions: "Fly into Goa (GOX); the villa is a 45-minute drive north.", mood: "beach", flow: "destination" },
  { name: "Andaman Blue", style: "Destination", colors: ["#0B4F6C", "#E9C46A", "#FBF9F4"], p1: "Kabir", p2: "Tara", tagline: "Where the sea keeps our secrets", date: [2027, 2, 9], venue: "Radhanagar Beach Resort", location: "Havelock, Andaman", story: "A scuba course, a shared regulator scare, and a promise to always check on each other.", hotels: [["Taj Exotica", "2 km"], ["Barefoot Havelock", "4 km"]], directions: "Fly into Port Blair (IXZ) and take the morning ferry to Havelock.", mood: "beach", flow: "destination" },
  { name: "Maldives Lagoon", style: "Destination", colors: ["#0E6BA8", "#F2C14E", "#FFFDF7"], p1: "Rohan", p2: "Alisha", tagline: "Barefoot and certain", date: [2027, 6, 30], venue: "Coral Lagoon Resort", location: "North Malé Atoll, Maldives", story: "Both missed the same connecting flight, shared a taxi, and decided the delay was worth keeping.", hotels: [["Water Villa Wing", "0 km"], ["Beach Villa Wing", "0 km"]], directions: "Fly into Malé (MLE); a resort speedboat completes the transfer in 35 minutes.", mood: "beach", flow: "destination" },
  { name: "Bali Bamboo", style: "Bohemian", colors: ["#3F5E4C", "#D9A566", "#FCF7EE"], p1: "Vikram", p2: "Sophie", tagline: "Slow mornings, tropical vows", date: [2027, 7, 19], venue: "Ubud Bamboo Pavilion", location: "Ubud, Bali", story: "A pottery class in Ubud where both made lopsided bowls they still eat breakfast from.", hotels: [["Kayon Jungle Resort", "5 km"], ["Alila Ubud", "8 km"]], directions: "Fly into Denpasar (DPS); the pavilion is a 90-minute drive inland.", mood: "garden", flow: "destination" },
  { name: "Santorini White", style: "Minimal", colors: ["#1F4E79", "#DCE6F1", "#FFFFFF"], p1: "Alex", p2: "Nadia", tagline: "Blue domes, white promises", date: [2027, 5, 21], venue: "Cliffside Terrace", location: "Oia, Santorini", story: "They queued three hours for the same sunset spot and ended up sharing a bottle of assyrtiko.", hotels: [["Canaves Oia", "0.5 km"], ["Katikies Hotel", "1 km"]], directions: "Fly into Santorini (JTR); the terrace is 25 minutes by road.", mood: "beach", flow: "destination" },
  { name: "Tuscan Olive", style: "Romantic", colors: ["#4F5D2F", "#C9A227", "#FBF7EC"], p1: "Marco", p2: "Riya", tagline: "Olive groves and open hearts", date: [2027, 8, 12], venue: "Villa Oliveto", location: "Siena, Italy", story: "An Indian-Italian cooking swap: she taught him dal, he taught her ragù, and neither left the kitchen.", hotels: [["Borgo Scopeto", "2 km"], ["Hotel Athena", "9 km"]], directions: "Fly into Florence (FLR); the villa is a 70-minute drive south.", mood: "garden", flow: "christian" },
  { name: "Paris Atelier", style: "Modern Glam", colors: ["#2B2B2B", "#C6A664", "#F6F3EE"], p1: "Lucas", p2: "Amara", tagline: "A love letter in every light", date: [2027, 3, 28], venue: "Atelier Saint-Germain", location: "Paris, France", story: "An art-school studio they both booked by mistake for the same Saturday; they shared the space and then a life.", hotels: [["Hôtel Lutetia", "1 km"], ["Le Pigalle", "4 km"]], directions: "Fly into Paris (CDG); the atelier is 45 minutes by RER and metro.", mood: "modern", flow: "modern" },
  { name: "Dubai Gold", style: "Modern Glam", colors: ["#1B1B2F", "#D4AF37", "#FDF9F0"], p1: "Zayn", p2: "Noor", tagline: "Skyline vows, desert hearts", date: [2027, 10, 14], venue: "Skyline Ballroom", location: "Downtown Dubai, UAE", story: "Two consultants on the same project who spent a year in meetings before anyone admitted anything.", hotels: [["Address Downtown", "0 km"], ["Vida Dubai Mall", "1 km"]], directions: "Fly into Dubai (DXB); the venue is a 20-minute drive.", mood: "modern", flow: "modern" },
  { name: "Singapore Skyline", style: "Modern Glam", colors: ["#20293A", "#C0C0C0", "#F4F4F6"], p1: "Ethan", p2: "Mei", tagline: "City lights, one horizon", date: [2027, 4, 30], venue: "Marina Sky Lounge", location: "Marina Bay, Singapore", story: "They met in a hawker centre queue and rated every stall in the city together over two years.", hotels: [["Fullerton Bay", "1 km"], ["Pan Pacific", "2 km"]], directions: "Fly into Changi (SIN); the lounge is 25 minutes by MRT.", mood: "modern", flow: "modern" },
  { name: "Tokyo Blossom", style: "Minimal", colors: ["#2E2E38", "#E8B4B8", "#FBF8F6"], p1: "Haruto", p2: "Priya", tagline: "Petals, patience, promises", date: [2027, 3, 4], venue: "Meguro Garden House", location: "Tokyo, Japan", story: "A language exchange that quietly became a nightly phone call across two time zones.", hotels: [["Trunk Hotel", "3 km"], ["Claska", "1 km"]], directions: "Fly into Haneda (HND); the garden house is 30 minutes by train.", mood: "garden", flow: "modern" },
  { name: "London Townhouse", style: "Modern Glam", colors: ["#24303C", "#B9A17B", "#F7F5F1"], p1: "Oliver", p2: "Saira", tagline: "Old brick, new beginnings", date: [2027, 6, 11], venue: "Mayfair Townhouse", location: "London, United Kingdom", story: "Two strangers who kept taking the same 6:40 train and finally swapped names on a delayed Tuesday.", hotels: [["The Connaught", "0.5 km"], ["Claridge's", "1 km"]], directions: "Fly into Heathrow (LHR); the townhouse is 50 minutes by Elizabeth line.", mood: "modern", flow: "modern" },
  { name: "New York Loft", style: "Modern Glam", colors: ["#1E1E1E", "#C8C8C8", "#F2EFEA"], p1: "Noah", p2: "Jessica", tagline: "Concrete, candlelight, commitment", date: [2027, 9, 16], venue: "Tribeca Loft No. 9", location: "New York, USA", story: "Neighbours who shared a fire escape, a cat and eventually an address.", hotels: [["The Greenwich", "1 km"], ["Walker Hotel", "2 km"]], directions: "Fly into JFK; the loft is 45 minutes by cab.", mood: "modern", flow: "modern" },
  { name: "Toronto Winter", style: "Minimal", colors: ["#22303F", "#D8DEE5", "#FFFFFF"], p1: "Liam", p2: "Anjali", tagline: "Warm hands in a cold season", date: [2027, 11, 19], venue: "Distillery Glasshouse", location: "Toronto, Canada", story: "They met in a library during a snowstorm; nobody wanted to leave and nobody had to.", hotels: [["The Broadview", "1 km"], ["Le Germain", "3 km"]], directions: "Fly into Toronto (YYZ); the glasshouse is 40 minutes by road.", mood: "modern", flow: "modern" },
  { name: "Sydney Harbour", style: "Destination", colors: ["#123C69", "#EDC7B7", "#FFFBF7"], p1: "Jack", p2: "Aditi", tagline: "Harbour breeze, homeward hearts", date: [2027, 1, 27], venue: "Harbourfront Pavilion", location: "Sydney, Australia", story: "A beginners' surf class where both were spectacularly bad and hilariously committed.", hotels: [["Park Hyatt Sydney", "1 km"], ["Ovolo Woolloomooloo", "3 km"]], directions: "Fly into Sydney (SYD); the pavilion is 25 minutes from the airport.", mood: "beach", flow: "destination" },
  { name: "Cape Town Cliff", style: "Destination", colors: ["#1D3557", "#E9C46A", "#FDFCF8"], p1: "Daniel", p2: "Zinhle", tagline: "Between mountain and sea", date: [2027, 2, 27], venue: "Camps Bay Cliff House", location: "Cape Town, South Africa", story: "A sunrise hike up Lion's Head where he carried both backpacks and she carried the conversation.", hotels: [["The Marly", "1 km"], ["Ellerman House", "2 km"]], directions: "Fly into Cape Town (CPT); the house is a 30-minute coastal drive.", mood: "beach", flow: "destination" },
  { name: "Desert Bloom", style: "Bohemian", colors: ["#7C4B3A", "#E4B363", "#FDF6EC"], p1: "Arvind", p2: "Mira", tagline: "Bloom where it is hardest", date: [2027, 10, 27], venue: "Sam Dunes Camp", location: "Jaisalmer, Rajasthan", story: "A camel safari that went off-route for three hours and turned into their favourite story.", hotels: [["Suryagarh", "12 km"], ["The Serai", "18 km"]], directions: "Fly into Jaisalmer (JSA); the camp is a 45-minute drive into the dunes.", mood: "heritage", flow: "destination" },
  { name: "Pine Forest", style: "Eco-Friendly", colors: ["#2F4F3A", "#CBB994", "#F7F4EC"], p1: "Aarav", p2: "Kiara", tagline: "Rooted, quiet, certain", date: [2027, 4, 9], venue: "Deodar Forest Lodge", location: "Manali, Himachal Pradesh", story: "Two tree-planting volunteers who counted 400 saplings and one very good day together.", hotels: [["Span Resort", "6 km"], ["The Himalayan", "9 km"]], directions: "Fly into Bhuntar (KUU); the lodge is a 90-minute drive up the valley.", mood: "garden", flow: "destination" },
  { name: "Tea Garden", style: "Eco-Friendly", colors: ["#26543F", "#D6B85A", "#FBF8EF"], p1: "Dhruv", p2: "Meghna", tagline: "Steeped in something good", date: [2027, 3, 17], venue: "Glenburn Tea Estate", location: "Darjeeling, West Bengal", story: "A tea-tasting weekend where she guessed every estate correctly and he decided to keep her around.", hotels: [["Glenburn Penthouse", "0 km"], ["Mayfair Darjeeling", "20 km"]], directions: "Fly into Bagdogra (IXB); the estate is a three-hour hill drive.", mood: "garden", flow: "destination" },
  { name: "Wildflower Meadow", style: "Bohemian", colors: ["#5B7553", "#E4C580", "#FCF9F1"], p1: "Ishaan", p2: "Noor", tagline: "Wild, free, together", date: [2027, 5, 26], venue: "Meadow Barn", location: "Coonoor, Tamil Nadu", story: "They met at a farmers' market; she sold him basil he did not need and he came back every Saturday.", hotels: [["O'Land Plantation", "3 km"], ["Taj Savoy Ooty", "18 km"]], directions: "Fly into Coimbatore (CJB); the barn is a two-hour drive up the ghat.", mood: "garden", flow: "destination" },
  { name: "Orchard Light", style: "Rustic", colors: ["#7A5C3E", "#E3C08D", "#FBF6EC"], p1: "Rahul", p2: "Emily", tagline: "Fruit, family and a long table", date: [2027, 8, 5], venue: "Old Orchard Farmhouse", location: "Shimla, Himachal Pradesh", story: "An apple-picking trip where they filled one basket between them and lost track of the afternoon.", hotels: [["Wildflower Hall", "8 km"], ["Oberoi Cecil", "12 km"]], directions: "Fly into Shimla (SLV); the farmhouse is 40 minutes by road.", mood: "garden", flow: "destination" },
  { name: "Coastal Ivory", style: "Minimal", colors: ["#33444E", "#E8E2D6", "#FFFFFF"], p1: "Nikhil", p2: "Sana", tagline: "Simple, sunlit, ours", date: [2027, 1, 20], venue: "Ivory House by the Sea", location: "Varkala, Kerala", story: "A yoga retreat where they were the only two who kept sneaking out for filter coffee.", hotels: [["Gateway Varkala", "2 km"], ["Clafouti Beach Resort", "1 km"]], directions: "Fly into Trivandrum (TRV); the house is a 60-minute coastal drive.", mood: "beach", flow: "destination" },
  { name: "Monochrome Vows", style: "Minimal", colors: ["#1A1A1A", "#BFBFBF", "#FFFFFF"], p1: "Arjun", p2: "Leah", tagline: "Everything essential, nothing extra", date: [2027, 6, 24], venue: "The White Room", location: "Bandra, Mumbai", story: "Two architects who argued about a doorway for six months and then designed a home together.", hotels: [["Abode Bombay", "4 km"], ["The St. Regis", "8 km"]], directions: "Fly into Mumbai (BOM); the venue is 35 minutes from the terminal.", mood: "modern", flow: "modern" },
  { name: "Blush Minimal", style: "Minimal", colors: ["#4A3F44", "#EBC9C5", "#FFFDFB"], p1: "Siddharth", p2: "Aanya", tagline: "Soft edges, strong promise", date: [2027, 2, 14], venue: "Pastel Studio", location: "New Delhi, Delhi", story: "A pottery studio, two wobbly mugs and a standing Wednesday date that never got cancelled.", hotels: [["The Lodhi", "3 km"], ["Andaz Delhi", "12 km"]], directions: "Fly into Delhi (DEL); the studio is a 40-minute drive.", mood: "modern", flow: "modern" },
  { name: "Emerald Heirloom", style: "Grand", colors: ["#12463A", "#D4AF37", "#FBF6E9"], p1: "Aryan", p2: "Vaishnavi", tagline: "Heirlooms, handed forward", date: [2027, 11, 12], venue: "Emerald Court", location: "Mysuru, Karnataka", story: "Her grandmother's emerald ring had been waiting in a drawer for twenty years; it fit perfectly.", hotels: [["Radisson Blu Mysore", "4 km"], ["Fortune JP Palace", "6 km"]], directions: "Fly into Bengaluru (BLR); Mysuru is a three-hour drive or 90 minutes by express train.", mood: "heritage", flow: "indian" },
  { name: "Midnight Meenakari", style: "Grand", colors: ["#141B33", "#D9A441", "#F7F1E4"], p1: "Kabir", p2: "Anushka", tagline: "Enamelled in blue and gold", date: [2027, 0, 9], venue: "Neelkanth Haveli", location: "Jaipur, Rajasthan", story: "They met at a jewellery exhibition; he was the curator, she was the one asking too many questions.", hotels: [["Samode Haveli", "2 km"], ["Rambagh Palace", "5 km"]], directions: "Fly into Jaipur (JAI); the haveli is 25 minutes away.", mood: "heritage", flow: "indian" },
  { name: "Ivory Royale", style: "Grand", colors: ["#3A2E2A", "#E3C27E", "#FFFBF2"], p1: "Devansh", p2: "Ritika", tagline: "Quietly grand, truly ours", date: [2027, 9, 24], venue: "Royale Banquet Palace", location: "Chandigarh, Punjab", story: "A blind date arranged by four determined cousins, who all now claim full credit.", hotels: [["JW Marriott Chandigarh", "3 km"], ["Taj Chandigarh", "5 km"]], directions: "Fly into Chandigarh (IXC); the palace is 20 minutes from the airport.", mood: "heritage", flow: "indian" },
  { name: "Copper Glow", style: "Modern Glam", colors: ["#3B2C2A", "#B87333", "#FBF4EC"], p1: "Varun", p2: "Tanvi", tagline: "Warm metal, warmer people", date: [2027, 7, 1], venue: "Copperhouse Hall", location: "Kochi, Kerala", story: "A rooftop dinner that was supposed to last an hour and ended when the kitchen closed.", hotels: [["Grand Hyatt Kochi", "3 km"], ["Crowne Plaza", "8 km"]], directions: "Fly into Kochi (COK); the hall is a 45-minute drive.", mood: "modern", flow: "modern" },
  { name: "Champagne Silk", style: "Modern Glam", colors: ["#2F2A28", "#DCC49B", "#FFFDF8"], p1: "Rishabh", p2: "Neha", tagline: "A toast that never ends", date: [2027, 4, 16], venue: "Silk Ballroom", location: "Gurugram, Haryana", story: "Two startup founders who pitched at the same demo day and celebrated both rejections together.", hotels: [["The Oberoi Gurgaon", "2 km"], ["Trident Gurgaon", "3 km"]], directions: "Fly into Delhi (DEL); the ballroom is 35 minutes by expressway.", mood: "modern", flow: "modern" },
  { name: "Velvet Noir", style: "Moody Luxe", colors: ["#171421", "#C7A15A", "#F4EFE6"], p1: "Aman", p2: "Shreya", tagline: "Low light, high romance", date: [2027, 10, 6], venue: "The Velvet Room", location: "Kolkata, West Bengal", story: "A jazz bar, a rainy Friday, and a pianist who let him dedicate a song to a stranger.", hotels: [["The Park Kolkata", "1 km"], ["JW Marriott", "7 km"]], directions: "Fly into Kolkata (CCU); the venue is a 45-minute drive.", mood: "modern", flow: "modern" },
  { name: "Obsidian Rose", style: "Moody Luxe", colors: ["#1B1A1F", "#B76E79", "#F6F1EF"], p1: "Kunal", p2: "Ira", tagline: "Dark skies, bright vows", date: [2027, 11, 28], venue: "Obsidian Hall", location: "Pune, Maharashtra", story: "They met at a stargazing meet-up and have been chasing dark skies together ever since.", hotels: [["Ritz Carlton Pune", "2 km"], ["Novotel Pune", "5 km"]], directions: "Fly into Pune (PNQ); the hall is 30 minutes away.", mood: "modern", flow: "modern" },
  { name: "Plum Twilight", style: "Moody Luxe", colors: ["#301934", "#D2A96A", "#F8F3EC"], p1: "Harsh", p2: "Ayesha", tagline: "The hour between day and always", date: [2027, 8, 30], venue: "Twilight Terrace", location: "Hyderabad, Telangana", story: "Two poets from the same open-mic night who kept writing about each other before ever speaking.", hotels: [["Park Hyatt Hyderabad", "2 km"], ["ITC Kohenur", "6 km"]], directions: "Fly into Hyderabad (HYD); the terrace is a 30-minute drive.", mood: "modern", flow: "modern" },
  { name: "Slate & Sage", style: "Minimal", colors: ["#3C4A44", "#A3B18A", "#FBFBF8"], p1: "Aniket", p2: "Juhi", tagline: "Calm, considered, committed", date: [2027, 5, 2], venue: "Sage House", location: "Bengaluru, Karnataka", story: "A shared plot in a community garden that slowly became a shared everything.", hotels: [["Taj Yeshwantpur", "5 km"], ["Vivanta Whitefield", "9 km"]], directions: "Fly into Bengaluru (BLR); allow an hour by road.", mood: "garden", flow: "modern" },
  { name: "Terracotta Courtyard", style: "Rustic", colors: ["#7B3F2E", "#E0A96D", "#FCF5EC"], p1: "Manav", p2: "Pooja", tagline: "Clay, courtyards and constancy", date: [2027, 1, 7], venue: "Mitti Courtyard", location: "Bhuj, Gujarat", story: "A craft residency in Kutch where they shared a kiln and eventually a studio.", hotels: [["The Fern Bhuj", "4 km"], ["Regenta Resort", "6 km"]], directions: "Fly into Bhuj (BHJ); the courtyard is 20 minutes away.", mood: "heritage", flow: "indian" },
  { name: "Banyan Shade", style: "Eco-Friendly", colors: ["#33503B", "#C9A66B", "#FAF7EE"], p1: "Rudra", p2: "Kavya", tagline: "Old roots, new shade", date: [2027, 6, 8], venue: "Banyan Grove", location: "Auroville, Puducherry", story: "Two volunteers at a seed library who catalogued 3,000 varieties and one shared future.", hotels: [["Palais de Mahe", "12 km"], ["Dune Eco Village", "6 km"]], directions: "Fly into Chennai (MAA); the grove is a three-hour coastal drive.", mood: "garden", flow: "destination" },
  { name: "Mango Grove", style: "Rustic", colors: ["#6B5426", "#EBC55B", "#FDF9EC"], p1: "Yash", p2: "Diya", tagline: "Sweet season, sweeter life", date: [2027, 4, 24], venue: "Aam Bagh", location: "Malihabad, Uttar Pradesh", story: "A mango-tasting summer where they ranked eleven varieties and disagreed about all of them.", hotels: [["Lebua Lucknow", "25 km"], ["Novotel Lucknow", "28 km"]], directions: "Fly into Lucknow (LKO); the grove is a 50-minute drive.", mood: "garden", flow: "indian" },
  { name: "Riverside Ghat", style: "Traditional", colors: ["#5A2D3C", "#DBA84F", "#FFF6EA"], p1: "Shaurya", p2: "Nandini", tagline: "By the river that remembers", date: [2027, 10, 2], venue: "Ganga Ghat Haveli", location: "Varanasi, Uttar Pradesh", story: "A sunrise boat ride where the guide left them alone for an hour and everything changed.", hotels: [["BrijRama Palace", "0.5 km"], ["Taj Ganges", "5 km"]], directions: "Fly into Varanasi (VNS); the haveli is 40 minutes from the airport.", mood: "heritage", flow: "indian" },
  { name: "Palace Courtyard", style: "Grand", colors: ["#452B3B", "#D2A44C", "#FBF3E6"], p1: "Ranveer", p2: "Aparna", tagline: "Courtyards made for celebration", date: [2027, 11, 21], venue: "Rana Mahal Courtyard", location: "Udaipur, Rajasthan", story: "They met at a wedding they both nearly skipped; the photographer captured them laughing before they were introduced.", hotels: [["Taj Lake Palace", "2 km"], ["Trident Udaipur", "4 km"]], directions: "Fly into Udaipur (UDR); the mahal is a 30-minute drive.", mood: "heritage", flow: "indian" },
  { name: "Lotus Pond", style: "Traditional", colors: ["#5E2750", "#E4B363", "#FFF7F0"], p1: "Anirudh", p2: "Sneha", tagline: "Rising clear, blooming bright", date: [2027, 7, 23], venue: "Kamal Sarovar Lawns", location: "Bhopal, Madhya Pradesh", story: "A birdwatching morning by the lake where they whispered for four hours straight.", hotels: [["Jehan Numa Palace", "3 km"], ["Courtyard Bhopal", "6 km"]], directions: "Fly into Bhopal (BHO); the lawns are 25 minutes away.", mood: "indian", flow: "indian" },
  { name: "Peacock Garden", style: "Fusion", colors: ["#154B5B", "#E2B04A", "#FFF8EC"], p1: "Tanish", p2: "Ruhi", tagline: "Colour everywhere, calm inside", date: [2027, 2, 6], venue: "Mayur Baug", location: "Vadodara, Gujarat", story: "Two dancers from different schools who choreographed one duet and never stopped rehearsing.", hotels: [["WelcomHotel Vadodara", "3 km"], ["Grand Mercure", "5 km"]], directions: "Fly into Vadodara (BDQ); the garden is 20 minutes away.", mood: "indian", flow: "indian" },
  { name: "Marigold Mornings", style: "Fusion", colors: ["#8A3324", "#F2A81D", "#FFF6E3"], p1: "Parth", p2: "Aisha", tagline: "Orange skies, open hearts", date: [2027, 0, 30], venue: "Genda Phool Farm", location: "Nagpur, Maharashtra", story: "A flower-market run at 5 a.m. for a friend's wedding that turned into their own tradition.", hotels: [["Radisson Blu Nagpur", "7 km"], ["Le Meridien", "9 km"]], directions: "Fly into Nagpur (NAG); the farm is a 40-minute drive.", mood: "indian", flow: "indian" },
  { name: "Indigo Handloom", style: "Eco-Friendly", colors: ["#1F3A5F", "#D9C7A0", "#FAF8F2"], p1: "Advait", p2: "Trisha", tagline: "Handwoven, heart-led", date: [2027, 3, 24], venue: "Neel Handloom Barn", location: "Pochampally, Telangana", story: "They met buying the same ikat saree; she let him have it, he gifted it back with a note.", hotels: [["Taj Deccan", "45 km"], ["Trident Hyderabad", "40 km"]], directions: "Fly into Hyderabad (HYD); the barn is a 75-minute drive east.", mood: "heritage", flow: "indian" },
  { name: "Coconut Grove", style: "Destination", colors: ["#1E5945", "#EFC050", "#FFFBF0"], p1: "Nithin", p2: "Reshma", tagline: "Green shade, blue water", date: [2027, 1, 13], venue: "Thengu Grove Resort", location: "Kumarakom, Kerala", story: "A canoe trip through narrow canals where they both fell in and laughed the whole way back.", hotels: [["Kumarakom Lake Resort", "1 km"], ["Coconut Lagoon", "3 km"]], directions: "Fly into Kochi (COK); the resort is a two-hour drive south.", mood: "beach", flow: "destination" },
  { name: "Harbour Lights", style: "Modern Glam", colors: ["#16283C", "#C9B037", "#F7F5F0"], p1: "Rehan", p2: "Alia", tagline: "Anchored, always", date: [2027, 9, 9], venue: "Dockside Pavilion", location: "Mormugao, Goa", story: "A sailing lesson where neither could tie a bowline and both refused to give up.", hotels: [["Grand Hyatt Goa", "6 km"], ["Cidade de Goa", "9 km"]], directions: "Fly into Goa (GOI); the pavilion is a 25-minute drive.", mood: "beach", flow: "destination" },
  { name: "Sunrise Cliff", style: "Bohemian", colors: ["#4A3A5A", "#F0A868", "#FFF9F2"], p1: "Veer", p2: "Anaya", tagline: "First light, forever after", date: [2027, 5, 19], venue: "Cliff Point Deck", location: "Gokarna, Karnataka", story: "They hiked to the same viewpoint every full moon for a year before either said anything.", hotels: [["SwaSwara", "4 km"], ["Kahani Paradise", "7 km"]], directions: "Fly into Goa (GOI); the deck is a three-hour coastal drive south.", mood: "beach", flow: "destination" },
  { name: "Ivory Chapel", style: "Romantic", colors: ["#2C3639", "#DCD7C9", "#FFFFFF"], p1: "Joel", p2: "Grace", tagline: "Kept simple, meant deeply", date: [2027, 3, 12], venue: "Ivory Chapel", location: "Shillong, Meghalaya", story: "A choir tour, a broken guitar string and a duet they had to improvise.", hotels: [["Ri Kynjai", "12 km"], ["Vivanta Shillong", "4 km"]], directions: "Fly into Guwahati (GAU); the chapel is a three-hour hill drive.", mood: "garden", flow: "christian" },
  { name: "Rose Cathedral", style: "Romantic", colors: ["#4B2E39", "#E8B4B8", "#FFF8F6"], p1: "Steve", p2: "Anna Maria", tagline: "Old stone, new song", date: [2027, 8, 19], venue: "Rosary Cathedral", location: "Panaji, Goa", story: "A Sunday service where he sang off-key and she could not stop smiling about it.", hotels: [["Hotel Fidalgo", "2 km"], ["Vivanta Panaji", "3 km"]], directions: "Fly into Goa (GOX); the cathedral is a 40-minute drive.", mood: "heritage", flow: "christian" },
  { name: "Garden Gazebo", style: "Romantic", colors: ["#3F5D45", "#E6C79C", "#FDFAF3"], p1: "Kevin", p2: "Diana", tagline: "Under the same roses", date: [2027, 4, 7], venue: "Rose Gazebo Lawns", location: "Ooty, Tamil Nadu", story: "Both entered the town flower show; she won, he asked for a rematch over dinner.", hotels: [["Taj Savoy", "2 km"], ["Sterling Ooty", "4 km"]], directions: "Fly into Coimbatore (CJB); the lawns are a 2.5-hour hill drive.", mood: "garden", flow: "christian" },
  { name: "Snowline Vows", style: "Destination", colors: ["#2A3A4A", "#DDE6ED", "#FFFFFF"], p1: "Abhinav", p2: "Sonia", tagline: "Cold air, warm forever", date: [2027, 11, 6], venue: "Snowline Lodge", location: "Gulmarg, Jammu & Kashmir", story: "A ski trip where she taught him to stop and he taught her to fall gracefully.", hotels: [["The Khyber", "1 km"], ["Hotel Highlands Park", "2 km"]], directions: "Fly into Srinagar (SXR); the lodge is a two-hour mountain drive.", mood: "garden", flow: "destination" },
  { name: "Heritage Fort", style: "Grand", colors: ["#463F3A", "#C9A227", "#FAF3E7"], p1: "Samarth", p2: "Prisha", tagline: "Stone walls, soft hearts", date: [2027, 10, 18], venue: "Neemrana Fort Courtyard", location: "Neemrana, Rajasthan", story: "A heritage walk where the guide gave up and let them explore the fort alone.", hotels: [["Neemrana Fort Palace", "0 km"], ["Tijara Fort", "35 km"]], directions: "Fly into Delhi (DEL); the fort is a two-hour drive on NH48.", mood: "heritage", flow: "indian" },
  { name: "Riverfront Pavilion", style: "Fusion", colors: ["#2B4B5A", "#E0B252", "#FDF8EE"], p1: "Ayaan", p2: "Myra", tagline: "Where two currents meet", date: [2027, 0, 12], venue: "Riverfront Pavilion", location: "Guwahati, Assam", story: "A river cruise on the Brahmaputra where the sunset lasted exactly long enough.", hotels: [["Radisson Blu Guwahati", "5 km"], ["Novotel Guwahati", "7 km"]], directions: "Fly into Guwahati (GAU); the pavilion is a 30-minute drive.", mood: "garden", flow: "indian" },
];

function build(seed: Seed, index: number): ExtraTemplate {
  const pool = PHOTOS[seed.mood];
  const [y, m, d] = seed.date;
  const pick = <T,>(arr: T[], shift = 0) => arr[(index + shift) % arr.length];

  const fmt = (offset: number) => {
    const dt = new Date(Date.UTC(y, m, d + offset));
    return `${SHORT[dt.getUTCMonth()]} ${dt.getUTCDate()}, ${dt.getUTCFullYear()}`;
  };

  return {
    name: seed.name,
    colors: seed.colors,
    style: seed.style,
    couple: `${seed.p1} & ${seed.p2}`,
    partner1: seed.p1,
    partner2: seed.p2,
    tagline: seed.tagline,
    weddingDate: `${MONTHS[m]} ${d}, ${y}`,
    venue: seed.venue,
    location: seed.location,
    story: seed.story,
    couplePhoto: U(pick(pool.couple), 800, 600),
    heroPhoto: U(pick(pool.hero, 1), 1200, 800),
    events: FLOWS[seed.flow].map((e) => ({
      name: e.name,
      date: fmt(e.offset),
      time: e.time,
      venue: e.where(seed.venue),
    })),
    guestbookMessages: [
      { name: pick(WISHERS), message: pick(WISHES)(seed.p1, seed.p2) },
      { name: pick(WISHERS, 3), message: pick(WISHES, 2)(seed.p1, seed.p2) },
    ],
    travelInfo: {
      hotels: seed.hotels.map(([name, distance]) => ({ name, distance: `${distance} from venue` })),
      directions: seed.directions,
    },
    galleryPhotos: pool.gallery.map((id, i) => ({
      label: GALLERY_LABELS[i] ?? "Celebration",
      url: U(id, 600, i % 3 === 2 ? 800 : 450),
    })),
  };
}

export const EXTRA_TEMPLATES: ExtraTemplate[] = SEEDS.map(build);
