import { InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient(process.env.HF_TOKEN);

export async function checkContent(text: string) {
  if (!text) return { isAppropriate: false, message: "No text provided" };

  if (!process.env.HF_TOKEN) {
    return { isAppropriate: true, message: "Moderation skipped (No Token)", error: "Config Error" };
  }

  try {
    const result = await hf.zeroShotClassification({
      model: 'facebook/bart-large-mnli',
      inputs: text,
      parameters: {
        candidate_labels: [
          "toxic",
          "harassment",
          "profanity",
          "sexual",
          "spam",
          "clean",
          "hate speech",
          "profanity",
          "violence",
          "sexual content",
          "spam",
          "neutral conversation",
          "customer support",
          "polite greeting"
        ]
      },
    });
    const restrictedLabels = [
      "toxic", "harassment", "profanity", "sexual", "spam", 
      "hate speech", "violence", "sexual content"
    ];
    const flaggedResult = (result as any[])
      .filter(item => restrictedLabels.includes(item.label))
      .sort((a, b) => b.score - a.score)[0];
    const isFlagged = flaggedResult && flaggedResult.score > 0.25;

    if (isFlagged) {
      return {
        isAppropriate: false,
        message: `Flagged for ${flaggedResult.label}`,
        confidence: (flaggedResult.score * 100).toFixed(0) + "%"
      };
    }

    return {
      isAppropriate: true,
      message: "Content is Safe",
    };

  } catch (error: any) {
    console.error("HF API Error:", error.message);
    if (error.message.includes("loading")) {
      return { isAppropriate: true, message: "Model is warming up. Please try again in 20s." };
    }
    return { isAppropriate: true, message: "Moderation service error", error: error.message };
  }
}