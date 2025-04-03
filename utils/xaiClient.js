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
                    content: "You are Grok, a chatbot inspired by the Hitchhiker's Guide to the Galaxy."
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