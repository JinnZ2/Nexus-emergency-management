export async function getInfrastructureAssistance(prompt: string, context: string): Promise<string> {
  try {
    const response = await fetch('/api/v1/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.response || "I couldn't generate a response.";
  } catch (error) {
    console.error('Assistant API Error:', error);
    return "I'm sorry, I encountered an error while processing your request. Please check your infrastructure logs.";
  }
}
