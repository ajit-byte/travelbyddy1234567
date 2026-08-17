import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Itinerary from '../models/ContentsCreated/Itinerary.js';
import Profile from '../models/Profile.js';

dotenv.config();

const itineraries = [
  {
    title: 'Everest Base Camp Trek',
    destinations: ['Lukla, Nepal', 'Namche Bazaar, Nepal', 'Everest Base Camp, Nepal'],
    startDate: new Date('2026-10-01'),
    endDate: new Date('2026-10-14'),
    budget: 1800,
    activities: ['Trekking', 'Camping', 'Photography', 'Cultural Exploration'],
    notes: 'One of the most iconic treks in the world. Acclimatization days included.',
    isPublic: true,
    status: 'My Trips',
    tags: ['Adventure', 'Trekking', 'Nepal', 'Himalaya', 'Nature'],
    tripPacts: ['Respect local culture', 'Leave no trace', 'Support local teahouses'],
    members: [],
    activityItems: [
      { dayId: 1, name: 'Fly Kathmandu to Lukla', description: 'Scenic flight to Tenzing-Hillary Airport', time: '06:00', cost: 200, location: 'Lukla, Nepal', budgetType: 'Travel Fee' },
      { dayId: 1, name: 'Trek to Phakding', description: 'Easy first day trek through pine forests', time: '10:00', cost: 0, location: 'Phakding, Nepal', budgetType: 'Tour' },
      { dayId: 2, name: 'Trek to Namche Bazaar', description: 'Steep climb with first Everest views', time: '07:00', cost: 0, location: 'Namche Bazaar, Nepal', budgetType: 'Tour' },
      { dayId: 3, name: 'Acclimatization Day', description: 'Rest and explore Namche market', time: '09:00', cost: 30, location: 'Namche Bazaar, Nepal', budgetType: 'Food' },
      { dayId: 7, name: 'Reach Everest Base Camp', description: 'The iconic goal — 5364m above sea level', time: '08:00', cost: 0, location: 'Everest Base Camp, Nepal', budgetType: 'Tour' },
    ],
  },
  {
    title: 'Tokyo Solo Adventure',
    destinations: ['Tokyo, Japan', 'Kyoto, Japan', 'Osaka, Japan'],
    startDate: new Date('2026-11-05'),
    endDate: new Date('2026-11-15'),
    budget: 2500,
    activities: ['Food Tours', 'Cultural Exploration', 'Photography', 'Shopping', 'Nightlife'],
    notes: 'A perfect blend of ancient temples and ultra-modern cityscapes.',
    isPublic: true,
    status: 'My Trips',
    tags: ['Asia', 'Japan', 'Food', 'Culture', 'City', 'Photography'],
    tripPacts: ['Try every local food', 'Use IC card for trains', 'Visit at least 3 temples'],
    members: [],
    activityItems: [
      { dayId: 1, name: 'Arrive Tokyo — Shibuya Crossing', description: 'Drop bags, head straight to the iconic crossing', time: '14:00', cost: 0, location: 'Shibuya, Tokyo', budgetType: 'Tour' },
      { dayId: 2, name: 'Tsukiji Outer Market Breakfast', description: 'Fresh sushi and tamagoyaki for breakfast', time: '07:30', cost: 25, location: 'Tsukiji, Tokyo', budgetType: 'Food' },
      { dayId: 2, name: 'Senso-ji Temple', description: 'Iconic Asakusa temple and Nakamise shopping', time: '11:00', cost: 0, location: 'Asakusa, Tokyo', budgetType: 'Tour' },
      { dayId: 4, name: 'Day Trip to Kyoto', description: 'Arashiyama bamboo forest and Fushimi Inari', time: '07:00', cost: 60, location: 'Kyoto, Japan', budgetType: 'Travel Fee' },
      { dayId: 6, name: 'Dotonbori Food Street', description: 'Takoyaki, okonomiyaki, ramen crawl', time: '18:00', cost: 40, location: 'Dotonbori, Osaka', budgetType: 'Food' },
    ],
  },
  {
    title: 'Bali Spirit & Surf',
    destinations: ['Canggu, Bali', 'Ubud, Bali', 'Uluwatu, Bali'],
    startDate: new Date('2026-09-10'),
    endDate: new Date('2026-09-20'),
    budget: 1200,
    activities: ['Surfing', 'Yoga/Wellness', 'Hiking', 'Food Tours', 'Photography'],
    notes: 'A soul-refreshing mix of surf, rice terraces, and Hindu temples.',
    isPublic: true,
    status: 'My Trips',
    tags: ['Asia', 'Bali', 'Beach', 'Wellness', 'Surf', 'Budget-Backpacker'],
    tripPacts: ['Sunrise yoga every other day', 'No plastic bottles', 'Respect temple dress code'],
    members: [],
    activityItems: [
      { dayId: 1, name: 'Arrive Canggu — Check In', description: 'Settle into surf hostel, walk Echo Beach', time: '13:00', cost: 20, location: 'Canggu, Bali', budgetType: 'Stay' },
      { dayId: 2, name: 'Morning Surf Lesson', description: 'Beginner surf lesson at Batu Bolong Beach', time: '07:00', cost: 35, location: 'Canggu, Bali', budgetType: 'Tour' },
      { dayId: 4, name: 'Tegallalang Rice Terraces', description: 'Famous cascading rice paddies near Ubud', time: '08:00', cost: 5, location: 'Ubud, Bali', budgetType: 'Tour' },
      { dayId: 5, name: 'Ubud Monkey Forest', description: 'Sacred monkey sanctuary in the jungle', time: '10:00', cost: 7, location: 'Ubud, Bali', budgetType: 'Tour' },
      { dayId: 8, name: 'Uluwatu Temple Sunset', description: 'Clifftop temple with Kecak fire dance', time: '17:30', cost: 10, location: 'Uluwatu, Bali', budgetType: 'Entertainment' },
    ],
  },
  {
    title: 'Patagonia End of the World',
    destinations: ['Torres del Paine, Chile', 'El Chaltén, Argentina', 'Ushuaia, Argentina'],
    startDate: new Date('2027-01-10'),
    endDate: new Date('2027-01-25'),
    budget: 3500,
    activities: ['Hiking', 'Camping', 'Wildlife Safari', 'Photography', 'Backpacking'],
    notes: 'Raw, remote, and utterly breathtaking. The W Trek is unmissable.',
    isPublic: true,
    status: 'My Trips',
    tags: ['South America', 'Adventure', 'Hiking', 'Nature', 'Patagonia', 'Eco Travel'],
    tripPacts: ['Book refugios well in advance', 'Pack for all weather in one day', 'No drone flying in national parks'],
    members: [],
    activityItems: [
      { dayId: 1, name: 'Arrive Puerto Natales', description: 'Gateway to Torres del Paine', time: '12:00', cost: 0, location: 'Puerto Natales, Chile', budgetType: 'Stay' },
      { dayId: 2, name: 'W Trek — Las Torres', description: 'Iconic towers base — 19km round trip', time: '05:00', cost: 35, location: 'Torres del Paine, Chile', budgetType: 'Tour' },
      { dayId: 5, name: 'Grey Glacier Kayak', description: 'Paddle through icebergs to Grey Glacier', time: '09:00', cost: 120, location: 'Grey Lake, Chile', budgetType: 'Tour' },
      { dayId: 10, name: 'Fitz Roy Trek', description: 'Argentina side — stunning granite spires', time: '06:00', cost: 0, location: 'El Chaltén, Argentina', budgetType: 'Tour' },
      { dayId: 14, name: 'Tierra del Fuego', description: 'The end of the world national park', time: '10:00', cost: 15, location: 'Ushuaia, Argentina', budgetType: 'Tour' },
    ],
  },
  {
    title: 'Morocco Desert to Medina',
    destinations: ['Marrakech, Morocco', 'Merzouga, Morocco', 'Chefchaouen, Morocco'],
    startDate: new Date('2026-12-01'),
    endDate: new Date('2026-12-10'),
    budget: 900,
    activities: ['Cultural Exploration', 'Food Tours', 'Photography', 'Hiking', 'Shopping'],
    notes: 'From the blue city to Sahara dunes — Morocco is pure sensory overload.',
    isPublic: true,
    status: 'My Trips',
    tags: ['Africa', 'Morocco', 'Culture', 'Desert', 'Gastronomy', 'Budget-Backpacker'],
    tripPacts: ['Bargain respectfully in souks', 'Dress modestly in medinas', 'Try every tagine variation'],
    members: [],
    activityItems: [
      { dayId: 1, name: 'Jemaa el-Fna Square Night', description: 'Snake charmers, food stalls, storytellers', time: '19:00', cost: 20, location: 'Marrakech, Morocco', budgetType: 'Food' },
      { dayId: 2, name: 'Bahia Palace & Souks', description: 'Ornate palace and labyrinthine souks', time: '09:00', cost: 8, location: 'Marrakech, Morocco', budgetType: 'Tour' },
      { dayId: 4, name: 'Sahara Camel Trek & Camp', description: 'Overnight in Berber desert camp under stars', time: '15:00', cost: 90, location: 'Merzouga, Morocco', budgetType: 'Tour' },
      { dayId: 7, name: 'Chefchaouen Blue Streets', description: 'Wander the iconic blue-painted medina', time: '10:00', cost: 0, location: 'Chefchaouen, Morocco', budgetType: 'Tour' },
      { dayId: 8, name: 'Rif Mountains Hike', description: 'Half-day hike above the blue city', time: '08:00', cost: 15, location: 'Chefchaouen, Morocco', budgetType: 'Tour' },
    ],
  },
  {
    title: 'Iceland Ring Road Solo',
    destinations: ['Reykjavik, Iceland', 'Akureyri, Iceland', 'Jökulsárlón, Iceland'],
    startDate: new Date('2027-02-01'),
    endDate: new Date('2027-02-12'),
    budget: 4000,
    activities: ['Road Trip', 'Photography', 'Hiking', 'Wildlife Safari', 'Wellness'],
    notes: 'Northern lights, geysers, waterfalls and hot springs. Drive the full ring road.',
    isPublic: true,
    status: 'My Trips',
    tags: ['Europe', 'Iceland', 'Road Trip', 'Nature', 'Photography', 'Adventure'],
    tripPacts: ['Check northern lights forecast nightly', 'Never drive off-road', 'Hot spring every other day'],
    members: [],
    activityItems: [
      { dayId: 1, name: 'Reykjavik Arrival & Blue Lagoon', description: 'Classic geothermal spa welcome', time: '15:00', cost: 80, location: 'Blue Lagoon, Iceland', budgetType: 'Entertainment' },
      { dayId: 2, name: 'Golden Circle Day Trip', description: 'Geysir, Gullfoss, Þingvellir', time: '08:00', cost: 60, location: 'Golden Circle, Iceland', budgetType: 'Tour' },
      { dayId: 4, name: 'Skógafoss & Seljalandsfoss', description: 'Walk behind the waterfall', time: '09:00', cost: 0, location: 'South Iceland', budgetType: 'Tour' },
      { dayId: 7, name: 'Glacier Lagoon Iceberg Walk', description: 'Jökulsárlón boat tour among icebergs', time: '10:00', cost: 55, location: 'Jökulsárlón, Iceland', budgetType: 'Tour' },
      { dayId: 10, name: 'Northern Lights Hunt', description: 'Guided aurora viewing from Akureyri', time: '21:00', cost: 70, location: 'Akureyri, Iceland', budgetType: 'Tour' },
    ],
  },
  {
    title: 'Vietnam North to South',
    destinations: ['Hanoi, Vietnam', 'Hoi An, Vietnam', 'Ho Chi Minh City, Vietnam'],
    startDate: new Date('2026-10-20'),
    endDate: new Date('2026-11-03'),
    budget: 1100,
    activities: ['Food Tours', 'Cultural Exploration', 'Scuba Diving', 'Photography', 'Backpacking'],
    notes: 'Incredible street food, ancient towns, and pristine beaches on a budget.',
    isPublic: true,
    status: 'My Trips',
    tags: ['Asia', 'Vietnam', 'Backpacking', 'Food', 'Culture', 'Budget-Backpacker'],
    tripPacts: ['Eat at least one pho a day', 'Rent a motorbike in Hoi An', 'Always negotiate xe om prices'],
    members: [],
    activityItems: [
      { dayId: 1, name: 'Hanoi Old Quarter Walk', description: '36 streets, street food, Hoan Kiem Lake', time: '10:00', cost: 15, location: 'Hanoi, Vietnam', budgetType: 'Food' },
      { dayId: 2, name: 'Ha Long Bay Cruise', description: '2-day overnight cruise among limestone karsts', time: '08:00', cost: 150, location: 'Ha Long Bay, Vietnam', budgetType: 'Tour' },
      { dayId: 6, name: 'Hoi An Ancient Town', description: 'Lantern-lit ancient town — magical at night', time: '17:00', cost: 10, location: 'Hoi An, Vietnam', budgetType: 'Entertainment' },
      { dayId: 8, name: 'My Son Sanctuary', description: 'Ancient Cham temple ruins in jungle', time: '08:00', cost: 12, location: 'My Son, Vietnam', budgetType: 'Tour' },
      { dayId: 12, name: 'Ben Thanh Market', description: 'Best street food market in HCMC', time: '18:00', cost: 20, location: 'Ho Chi Minh City, Vietnam', budgetType: 'Food' },
    ],
  },
  {
    title: 'Scottish Highlands Road Trip',
    destinations: ['Edinburgh, Scotland', 'Inverness, Scotland', 'Isle of Skye, Scotland'],
    startDate: new Date('2026-09-15'),
    endDate: new Date('2026-09-23'),
    budget: 1600,
    activities: ['Road Trip', 'Hiking', 'Photography', 'Cultural Exploration', 'Wildlife Safari'],
    notes: 'Misty mountains, lochs, castles and whisky. The ultimate Highland adventure.',
    isPublic: true,
    status: 'My Trips',
    tags: ['Europe', 'Scotland', 'Road Trip', 'Hiking', 'Nature', 'Cultural Explorer'],
    tripPacts: ['Try a different whisky each evening', 'Hike Quiraing on Skye', 'No rushing between stops'],
    members: [],
    activityItems: [
      { dayId: 1, name: 'Edinburgh Castle & Royal Mile', description: 'Start with the iconic hilltop fortress', time: '10:00', cost: 18, location: 'Edinburgh, Scotland', budgetType: 'Tour' },
      { dayId: 2, name: 'Drive to Loch Ness', description: 'Via the Cairngorms national park', time: '09:00', cost: 50, location: 'Loch Ness, Scotland', budgetType: 'Travel Fee' },
      { dayId: 3, name: 'Glencoe Valley Hike', description: 'Dramatic valley with golden hills', time: '08:00', cost: 0, location: 'Glencoe, Scotland', budgetType: 'Tour' },
      { dayId: 5, name: 'Isle of Skye — Fairy Pools', description: 'Crystal clear natural pools in the Cuillins', time: '09:00', cost: 0, location: 'Isle of Skye, Scotland', budgetType: 'Tour' },
      { dayId: 6, name: 'Old Man of Storr Hike', description: 'Iconic rock formation on Skye', time: '07:30', cost: 0, location: 'Isle of Skye, Scotland', budgetType: 'Tour' },
    ],
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find admin user to use as the seed owner
    const admin = await Profile.findOne({ isAdmin: true });
    if (!admin) {
      console.error('No admin user found. Run the server first to auto-create admin.');
      process.exit(1);
    }

    console.log(`Using admin user: ${admin.username} (${admin._id})`);

    // Remove previously seeded itineraries to avoid duplicates
    const existingTitles = itineraries.map(i => i.title);
    await Itinerary.deleteMany({ title: { $in: existingTitles } });
    console.log('Cleared old seed data');

    // Insert all itineraries
    const docs = itineraries.map(it => ({
      ...it,
      user: admin._id,
      activityItems: it.activityItems.map((a, idx) => ({
        ...a,
        suggestedBy: admin.username,
        date: (() => {
          const d = new Date(it.startDate);
          d.setDate(d.getDate() + (a.dayId - 1));
          return d.toISOString().split('T')[0];
        })(),
      })),
    }));

    await Itinerary.insertMany(docs);
    console.log(`✅ Seeded ${docs.length} public itineraries successfully`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
