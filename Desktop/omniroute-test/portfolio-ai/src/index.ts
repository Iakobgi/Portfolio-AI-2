import englishData from "../data-english.json";
import frenchData from "../data-francais.json";

interface Env {
  OPENROUTER_API_KEY: string;
  GROQ_API_KEY: string;
  GEMINI_API_KEY: string;
}


export default {
  async fetch(request: Request, env: Env) {

    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders()
      });
    }


    if (request.method === "GET") {
      return Response.json(
        {
          status: "AI assistant backend is running"
        },
        {
          headers: corsHeaders()
        }
      );
    }


    if (request.method === "POST") {

      try {

        const data = await request.json();

        const userMessage = data.message || "";
        const language = data.language || "fr";


        const portfolioData =
          language === "fr"
          ? frenchData
          : englishData;


        const languageLabel = language === "fr" ? "Français" : "English";

        const systemPrompt = `
Tu es l'assistant IA qui représente Iakobi Iakobashvili.
Tu N'ES PAS Iakobi. Tu parles À PROPOS de lui, jamais À SA PLACE.
Tu réponds aux visiteurs de son portfolio.

Langue de réponse obligatoire : ${languageLabel}.
Ne change jamais de langue. Réponds toujours dans la langue indiquée ci-dessus, jamais dans une autre.

IMPORTANT — IDENTITÉ :
- Tu es un assistant IA. Parle toujours à la troisième personne quand tu parles de Iakobi.
- Jamais "je suis Iakobi", "j'ai 24 ans", "mon portfolio".
- Toujours "Iakobi a 24 ans", "son portfolio", "il est développeur".
- Si on te demande qui tu es, dis que tu es l'assistant IA du portfolio.

Utilise uniquement les informations suivantes :

${JSON.stringify(portfolioData)}

RÈGLES DE RÉPONSE (à respecter absolument) :
- Réponds de manière concise et directe, en répondant exactement à ce qui est demandé.
- MAXIMUM 2-3 phrases. Pour les questions sur les compétences, projets, ou toute liste : résume en 1-2 phrases sans tout énumérer. Ne donne JAMAIS d'informations supplémentaires non demandées.
- Cherche l'information dans TOUS les champs du JSON, y compris dans les phrases descriptives (ex. "j'ai 24 ans" dans "myself"). Ne dis pas que l'info n'existe pas si elle est présente sous une forme différente.
- Si l'information n'est absolument pas disponible après avoir cherché partout, dis simplement que tu ne disposes pas de cette information, sans justification.
- Termine par une question courte et pertinente liée au sujet, si cela s'ajuste naturellement.
- Réponds uniquement en texte brut.
- N'utilise jamais Markdown.
- N'inclus jamais de métadonnées, de balises de sécurité, ou de champs techniques dans ta réponse.
`;


        // ── Helper: call Groq with a specific model ────────────────────
        async function callGroq(model: string): Promise<{ content: string | null; status: number }> {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model,
                    max_tokens: 600,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage }
                    ]
                })
            });
            const text = await res.text();
            let parsed: any;
            try { parsed = JSON.parse(text); } catch { parsed = null; }
            const c = parsed?.choices?.[0]?.message?.content || null;
            return { content: c, status: res.status };
        }

        // Multi-provider fallback chain: Groq (primary) → Gemini → OpenRouter
        let content: string | null = null;
        const allErrors: string[] = [];

        // ── Provider 1: Groq (multiple models) ─────────────────────────
        if (env.GROQ_API_KEY) {
            const groqModels = [
                "llama-3.3-70b-versatile",
                "llama-3.1-8b-instant",
                "qwen/qwen3.6-27b",
                "openai/gpt-oss-20b"
            ];
            for (const model of groqModels) {
                const { content: groqContent, status: groqStatus } = await callGroq(model);
                if (groqContent) {
                    content = groqContent;
                    console.log(`Groq (${model}) succeeded for query:`, userMessage.slice(0, 30));
                    break;
                }
                allErrors.push(`Groq/${model} ${groqStatus}`);
            }
        }

        // ── Provider 2: Gemini fallback ────────────────────────────────
        if (!content && env.GEMINI_API_KEY) {
            const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions?key=${env.GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${env.GEMINI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "gemini-3.6-flash",
                        max_tokens: 600,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userMessage }
                        ]
                    })
                }
            );
            const geminiText = await geminiRes.text();
            let geminiParsed: any;
            try { geminiParsed = JSON.parse(geminiText); } catch { geminiParsed = null; }
            content = geminiParsed?.choices?.[0]?.message?.content || null;
            if (content) {
                console.log("Gemini fallback succeeded for query:", userMessage.slice(0, 30));
            } else {
                allErrors.push(`Gemini ${geminiRes.status}: ${geminiText.slice(0, 100)}`);
            }
        }

        // ── Provider 3: OpenRouter fallback ────────────────────────────
        if (!content && env.OPENROUTER_API_KEY) {
            const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`
                },
                body: JSON.stringify({
                    model: "openrouter/free",
                    max_tokens: 600,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage }
                    ]
                })
            });
            const orText = await orRes.text();
            let orParsed: any;
            try { orParsed = JSON.parse(orText); } catch { orParsed = null; }
            content = orParsed?.choices?.[0]?.message?.content || null;
            if (content) {
                console.log("OpenRouter fallback succeeded for query:", userMessage.slice(0, 30));
            } else {
                allErrors.push(`OpenRouter ${orRes.status}: ${orText.slice(0, 100)}`);
            }
        }

        // ── Post-process: strip leaking metadata ───────────────────────
        if (content) {
            content = content
                .replace(/Here's a thinking process:[\s\S]*?(?=\n\n$|\Z)/gis, "")
                .replace(/```[\s\S]*?```/gs, "")
                .replace(/^User Safety:.*$/gim, "")
                .replace(/User Safety:.*$/gim, "")
                .replace(/^Safety:.*$/gim, "")
                .replace(/Safety:.*$/gim, "")
                .replace(/^---\n?$/gm, "")
                // Strip English reasoning intros
                .replace(/^(?:The user is asking|Looking through|I need to check|Let me check|I've checked|According to the rules|So I should|Let me formulate|Actually, re-reading|I should respond|The response should|Wait, re-reading|Analyzing|Reviewing|Checking).*?(?=\n\n|$)/gis, "")
                // Strip thinking artifacts: **bold headers** followed by content blocks
                .replace(/\n\*\*.*?\*\*:\n[\s\S]*?(?=\n\d\.|\n\n|$)/g, "")
                .replace(/\n✅\n?/g, "")
                .replace(/\n\n{3,}/g, "\n\n")
                .trim();
        }

        // ── Strip thinking blocks: capture only the first real answer sentence ──
        // Models sometimes append thinking/validation AFTER the answer.
        // Strategy: find the first answer-like line, take only up to the next thinking artifact.
        if (content) {
            const lines = content.split("\n");
            let answerText = "";
            let capturing = false;
            const thinkingPatterns = [
                /^#{1,3}\s*\*\*\d+\.\s/,
                /^\*\*\d+\.\s+\*\*[^*]+\*\*:/,
                /^\d+\.\s+\*\*[^*]+\*\*:/,
                /^(the user is|looking through|i need to|let me|i've checked|according to|so i should|let me formulate|actually|wait|analyzing|reviewing|checking|constraint check|draft response|check constraints|all constraints met|one minor adjustment|self-correction|final output|note:|language:|context:|summary needed|matches all rules)/i,
                /✅/,
                /^\[.+?\]:/,
            ];
            // Also stop at any line containing thinking keywords mid-content
            const thinkingKeywords = [
                "Constraint Check", "Check Constraints", "Draft Response", "Self-Correction",
                "Final Output Generation", "Language:", "Context:",
                "The user is", "Let me", "I need to", "I've checked", "Actually",
                "Analyzing", "Reviewing", "Checking",
            ];
            const answerPatterns = [
                /^(Iakobi|He is|He has|He works|I am the|I provide|Bonjour|Salut|Je suis|Il est|Il a|I have|My name|I was|I discovered|I developed|I built|I created|Je m'appelle|J'ai |J'aime)/i,
            ];
            for (const line of lines) {
                const t = line.trim();
                if (!t) continue;
                // If we're not yet capturing, skip until we find an answer
                if (!capturing) {
                    if (answerPatterns.some(p => p.test(t))) {
                        capturing = true;
                        answerText = t;
                    }
                    continue;
                }
                // Stop if we hit a thinking artifact (line pattern or mid-content keyword)
                if (thinkingPatterns.some(p => p.test(t))) break;
                if (thinkingKeywords.some(kw => t.includes(kw))) break;
                answerText += " " + t;
            }
            if (answerText) {
                content = answerText.trim();
            }
            // Fallback: inline thinking may leak on same line as answer
            // e.g. "...technologies? 4.  **Check Constraints:** - ..."
            if (content) {
                for (const kw of thinkingKeywords) {
                    const idx = content.indexOf(kw);
                    if (idx > 0) content = content.slice(0, idx).replace(/\s*[.?]\s*$/, "").trim();
                }
            }
        }

        // ── All providers failed ───────────────────────────────────────
        if (!content) {
            console.error("All providers failed. Errors:", allErrors.join(" | "));
            return Response.json(
                {
                    answer:
                        language === "fr"
                            ? "Désolé, l'assistant est temporairement indisponible. Réessayez dans quelques instants."
                            : "Sorry, the assistant is temporarily unavailable. Please try again in a moment.",
                    // internal error logged, no debug in response
                },
                { status: 200, headers: corsHeaders() }
            );
        }

        return Response.json(
            { answer: content },
            { headers: corsHeaders() }
        );


      } catch(error) {

        return Response.json(
          {
            error: String(error)
          },
          {
            status:500,
            headers:corsHeaders()
          }
        );

      }

    }


    return new Response("Not found", {
      status:404
    });

  }
};


function corsHeaders(){

  return {

    "Access-Control-Allow-Origin":"*",

    "Access-Control-Allow-Headers":
      "Content-Type",

    "Content-Type":
      "application/json"

  };

}