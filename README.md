# VowZ

I am building a no-code wedding website maker platform called ShaadiSite, targeted specifically at Indian weddings. This platform is similar to The Knot, SayI.do, or Bliss & Bone, but customized for Indian cultural elements, trends, and traditions. It follows a freemium model where basic features are free, and users can upgrade to premium for advanced options like custom domains. The focus is on ease of use, personalization, and integration of current Indian wedding trends such as personalization and storytelling, sustainability and eco-consciousness, fusion of tradition and modernity, minimalist luxury, immersive experiences, and digital tech integration. The platform should be built with a user-friendly interface, mobile responsiveness, and scalability in mind, using technologies like React for frontend, Node.js for backend if needed, but prioritize no-code tools where possible to keep it simple.

The core user audience is engaged couples in India and the diaspora, aged 25-35, along with family members or planners. The value proposition is to allow users to quickly create personalized wedding websites that replace paper invites, handle RSVPs, and showcase their love story, events, and photos in a culturally relevant way. Upon sign-up, users register with minimal fields: name, email, wedding date, partner name, and location. Include an AI-powered onboarding wizard that guides users through setup via a conversational chat interface. The AI asks simple questions like the names of the bride and groom, primary religion or cultural background (e.g., Hindu, Christian, Muslim, Sikh, or interfaith), wedding date and location, and a brief story of how they met. It also provides options to select traditional Indian wedding functions such as Engagement/Betrothal (Sagai), Mehendi/Haldi, Sangeet, Wedding Ceremony (Vivah), Reception, Vidaai, and regional variants like Pheras, Nikaah, Anand Karaj, or Roce. Users can add custom functions, and the AI suggests additional ones based on religion or inputs. Based on responses, the AI auto-generates a draft site with populated pages, personalized text, suggested themes (e.g., traditional red/gold, fusion pastels, sustainable eco-motifs), and placeholders for photos or media.

The site builder should be a drag-and-drop editor similar to Canva or Squarespace, allowing users to customize templates. Provide 20 free templates themed for Indian weddings: traditional with motifs like lotus, peacocks, mandalas; fusion with softer palettes like lavender, peach, blush, emerald green, metallics; and sustainable with nature-inspired elements. Core free pages include Home (welcome and couple intro), Our Story (timeline and photos), Events (schedule with maps, times, and selected functions), Gallery (up to 50 photo uploads), RSVP Form (simple yes/no with guest count and email notifications), and Gift Registry (links to external sites like Amazon or custom wishes). Basic customizations include color pickers aligned with trends (pastels, jewels, metallics), font selection supporting Indian scripts, image uploads up to 100MB, and text editors. All sites must be mobile-responsive, with sharing options like generateable links, QR codes for invites, basic email integration, and embedded social media feeds (e.g., Instagram for pre-wedding shoots). Include basic analytics like visitor count and RSVP stats.

For premium features, accessible via subscription ($9.99/month or $99 one-time for 6 months), add advanced AI capabilities like generating full romantic narratives from user stories, formal/informal invite wording in multiple languages with cultural elements (e.g., Sanskrit shlokas), and hashtag suggestions. Other premium unlocks include custom domains (easy connection like anoojandpriya.com), unlimited templates and storage (up to 5GB for photos/videos), video embeds, privacy options like password-protected sites or guest logins, ad-free experience without "Powered by ShaadiSite" watermarks, multilingual auto-translation, guestbook comments, countdown timers, Google Calendar integrations, sustainability toolkit (digital invite trackers, eco-tips), fusion theme packs (ombré gradients, animated elements), guest polls (e.g., song votes), and priority support via email/chat. Include in-app prompts to upgrade when free limits are hit, such as during media uploads or AI use.

The user flow starts with sign-up, followed by the optional AI wizard for quick setup (5-10 questions to avoid fatigue, with multilingual support). The AI drafts the site, which opens in the editor for manual tweaks. Users can preview in real-time, publish to a subdomain (e.g., anooj.shaadisite.com), and manage via a dashboard showing edits, RSVPs, analytics, and an ongoing AI chat for additions like custom events. Ensure accessibility with dark mode, gender-neutral language, and support for interfaith or same-sex couples. For regional focus, since the launch is in Kerala, include default South Indian elements like Sadhya menu suggestions or Onam-inspired decor, with opt-out options. Implement data privacy (GDPR-compliant), secure authentication (e.g., via email/Google), and scalability for wedding season spikes (Nov-Feb). Monetization includes premium subscriptions and future affiliate links from registry integrations, with marketing hooks like AI teasers in ads.

Additional features to enhance engagement include AI-generated content boosters (story writer, invite wording), trend-aligned customizations (virtual embeds for hybrid events, AR previews via links), user interaction tools (live updates for post-wedding shares), and inclusivity options. Use rule-based logic with NLP for the AI (integrate with open-source like Rasa or external APIs if needed). The platform should track metrics like sign-up rates, AI completion (target 70%), and premium conversions (20%). This MVP should be launch-ready in 2-3 months, focusing on validation through user feedback and iteration based on emerging Indian wedding trends.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vowz.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fd6e766c-9d0a-4610-9164-cb8d6d98a57a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
