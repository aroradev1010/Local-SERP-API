import axios from "axios";
import cheerio from "cheerio";

function firstSentence(text: string): string {
  if (!text) return "";
  const m = text.match(/[^\.!\?]+[\.!\?]*/);
  const s = m ? m[0].trim() : text.slice(0, 140);
  return s.length > 200 ? s.slice(0, 200) + "..." : s;
}

async function fetchFirstParagraph(url: string): Promise<string> {
  try {
    const { data } = await axios.get(url, {
      timeout: 8000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $ = cheerio.load(data);
    let p =
      $("main p").first().text() ||
      $("article p").first().text() ||
      $("p").first().text();
    p = (p || "").trim();
    if (!p) {
      p = $('meta[name="description"]').attr("content") || "";
    }
    return p;
  } catch (err) {
    return "";
  }
}

export default {
  summarizeResult: async (result: {
    title: string;
    url: string;
    snippet?: string;
  }): Promise<string> => {
    if (result.snippet && result.snippet.length > 20) {
      return firstSentence(result.snippet);
    }
    const p = await fetchFirstParagraph(result.url);
    if (p && p.length > 20) return firstSentence(p);
    return result.title || "No summary available";
  },

  aggregateSummaries: (text: string): string => {
    if (!text) return "";
    const sentences = text.match(/[^\.!\?]+[\.!\?]*/g) || [];
    return sentences.slice(0, 3).join(" ").trim();
  },
};
