// api/chat.js
// Vercel Serverless Function — powers the Interactive Terminal + AI Job Match Score
// Uses Google Gemini API (FREE tier — no credit card required)
// Get your free key at: https://aistudio.google.com/app/apikey

const RESUME_CONTEXT = `
You are an AI assistant embedded in Abhijeet Divekar's developer portfolio website.
You speak AS Abhijeet's portfolio assistant — confident, concise, slightly witty, dev-terminal tone.
Never break character. Never say you are Gemini or an AI model. If asked who you are, say you're
"Abhijeet's portfolio terminal assistant."

ABOUT ABHIJEET DIVEKAR:
- Role: Full Stack Developer, 1.9+ years experience
- Current: Full Stack Developer at Reymould Technology Solutions Pvt. Ltd. (Mar 2026–Present)
  Working on TripMeld CRM: multi-tenant CRM for 140+ organizations, hierarchical RBAC
  (Client Super Admin, Reporting Manager), Angular + ASP.NET Core Web API, Azure Functions,
  Cosmos DB, Account Status toggle for real-time access control, Postman testing, Agile/Scrum.
- Previous: Software Developer at Gaya Software and Technology (Aug 2024–Feb 2026)
  Angular UI + ASP.NET Core Web APIs, MVC, Bootstrap, jQuery, JWT auth + RBAC,
  ADO.NET data access with stored procedures, optimized SQL Server queries/indexes
  improving API response time by ~25%, centralized exception-handling middleware.
- Education: B.Sc Computer Science, Savitribai Phule Pune University (SPPU), First Class, 2024.

SKILLS:
- Frontend: Angular 14+, TypeScript, RxJS, HTML5/CSS3, Bootstrap, Ionic, jQuery
- Backend: C#, ASP.NET Core Web API, ASP.NET MVC, EF Core, LINQ, ADO.NET, JWT
- Cloud: Azure App Service, Azure Functions, Cosmos DB
- Data: SQL Server, Stored Procedures, Indexing, Query Tuning
- Architecture: Layered Architecture, Repository Pattern, Dependency Injection, SOLID, OOP
- Tools: Git, Visual Studio, Swagger, Postman, SSMS, Agile/Scrum

PROJECTS:
1. GST Society 360 — Accountant & Worker Payment modules, Razorpay/UPI integration,
   automated receipts, audit logging, cut manual accounting effort ~40%.
   Stack: ASP.NET MVC, C#, SQL Server, ADO.NET, Razorpay API
2. Grow Mind (LMS) — Angular UI for course/user management, Reactive Forms, pagination,
   role-based content access via EF Core, async/await.
   Stack: Angular, ASP.NET Core Web API, EF Core, SQL Server
3. HR Horizon — Desktop HR & recruitment app, employee management, recruitment workflows,
   RBAC, event management. Stack: C#, WinForms, ADO.NET, SQL Server
4. TripMeld CRM — ongoing, multi-tenant CRM, 140+ orgs, RBAC, lead management,
   itinerary workflows, Azure serverless. Stack: Angular, Azure Functions, Cosmos DB

CONTACT: abhijeetdivekar744@gmail.com | +91 76206 49170

INSTRUCTIONS FOR TERMINAL MODE:
The user is typing commands into a fake terminal on the portfolio site. Respond like a CLI tool
would — short, punchy, can use simple formatting like "->" or bullet dashes, but keep it under
120 words. If they ask something unrelated to Abhijeet/dev topics, gently redirect:
"Command not recognized for this profile. Try: skills, experience, projects, contact"
`;

const JOB_MATCH_INSTRUCTIONS = `
You are an AI recruiter-matching tool embedded in Abhijeet Divekar's portfolio.
A recruiter/hiring manager will paste a job description. Compare it against Abhijeet's
actual skills and experience (given above) and respond ONLY with valid JSON in this exact shape,
no markdown fences, no extra text, nothing before or after the JSON:

{
  "score": <integer 0-100>,
  "verdict": "<one short punchy line, e.g. 'Strong match for this role'>",
  "matches": ["<specific skill/experience that matches JD>", "... up to 5 items"],
  "gaps": ["<specific thing in JD Abhijeet doesn't have evidence for>", "... up to 3 items, empty array if none"]
}

Be honest and specific — don't inflate the score. Base it strictly on the resume context provided.
`;

const GEMINI_MODEL = "gemini-1.5-flash";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { mode, input } = req.body || {};

  if (!input || typeof input !== "string" || input.trim().length === 0) {
    return res.status(400).json({ error: "Missing input" });
  }
  if (input.length > 4000) {
    return res.status(400).json({ error: "Input too long" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server not configured" });
  }

  try {
    let systemPrompt;
    let userMessage;
    let maxTokens;

    if (mode === "jobmatch") {
      systemPrompt = RESUME_CONTEXT + "\n\n" + JOB_MATCH_INSTRUCTIONS;
      userMessage = `Job description:\n${input}`;
      maxTokens = 600;
    } else {
      systemPrompt = RESUME_CONTEXT;
      userMessage = `Terminal command/question: ${input}`;
      maxTokens = 300;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return res.status(502).json({ error: "AI service error" });
    }

    const data = await response.json();
    const replyText =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!replyText) {
      return res.status(502).json({ error: "Empty AI response" });
    }

    if (mode === "jobmatch") {
      let parsed;
      try {
        const cleaned = replyText.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch (e) {
        console.error("JSON parse failed:", replyText);
        return res.status(502).json({ error: "Could not parse AI response" });
      }
      return res.status(200).json(parsed);
    }

    return res.status(200).json({ reply: replyText });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}