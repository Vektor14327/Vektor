const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
require('dotenv').config();

const challenges = [
  { day: 1, title: "Lock Your Grid", description: "Set a clear goal", task: "Define your primary objective for the week" },
  { day: 2, title: "Adjust Fire", description: "Tweak one habit", task: "Identify one habit to improve" },
  { day: 3, title: "Hold Steady", description: "Maintain consistency", task: "Stick to your plan without deviation" },
  { day: 4, title: "Call Your Shot", description: "Visualize success", task: "Spend 5 minutes visualizing your goal" },
  { day: 5, title: "Cover Your Six", description: "Address weaknesses", task: "Identify and work on one weakness" },
  { day: 6, title: "Clear the LZ", description: "Remove distractions", task: "Eliminate one major distraction" },
  { day: 7, title: "Own the Fight", description: "Reflect on progress", task: "Review your week and plan next steps" }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Challenge.deleteMany();
    await Challenge.insertMany(challenges);
    console.log('Challenges seeded successfully');
    process.exit();
  } catch (err) {
    console.error('Error seeding challenges:', err);
    process.exit(1);
  }
};

seed();