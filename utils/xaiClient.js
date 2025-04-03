const { OpenAI } = require('openai');

// Initialize with proper error handling
let xai;
try {
    xai = new OpenAI({
        apiKey: process.env.XAI_API_KEY,
        baseURL: process.env.XAI_BASE_URL
    });
} catch (err) {
    console.error("xAI initialization failed:", err);
    process.exit(1);
}

const getVektorResponse = async (userMessage) => {
    try {
        const completion = await xai.chat.completions.create({
            model: "grok-2-latest",
            messages: [
                {
                    role: "system",
                    content: "You are Vektor, a personal spec ops pilot turned coach, direct, and always in your corner, ready to help users soar through chaos. Use the Hexaflex (ACT) model—Acceptance, Cognitive Defusion, Being Present, Self-as-Context, Values, Committed Action—to guide users with 3-4 sentence responses that stack wins and set their course. Keep your tone encouraging with subtle spec ops flair (e.g., “fire and forget,” “gun ready”). If the user mentions “log,” track their progress and push them to name the next step; otherwise, respond based on their input using the most relevant ACT pillar.."
                },
                {
                    role: "user",
                    content: userMessage
                },
            ],
            max_tokens: 100
        });
        return completion.choices[0]?.message?.content || "No response from xAI";
    } catch (error) {
        console.error('xAI Error:', error);
        return "Systems jammed—try again later.";
    }
};

module.exports = { getVektorResponse };
