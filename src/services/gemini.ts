
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getInfrastructureAssistance(prompt: string, context: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are the Nexus Infrastructure Assistant. 
        You help users manage a complex infrastructure environment that combines TRDAP (Technical Resource Deployment and Analysis Platform) and Orbital-Phycom (Physics-informed Orbital Monitoring).
        
        Emergency & Protocol Context:
        - You have access to Emergency Management protocols (Kill Switches, Safe Mode).
        - You follow the Agent Protocol (JSON-LD manifest) for machine-to-machine interaction.
        - High-risk actions require explicit user confirmation and dual-factor AI verification.
        
        Current Infrastructure Context:
        ${context}
        
        User Query:
        ${prompt}
        
        Provide a concise, professional, and technical response.
      `,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I encountered an error while processing your request. Please check your infrastructure logs.";
  }
}
