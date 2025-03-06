import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import fs from "fs";

const genAI = new GoogleGenerativeAI("AIzaSyBRnhR7VZOgwlLa52UqYXehtou0GYwlDb0");

const app = express();
const PORT = 3000;

// Function to check if cached quotes exist
const getCachedQuotes = () => {
  try {
    if (fs.existsSync("quotes.json")) {
      const data = fs.readFileSync("quotes.json", "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading cache:", error);
  }
  return null;
};

const GenerateQuotes = async () => {
  // Check if cached quotes exist before calling API
  const cachedQuotes = getCachedQuotes();
  if (cachedQuotes) {
    console.log("Using cached quotes...");
    return cachedQuotes;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  let prompt = `Write 10 quotes on Shivaji Maharaj in Hindi.
  Format as a JSON array with "quote" and "category" fields.`;

  try {
    const result = await model.generateContent(prompt);
    let rawResponse = result.response.text().replace(/```json|```/g, "").trim();
    let clearJson = JSON.parse(rawResponse);

    // Save the response to cache
    fs.writeFileSync("quotes.json", JSON.stringify(clearJson, null, 2));

    console.log("✅ New quotes fetched!");
    return clearJson;
  } catch (error) {
    console.error("❌ Error fetching quotes:", error);

    if (error.status === 429) {
      console.log("⚠️ Too many requests! Using cached data...");
      return getCachedQuotes();
    }

    return { error: "Failed to fetch quotes." };
  }
};

// API Route to fetch quotes
app.get("/", async (req, res) => {
  const quotes = await GenerateQuotes();
  res.json(quotes);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});
