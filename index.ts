import englishData from "../data-english.json";
import frenchData from "../data-francais.json";


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


        const systemPrompt = `
Tu es l'assistant IA personnel de Iakobi Iakobashvili.

Tu réponds aux visiteurs de son portfolio.

Utilise uniquement les informations suivantes :

${JSON.stringify(portfolioData)}

Réponds clairement, professionnellement et dans la langue demandée.

Si l'information n'est pas disponible, indique simplement que tu ne disposes pas de cette information.

Réponds uniquement en texte brut.

N'utilise jamais Markdown.
`;


        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`
            },

            body: JSON.stringify({

              model: "openrouter/auto",

              messages: [
                {
                  role: "system",
                  content: systemPrompt
                },
                {
                  role: "user",
                  content: userMessage
                }
              ]

            })
          }
        );


        const result = await response.json();


        return Response.json(
          {
            answer:
              result.choices[0].message.content
          },
          {
            headers: corsHeaders()
          }
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