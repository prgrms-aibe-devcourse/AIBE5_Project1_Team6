import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyAXRd-QX1E1l6qc6ZAt8pfZrWaF7pWMGyM";

async function listModels() {
  const client = new GoogleGenAI({ apiKey });

  try {
    console.log("Fetching available models...");
    const response = await client.models.list();
    
    console.log("Available Models:");
    // Response might be { models: [] } or just iterable
    if (response.models) {
        response.models.forEach(model => {
             console.log(`- ${model.name}`);
        });
    } else {
        // Fallback for different SDK structure
        for await (const model of response) {
            console.log(`- ${model.name}`);
        }
    }
  } catch (error) {
    console.error("Error listing models:", error);
    if (error.response) {
        console.error("Response data:", await error.response.text());
    }
  }
}

listModels();
