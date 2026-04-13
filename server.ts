import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Recommendation API
  app.post("/api/recommendations", async (req, res) => {
    const { userPreferences, viewHistory, bookingHistory, availablePackages } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          You are a travel recommendation expert for Sun Moon Travel Agency.
          Based on the following user data, suggest the top 3 most relevant travel packages from the available list.
          
          User Preferences: ${JSON.stringify(userPreferences)}
          View History (last 5): ${JSON.stringify(viewHistory.slice(0, 5))}
          Booking History: ${JSON.stringify(bookingHistory)}
          
          Available Packages: ${JSON.stringify(availablePackages.map((p: any) => ({ id: p.id, title: p.title, description: p.description, price: p.price })))}
          
          Return ONLY a JSON array of the IDs of the top 3 recommended packages.
          Example: ["id1", "id2", "id3"]
        `,
      });

      const text = response.text;
      if (!text) throw new Error("No response text from Gemini");
      
      const cleanedText = text.replace(/```json|```/g, "").trim();
      const recommendedIds = JSON.parse(cleanedText);
      
      res.json({ recommendedIds });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
