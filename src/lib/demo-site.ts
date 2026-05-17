// Hardcoded demo wedding site shown at /site/demo
// Used to showcase look & feel and features without requiring auth or DB seeding.

export const DEMO_WEDDING_DATE = "2026-08-20T17:30:00+05:30";

export const demoWeddingSite = {
  id: "00000000-0000-0000-0000-000000000d3m",
  partner1: "Aarav",
  partner2: "Priya",
  cultural_background: "Indian",
  how_we_met:
    "We met on a rainy August evening at a tiny bookshop in Bandra — Aarav reached for the last copy of a worn poetry collection, and Priya reached for it at the very same moment. One shared espresso turned into six hours of conversation, then six weekends, then six countries. Five years later, on the same monsoon street, Aarav got down on one knee with a single white lily — and Priya said yes before he could finish the question.",
  theme: "royal",
  tagline: "Two hearts, one beautiful forever",
  suggested_colors: ["#6B1D2A", "#D4A853", "#FFF5E6"],
  is_published: true,
  slug: "demo",
  site_language: "en",
  translations: null,
  sections: [
    {
      id: "hero",
      type: "hero",
      visible: true,
      data: {
        heading: "Aarav & Priya",
        subheading: "Together with their families invite you to celebrate",
        tagline: "Two hearts, one beautiful forever",
        heroImageUrl: "/demo/couple-hero.jpg",
      },
    },
    {
      id: "countdown",
      type: "countdown",
      visible: true,
      data: { label: "Counting Down to Forever", date: DEMO_WEDDING_DATE },
    },
    {
      id: "story",
      type: "story",
      visible: true,
      data: {
        heading: "Our Love Story",
        body: "We met on a rainy August evening at a tiny bookshop in Bandra — Aarav reached for the last copy of a worn poetry collection, and Priya reached for it at the very same moment. One shared espresso turned into six hours of conversation, then six weekends, then six countries.\n\nFive years later, on the same monsoon street, Aarav got down on one knee with a single white lily — and Priya said yes before he could finish the question. And now, we'd love nothing more than to celebrate the beginning of forever surrounded by the people we love most.",
      },
    },
    {
      id: "events",
      type: "events",
      visible: true,
      data: {
        heading: "Wedding Events",
        events: [
          {
            name: "Mehendi & Sangeet",
            date: "August 18, 2026",
            time: "6:00 PM onwards",
            venue: "Royal Garden Lawns",
            address: "Lake Pichola Road, Udaipur, Rajasthan",
            location: "Udaipur, India",
          },
          {
            name: "Haldi Ceremony",
            date: "August 19, 2026",
            time: "10:00 AM",
            venue: "Sunrise Courtyard, Taj Lake Palace",
            address: "Pichola, Udaipur, Rajasthan 313001",
            location: "Udaipur, India",
          },
          {
            name: "Wedding Ceremony",
            date: "August 20, 2026",
            time: "5:30 PM",
            venue: "The Leela Palace, Udaipur",
            address: "Lake Pichola, Udaipur, Rajasthan 313001",
            location: "Udaipur, India",
          },
        ],
      },
    },
    {
      id: "gallery",
      type: "gallery",
      visible: true,
      data: {
        heading: "Moments We Love",
        photos: [
          { id: "p1", url: "/demo/gallery-1.jpg", name: "Beach engagement" },
          { id: "p2", url: "/demo/gallery-2.jpg", name: "Mehendi details" },
          { id: "p3", url: "/demo/gallery-3.jpg", name: "The mandap" },
          { id: "p4", url: "/demo/gallery-4.jpg", name: "Sangeet night" },
          { id: "p5", url: "/demo/couple-hero.jpg", name: "Golden hour" },
          { id: "p6", url: "/demo/venue.jpg", name: "The venue" },
        ],
      },
    },
    {
      id: "travel",
      type: "travel",
      visible: true,
      data: {
        heading: "Travel & Stay",
        description:
          "Udaipur is a magical city of lakes and palaces. We've curated a few stays to make your visit effortless — book early for the best rates.",
        hotels: [
          {
            name: "Taj Lake Palace",
            description: "Iconic floating palace on Lake Pichola — fairy-tale luxury, special room block for our guests.",
            address: "Pichola, Udaipur, Rajasthan",
            distance: "Wedding venue (on-site)",
          },
          {
            name: "The Oberoi Udaivilas",
            description: "Riverside resort with private pools and a complimentary boat shuttle to the venue.",
            address: "Haridasji Ki Magri, Udaipur, Rajasthan",
            distance: "15 minutes by boat",
          },
          {
            name: "Trident Udaipur",
            description: "Comfortable, modern rooms at a friendly nightly rate — perfect for friends and family.",
            address: "Mulla Talai, Udaipur, Rajasthan",
            distance: "10 minutes by car",
          },
          {
            name: "Hotel Lakend",
            description: "Charming lake-view stay with a hearty Rajasthani breakfast included.",
            address: "Alkapuri, Fateh Sagar, Udaipur",
            distance: "20 minutes by car",
          },
        ],
        directions:
          "Nearest airport: Maharana Pratap (UDR), 25 km from venue. Direct daily flights from Delhi, Mumbai and Bengaluru.\nWe will arrange complimentary airport pickups for all out-of-town guests — please RSVP with your arrival details and we'll be in touch.",
      },
    },
    {
      id: "registry",
      type: "registry",
      visible: true,
      data: {
        heading: "Gift Registry",
        description:
          "Your presence is the greatest gift. If you'd still like to bless us with something, here are a few thoughtful options.",
        items: [
          { name: "Honeymoon in Kyoto", description: "Help us explore Japan in cherry-blossom season.", link: "https://example.com" },
          { name: "Plant a Tree", description: "Contribute to a forest in our names through Grow-Trees.", link: "https://example.com" },
          { name: "Home Together", description: "A small fund toward setting up our first home in Bengaluru.", link: "https://example.com" },
        ],
      },
    },
    {
      id: "guestbook",
      type: "guestbook",
      visible: true,
      data: {
        heading: "Wishes & Blessings",
        description: "Leave a note, blessing, or favourite memory — we'll treasure every word.",
      },
    },
    {
      id: "rsvp",
      type: "rsvp",
      visible: true,
      data: {
        heading: "Will You Join Us?",
        body: "Kindly RSVP by July 20, 2026 so we can plan the perfect celebration for you.",
      },
    },
  ],
} as const;
