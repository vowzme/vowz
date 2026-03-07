import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Calendar, MapPin, Clock, X, MessageSquare, Plane, Hotel, Users, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemplateData {
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
  events: { name: string; date: string; time: string; venue: string }[];
  guestbookMessages: { name: string; message: string }[];
  travelInfo: { hotels: { name: string; distance: string }[]; directions: string };
  galleryPhotos: { label: string; url: string }[];
}

const templates: TemplateData[] = [
  {
    name: "Royal Maroon",
    colors: ["#6B1D2A", "#D4A853", "#FFF5E6"],
    style: "Traditional",
    couple: "Arjun & Meera",
    partner1: "Arjun",
    partner2: "Meera",
    tagline: "Two souls, one journey — blessed by tradition",
    weddingDate: "December 15, 2026",
    venue: "The Grand Palace",
    location: "Jaipur, Rajasthan",
    story: "We met at a friend's Diwali celebration in 2022. Arjun was trying to light a stubborn sparkler, and Meera offered her lighter with a laugh. That spark — both literal and figurative — never went out. Three years, countless chai dates, and one sunset proposal later, we're ready to begin our forever.",
    events: [
      { name: "Mehendi Ceremony", date: "Dec 13, 2026", time: "4:00 PM", venue: "Meera's Family Home" },
      { name: "Sangeet Night", date: "Dec 14, 2026", time: "7:00 PM", venue: "Royal Garden Hall" },
      { name: "Wedding Ceremony", date: "Dec 15, 2026", time: "11:00 AM", venue: "The Grand Palace" },
      { name: "Reception", date: "Dec 15, 2026", time: "7:00 PM", venue: "The Grand Palace Ballroom" },
    ],
    guestbookMessages: [
      { name: "Priya & Karan", message: "So happy for you both! Can't wait to dance at the sangeet! 💃" },
      { name: "Uncle Sharma", message: "Blessings to the beautiful couple. May your life together be filled with love and laughter." },
      { name: "Nisha", message: "Meera, you're going to be the most gorgeous bride! Love you! ❤️" },
    ],
    travelInfo: {
      hotels: [
        { name: "Taj Rambagh Palace", distance: "0.5 km from venue" },
        { name: "ITC Rajputana", distance: "2 km from venue" },
      ],
      directions: "Fly into Jaipur International Airport (JAI). The venue is a 20-minute drive from the airport.",
    },
    galleryPhotos: [
      { label: "Mehendi", url: "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=600&h=450&fit=crop" },
      { label: "Couple Portrait", url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=450&fit=crop" },
      { label: "Venue", url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=450&fit=crop" },
      { label: "Sangeet", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Pastel Bloom",
    colors: ["#E8D5E0", "#F5E6CC", "#5C4A5E"],
    style: "Fusion",
    couple: "James & Sofia",
    partner1: "James",
    partner2: "Sofia",
    tagline: "Where love blooms, magic follows",
    weddingDate: "April 20, 2027",
    venue: "Rosewood Gardens",
    location: "Tuscany, Italy",
    story: "James spotted Sofia at a tiny bookshop in Florence, both reaching for the same novel. They ended up sharing coffee, then dinner, then a lifetime of adventures. From spontaneous road trips across Europe to quiet Sunday mornings — every moment together feels like a chapter worth reading.",
    events: [
      { name: "Welcome Dinner", date: "Apr 19, 2027", time: "7:00 PM", venue: "Villa Cora Terrace" },
      { name: "Church Ceremony", date: "Apr 20, 2027", time: "11:00 AM", venue: "Chapel of the Holy Cross" },
      { name: "Garden Reception", date: "Apr 20, 2027", time: "5:00 PM", venue: "Rosewood Gardens" },
    ],
    guestbookMessages: [
      { name: "Maria & Luca", message: "The most beautiful couple! Wishing you a lifetime of amore! 🌸" },
      { name: "Emily", message: "Sofia, I still can't believe our bookworm found her Prince Charming!" },
      { name: "Grandma Rose", message: "My darling James, may God bless your union. So proud of you both." },
    ],
    travelInfo: {
      hotels: [
        { name: "Hotel Brunelleschi", distance: "1 km from venue" },
        { name: "Villa San Michele", distance: "3 km from venue" },
      ],
      directions: "Fly into Florence Airport (FLR). Shuttle service will be arranged from the airport to the venue.",
    },
    galleryPhotos: [
      { label: "Garden Setup", url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=450&fit=crop" },
      { label: "Couple Portrait", url: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&h=450&fit=crop" },
      { label: "Chapel", url: "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&h=450&fit=crop" },
      { label: "Reception", url: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Golden Mandala",
    colors: ["#2C1810", "#D4A853", "#F0E6D2"],
    style: "Traditional",
    couple: "Ravi & Anita",
    partner1: "Ravi",
    partner2: "Anita",
    tagline: "Written in the stars, sealed with love",
    weddingDate: "February 8, 2027",
    venue: "Lakshmi Vilas Palace",
    location: "Udaipur, Rajasthan",
    story: "Ravi and Anita were introduced through their families — a modern arranged-love story. After their first meeting over masala dosa at a café, they knew something special had begun. Long phone calls turned into weekend trips, and what started as curiosity blossomed into deep, unwavering love.",
    events: [
      { name: "Haldi Ceremony", date: "Feb 6, 2027", time: "10:00 AM", venue: "Anita's Family Home" },
      { name: "Mehendi & Sangeet", date: "Feb 7, 2027", time: "5:00 PM", venue: "Lakshmi Vilas Courtyard" },
      { name: "Wedding Ceremony", date: "Feb 8, 2027", time: "9:30 AM", venue: "Lakshmi Vilas Palace" },
      { name: "Reception Dinner", date: "Feb 8, 2027", time: "7:00 PM", venue: "Palace Grand Hall" },
    ],
    guestbookMessages: [
      { name: "Deepak & Sunita", message: "Our families are finally joining! Couldn't be happier. Love you both!" },
      { name: "Rahul", message: "Ravi bhai, you found the one! Wishing you both endless happiness." },
    ],
    travelInfo: {
      hotels: [
        { name: "Oberoi Udaivilas", distance: "1.5 km from venue" },
        { name: "Trident Udaipur", distance: "2 km from venue" },
      ],
      directions: "Fly into Maharana Pratap Airport (UDR). The venue is a 30-minute scenic drive along the lake.",
    },
    galleryPhotos: [
      { label: "Mandap Setup", url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=450&fit=crop" },
      { label: "Haldi", url: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&h=450&fit=crop" },
      { label: "Couple", url: "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=600&h=450&fit=crop" },
      { label: "Palace View", url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Sage & Ivory",
    colors: ["#8B9D77", "#F5F0E8", "#3D4A35"],
    style: "Eco-Friendly",
    couple: "David & Grace",
    partner1: "David",
    partner2: "Grace",
    tagline: "Growing together, rooted in love",
    weddingDate: "June 21, 2027",
    venue: "Willow Creek Farm",
    location: "Vermont, USA",
    story: "David and Grace met while volunteering at a community garden. She was planting sunflowers; he was hopelessly overwatering the tomatoes. Their shared love for nature, sustainability, and terrible gardening puns turned into something beautiful — a love as natural and enduring as the earth itself.",
    events: [
      { name: "Rehearsal Dinner", date: "Jun 20, 2027", time: "6:00 PM", venue: "The Farmhouse Barn" },
      { name: "Garden Ceremony", date: "Jun 21, 2027", time: "3:00 PM", venue: "Willow Creek Meadow" },
      { name: "Farm-to-Table Reception", date: "Jun 21, 2027", time: "6:00 PM", venue: "The Orchard Pavilion" },
    ],
    guestbookMessages: [
      { name: "Sarah & Tom", message: "You two are proof that the best things grow naturally! 🌿" },
      { name: "Pastor Mike", message: "What a joy to witness your love. Blessings on your marriage!" },
    ],
    travelInfo: {
      hotels: [
        { name: "Green Mountain Inn", distance: "5 km from venue" },
        { name: "Stowe Meadows Lodge", distance: "8 km from venue" },
      ],
      directions: "Fly into Burlington International Airport (BTV). Rental cars recommended — the scenic drive is part of the experience!",
    },
    galleryPhotos: [
      { label: "Meadow", url: "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=600&h=450&fit=crop" },
      { label: "Couple in Garden", url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&h=450&fit=crop" },
      { label: "Barn Setup", url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=450&fit=crop" },
      { label: "Sunset", url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Lavender Dream",
    colors: ["#9B8EC4", "#F0E8F5", "#4A3D6B"],
    style: "Fusion",
    couple: "Omar & Ayesha",
    partner1: "Omar",
    partner2: "Ayesha",
    tagline: "A love story penned by destiny",
    weddingDate: "March 14, 2027",
    venue: "The Pearl Ballroom",
    location: "Istanbul, Turkey",
    story: "Omar and Ayesha's love story began at a calligraphy workshop in Istanbul. He was drawn to her graceful brushstrokes; she admired his patience and quiet determination. Over cups of Turkish tea and walks along the Bosphorus, they discovered a love as timeless as the city where they met.",
    events: [
      { name: "Nikah Ceremony", date: "Mar 14, 2027", time: "11:00 AM", venue: "Blue Mosque Gardens" },
      { name: "Walima Reception", date: "Mar 14, 2027", time: "6:00 PM", venue: "The Pearl Ballroom" },
    ],
    guestbookMessages: [
      { name: "Fatima Aunty", message: "MashaAllah! Such a beautiful couple. May Allah bless your union." },
      { name: "Yusuf & Hana", message: "We're so happy for you both! Can't wait to celebrate together!" },
    ],
    travelInfo: {
      hotels: [
        { name: "Four Seasons Sultanahmet", distance: "0.8 km from venue" },
        { name: "Ciragan Palace Kempinski", distance: "3 km from venue" },
      ],
      directions: "Fly into Istanbul Airport (IST). The venue is in the historic Sultanahmet district, easily accessible by taxi or tram.",
    },
    galleryPhotos: [
      { label: "Bosphorus View", url: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=600&h=450&fit=crop" },
      { label: "Couple Portrait", url: "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=600&h=450&fit=crop" },
      { label: "Calligraphy", url: "https://images.unsplash.com/photo-1522413452208-996ff3f3e740?w=600&h=450&fit=crop" },
      { label: "Venue", url: "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Kerala Spice",
    colors: ["#1A4D2E", "#D4A853", "#FFF5E6"],
    style: "Regional",
    couple: "Zain & Fatima",
    partner1: "Zain",
    partner2: "Fatima",
    tagline: "Where spice meets sweetness — forever begins",
    weddingDate: "January 10, 2027",
    venue: "Kumarakom Lake Resort",
    location: "Kumarakom, Kerala",
    story: "Zain and Fatima grew up in neighboring towns in Kerala but only met at a food festival in Kochi. He was judging the biryani competition; she was the winner. What started as playful banter over spice levels turned into late-night conversations, family visits, and a love seasoned with joy.",
    events: [
      { name: "Mehendi Night", date: "Jan 8, 2027", time: "6:00 PM", venue: "Fatima's Family Home" },
      { name: "Nikah", date: "Jan 10, 2027", time: "10:00 AM", venue: "Kumarakom Lake Resort" },
      { name: "Walima", date: "Jan 10, 2027", time: "7:00 PM", venue: "Lakeside Pavilion" },
    ],
    guestbookMessages: [
      { name: "Amina & Rashid", message: "The best biryani love story ever! May your life be full of flavor! 🌶️" },
      { name: "Grandpa Hassan", message: "Proud of you both. May Allah grant you happiness and togetherness." },
    ],
    travelInfo: {
      hotels: [
        { name: "Kumarakom Lake Resort", distance: "On-site" },
        { name: "Coconut Lagoon", distance: "2 km away" },
      ],
      directions: "Fly into Cochin International Airport (COK). The resort is a 1.5-hour scenic drive through the backwaters.",
    },
    galleryPhotos: [
      { label: "Backwaters", url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=450&fit=crop" },
      { label: "Couple Portrait", url: "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=600&h=450&fit=crop" },
      { label: "Ceremony", url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=450&fit=crop" },
      { label: "Food Spread", url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Beach Bliss",
    colors: ["#1B6B93", "#F5D89A", "#FFF8F0"],
    style: "Destination",
    couple: "Leo & Ananya",
    partner1: "Leo",
    partner2: "Ananya",
    tagline: "Where the ocean meets our love story",
    weddingDate: "May 18, 2027",
    venue: "Sunset Beach Resort",
    location: "Goa, India",
    story: "Leo and Ananya met on a beach cleanup drive in Goa. She was organizing volunteers; he showed up with two trash bags and a terrible sunburn. Their shared passion for the ocean turned into sunset walks, surfing lessons, and eventually a proposal at the very beach where it all started.",
    events: [
      { name: "Beach Welcome Party", date: "May 17, 2027", time: "6:00 PM", venue: "Beachside Shack" },
      { name: "Ceremony on the Sand", date: "May 18, 2027", time: "5:00 PM", venue: "Sunset Beach Resort" },
      { name: "Starlit Reception", date: "May 18, 2027", time: "8:00 PM", venue: "Ocean Deck Pavilion" },
    ],
    guestbookMessages: [
      { name: "Tara & Jai", message: "You two are the perfect wave! Can't wait for the beach party! 🌊" },
      { name: "Coach Daniel", message: "Leo, you finally caught the best wave of your life. Congratulations!" },
    ],
    travelInfo: {
      hotels: [
        { name: "Sunset Beach Resort", distance: "On-site" },
        { name: "Taj Exotica Goa", distance: "3 km from venue" },
      ],
      directions: "Fly into Dabolim Airport (GOI). The resort is a 40-minute drive south along the coast.",
    },
    photoPlaceholders: ["Beach Sunset", "Couple on Shore", "Ceremony Setup", "Ocean View"],
  },
  {
    name: "Royal Blue",
    colors: ["#1A237E", "#C0A44D", "#E8E6F0"],
    style: "Grand",
    couple: "Kabir & Ishani",
    partner1: "Kabir",
    partner2: "Ishani",
    tagline: "A regal affair of two hearts united",
    weddingDate: "November 22, 2027",
    venue: "Umaid Bhawan Palace",
    location: "Jodhpur, Rajasthan",
    story: "Kabir and Ishani met at a mutual friend's art exhibition in Mumbai. He was captivated by her critique of a painting; she was impressed that he actually listened. What followed were gallery dates, midnight chai conversations, and a surprise proposal under the blue walls of Jodhpur — the city that would host their dream wedding.",
    events: [
      { name: "Mehendi & Haldi", date: "Nov 20, 2027", time: "3:00 PM", venue: "Palace Courtyard" },
      { name: "Sangeet Gala", date: "Nov 21, 2027", time: "7:00 PM", venue: "Umaid Bhawan Ballroom" },
      { name: "Royal Wedding Ceremony", date: "Nov 22, 2027", time: "10:00 AM", venue: "Umaid Bhawan Palace" },
      { name: "Grand Reception", date: "Nov 22, 2027", time: "7:30 PM", venue: "Palace Banquet Hall" },
    ],
    guestbookMessages: [
      { name: "Aisha & Vikram", message: "A wedding fit for royalty! So thrilled for you both! 👑" },
      { name: "Nani ji", message: "My blessings are always with you. May your love shine brighter than gold." },
      { name: "Rohan", message: "Kabir bhai, from college roommates to watching you marry your soulmate. Proud of you!" },
    ],
    travelInfo: {
      hotels: [
        { name: "Umaid Bhawan Palace", distance: "On-site" },
        { name: "Raas Jodhpur", distance: "4 km from venue" },
      ],
      directions: "Fly into Jodhpur Airport (JDH). The palace is a 15-minute drive from the airport.",
    },
    photoPlaceholders: ["Palace Exterior", "Blue City View", "Couple Portrait", "Ballroom"],
  },
  {
    name: "Rose Garden",
    colors: ["#8C3A5E", "#F5C6D0", "#FFF5F7"],
    style: "Romantic",
    couple: "Daniel & Priya",
    partner1: "Daniel",
    partner2: "Priya",
    tagline: "Every petal tells our love story",
    weddingDate: "September 6, 2027",
    venue: "The Botanical Estate",
    location: "Ooty, Tamil Nadu",
    story: "Daniel, a botanist from London, came to Ooty for a rare orchid. He found Priya instead — the garden curator who knew every flower by name. Their love blossomed like the roses around them, nurtured by letters across continents and weekend flights. Now they're planting roots together, forever.",
    events: [
      { name: "Rose Garden Welcome Tea", date: "Sep 5, 2027", time: "4:00 PM", venue: "The Botanical Estate" },
      { name: "Fusion Ceremony", date: "Sep 6, 2027", time: "11:00 AM", venue: "Rose Terrace Gazebo" },
      { name: "Garden Reception", date: "Sep 6, 2027", time: "5:30 PM", venue: "The Grand Greenhouse" },
    ],
    guestbookMessages: [
      { name: "Aunt Catherine", message: "Daniel, you traveled the world and found your greatest bloom. Beautiful! 🌹" },
      { name: "Meera & Sanjay", message: "Priya, you deserve all the flowers in the world. So happy for you both!" },
    ],
    travelInfo: {
      hotels: [
        { name: "Savoy Hotel Ooty", distance: "2 km from venue" },
        { name: "Sterling Elk Hill", distance: "5 km from venue" },
      ],
      directions: "Fly into Coimbatore Airport (CJB). Ooty is a scenic 3-hour drive through the Nilgiri hills.",
    },
    photoPlaceholders: ["Rose Garden", "Couple in Greenhouse", "Gazebo Setup", "Mountain View"],
  },
];

// ─── Countdown helper ────────────────────────────────────────────────
function getCountdownFromDate(dateStr: string) {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
  };
}

// ─── Photo placeholder component ─────────────────────────────────────
function PhotoPlaceholder({ label, color, accent }: { label: string; color: string; accent: string }) {
  return (
    <div
      className="aspect-[4/3] rounded-lg flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: color + "15", border: `1px solid ${color}30` }}
    >
      <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at 50% 50%, ${accent}, transparent 70%)` }} />
      <div className="text-center z-10">
        <svg className="w-8 h-8 mx-auto mb-2 opacity-40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
        <p className="text-xs font-body opacity-50" style={{ color }}>{label}</p>
      </div>
    </div>
  );
}

// ─── Template Preview Modal ──────────────────────────────────────────
function TemplatePreviewModal({ template: t, onClose, onUseTemplate }: { template: TemplateData; onClose: () => void; onUseTemplate: (t: TemplateData) => void }) {
  const [bg, accent, text] = t.colors;
  const countdown = getCountdownFromDate(t.weddingDate);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal content */}
      <motion.div
        className="relative w-full max-w-3xl mx-4 my-8 rounded-2xl overflow-hidden shadow-2xl"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── Hero Section ── */}
        <div
          className="relative py-20 px-6 text-center"
          style={{ background: `linear-gradient(135deg, ${bg}, ${bg}dd)` }}
        >
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 400 400" className="w-full h-full">
              {[...Array(8)].map((_, i) => (
                <circle key={i} cx="200" cy="200" r={50 + i * 30} fill="none" stroke={text} strokeWidth="0.5" />
              ))}
            </svg>
          </div>
          <div className="relative z-10">
            <Heart className="w-8 h-8 mx-auto mb-3" style={{ color: accent }} fill="currentColor" />
            <p className="font-body text-sm tracking-widest uppercase mb-2" style={{ color: `${text}80` }}>
              You're Invited to the Wedding of
            </p>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-3" style={{ color: text }}>
              {t.partner1} & {t.partner2}
            </h1>
            <p className="font-display text-xl italic mb-4" style={{ color: accent }}>
              {t.tagline}
            </p>
            <div className="flex items-center justify-center gap-4 text-sm" style={{ color: `${text}99` }}>
              <span className="flex items-center gap-1 font-body">
                <Calendar className="w-4 h-4" /> {t.weddingDate}
              </span>
              <span className="flex items-center gap-1 font-body">
                <MapPin className="w-4 h-4" /> {t.location}
              </span>
            </div>
          </div>
        </div>

        {/* ── Countdown Section ── */}
        <div className="py-10 px-6 text-center" style={{ backgroundColor: `${accent}10` }}>
          <p className="font-display text-lg font-semibold mb-4" style={{ color: bg }}>
            Days Until We Say "I Do"
          </p>
          <div className="flex justify-center gap-6">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Minutes", value: countdown.minutes },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-display font-bold mb-1"
                  style={{ backgroundColor: bg, color: text }}
                >
                  {item.value}
                </div>
                <p className="text-xs font-body" style={{ color: `${bg}99` }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Our Story Section ── */}
        <div className="bg-white py-12 px-8">
          <h2 className="font-display text-2xl font-bold text-center mb-2" style={{ color: bg }}>Our Story</h2>
          <div className="w-12 h-0.5 mx-auto mb-6" style={{ backgroundColor: accent }} />
          <p className="text-center max-w-xl mx-auto leading-relaxed font-body text-sm" style={{ color: `${bg}cc` }}>
            {t.story}
          </p>
        </div>

        {/* ── Photo Gallery Section ── */}
        <div className="py-12 px-8" style={{ backgroundColor: `${bg}08` }}>
          <h2 className="font-display text-2xl font-bold text-center mb-2" style={{ color: bg }}>Gallery</h2>
          <div className="w-12 h-0.5 mx-auto mb-8" style={{ backgroundColor: accent }} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {t.photoPlaceholders.map((label) => (
              <PhotoPlaceholder key={label} label={label} color={bg} accent={accent} />
            ))}
          </div>
          <p className="text-center text-xs font-body mt-4" style={{ color: `${bg}60` }}>
            Upload your own photos after creating your site
          </p>
        </div>

        {/* ── Wedding Events Section ── */}
        <div className="bg-white py-12 px-8">
          <h2 className="font-display text-2xl font-bold text-center mb-2" style={{ color: bg }}>Wedding Events</h2>
          <div className="w-12 h-0.5 mx-auto mb-8" style={{ backgroundColor: accent }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {t.events.map((evt) => (
              <div
                key={evt.name}
                className="rounded-xl p-5 text-center border"
                style={{ borderColor: `${accent}30`, backgroundColor: `${accent}08` }}
              >
                <div
                  className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: `${accent}20` }}
                >
                  <Calendar className="w-5 h-5" style={{ color: accent }} />
                </div>
                <p className="font-display text-base font-semibold" style={{ color: bg }}>{evt.name}</p>
                <p className="text-xs font-body mt-1" style={{ color: `${bg}99` }}>
                  {evt.date} • {evt.time}
                </p>
                <p className="text-xs font-body mt-1 flex items-center justify-center gap-1" style={{ color: `${bg}77` }}>
                  <MapPin className="w-3 h-3" /> {evt.venue}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── RSVP Section ── */}
        <div className="py-12 px-8" style={{ background: `linear-gradient(135deg, ${bg}, ${bg}ee)` }}>
          <h2 className="font-display text-2xl font-bold text-center mb-2" style={{ color: text }}>RSVP</h2>
          <div className="w-12 h-0.5 mx-auto mb-6" style={{ backgroundColor: accent }} />
          <div className="max-w-sm mx-auto space-y-3">
            {["Your Name", "Email Address"].map((ph) => (
              <div
                key={ph}
                className="rounded-lg px-4 py-3 text-sm font-body"
                style={{ backgroundColor: `${text}15`, color: `${text}60`, border: `1px solid ${text}20` }}
              >
                {ph}
              </div>
            ))}
            <div className="flex gap-3">
              <div
                className="flex-1 rounded-lg px-4 py-3 text-sm font-body text-center font-semibold"
                style={{ backgroundColor: accent, color: bg }}
              >
                Joyfully Accept ✓
              </div>
              <div
                className="flex-1 rounded-lg px-4 py-3 text-sm font-body text-center"
                style={{ backgroundColor: `${text}10`, color: `${text}70`, border: `1px solid ${text}20` }}
              >
                Regretfully Decline
              </div>
            </div>
          </div>
        </div>

        {/* ── Guestbook Section ── */}
        <div className="bg-white py-12 px-8">
          <h2 className="font-display text-2xl font-bold text-center mb-2" style={{ color: bg }}>
            <MessageSquare className="w-5 h-5 inline mr-2" style={{ color: accent }} />
            Wishes & Blessings
          </h2>
          <div className="w-12 h-0.5 mx-auto mb-6" style={{ backgroundColor: accent }} />
          <div className="space-y-3 max-w-lg mx-auto">
            {t.guestbookMessages.map((msg, i) => (
              <div
                key={i}
                className="rounded-xl p-4 border"
                style={{ borderColor: `${accent}20`, backgroundColor: `${accent}05` }}
              >
                <p className="font-display text-sm font-semibold mb-1" style={{ color: bg }}>{msg.name}</p>
                <p className="text-xs font-body leading-relaxed" style={{ color: `${bg}aa` }}>{msg.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Travel & Stay Section ── */}
        <div className="py-12 px-8" style={{ backgroundColor: `${bg}08` }}>
          <h2 className="font-display text-2xl font-bold text-center mb-2" style={{ color: bg }}>
            <Plane className="w-5 h-5 inline mr-2" style={{ color: accent }} />
            Travel & Stay
          </h2>
          <div className="w-12 h-0.5 mx-auto mb-6" style={{ backgroundColor: accent }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-6">
            {t.travelInfo.hotels.map((hotel) => (
              <div
                key={hotel.name}
                className="rounded-xl p-4 text-center border"
                style={{ borderColor: `${accent}30`, backgroundColor: "white" }}
              >
                <Hotel className="w-5 h-5 mx-auto mb-2" style={{ color: accent }} />
                <p className="font-display text-sm font-semibold" style={{ color: bg }}>{hotel.name}</p>
                <p className="text-xs font-body mt-1" style={{ color: `${bg}77` }}>{hotel.distance}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-xs font-body max-w-md mx-auto" style={{ color: `${bg}88` }}>
              <MapPin className="w-3 h-3 inline mr-1" />
              {t.travelInfo.directions}
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="py-8 px-6 text-center"
          style={{ background: `linear-gradient(135deg, ${bg}, ${bg}dd)` }}
        >
          <Heart className="w-5 h-5 mx-auto mb-2" style={{ color: accent }} fill="currentColor" />
          <p className="font-display text-lg font-bold" style={{ color: text }}>
            {t.partner1} & {t.partner2}
          </p>
          <p className="font-body text-xs mt-1" style={{ color: `${text}70` }}>
            {t.weddingDate} • {t.location}
          </p>
          <p className="font-body text-xs mt-3" style={{ color: `${text}50` }}>
            Made with ❤️ on ShaadiSite
          </p>
        </div>

        {/* ── Use Template CTA ── */}
        <div className="bg-white p-6 text-center border-t">
          <Button
            className="font-body font-semibold px-8"
            style={{ backgroundColor: accent, color: bg }}
            onClick={() => onUseTemplate(t)}
          >
            Use This Template →
          </Button>
          <p className="text-xs text-muted-foreground font-body mt-2">
            Sign in to create your site with this theme
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Templates Section ──────────────────────────────────────────
const TemplatesSection = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);

  const handleUseTemplate = (t: TemplateData) => {
    setSelectedTemplate(null);
    navigate("/wizard", {
      state: {
        templateName: t.name,
        templateStyle: t.style,
        templateColors: t.colors,
      },
    });
  };

  return (
    <>
      <section className="py-24 px-4" id="templates">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-accent font-semibold font-body tracking-wider uppercase text-sm mb-3">
              9 Stunning Templates
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Themes for Every <span className="text-gradient-gold italic">Tradition</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-body">
              Click any template to preview the full wedding site — complete with events, RSVP, guestbook, and more.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer"
                onClick={() => setSelectedTemplate(t)}
              >
                <div className="relative rounded-xl overflow-hidden shadow-card hover:shadow-elegant transition-all duration-300 border border-border/50 hover:-translate-y-1">
                  {/* Template preview */}
                  <div
                    className="h-52 relative"
                    style={{
                      background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[0]}cc)`,
                    }}
                  >
                    {/* Decorative pattern */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-15">
                      <svg viewBox="0 0 200 200" className="w-32 h-32">
                        <circle cx="100" cy="100" r="80" fill="none" stroke={t.colors[2]} strokeWidth="0.5" />
                        <circle cx="100" cy="100" r="60" fill="none" stroke={t.colors[2]} strokeWidth="0.5" />
                        <circle cx="100" cy="100" r="40" fill="none" stroke={t.colors[2]} strokeWidth="0.5" />
                        {[...Array(12)].map((_, j) => (
                          <line
                            key={j}
                            x1="100" y1="20" x2="100" y2="180"
                            stroke={t.colors[2]}
                            strokeWidth="0.3"
                            transform={`rotate(${j * 30} 100 100)`}
                          />
                        ))}
                      </svg>
                    </div>
                    {/* Sample text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                      <Heart className="w-4 h-4 mb-2" style={{ color: t.colors[1] }} fill="currentColor" />
                      <p className="font-display text-xs tracking-widest uppercase mb-1" style={{ color: t.colors[2] + "80" }}>
                        You're Invited
                      </p>
                      <p className="font-display text-2xl font-bold" style={{ color: t.colors[2] }}>
                        {t.couple}
                      </p>
                      <p className="font-body text-xs mt-1" style={{ color: t.colors[2] + "70" }}>
                        {t.weddingDate}
                      </p>
                      <p className="font-body text-[10px] mt-1 flex items-center gap-1" style={{ color: t.colors[2] + "60" }}>
                        <MapPin className="w-3 h-3" /> {t.location}
                      </p>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white bg-black/60 backdrop-blur-sm px-5 py-2.5 rounded-full font-body text-sm font-medium flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Preview Template
                      </span>
                    </div>
                  </div>
                  {/* Info bar */}
                  <div className="p-4 bg-card flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">{t.name}</h3>
                      <p className="text-xs text-muted-foreground font-body">{t.style} • {t.events.length} events</p>
                    </div>
                    <div className="flex gap-1.5">
                      {t.colors.map((c, j) => (
                        <div
                          key={j}
                          className="w-5 h-5 rounded-full border border-border/50"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <TemplatePreviewModal
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
            onUseTemplate={handleUseTemplate}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Eye icon import workaround
function Eye(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default TemplatesSection;
