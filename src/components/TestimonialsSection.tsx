import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Priya & Arjun",
    location: "Mumbai, India",
    text: "Vowz made our wedding website so easy to set up! Our guests loved the RSVP feature and the photo gallery. Highly recommended for Indian weddings.",
    rating: 5,
  },
  {
    name: "Sarah & James",
    location: "London, UK",
    text: "We were looking for something elegant and simple. Vowz delivered beautifully — the multilingual feature was a lifesaver for our multicultural wedding!",
    rating: 5,
  },
  {
    name: "Meera & Rohan",
    location: "Bangalore, India",
    text: "The QR code feature was brilliant for our physical invites. We saved so much on printed cards and our guests could RSVP instantly.",
    rating: 5,
  },
  {
    name: "Aisha & Omar",
    location: "Dubai, UAE",
    text: "Custom domain, password protection, and beautiful templates — everything we needed for our intimate wedding. Worth every penny!",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-16 sm:py-24 px-4 bg-card" id="testimonials">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-accent font-semibold font-body tracking-wider uppercase text-sm mb-3">
            Love Stories
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trusted by <span className="text-gradient-gold italic">Thousands</span> of Couples
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-body">
            See what couples around the world are saying about their Vowz experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-background rounded-2xl p-6 border border-border/50 hover:shadow-elegant transition-shadow duration-300 relative"
            >
              <Quote className="w-8 h-8 text-gold/20 absolute top-4 right-4" />
              <div className="flex gap-0.5 mb-3">
                {[...Array(t.rating)].map((_, si) => (
                  <Star key={si} className="w-4 h-4 text-gold fill-current" />
                ))}
              </div>
              <p className="font-body text-sm text-foreground/80 leading-relaxed mb-4 italic">
                "{t.text}"
              </p>
              <div className="border-t border-border/30 pt-3">
                <p className="font-display text-sm font-semibold text-foreground">{t.name}</p>
                <p className="font-body text-xs text-muted-foreground">{t.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
