// src/routes/search.ts
import { Router, Request, Response } from "express";
import SearchModel, { IResult } from "../models/Search";
import scraper from "../services/scraper";
import summarizer from "../services/summarizer";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const q: string = (req.body.q || "").trim();
    const limit = Math.min(parseInt(req.body.limit) || 8, 15);
    const force = !!req.body.forceRefresh;

    if (!q) return res.status(400).json({ error: "query (q) is required" });

    // check cache unless forced refresh
    if (!force) {
      const cached = await SearchModel.findOne({ query: q })
        .sort({ createdAt: -1 })
        .lean();
      if (cached) return res.json({ cached: true, data: cached });
    }

    // scrape raw results
    console.log(`Initiating scrape for query: ${q}`);
    const rawResults = await scraper.scrapeGoogle(q, limit);
    console.log("Scraped results:", rawResults);
    // rawResults: Array<{ title: string; url: string; snippet: string }>

    // declare typed results array so TS knows the element type (fixes never[] error)
    const resultsWithSummaries: IResult[] = [];

    // Option A: sequential (simple)
    // for (let i = 0; i < rawResults.length; i++) {
    //   const r = rawResults[i];
    //   const summary = await summarizer.summarizeResult(r);
    //   resultsWithSummaries.push({
    //     position: i + 1,
    //     title: r.title,
    //     url: r.url,
    //     snippet: r.snippet,
    //     summary,
    //     type: 'unknown',
    //   });
    // }

    // Option B: parallel summary generation (faster)
    const summaries = await Promise.all(
      rawResults.map((r) => summarizer.summarizeResult(r))
    );
    console.log("Generated summaries for all results.", summaries);
    for (let i = 0; i < rawResults.length; i++) {
      const r = rawResults[i];
      resultsWithSummaries.push({
        position: i + 1,
        title: r.title,
        url: r.url,
        snippet: r.snippet,
        summary: summaries[i],
        type: "unknown",
      });
    }

    const topSummaries = resultsWithSummaries
      .slice(0, 3)
      .map((x) => x.summary || "")
      .join(" ");
    const aggregateSummary = summarizer.aggregateSummaries(topSummaries);

    const doc = await SearchModel.create({
      query: q,
      results: resultsWithSummaries,
      aggregateSummary,
    });

    return res.json({ cached: false, data: doc });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || "server error" });
  }
});

export default router;
