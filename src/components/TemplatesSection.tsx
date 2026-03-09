import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Calendar, MapPin, Clock, X, MessageSquare, Plane, Hotel, Users, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Lightbox from "@/components/Lightbox";

export interface TemplateData {
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

export const templates: TemplateData[] = [
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
    couplePhoto: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=800&fit=crop",
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
      { label: "Ceremony Decor", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=800&fit=crop" },
      { label: "Family Blessing", url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=450&fit=crop" },
      { label: "Grand Entrance", url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=800&fit=crop" },
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
    couplePhoto: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&h=800&fit=crop",
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
      { label: "Chapel", url: "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&h=800&fit=crop" },
      { label: "Reception", url: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=600&h=450&fit=crop" },
      { label: "First Dance", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=450&fit=crop" },
      { label: "Tuscan Hills", url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=800&fit=crop" },
      { label: "Cake Cutting", url: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600&h=450&fit=crop" },
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
    couplePhoto: "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&h=800&fit=crop",
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
      { label: "Haldi", url: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&h=800&fit=crop" },
      { label: "Couple", url: "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=600&h=450&fit=crop" },
      { label: "Palace View", url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=450&fit=crop" },
      { label: "Lake Sunset", url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=450&fit=crop" },
      { label: "Baraat", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=800&fit=crop" },
      { label: "Ring Exchange", url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=450&fit=crop" },
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
    couplePhoto: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=1200&h=800&fit=crop",
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
      { label: "Meadow", url: "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=600&h=800&fit=crop" },
      { label: "Couple in Garden", url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&h=450&fit=crop" },
      { label: "Barn Setup", url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=450&fit=crop" },
      { label: "Sunset", url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=450&fit=crop" },
      { label: "Wildflowers", url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=450&fit=crop" },
      { label: "Farm Table", url: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=600&h=800&fit=crop" },
      { label: "Rustic Arch", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=450&fit=crop" },
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
    couplePhoto: "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200&h=800&fit=crop",
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
      { label: "Couple Portrait", url: "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=600&h=800&fit=crop" },
      { label: "Calligraphy", url: "https://images.unsplash.com/photo-1522413452208-996ff3f3e740?w=600&h=450&fit=crop" },
      { label: "Venue", url: "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=600&h=450&fit=crop" },
      { label: "Turkish Tea", url: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=600&h=450&fit=crop" },
      { label: "Sunset Walk", url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=800&fit=crop" },
      { label: "Floral Arch", url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=450&fit=crop" },
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
    couplePhoto: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&h=800&fit=crop",
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
      { label: "Backwaters", url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=800&fit=crop" },
      { label: "Couple Portrait", url: "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=600&h=450&fit=crop" },
      { label: "Ceremony", url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=450&fit=crop" },
      { label: "Food Spread", url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&h=450&fit=crop" },
      { label: "Houseboat", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=450&fit=crop" },
      { label: "Floral Rangoli", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=450&fit=crop" },
      { label: "Golden Hour", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=800&fit=crop" },
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
    couplePhoto: "https://images.unsplash.com/photo-1439539698758-ba2680ecadb9?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop",
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
    galleryPhotos: [
      { label: "Beach Sunset", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=450&fit=crop" },
      { label: "Couple on Shore", url: "https://images.unsplash.com/photo-1439539698758-ba2680ecadb9?w=600&h=800&fit=crop" },
      { label: "Ceremony Setup", url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&h=450&fit=crop" },
      { label: "Ocean View", url: "https://images.unsplash.com/photo-1505881502353-a1986add3762?w=600&h=450&fit=crop" },
      { label: "Tiki Torches", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=450&fit=crop" },
      { label: "Seashell Decor", url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=800&fit=crop" },
      { label: "Barefoot Dance", url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=450&fit=crop" },
    ],
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
    couplePhoto: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200&h=800&fit=crop",
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
    galleryPhotos: [
      { label: "Palace Exterior", url: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&h=450&fit=crop" },
      { label: "Blue City View", url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=800&fit=crop" },
      { label: "Couple Portrait", url: "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=600&h=450&fit=crop" },
      { label: "Ballroom", url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=450&fit=crop" },
      { label: "Royal Procession", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=450&fit=crop" },
      { label: "Jeweled Details", url: "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=600&h=800&fit=crop" },
      { label: "Fireworks", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=450&fit=crop" },
    ],
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
    couplePhoto: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=1200&h=800&fit=crop",
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
    galleryPhotos: [
      { label: "Rose Garden", url: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=600&h=800&fit=crop" },
      { label: "Couple in Greenhouse", url: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&h=450&fit=crop" },
      { label: "Gazebo Setup", url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=450&fit=crop" },
      { label: "Mountain View", url: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=450&fit=crop" },
      { label: "Bouquet Detail", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=800&fit=crop" },
      { label: "Garden Path", url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=450&fit=crop" },
      { label: "Tea Service", url: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Midnight Garden",
    colors: ["#0D1B2A", "#C9A96E", "#E8DDD3"],
    style: "Moody Luxe",
    couple: "Vikram & Rhea",
    partner1: "Vikram",
    partner2: "Rhea",
    tagline: "Under the midnight sky, our forever begins",
    weddingDate: "October 31, 2027",
    venue: "The Secret Garden Estate",
    location: "Coorg, Karnataka",
    story: "Vikram and Rhea met at a jazz night in Bangalore. He was the saxophonist; she was the only one in the crowd who stayed till the last note. They bonded over vinyl records, midnight drives to Nandi Hills, and a shared belief that the best things happen after dark. Their love story is a melody that never ends.",
    couplePhoto: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=1200&h=800&fit=crop",
    events: [
      { name: "Cocktail Evening", date: "Oct 30, 2027", time: "7:00 PM", venue: "The Veranda Lounge" },
      { name: "Sangeet Under the Stars", date: "Oct 30, 2027", time: "9:00 PM", venue: "Garden Amphitheatre" },
      { name: "Morning Wedding", date: "Oct 31, 2027", time: "8:00 AM", venue: "The Secret Garden" },
      { name: "Midnight Reception", date: "Oct 31, 2027", time: "8:00 PM", venue: "Estate Grand Hall" },
    ],
    guestbookMessages: [
      { name: "Anil & Kavitha", message: "You two are absolute magic together! Can't wait for this celebration! 🌙" },
      { name: "Jazz Club Gang", message: "From the front row to the front of the aisle — we're so proud of you both!" },
      { name: "Rhea's Mom", message: "My moonlight baby, wishing you and Vikram a lifetime of beautiful nights." },
    ],
    travelInfo: {
      hotels: [
        { name: "Tamara Coorg", distance: "3 km from venue" },
        { name: "Evolve Back Coorg", distance: "5 km from venue" },
      ],
      directions: "Fly into Mangalore International Airport (IXE). Coorg is a scenic 3.5-hour drive through coffee plantations.",
    },
    galleryPhotos: [
      { label: "Night Garden", url: "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=600&h=450&fit=crop" },
      { label: "Couple Portrait", url: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&h=800&fit=crop" },
      { label: "Candlelit Aisle", url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=450&fit=crop" },
      { label: "Jazz Setup", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=450&fit=crop" },
      { label: "Coffee Estate", url: "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=600&h=800&fit=crop" },
      { label: "Moody Florals", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=450&fit=crop" },
      { label: "Starlit Dance", url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Punjabi Fiesta",
    colors: ["#B8292F", "#FFD700", "#FFF8E1"],
    style: "Regional",
    couple: "Harpreet & Simran",
    partner1: "Harpreet",
    partner2: "Simran",
    tagline: "Balle balle! Two hearts, one celebration",
    weddingDate: "December 1, 2027",
    venue: "The Heritage Haveli",
    location: "Amritsar, Punjab",
    story: "Harpreet and Simran's families have been friends for decades, but it wasn't until a cousin's wedding that sparks flew. He asked her for a dance during the bhangra set; she outdanced him completely. Determined to keep up, he kept showing up — at family dinners, gurudwara visits, and eventually at her doorstep with a ring and his mother's blessings.",
    couplePhoto: "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&h=800&fit=crop",
    events: [
      { name: "Roka Ceremony", date: "Nov 29, 2027", time: "11:00 AM", venue: "Simran's Family Home" },
      { name: "Mehendi & Ladies Sangeet", date: "Nov 30, 2027", time: "4:00 PM", venue: "Heritage Haveli Gardens" },
      { name: "Anand Karaj", date: "Dec 1, 2027", time: "8:00 AM", venue: "Golden Temple Complex" },
      { name: "Grand Reception", date: "Dec 1, 2027", time: "7:00 PM", venue: "The Heritage Haveli" },
    ],
    guestbookMessages: [
      { name: "Biji", message: "Waheguru's blessings on this beautiful jodi! So much love for you both! 🙏" },
      { name: "Gurpreet & Mandeep", message: "Get ready for the biggest bhangra of your lives! We're SO excited!" },
      { name: "Chacha ji", message: "From playing in the fields together to this — our families are blessed." },
    ],
    travelInfo: {
      hotels: [
        { name: "Taj Swarna Amritsar", distance: "2 km from venue" },
        { name: "Hyatt Amritsar", distance: "3 km from venue" },
      ],
      directions: "Fly into Sri Guru Ram Dass Jee International Airport (ATQ). The venue is a 20-minute drive.",
    },
    galleryPhotos: [
      { label: "Golden Temple", url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=800&fit=crop" },
      { label: "Mehendi Hands", url: "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=600&h=450&fit=crop" },
      { label: "Bhangra", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=450&fit=crop" },
      { label: "Couple Portrait", url: "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=600&h=450&fit=crop" },
      { label: "Haveli Decor", url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=800&fit=crop" },
      { label: "Food Feast", url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&h=450&fit=crop" },
      { label: "Pheras", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Cherry Blossom",
    colors: ["#F7CAD0", "#FFFFFF", "#5C374C"],
    style: "Minimal",
    couple: "Kenji & Anika",
    partner1: "Kenji",
    partner2: "Anika",
    tagline: "Fleeting as sakura, lasting as love",
    weddingDate: "March 28, 2027",
    venue: "Zen Garden Retreat",
    location: "Kyoto, Japan",
    story: "Kenji, a Japanese architect, met Anika, an Indian textile designer, at a design conference in Tokyo. She was fascinated by his minimalist philosophy; he was drawn to her vibrant patterns. Together, they blend the beauty of simplicity with the richness of color — a fusion of two worlds that fits perfectly.",
    couplePhoto: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=1200&h=800&fit=crop",
    events: [
      { name: "Tea Ceremony", date: "Mar 27, 2027", time: "3:00 PM", venue: "Zen Garden Tea House" },
      { name: "Fusion Ceremony", date: "Mar 28, 2027", time: "11:00 AM", venue: "Sakura Pavilion" },
      { name: "Evening Celebration", date: "Mar 28, 2027", time: "6:00 PM", venue: "Zen Garden Retreat" },
    ],
    guestbookMessages: [
      { name: "Yuki & Taro", message: "Two beautiful cultures, one beautiful love! Omedetou gozaimasu! 🌸" },
      { name: "Anika's Dadi", message: "My granddaughter found love across oceans. How magical. Blessings always." },
    ],
    travelInfo: {
      hotels: [
        { name: "Hoshinoya Kyoto", distance: "1 km from venue" },
        { name: "The Ritz-Carlton Kyoto", distance: "4 km from venue" },
      ],
      directions: "Fly into Kansai International Airport (KIX). Take the JR Haruka Express to Kyoto Station (75 min), then taxi to the venue.",
    },
    galleryPhotos: [
      { label: "Sakura Blossoms", url: "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&h=800&fit=crop" },
      { label: "Couple Portrait", url: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&h=450&fit=crop" },
      { label: "Zen Garden", url: "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=600&h=450&fit=crop" },
      { label: "Tea Ceremony", url: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=600&h=450&fit=crop" },
      { label: "Temple Gate", url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=800&fit=crop" },
      { label: "Kimono Detail", url: "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=600&h=450&fit=crop" },
      { label: "Paper Lanterns", url: "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Terracotta Sun",
    colors: ["#C4653A", "#F5E1C8", "#2B1F1A"],
    style: "Bohemian",
    couple: "Marco & Zara",
    partner1: "Marco",
    partner2: "Zara",
    tagline: "Wild hearts, warm souls, one adventure",
    weddingDate: "August 15, 2027",
    venue: "Desert Oasis Ranch",
    location: "Jaisalmer, Rajasthan",
    story: "Marco, an Italian photographer, came to Rajasthan chasing golden hour in the desert. He found Zara at a camel fair, haggling for antique textiles with an infectious laugh. He asked to photograph her; she said only if he could ride a camel. He couldn't — but he tried, and she fell for his fearless spirit.",
    couplePhoto: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200&h=800&fit=crop",
    events: [
      { name: "Desert Bonfire Night", date: "Aug 14, 2027", time: "7:00 PM", venue: "Sand Dune Camp" },
      { name: "Sunrise Ceremony", date: "Aug 15, 2027", time: "6:00 AM", venue: "Golden Sand Ridge" },
      { name: "Oasis Reception", date: "Aug 15, 2027", time: "6:00 PM", venue: "Desert Oasis Ranch" },
    ],
    guestbookMessages: [
      { name: "Isabella", message: "Marco, you went looking for light and found love. Bellissimo! ☀️" },
      { name: "Zara's Mom", message: "My wild desert flower found her match. All my love and duas." },
      { name: "Nomad Friends", message: "The best love story we've ever witnessed — and we've seen the world!" },
    ],
    travelInfo: {
      hotels: [
        { name: "Suryagarh Jaisalmer", distance: "10 km from venue" },
        { name: "The Serai", distance: "5 km from venue" },
      ],
      directions: "Fly into Jaisalmer Airport (JSA). The ranch is a 30-minute drive into the golden desert landscape.",
    },
    galleryPhotos: [
      { label: "Desert Sunset", url: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&h=450&fit=crop" },
      { label: "Couple in Dunes", url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&h=800&fit=crop" },
      { label: "Bonfire", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=450&fit=crop" },
      { label: "Camel Silhouette", url: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=450&fit=crop" },
      { label: "Textile Details", url: "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=600&h=450&fit=crop" },
      { label: "Fort View", url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=800&fit=crop" },
      { label: "Golden Hour", url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Velvet Noir",
    colors: ["#1A1A1A", "#B8860B", "#F5F5F5"],
    style: "Modern Glam",
    couple: "Aryan & Tanya",
    partner1: "Aryan",
    partner2: "Tanya",
    tagline: "Bold love, golden moments",
    weddingDate: "July 4, 2027",
    venue: "The Black Marble Hall",
    location: "Mumbai, Maharashtra",
    story: "Aryan and Tanya are both fashion designers who competed on the same reality show. She won, but he won her heart with a backstage confession over cold coffee. Their relationship is fierce, fabulous, and unapologetically glamorous — just like the wedding they've always dreamed of.",
    couplePhoto: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=800&fit=crop",
    events: [
      { name: "Fashion Forward Sangeet", date: "Jul 3, 2027", time: "8:00 PM", venue: "Soho House Mumbai" },
      { name: "Black-Tie Ceremony", date: "Jul 4, 2027", time: "5:00 PM", venue: "The Black Marble Hall" },
      { name: "After-Party", date: "Jul 4, 2027", time: "10:00 PM", venue: "Rooftop at The St. Regis" },
    ],
    guestbookMessages: [
      { name: "Fashion Week Crew", message: "The most stylish couple we know! This wedding is going to be ICONIC 🖤" },
      { name: "Mama Sharma", message: "My darling Tanya, you've always been a star. Now you've found your co-star." },
      { name: "Raj & Neha", message: "You two are literal couple goals. Can't wait to see the venue decor!" },
    ],
    travelInfo: {
      hotels: [
        { name: "The St. Regis Mumbai", distance: "0.5 km from venue" },
        { name: "Four Seasons Mumbai", distance: "2 km from venue" },
      ],
      directions: "Fly into Chhatrapati Shivaji Maharaj International Airport (BOM). The venue is in Lower Parel, 40 min from the airport.",
    },
    galleryPhotos: [
      { label: "Venue Interior", url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=450&fit=crop" },
      { label: "Couple Portrait", url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=800&fit=crop" },
      { label: "Gold Details", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=450&fit=crop" },
      { label: "Runway Moment", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=450&fit=crop" },
      { label: "City Skyline", url: "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=600&h=800&fit=crop" },
      { label: "Cocktail Hour", url: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=600&h=450&fit=crop" },
      { label: "Sparkler Exit", url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Bengali Monsoon",
    colors: ["#D93B30", "#F0E68C", "#FFFDF5"],
    style: "Regional",
    couple: "Arnab & Isha",
    partner1: "Arnab",
    partner2: "Isha",
    tagline: "Like monsoon rains — fierce, gentle, and life-giving",
    weddingDate: "August 22, 2027",
    venue: "Rabindra Sadan Heritage",
    location: "Kolkata, West Bengal",
    story: "Arnab and Isha met at a Durga Puja pandal hopping marathon. He was photographing the idols; she was critiquing the dhak drummers. They argued about which pandal was best, bonded over mishti doi, and by Dashami, neither wanted the festival to end. So they decided to start a forever of their own.",
    couplePhoto: "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&h=800&fit=crop",
    events: [
      { name: "Ashirbaad", date: "Aug 20, 2027", time: "5:00 PM", venue: "Isha's Family Home" },
      { name: "Gaye Holud & Mehendi", date: "Aug 21, 2027", time: "3:00 PM", venue: "Garden Terrace" },
      { name: "Wedding (Shubho Bibaho)", date: "Aug 22, 2027", time: "7:00 PM", venue: "Rabindra Sadan Heritage" },
      { name: "Bou Bhaat Reception", date: "Aug 23, 2027", time: "7:00 PM", venue: "The Park Kolkata" },
    ],
    guestbookMessages: [
      { name: "Rima Di", message: "Arnab, you finally found someone who appreciates your adda sessions! 😄" },
      { name: "Baba & Ma", message: "Amader Isha, tumi amader gorbho. Blessings forever. 🙏" },
      { name: "Puja Gang", message: "From pandal hopping to wedding planning — what a journey! Congrats!" },
    ],
    travelInfo: {
      hotels: [
        { name: "The Oberoi Grand", distance: "1.5 km from venue" },
        { name: "ITC Royal Bengal", distance: "8 km from venue" },
      ],
      directions: "Fly into Netaji Subhas Chandra Bose International Airport (CCU). The venue is in central Kolkata, 30 min from the airport.",
    },
    galleryPhotos: [
      { label: "Puja Pandal", url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=800&fit=crop" },
      { label: "Couple Portrait", url: "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=600&h=450&fit=crop" },
      { label: "Sindoor", url: "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=600&h=450&fit=crop" },
      { label: "Kolkata Streets", url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=450&fit=crop" },
      { label: "Saree Detail", url: "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=600&h=800&fit=crop" },
      { label: "Mishti Spread", url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&h=450&fit=crop" },
      { label: "Dhak Players", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=450&fit=crop" },
    ],
  },
  // ─── 10 NEW TEMPLATES ──────────────────────────────────────────────
  {
    name: "Ivory Blush",
    colors: ["#4A3728", "#C9A96E", "#FFF8F0"],
    style: "Modern Minimal",
    couple: "Ethan & Ria",
    partner1: "Ethan",
    partner2: "Ria",
    tagline: "Simply, beautifully, forever yours",
    weddingDate: "October 10, 2027",
    venue: "The Ivory Loft",
    location: "Bangalore, Karnataka",
    story: "Ethan and Ria met at a minimalist design meetup. He loved clean lines; she loved negative space. Their first date was at a white-walled café where they sketched ideas on napkins. Their love, like great design, is intentional, elegant, and built to last.",
    couplePhoto: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=800&fit=crop",
    events: [
      { name: "Welcome Brunch", date: "Oct 9, 2027", time: "11:00 AM", venue: "The Loft Terrace" },
      { name: "Ceremony", date: "Oct 10, 2027", time: "4:00 PM", venue: "The Ivory Loft" },
      { name: "Dinner Reception", date: "Oct 10, 2027", time: "7:30 PM", venue: "The Ivory Loft" },
    ],
    guestbookMessages: [
      { name: "Anita", message: "You two are design goals AND couple goals! ✨" },
      { name: "Dad", message: "Proud of the beautiful life you're building together." },
    ],
    travelInfo: { hotels: [{ name: "The Leela Palace", distance: "3 km" }, { name: "ITC Gardenia", distance: "5 km" }], directions: "Fly into Kempegowda International Airport (BLR)." },
    galleryPhotos: [
      { label: "Venue", url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=450&fit=crop" },
      { label: "Couple", url: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&h=800&fit=crop" },
      { label: "Details", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=450&fit=crop" },
      { label: "Reception", url: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=600&h=450&fit=crop" },
      { label: "Floral", url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=450&fit=crop" },
      { label: "Dance", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=800&fit=crop" },
      { label: "Sunset", url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Sapphire Night",
    colors: ["#0D1B2A", "#4FC3F7", "#E8F4FD"],
    style: "Luxe Evening",
    couple: "Samir & Neha",
    partner1: "Samir",
    partner2: "Neha",
    tagline: "Under sapphire skies, we found forever",
    weddingDate: "November 15, 2027",
    venue: "The Sapphire Terrace",
    location: "Delhi, India",
    story: "Samir and Neha met at a rooftop jazz night in Delhi. The city lights reflected in her eyes, and he forgot his own name. After months of starlit dinners and spontaneous midnight drives, he proposed under a sky full of stars — the same ones that seemed to align the night they first met.",
    couplePhoto: "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=1200&h=800&fit=crop",
    events: [
      { name: "Cocktail Evening", date: "Nov 14, 2027", time: "7:00 PM", venue: "Sky Lounge" },
      { name: "Wedding Ceremony", date: "Nov 15, 2027", time: "6:00 PM", venue: "The Sapphire Terrace" },
      { name: "Starlit Reception", date: "Nov 15, 2027", time: "9:00 PM", venue: "Grand Ballroom" },
    ],
    guestbookMessages: [
      { name: "Rahul & Priya", message: "The most glamorous couple! Wishing you starlit nights forever! 💫" },
      { name: "Neha's Mom", message: "My shining star found her moon. Blessings always." },
    ],
    travelInfo: { hotels: [{ name: "The Oberoi", distance: "2 km" }, { name: "The Imperial", distance: "4 km" }], directions: "Fly into Indira Gandhi International Airport (DEL)." },
    galleryPhotos: [
      { label: "Night View", url: "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=600&h=450&fit=crop" },
      { label: "Couple", url: "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=600&h=800&fit=crop" },
      { label: "Ceremony", url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=450&fit=crop" },
      { label: "Dance", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=450&fit=crop" },
      { label: "Decor", url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=450&fit=crop" },
      { label: "Details", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=800&fit=crop" },
      { label: "Skyline", url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Lotus Pink",
    colors: ["#AD1457", "#F48FB1", "#FFF0F5"],
    style: "Contemporary Chic",
    couple: "Karan & Divya",
    partner1: "Karan",
    partner2: "Divya",
    tagline: "Like a lotus — rising beautifully, together",
    weddingDate: "April 5, 2027",
    venue: "Lotus Garden Estate",
    location: "Pune, Maharashtra",
    story: "Karan spotted Divya at a marathon — she was at the finish line handing out water, and he nearly tripped trying to catch her eye. They started running together every weekend, and somewhere between the morning jogs and post-run breakfasts, they fell in love.",
    couplePhoto: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=1200&h=800&fit=crop",
    events: [
      { name: "Haldi & Mehendi", date: "Apr 4, 2027", time: "3:00 PM", venue: "Divya's Home" },
      { name: "Wedding Ceremony", date: "Apr 5, 2027", time: "10:00 AM", venue: "Lotus Garden Estate" },
      { name: "Reception", date: "Apr 5, 2027", time: "7:00 PM", venue: "Estate Ballroom" },
    ],
    guestbookMessages: [
      { name: "Running Club", message: "You two crossed the ultimate finish line together! 🏃‍♂️❤️" },
      { name: "Divya's Nani", message: "My lotus flower, may your love bloom forever. Ashirvaad." },
    ],
    travelInfo: { hotels: [{ name: "JW Marriott Pune", distance: "4 km" }, { name: "Conrad Pune", distance: "6 km" }], directions: "Fly into Pune Airport (PNQ)." },
    galleryPhotos: [
      { label: "Garden", url: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=600&h=800&fit=crop" },
      { label: "Couple", url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&h=450&fit=crop" },
      { label: "Ceremony", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=450&fit=crop" },
      { label: "Florals", url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=450&fit=crop" },
      { label: "Sunset", url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=450&fit=crop" },
      { label: "Reception", url: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=600&h=800&fit=crop" },
      { label: "Couple Walk", url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Mughal Romance",
    colors: ["#1F3A5F", "#C19A6B", "#FAF0E6"],
    style: "Indo-Persian",
    couple: "Faizan & Aisha",
    partner1: "Faizan",
    partner2: "Aisha",
    tagline: "A love story as grand as the Mughal courts",
    weddingDate: "January 25, 2027",
    venue: "The Mughal Heritage Hall",
    location: "Lucknow, Uttar Pradesh",
    story: "Faizan, a historian, and Aisha, a miniature painter, met at a Mughal art exhibition. He was lecturing about Akbar's court; she was sketching in the corner. He noticed her delicate brushwork, she noticed his passion — and a love story worthy of the courts they admired began.",
    couplePhoto: "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&h=800&fit=crop",
    events: [
      { name: "Mehendi Night", date: "Jan 23, 2027", time: "5:00 PM", venue: "Heritage Gardens" },
      { name: "Nikah", date: "Jan 25, 2027", time: "11:00 AM", venue: "The Mughal Heritage Hall" },
      { name: "Walima", date: "Jan 25, 2027", time: "7:00 PM", venue: "Grand Durbar Room" },
    ],
    guestbookMessages: [
      { name: "Professor Khan", message: "A love story for the history books! MashaAllah! 📖" },
      { name: "Art Society", message: "Two artists creating the masterpiece of a lifetime together!" },
    ],
    travelInfo: { hotels: [{ name: "Taj Mahal Lucknow", distance: "3 km" }, { name: "Vivanta Lucknow", distance: "5 km" }], directions: "Fly into Chaudhary Charan Singh Airport (LKO)." },
    galleryPhotos: [
      { label: "Heritage Hall", url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=450&fit=crop" },
      { label: "Couple", url: "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=600&h=800&fit=crop" },
      { label: "Mehendi", url: "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=600&h=450&fit=crop" },
      { label: "Arch Detail", url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=450&fit=crop" },
      { label: "Calligraphy", url: "https://images.unsplash.com/photo-1522413452208-996ff3f3e740?w=600&h=800&fit=crop" },
      { label: "Feast", url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&h=450&fit=crop" },
      { label: "Night Lights", url: "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Mysore Silk",
    colors: ["#4B0082", "#DAA520", "#FFF8DC"],
    style: "South Indian Royal",
    couple: "Venkat & Lakshmi",
    partner1: "Venkat",
    partner2: "Lakshmi",
    tagline: "Woven in silk, tied in love",
    weddingDate: "February 20, 2027",
    venue: "Mysore Palace Grounds",
    location: "Mysore, Karnataka",
    story: "Venkat is a silk weaver's son; Lakshmi is a classical dancer. They met when she visited his father's workshop to commission a costume. The way she appreciated each thread's journey reminded him of how love is woven — patiently, beautifully, one thread at a time.",
    couplePhoto: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&h=800&fit=crop",
    events: [
      { name: "Nichayathartham", date: "Feb 18, 2027", time: "10:00 AM", venue: "Family Temple" },
      { name: "Wedding Ceremony", date: "Feb 20, 2027", time: "9:00 AM", venue: "Mysore Palace Grounds" },
      { name: "Reception", date: "Feb 20, 2027", time: "6:30 PM", venue: "Royal Pavilion" },
    ],
    guestbookMessages: [
      { name: "Amma & Appa", message: "Our golden boy found his golden girl. All our blessings. 🪷" },
      { name: "Dance Academy", message: "Lakshmi akka, the most graceful bride! Love from all of us!" },
    ],
    travelInfo: { hotels: [{ name: "Radisson Blu Mysore", distance: "2 km" }, { name: "Royal Orchid Metropole", distance: "3 km" }], directions: "Fly into Mysore Airport (MYQ) or Bangalore (BLR) + 3hr drive." },
    galleryPhotos: [
      { label: "Palace", url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=800&fit=crop" },
      { label: "Couple", url: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&h=450&fit=crop" },
      { label: "Silk Detail", url: "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=600&h=450&fit=crop" },
      { label: "Temple", url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=450&fit=crop" },
      { label: "Dance", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=800&fit=crop" },
      { label: "Garland", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=450&fit=crop" },
      { label: "Feast", url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Kashmiri Snow",
    colors: ["#2C3E50", "#C0C0C0", "#F8F9FA"],
    style: "Winter Elegance",
    couple: "Rohan & Meher",
    partner1: "Rohan",
    partner2: "Meher",
    tagline: "In the silence of snow, our hearts spoke",
    weddingDate: "December 28, 2027",
    venue: "Pine Valley Resort",
    location: "Gulmarg, Kashmir",
    story: "Rohan was skiing down a slope in Gulmarg when he crashed (gently) into Meher's snowman. She demanded he rebuild it; he spent two hours sculpting the worst snowman ever. But his effort — and his laughter — melted her heart faster than the sun melts snow.",
    couplePhoto: "https://images.unsplash.com/photo-1439539698758-ba2680ecadb9?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&h=800&fit=crop",
    events: [
      { name: "Welcome Bonfire", date: "Dec 27, 2027", time: "6:00 PM", venue: "Pine Valley Courtyard" },
      { name: "Wedding Ceremony", date: "Dec 28, 2027", time: "11:00 AM", venue: "Snow Chapel" },
      { name: "Winter Wonderland Reception", date: "Dec 28, 2027", time: "6:00 PM", venue: "Grand Lodge" },
    ],
    guestbookMessages: [
      { name: "Ski Club", message: "The coolest couple we know — literally and figuratively! ⛷️❄️" },
      { name: "Meher's Dad", message: "My snowflake found her sunshine. Blessings on this beautiful union." },
    ],
    travelInfo: { hotels: [{ name: "Khyber Himalayan Resort", distance: "2 km" }, { name: "Hotel Highlands Park", distance: "4 km" }], directions: "Fly into Srinagar Airport (SXR). Gulmarg is a 2-hour scenic drive." },
    galleryPhotos: [
      { label: "Mountains", url: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=450&fit=crop" },
      { label: "Couple in Snow", url: "https://images.unsplash.com/photo-1439539698758-ba2680ecadb9?w=600&h=800&fit=crop" },
      { label: "Pine Forest", url: "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=600&h=450&fit=crop" },
      { label: "Chapel", url: "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&h=450&fit=crop" },
      { label: "Bonfire", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=450&fit=crop" },
      { label: "Snow Walk", url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=800&fit=crop" },
      { label: "Winter Decor", url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Rajasthani Sunset",
    colors: ["#C0392B", "#F39C12", "#FEF9E7"],
    style: "Desert Royal",
    couple: "Aditya & Nandini",
    partner1: "Aditya",
    partner2: "Nandini",
    tagline: "Painted in sunset hues, sealed with forever",
    weddingDate: "March 8, 2027",
    venue: "Fort Barmer Heritage",
    location: "Barmer, Rajasthan",
    story: "Aditya and Nandini met during a desert safari. The jeep broke down at sunset, and while the driver fixed it, they sat on a dune watching the sky turn every shade of orange. He told her she was more beautiful than any sunset. She told him that was cheesy. They've been inseparable since.",
    couplePhoto: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200&h=800&fit=crop",
    events: [
      { name: "Mehendi & Sangeet", date: "Mar 7, 2027", time: "5:00 PM", venue: "Fort Courtyard" },
      { name: "Wedding Ceremony", date: "Mar 8, 2027", time: "10:00 AM", venue: "Fort Barmer Heritage" },
      { name: "Sunset Reception", date: "Mar 8, 2027", time: "5:30 PM", venue: "Desert View Terrace" },
    ],
    guestbookMessages: [
      { name: "Desert Safari Group", message: "The best breakdown ever led to the best love story! 🌅" },
      { name: "Nandini's Mom", message: "My sunshine found her desert king. All my love and blessings." },
    ],
    travelInfo: { hotels: [{ name: "Fort Barmer Heritage", distance: "On-site" }, { name: "Desert Haven Resort", distance: "5 km" }], directions: "Fly into Jodhpur Airport (JDH). Barmer is a 3-hour drive south." },
    galleryPhotos: [
      { label: "Desert Sunset", url: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&h=450&fit=crop" },
      { label: "Couple", url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&h=800&fit=crop" },
      { label: "Fort", url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=450&fit=crop" },
      { label: "Mehendi", url: "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=600&h=450&fit=crop" },
      { label: "Ceremony", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=450&fit=crop" },
      { label: "Camel Ride", url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=800&fit=crop" },
      { label: "Fireworks", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Marigold Fields",
    colors: ["#B7410E", "#FFB300", "#FFFDE7"],
    style: "Festive Traditional",
    couple: "Suresh & Kavya",
    partner1: "Suresh",
    partner2: "Kavya",
    tagline: "In a field of marigolds, I found you",
    weddingDate: "November 5, 2027",
    venue: "Marigold Farms Estate",
    location: "Nashik, Maharashtra",
    story: "Suresh grows organic flowers; Kavya makes natural perfumes. They met at a farmers' market where she kept coming back to smell his marigolds. He started saving the best blooms for her. One day he wrote 'Will you marry me?' on the farm's welcome board. She said yes before reading the full sign.",
    couplePhoto: "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&h=800&fit=crop",
    events: [
      { name: "Haldi in the Fields", date: "Nov 4, 2027", time: "10:00 AM", venue: "Marigold Farms" },
      { name: "Wedding Ceremony", date: "Nov 5, 2027", time: "11:00 AM", venue: "Marigold Farms Estate" },
      { name: "Farm Reception", date: "Nov 5, 2027", time: "6:00 PM", venue: "The Barn at Marigold" },
    ],
    guestbookMessages: [
      { name: "Farmers' Market Friends", message: "The sweetest love story — literally grown from the soil! 🌼" },
      { name: "Kavya's Aji", message: "My flower girl found her sunshine. Blessings from the heavens." },
    ],
    travelInfo: { hotels: [{ name: "Sula Vineyards Resort", distance: "8 km" }, { name: "Gateway Nashik", distance: "12 km" }], directions: "Fly into Nashik Airport (ISK) or Pune Airport (PNQ) + 3.5hr drive." },
    galleryPhotos: [
      { label: "Marigold Field", url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=800&fit=crop" },
      { label: "Couple", url: "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=600&h=450&fit=crop" },
      { label: "Haldi", url: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&h=450&fit=crop" },
      { label: "Barn", url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=450&fit=crop" },
      { label: "Floral Arch", url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=450&fit=crop" },
      { label: "Vineyard", url: "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=600&h=800&fit=crop" },
      { label: "Sunset", url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Goan Sunlight",
    colors: ["#E67E22", "#3498DB", "#FFF5EE"],
    style: "Beach Casual",
    couple: "Miguel & Prerna",
    partner1: "Miguel",
    partner2: "Prerna",
    tagline: "Barefoot, sun-kissed, and madly in love",
    weddingDate: "December 20, 2027",
    venue: "Cabo de Rama Beach Club",
    location: "South Goa, India",
    story: "Miguel is a Portuguese-Goan chef; Prerna is a travel blogger. She walked into his beach shack for a fish curry review. He served her the best meal of her life, and she gave him a five-star review — and her phone number. Their love tastes like the sea and feels like sunshine.",
    couplePhoto: "https://images.unsplash.com/photo-1439539698758-ba2680ecadb9?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop",
    events: [
      { name: "Beach BBQ Night", date: "Dec 19, 2027", time: "6:00 PM", venue: "Cabo Beach Shack" },
      { name: "Barefoot Ceremony", date: "Dec 20, 2027", time: "4:30 PM", venue: "Sunset Point Beach" },
      { name: "Seafood Feast Reception", date: "Dec 20, 2027", time: "7:30 PM", venue: "Beach Club Pavilion" },
    ],
    guestbookMessages: [
      { name: "Food Blog Fans", message: "The chef and the critic — the tastiest love story ever! 🍽️" },
      { name: "Tia Maria", message: "Miguel meu amor, she is perfect for you. Blessings from Portugal!" },
    ],
    travelInfo: { hotels: [{ name: "Taj Exotica Goa", distance: "5 km" }, { name: "Alila Diwa Goa", distance: "8 km" }], directions: "Fly into Dabolim Airport (GOI). South Goa is a 1-hour drive." },
    galleryPhotos: [
      { label: "Beach Sunset", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=450&fit=crop" },
      { label: "Couple", url: "https://images.unsplash.com/photo-1439539698758-ba2680ecadb9?w=600&h=800&fit=crop" },
      { label: "Food Spread", url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&h=450&fit=crop" },
      { label: "Ocean", url: "https://images.unsplash.com/photo-1505881502353-a1986add3762?w=600&h=450&fit=crop" },
      { label: "Ceremony", url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&h=450&fit=crop" },
      { label: "Dancing", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=800&fit=crop" },
      { label: "Church", url: "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&h=450&fit=crop" },
    ],
  },
  {
    name: "Teak & Brass",
    colors: ["#5D4037", "#CD853F", "#FAF3E8"],
    style: "Heritage Minimal",
    couple: "Anand & Meera",
    partner1: "Anand",
    partner2: "Meera",
    tagline: "Timeless as teak, warm as brass",
    weddingDate: "January 18, 2027",
    venue: "The Heritage House",
    location: "Pondicherry, India",
    story: "Anand restores old furniture; Meera is an architect who loves heritage buildings. They met when she hired him to restore antique doors for a French-colonial villa. He delivered the doors and asked her out for coffee in the same breath. She said yes to both — the doors were perfect, and so was the coffee.",
    couplePhoto: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&h=600&fit=crop",
    heroPhoto: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&h=800&fit=crop",
    events: [
      { name: "Welcome Sundowner", date: "Jan 17, 2027", time: "5:00 PM", venue: "Promenade Beach" },
      { name: "Wedding Ceremony", date: "Jan 18, 2027", time: "10:00 AM", venue: "The Heritage House" },
      { name: "French Quarter Reception", date: "Jan 18, 2027", time: "7:00 PM", venue: "Villa Shanti" },
    ],
    guestbookMessages: [
      { name: "Architecture Firm", message: "You two built something more beautiful than any building! 🏛️" },
      { name: "Anand's Thatha", message: "Like fine teak, your love will only get more beautiful with age." },
    ],
    travelInfo: { hotels: [{ name: "Palais de Mahé", distance: "1 km" }, { name: "La Villa", distance: "2 km" }], directions: "Fly into Chennai Airport (MAA). Pondicherry is a 3-hour drive south along the coast." },
    galleryPhotos: [
      { label: "Heritage Villa", url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=450&fit=crop" },
      { label: "Couple", url: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&h=800&fit=crop" },
      { label: "French Quarter", url: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=600&h=450&fit=crop" },
      { label: "Beach", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=450&fit=crop" },
      { label: "Doors Detail", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=800&fit=crop" },
      { label: "Ceremony", url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=450&fit=crop" },
      { label: "Sunset", url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=450&fit=crop" },
    ],
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

// ─── Masonry Gallery component ─────────────────────────────────────
const MASONRY_SPANS = [2, 1, 1, 1, 2, 1, 1]; // row-span pattern: some tall, some normal

function MasonryGallery({ photos, accent }: { photos: { label: string; url: string }[]; accent: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxImages = photos.map((p) => ({ url: p.url, name: p.label }));

  return (
    <>
      <div className="columns-2 md:columns-3 gap-3 max-w-2xl mx-auto [column-fill:_balance]">
        {photos.map((photo, i) => {
          const isTall = MASONRY_SPANS[i % MASONRY_SPANS.length] === 2;
          return (
            <div
              key={photo.label}
              className="mb-3 break-inside-avoid rounded-xl overflow-hidden relative group cursor-pointer"
              onClick={() => setLightboxIndex(i)}
            >
              <div className={isTall ? "aspect-[3/4]" : "aspect-[4/3]"}>
                <img
                  src={photo.url}
                  alt={photo.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <div className="p-3 w-full">
                  <p className="text-white text-xs font-body font-medium">{photo.label}</p>
                </div>
              </div>
              <div
                className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: accent }}
              />
            </div>
          );
        })}
      </div>
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={lightboxImages}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Template Preview Modal ──────────────────────────────────────────
function TemplatePreviewModal({ template: t, onClose, onUseTemplate }: { template: TemplateData; onClose: () => void; onUseTemplate: (t: TemplateData) => void }) {
  const [bg, accent, text] = t.colors;
  const countdown = getCountdownFromDate(t.weddingDate);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [parallaxY, setParallaxY] = useState(0);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setParallaxY(scrollRef.current.scrollTop * 0.4);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll, { passive: true });
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      ref={scrollRef}
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

        {/* ── Hero Section with Parallax ── */}
        <div className="relative overflow-hidden" style={{ minHeight: "min(480px, 85vh)" }}>
          {/* Parallax hero background */}
          <div
            className="absolute inset-0 will-change-transform"
            style={{ transform: `translateY(${parallaxY}px) scale(1.15)`, top: "-15%" , bottom: "-15%" }}
          >
            <img src={t.heroPhoto} alt={t.venue} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${bg}bb 0%, ${bg}88 40%, ${bg}dd 100%)` }} />
          </div>

          <div className="relative z-10 pt-16 pb-8 px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Heart className="w-8 h-8 mx-auto mb-4" style={{ color: accent }} fill="currentColor" />
              <p className="font-body text-sm tracking-[0.25em] uppercase mb-3" style={{ color: `${text}90` }}>
                You're Invited to the Wedding of
              </p>
            </motion.div>
            <motion.h1
              className="font-display text-4xl sm:text-5xl md:text-7xl font-bold mb-3 drop-shadow-lg"
              style={{ color: text }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
            >
              {t.partner1} <span className="font-normal italic text-2xl sm:text-3xl md:text-4xl mx-1 sm:mx-2" style={{ color: accent }}>&</span> {t.partner2}
            </motion.h1>
            <motion.p
              className="font-display text-xl italic mb-6"
              style={{ color: accent }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {t.tagline}
            </motion.p>

            {/* Couple photo circle */}
            <motion.div
              className="mx-auto mb-4 sm:mb-6 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 shadow-xl"
              style={{ borderColor: accent }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5, type: "spring", stiffness: 200 }}
            >
              <img src={t.couplePhoto} alt={t.couple} className="w-full h-full object-cover" />
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-sm"
              style={{ color: `${text}cc` }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <span className="flex items-center gap-1.5 font-body">
                <Calendar className="w-4 h-4" /> {t.weddingDate}
              </span>
              <span className="w-1 h-1 rounded-full hidden sm:block" style={{ backgroundColor: accent }} />
              <span className="flex items-center gap-1.5 font-body">
                <MapPin className="w-4 h-4" /> {t.location}
              </span>
            </motion.div>
          </div>
        </div>

        {/* ── Countdown Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="py-10 px-6 text-center" style={{ backgroundColor: `${accent}10` }}
        >
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
        </motion.div>

        {/* ── Our Story Section with Photo ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white py-14 px-8"
        >
          <h2 className="font-display text-2xl font-bold text-center mb-2" style={{ color: bg }}>Our Story</h2>
          <div className="w-12 h-0.5 mx-auto mb-8" style={{ backgroundColor: accent }} />
          <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-8">
            <motion.div
              className="w-full md:w-2/5 flex-shrink-0"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-lg">
                <img src={t.couplePhoto} alt={t.couple} className="w-full h-full object-cover" />
              </div>
            </motion.div>
            <motion.div
              className="w-full md:w-3/5"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <p className="leading-relaxed font-body text-sm" style={{ color: `${bg}cc` }}>
                {t.story}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-8 h-0.5" style={{ backgroundColor: accent }} />
                <Heart className="w-4 h-4" style={{ color: accent }} fill="currentColor" />
                <div className="w-8 h-0.5" style={{ backgroundColor: accent }} />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Photo Gallery Section (Masonry) ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="py-14 px-8" style={{ backgroundColor: `${bg}08` }}
        >
          <h2 className="font-display text-2xl font-bold text-center mb-2" style={{ color: bg }}>Gallery</h2>
          <div className="w-12 h-0.5 mx-auto mb-8" style={{ backgroundColor: accent }} />
          <MasonryGallery photos={t.galleryPhotos} accent={accent} />
          <p className="text-center text-xs font-body mt-6" style={{ color: `${bg}60` }}>
            Upload your own photos after creating your site
          </p>
        </motion.div>

        {/* ── Wedding Events Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="bg-white py-12 px-8"
        >
          <h2 className="font-display text-2xl font-bold text-center mb-2" style={{ color: bg }}>Wedding Events</h2>
          <div className="w-12 h-0.5 mx-auto mb-8" style={{ backgroundColor: accent }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {t.events.map((evt, i) => (
              <motion.div
                key={evt.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
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
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── RSVP Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="py-12 px-8" style={{ background: `linear-gradient(135deg, ${bg}, ${bg}ee)` }}
        >
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
        </motion.div>

        {/* ── Guestbook Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="bg-white py-12 px-8"
        >
          <h2 className="font-display text-2xl font-bold text-center mb-2" style={{ color: bg }}>
            <MessageSquare className="w-5 h-5 inline mr-2" style={{ color: accent }} />
            Wishes & Blessings
          </h2>
          <div className="w-12 h-0.5 mx-auto mb-6" style={{ backgroundColor: accent }} />
          <div className="space-y-3 max-w-lg mx-auto">
            {t.guestbookMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="rounded-xl p-4 border"
                style={{ borderColor: `${accent}20`, backgroundColor: `${accent}05` }}
              >
                <p className="font-display text-sm font-semibold mb-1" style={{ color: bg }}>{msg.name}</p>
                <p className="text-xs font-body leading-relaxed" style={{ color: `${bg}aa` }}>{msg.message}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

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
    const templateState = {
      templateName: t.name,
      templateStyle: t.style,
      templateColors: t.colors,
    };
    // Persist in sessionStorage so it survives the auth redirect
    sessionStorage.setItem("pendingTemplate", JSON.stringify(templateState));
    navigate("/wizard", { state: templateState });
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
              {templates.length} Stunning Templates
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Themes for Every <span className="text-gradient-gold italic">Tradition</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-body">
              Click any template to preview the full wedding site — complete with events, RSVP, guestbook, and more.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.slice(0, 6).map((t, i) => (
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
                  {/* Template preview with hero photo */}
                  <div className="h-60 relative">
                    <img src={t.heroPhoto} alt={t.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${t.colors[0]}88 0%, ${t.colors[0]}cc 50%, ${t.colors[0]}ee 100%)` }} />
                    
                    {/* Content overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                      {/* Couple photo circle */}
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 mb-3 shadow-lg" style={{ borderColor: t.colors[1] }}>
                        <img src={t.couplePhoto} alt={t.couple} className="w-full h-full object-cover" />
                      </div>
                      <Heart className="w-3.5 h-3.5 mb-1.5" style={{ color: t.colors[1] }} fill="currentColor" />
                      <p className="font-display text-2xl font-bold drop-shadow-md" style={{ color: t.colors[2] }}>
                        {t.couple}
                      </p>
                      <p className="font-body text-xs mt-1 drop-shadow-sm" style={{ color: t.colors[2] + "cc" }}>
                        {t.weddingDate}
                      </p>
                      <p className="font-body text-[10px] mt-0.5 flex items-center gap-1 drop-shadow-sm" style={{ color: t.colors[2] + "99" }}>
                        <MapPin className="w-3 h-3" /> {t.location}
                      </p>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-white bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full font-body text-sm font-medium flex items-center gap-2 border border-white/30">
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
                          className="w-5 h-5 rounded-full border border-border/50 shadow-sm"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* View More Templates button */}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Button
              variant="gold"
              size="xl"
              onClick={() => navigate("/templates")}
              className="font-body"
            >
              View All {templates.length} Templates →
            </Button>
          </motion.div>
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
