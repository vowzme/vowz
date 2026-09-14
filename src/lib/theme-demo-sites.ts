// Themed full-site demos. Each of the 10 curated themes has a corresponding
// "look-like-a-real-wedding-website" demo that can be viewed at /site/demo-<id>.
// Content is derived from wedding-themes + theme-templates and enriched here
// with real venues, sample gallery photos, travel notes, blessings, and dates.

import { WEDDING_THEMES, getTheme } from "@/lib/wedding-themes";
import { buildThemeTemplate } from "@/lib/theme-templates";

// Curated Unsplash direct-image URLs. Each is a stable photo ID.
// Grouped so themed demos feel visually distinct.
export const PHOTO_SETS: Record<string, { hero: string; gallery: string[]; venue: string }> = {
  "royal-rajput": {
    hero: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600091474842-6ec372d3d2c8?w=1200&q=80",
      "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=1200&q=80",
      "https://images.unsplash.com/photo-1595407660626-db35dcd16609?w=1200&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
      "https://images.unsplash.com/photo-1583939411023-14783179e581?w=1200&q=80",
      "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1200&q=80",
    ],
    venue: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1600&q=80",
  },
  "south-indian-temple": {
    hero: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?w=1200&q=80",
      "https://images.unsplash.com/photo-1610894820394-3c3fc46e8f47?w=1200&q=80",
      "https://images.unsplash.com/photo-1590080876306-fac1a01e6f4a?w=1200&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80",
      "https://images.unsplash.com/photo-1604608672516-f1b9b1d1f1f6?w=1200&q=80",
      "https://images.unsplash.com/photo-1610030006630-4c1a1c9a3f34?w=1200&q=80",
    ],
    venue: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&q=80",
  },
  "modern-minimal": {
    hero: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=1200&q=80",
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80",
      "https://images.unsplash.com/photo-1519657337289-077653f724ed?w=1200&q=80",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=80",
      "https://images.unsplash.com/photo-1525258946800-98cfd641d0de?w=1200&q=80",
    ],
    venue: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1600&q=80",
  },
  "bengali-alpona": {
    hero: "https://images.unsplash.com/photo-1622479054828-fc7ff0d13ffd?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?w=1200&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80",
      "https://images.unsplash.com/photo-1595407660626-db35dcd16609?w=1200&q=80",
      "https://images.unsplash.com/photo-1600091474842-6ec372d3d2c8?w=1200&q=80",
      "https://images.unsplash.com/photo-1610894820394-3c3fc46e8f47?w=1200&q=80",
      "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=1200&q=80",
    ],
    venue: "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=1600&q=80",
  },
  "goa-beach": {
    hero: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80",
      "https://images.unsplash.com/photo-1531761535209-180857e963b9?w=1200&q=80",
      "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=1200&q=80",
      "https://images.unsplash.com/photo-1520454974749-611b7248ffdb?w=1200&q=80",
      "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=1200&q=80",
    ],
    venue: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80",
  },
  "kerala-backwaters": {
    hero: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=80",
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=80",
      "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&q=80",
      "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=1200&q=80",
      "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1200&q=80",
      "https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=1200&q=80",
    ],
    venue: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1600&q=80",
  },
  "punjabi-anand-karaj": {
    hero: "https://images.unsplash.com/photo-1595407660626-db35dcd16609?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1595407660626-db35dcd16609?w=1200&q=80",
      "https://images.unsplash.com/photo-1600091474842-6ec372d3d2c8?w=1200&q=80",
      "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=1200&q=80",
      "https://images.unsplash.com/photo-1583939411023-14783179e581?w=1200&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80",
      "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1200&q=80",
    ],
    venue: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&q=80",
  },
  "marwari-haveli": {
    hero: "https://images.unsplash.com/photo-1600091474842-6ec372d3d2c8?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600091474842-6ec372d3d2c8?w=1200&q=80",
      "https://images.unsplash.com/photo-1583939411023-14783179e581?w=1200&q=80",
      "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=1200&q=80",
      "https://images.unsplash.com/photo-1595407660626-db35dcd16609?w=1200&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
    ],
    venue: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1600&q=80",
  },
  "christian-chapel": {
    hero: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=1200&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80",
      "https://images.unsplash.com/photo-1519657337289-077653f724ed?w=1200&q=80",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=80",
      "https://images.unsplash.com/photo-1525258946800-98cfd641d0de?w=1200&q=80",
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80",
    ],
    venue: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1600&q=80",
  },
  "boho-destination": {
    hero: "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=1200&q=80",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=80",
      "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=1200&q=80",
      "https://images.unsplash.com/photo-1520454974749-611b7248ffdb?w=1200&q=80",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80",
      "https://images.unsplash.com/photo-1531761535209-180857e963b9?w=1200&q=80",
    ],
    venue: "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=1600&q=80",
  },
  // ——— LUXE collection ———
  "luxe-ivory-royale": {
    hero: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=1200&q=80",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80",
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80",
      "https://images.unsplash.com/photo-1525258946800-98cfd641d0de?w=1200&q=80",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&q=80",
    ],
    venue: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1600&q=80",
  },
  "luxe-midnight-meenakari": {
    hero: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600091474842-6ec372d3d2c8?w=1200&q=80",
      "https://images.unsplash.com/photo-1519657337289-077653f724ed?w=1200&q=80",
      "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=1200&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
      "https://images.unsplash.com/photo-1595407660626-db35dcd16609?w=1200&q=80",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=80",
    ],
    venue: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1600&q=80",
  },
  "luxe-emerald-heirloom": {
    hero: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1583939411023-14783179e581?w=1200&q=80",
      "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1200&q=80",
      "https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?w=1200&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80",
      "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=1200&q=80",
    ],
    venue: "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=1600&q=80",
  },
};

// Themed venue/city details for the events section.
const VENUES: Record<string, { city: string; venue: string; address: string; date: string; time: string }[]> = {
  "royal-rajput": [
    { city: "Udaipur, India", venue: "Zenana Mahal, City Palace", address: "City Palace Complex, Udaipur, Rajasthan", date: "November 12, 2026", time: "7:00 PM" },
    { city: "Udaipur, India", venue: "Sunset Terrace, Taj Lake Palace", address: "Pichola, Udaipur, Rajasthan", date: "November 13, 2026", time: "6:00 PM" },
    { city: "Udaipur, India", venue: "Durbar Hall, The Leela Palace", address: "Lake Pichola, Udaipur", date: "November 14, 2026", time: "5:30 PM" },
  ],
  "south-indian-temple": [
    { city: "Chennai, India", venue: "Sri Krishna Gana Sabha", address: "TTK Road, Alwarpet, Chennai", date: "May 22, 2026", time: "7:30 AM" },
    { city: "Chennai, India", venue: "Rani Seethai Hall", address: "Anna Salai, Chennai, Tamil Nadu", date: "May 22, 2026", time: "12:30 PM" },
    { city: "Chennai, India", venue: "The Leela Palace Chennai", address: "Adyar Seaface, MRC Nagar, Chennai", date: "May 22, 2026", time: "7:00 PM" },
  ],
  "modern-minimal": [
    { city: "Bengaluru, India", venue: "The Tamarind Tree", address: "Kanakapura Road, Bengaluru", date: "February 14, 2026", time: "7:00 PM" },
    { city: "Bengaluru, India", venue: "The Leela Palace", address: "Old Airport Road, Bengaluru", date: "February 15, 2026", time: "6:00 PM" },
  ],
  "bengali-alpona": [
    { city: "Kolkata, India", venue: "The Tollygunge Club", address: "120 Deshapran Sasmal Road, Kolkata", date: "December 9, 2026", time: "6:00 PM" },
    { city: "Kolkata, India", venue: "ITC Sonar", address: "1 J.B.S. Haldane Avenue, Kolkata", date: "December 10, 2026", time: "7:30 PM" },
    { city: "Kolkata, India", venue: "Rajbari Bawali", address: "Nurpur Road, South 24 Parganas", date: "December 11, 2026", time: "5:30 PM" },
  ],
  "goa-beach": [
    { city: "Goa, India", venue: "Ashvem Beach Shack", address: "Ashvem, Mandrem, North Goa", date: "January 24, 2026", time: "5:00 PM" },
    { city: "Goa, India", venue: "W Goa, Vagator", address: "Vagator Beach, Bardez, Goa", date: "January 25, 2026", time: "4:30 PM" },
    { city: "Goa, India", venue: "Taj Fort Aguada Beach Resort", address: "Sinquerim, Bardez, Goa", date: "January 26, 2026", time: "5:30 PM" },
  ],
  "kerala-backwaters": [
    { city: "Alleppey, India", venue: "Kumarakom Lake Resort", address: "Kumarakom North, Kottayam, Kerala", date: "April 18, 2026", time: "10:00 AM" },
    { city: "Alleppey, India", venue: "Purity at Lake Vembanad", address: "Muhamma, Alappuzha, Kerala", date: "April 18, 2026", time: "12:00 PM" },
    { city: "Alleppey, India", venue: "Taj Bekal", address: "Kappil Beach, Bekal, Kerala", date: "April 19, 2026", time: "6:30 PM" },
  ],
  "punjabi-anand-karaj": [
    { city: "Amritsar, India", venue: "Gurdwara Baba Deep Singh", address: "Chattiwind Road, Amritsar", date: "October 25, 2026", time: "9:30 AM" },
    { city: "Amritsar, India", venue: "Taj Swarna", address: "Albert Road, Amritsar, Punjab", date: "October 24, 2026", time: "7:00 PM" },
    { city: "Amritsar, India", venue: "Hyatt Regency Amritsar", address: "GT Road, Amritsar, Punjab", date: "October 25, 2026", time: "7:30 PM" },
  ],
  "marwari-haveli": [
    { city: "Jodhpur, India", venue: "Umaid Bhawan Palace", address: "Circuit House Road, Jodhpur", date: "December 3, 2026", time: "6:30 PM" },
    { city: "Jodhpur, India", venue: "RAAS Jodhpur", address: "Tunwarji Ka Jhalra, Makrana Mohalla", date: "December 4, 2026", time: "7:00 PM" },
    { city: "Jodhpur, India", venue: "Mehrangarh Fort — Chokelao Bagh", address: "Mehrangarh Fort, Jodhpur", date: "December 5, 2026", time: "6:00 PM" },
  ],
  "christian-chapel": [
    { city: "Bandra, Mumbai", venue: "Mount Mary Basilica", address: "Mount Mary Road, Bandra West, Mumbai", date: "June 20, 2026", time: "4:30 PM" },
    { city: "Bandra, Mumbai", venue: "Sofitel Mumbai BKC", address: "C-57, G Block, BKC, Bandra East", date: "June 20, 2026", time: "7:00 PM" },
  ],
  "boho-destination": [
    { city: "Jaisalmer, India", venue: "Suryagarh Jaisalmer", address: "Kahala Phata, Sam Road, Jaisalmer", date: "March 7, 2026", time: "6:00 PM" },
    { city: "Jaisalmer, India", venue: "Serai Camp — Sam Dunes", address: "Sam Sand Dunes, Jaisalmer", date: "March 8, 2026", time: "5:30 PM" },
    { city: "Jaisalmer, India", venue: "Suryagarh — Rooftop Terrace", address: "Kahala Phata, Sam Road, Jaisalmer", date: "March 9, 2026", time: "7:00 PM" },
  ],
};

const HOTELS: Record<string, { name: string; description: string; address: string; distance: string }[]> = {
  "royal-rajput": [
    { name: "Taj Lake Palace", description: "Iconic floating palace on Lake Pichola — special block for our guests.", address: "Pichola, Udaipur", distance: "On-site" },
    { name: "The Oberoi Udaivilas", description: "Riverside luxury with private pools and a boat shuttle.", address: "Haridasji Ki Magri, Udaipur", distance: "15 min by boat" },
    { name: "Trident Udaipur", description: "Warm lake-view rooms at a friendly rate.", address: "Mulla Talai, Udaipur", distance: "10 min by car" },
  ],
  "south-indian-temple": [
    { name: "The Leela Palace Chennai", description: "Adyar seafront luxury steps from the mandapam.", address: "MRC Nagar, Chennai", distance: "10 min" },
    { name: "ITC Grand Chola", description: "Chola-inspired grandeur and world-class dining.", address: "Guindy, Chennai", distance: "20 min" },
    { name: "Taj Coromandel", description: "Central, refined, and family-friendly.", address: "Nungambakkam, Chennai", distance: "15 min" },
  ],
  "modern-minimal": [
    { name: "The Oberoi Bengaluru", description: "Central, calm, garden-forward.", address: "MG Road, Bengaluru", distance: "20 min" },
    { name: "The Leela Palace", description: "A short drive from the venue with a curated brunch.", address: "Old Airport Road, Bengaluru", distance: "10 min" },
  ],
  "bengali-alpona": [
    { name: "ITC Sonar", description: "Waterbody views and warm Bengali hospitality.", address: "J.B.S. Haldane Ave, Kolkata", distance: "5 min" },
    { name: "The Oberoi Grand", description: "Heritage stay in the heart of the city.", address: "Chowringhee Road, Kolkata", distance: "20 min" },
    { name: "Rajbari Bawali", description: "A restored 300-year-old zamindari mansion.", address: "Nurpur, South 24 Parganas", distance: "45 min" },
  ],
  "goa-beach": [
    { name: "W Goa", description: "Vagator cliff-side rooms with an ocean view.", address: "Vagator Beach, Goa", distance: "On-site" },
    { name: "Taj Fort Aguada", description: "Heritage seaside fort with private pools.", address: "Sinquerim, Goa", distance: "20 min" },
    { name: "Ahilya by the Sea", description: "Boutique villa hideaway with sunset decks.", address: "Nerul, North Goa", distance: "25 min" },
  ],
  "kerala-backwaters": [
    { name: "Kumarakom Lake Resort", description: "Backwater villas with a private meandering pool.", address: "Kumarakom, Kottayam", distance: "On-site" },
    { name: "Taj Bekal", description: "Kerala's coast with a private beach and Ayurveda spa.", address: "Kappil Beach, Bekal", distance: "1.5 hr" },
    { name: "Purity at Lake Vembanad", description: "Boutique lakefront calm with 14 suites.", address: "Muhamma, Alappuzha", distance: "30 min" },
  ],
  "punjabi-anand-karaj": [
    { name: "Taj Swarna", description: "Sikh-heritage architecture, close to the Golden Temple.", address: "Albert Road, Amritsar", distance: "10 min" },
    { name: "Hyatt Regency Amritsar", description: "Modern comfort with warm Punjabi hospitality.", address: "GT Road, Amritsar", distance: "12 min" },
    { name: "Ranjit's SVAASA", description: "Boutique haveli, 200 years of family history.", address: "The Mall, Amritsar", distance: "8 min" },
  ],
  "marwari-haveli": [
    { name: "Umaid Bhawan Palace", description: "Royal residence with our reserved wedding wing.", address: "Circuit House Road, Jodhpur", distance: "On-site" },
    { name: "RAAS Jodhpur", description: "Design-forward heritage stay under the fort.", address: "Makrana Mohalla, Jodhpur", distance: "10 min" },
    { name: "Ajit Bhawan", description: "The first heritage hotel in India — cozy and characterful.", address: "Airport Road, Jodhpur", distance: "15 min" },
  ],
  "christian-chapel": [
    { name: "Sofitel Mumbai BKC", description: "Contemporary French-forward rooms near the church.", address: "BKC, Mumbai", distance: "20 min" },
    { name: "Taj Lands End", description: "Bandra bayfront with a lovely brunch.", address: "Bandstand, Bandra West", distance: "5 min" },
  ],
  "boho-destination": [
    { name: "Suryagarh Jaisalmer", description: "Golden-fort inspired stay with private courtyards.", address: "Kahala Phata, Jaisalmer", distance: "On-site" },
    { name: "The Serai — Sam Dunes", description: "Luxury tents in the Thar with private plunge pools.", address: "Sam Dunes, Jaisalmer", distance: "45 min" },
    { name: "Rawla Narlai", description: "A 17th-century Marwar hideaway between Jodhpur & Udaipur.", address: "Narlai, Rajasthan", distance: "4 hr drive" },
  ],
};

const REGISTRY_ITEMS: Record<string, { name: string; description: string; link: string }[]> = {
  "royal-rajput": [
    { name: "Honeymoon in Kyoto", description: "Cherry blossoms in April.", link: "https://example.com" },
    { name: "Home in Udaipur", description: "Setting up our lakeside home.", link: "https://example.com" },
    { name: "Grow-Trees Fund", description: "Plant a tree in our names.", link: "https://example.com" },
  ],
  "modern-minimal": [
    { name: "Espresso Kit", description: "Help us build our morning ritual.", link: "https://example.com" },
    { name: "Bookshelf Fund", description: "A shared library for our new home.", link: "https://example.com" },
    { name: "Kyoto Honeymoon", description: "Sakura, ryokans, kaiseki.", link: "https://example.com" },
  ],
  "goa-beach": [
    { name: "Maldives Honeymoon", description: "Overwater villa mornings.", link: "https://example.com" },
    { name: "Beach House Fund", description: "A little cottage in Assagao.", link: "https://example.com" },
    { name: "Reef Guardian", description: "Adopt a coral in our names.", link: "https://example.com" },
  ],
};

function defaultRegistry(themeId: string) {
  return REGISTRY_ITEMS[themeId] ?? [
    { name: "Honeymoon Fund", description: "Help us plan the trip of a lifetime.", link: "https://example.com" },
    { name: "Home Together", description: "A little something for our first home.", link: "https://example.com" },
    { name: "Give Back", description: "A donation to a cause close to our hearts.", link: "https://example.com" },
  ];
}

export function getThemeDemoSite(themeId: string) {
  const theme = getTheme(themeId);
  if (!theme) return null;
  const tpl = buildThemeTemplate(theme);
  const photos = PHOTO_SETS[themeId] ?? PHOTO_SETS["modern-minimal"];
  const venueList = VENUES[themeId] ?? VENUES["modern-minimal"];
  const hotels = HOTELS[themeId] ?? HOTELS["modern-minimal"];
  const firstDate = venueList[venueList.length - 1]?.date ?? "August 20, 2026";

  return {
    id: `demo-${themeId}`,
    partner1: tpl.partner1,
    partner2: tpl.partner2,
    cultural_background: theme.tradition,
    how_we_met: tpl.howWeMet,
    theme: themeId,
    tagline: tpl.tagline,
    suggested_colors: [theme.colors.bg, theme.colors.accent, theme.colors.surface],
    display_font: theme.fonts.display,
    body_font: theme.fonts.body,
    is_published: true,
    slug: `demo-${themeId}`,
    site_language: "en",
    translations: null,
    sections: [
      {
        id: "hero",
        type: "hero",
        visible: true,
        data: {
          heading: `${tpl.partner1} & ${tpl.partner2}`,
          subheading: tpl.heroSubheading,
          tagline: tpl.tagline,
          heroImageUrl: photos.hero,
        },
      },
      {
        id: "countdown",
        type: "countdown",
        visible: true,
        data: { label: tpl.countdownLabel, date: `${firstDate} 17:30:00 GMT+0530` },
      },
      {
        id: "story",
        type: "story",
        visible: true,
        data: { heading: tpl.storyHeading, body: tpl.howWeMet },
      },
      {
        id: "events",
        type: "events",
        visible: true,
        data: {
          heading: "Wedding Events",
          events: tpl.events.map((name, i) => {
            const v = venueList[i % venueList.length];
            return { name, date: v.date, time: v.time, venue: v.venue, address: v.address, location: v.city };
          }),
        },
      },
      {
        id: "gallery",
        type: "gallery",
        visible: true,
        data: {
          heading: "Moments We Love",
          photos: photos.gallery.map((url, i) => ({ id: `p${i + 1}`, url, name: `Memory ${i + 1}` })),
        },
      },
      {
        id: "travel",
        type: "travel",
        visible: true,
        data: {
          heading: "Travel & Stay",
          description: tpl.travelDescription,
          hotels,
          directions:
            "We'll share door-to-door transport details with every RSVP. Airport pickups are complimentary for out-of-town guests.",
        },
      },
      {
        id: "registry",
        type: "registry",
        visible: true,
        data: {
          heading: "Gift Registry & Shagun",
          description: "Your presence is our greatest gift. Send Shagun over UPI or pick a gift from the list — every blessing means the world to us.",
          upi: {
            vpa: `${tpl.partner1.toLowerCase()}.${tpl.partner2.toLowerCase()}@upi`,
            name: `${tpl.partner1} & ${tpl.partner2}`,
            note: "Wedding Shagun 💛",
          },
          items: defaultRegistry(themeId),
        },
      },
      {
        id: "blessings",
        type: "blessings",
        visible: true,
        data: {
          heading: "Share a Photo & Wish",
          description: "Guests can upload a photo with the couple and leave a blessing — every message shows up on the page.",
        },
      },
      {
        id: "guestbook",
        type: "guestbook",
        visible: true,
        data: { heading: tpl.guestbookHeading, description: tpl.guestbookDescription },
      },
      {
        id: "rsvp",
        type: "rsvp",
        visible: true,
        data: { heading: tpl.rsvpHeading, body: tpl.rsvpBody },
      },
    ],
  } as const;
}

// Theme categorization for the gallery page.
export type ThemeCategory = {
  id: string;
  label: string;
  description: string;
  themeIds: string[];
};

export const THEME_CATEGORIES: ThemeCategory[] = [
  {
    id: "north-indian",
    label: "North Indian",
    description: "Regal palace weddings, mirror-work havelis, dhol-driven celebrations.",
    themeIds: ["royal-rajput", "marwari-haveli", "punjabi-anand-karaj"],
  },
  {
    id: "south-indian",
    label: "South Indian",
    description: "Temple mornings, silk-woven Muhurthams and backwater kalyanams.",
    themeIds: ["south-indian-temple", "kerala-backwaters"],
  },
  {
    id: "east-indian",
    label: "East Indian",
    description: "Terracotta reds, alpona lines, and Rabindrik warmth.",
    themeIds: ["bengali-alpona"],
  },
  {
    id: "coastal-destination",
    label: "Coastal & Destination",
    description: "Beach ceremonies, desert camps, and long-table feasts under the stars.",
    themeIds: ["goa-beach", "boho-destination"],
  },
  {
    id: "muslim-nikah",
    label: "Muslim · Nikah & Walima",
    description: "Emerald jaali arches, antique gold calligraphy and soft Walima rose.",
    themeIds: ["nikah-emerald", "walima-rose"],
  },
  {
    id: "christian",
    label: "Christian & Chapel",
    description: "Cathedral hush, blush florals, and sage-toned receptions.",
    themeIds: ["christian-chapel"],
  },
  {
    id: "modern-editorial",
    label: "Modern & Editorial",
    description: "Refined type, editorial whitespace and a single accent.",
    themeIds: ["modern-minimal"],
  },
];

// Convenience for other modules (e.g. sitemap).
export const ALL_THEME_IDS = WEDDING_THEMES.map((t) => t.id);
