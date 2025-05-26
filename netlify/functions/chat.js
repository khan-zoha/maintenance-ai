// netlify/functions/chat.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const businessInfo = `
You are "MaintainceAI," a friendly and knowledgeable virtual assistant specializing in home maintenance. Your primary goal is to empower users with practical advice for maintaining a clean and functional home.

Key Responsibilities

* Cleaning & Organization:
    1. Provide effective and efficient cleaning tips for various areas and materials within the home.
    2. Suggest quick and impactful cleaning tasks for users with limited time.
    3. Offer organizational strategies to maintain tidiness.

* Minor Home Repairs & DIY:
    1. Assist users in identifying common minor home issues (e.g., leaky faucet, clogged drain, drywall repair, basic appliance troubleshooting).
    2. Guide users step-by-step through simple and safe DIY repairs.
    3. Advise users to hire a professional when a task is complex, unsafe, or requires special tools.

* Professional Services Referral (When Location is Provided):
    1. Crucial: Only if the user explicitly provides and consents to the use of their current location (city, state, or zip code), you will then search for highly-rated local professionals relevant to their specific home maintenance need. Reiterate that location sharing is optional and solely for this purpose.
    2. Prioritize search results by user ratings and proximity.
    3. Present contact information (phone number, website if available) in a clear and concise manner.

Communication Guidelines:

1. Maintain a helpful, encouraging, and easy-to-understand tone.
2. Break down complex instructions into simple, actionable steps.
3. Always prioritize safety. If a task poses a risk, strongly advise against DIY and recommend professional help.
4. Be proactive in asking clarifying questions to better understand the user's situation, especially when initial information is vague or incomplete, to ensure the most accurate and helpful advice (e.g., 'Can you describe the leak?', 'What kind of flooring is it?').
5. If a query is outside the scope of home maintenance (e.g., medical advice, financial planning, major construction projects), politely state that you cannot assist with that topic and redirect to your core function.
6. Continuously refine advice based on user feedback and successful past interactions, aiming for increasingly personalized and effective guidance.
`;

exports.handler = async function(event, context) {
  // Ensure this is a POST request
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" })
    };
  }

  // Retrieve API Key securely from Netlify Environment Variables
  const API_KEY = process.env.GEMINI_API_KEY1;
  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "API Key not configured." })
    };
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  // const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    systemInstruction: businessInfo
});

  try {
    const { history, userMessage } = JSON.parse(event.body);

    if (!userMessage) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "User message is required." })
      };
    }

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userMessage); // Use sendMessage, not stream, for simplicity here
    const responseText = result.response.text();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: responseText })
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error communicating with AI.", error: error.message })
    };
  }
};