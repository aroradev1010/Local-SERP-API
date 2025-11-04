// backend/scripts/seed.ts
import axios from "axios";

const API = process.env.SEED_API_URL || "http://localhost:4000/api/search";

const queries = [
  "next js",
  "best node.js frameworks 2025",
  "what is playwright",
  "top ai tools 2025",
  "react performance tips",
  "how to deploy nextjs",
];

async function seed() {
  for (const q of queries) {
    try {
      console.log("Seeding:", q);

      const res = await axios.post(API, { q, limit: 8 });

      console.log(
        "Seed response for",
        q,
        ":",
        res.data?.data ? "OK" : res.data?.error || "no-data"
      );

      // small pause
      await new Promise((r) => setTimeout(r, 1200));
    } catch (err: any) {
      console.error("Seed error for", q, err.response?.data || err.message);
    }
  }

  console.log("Seeding done");
}

seed();
