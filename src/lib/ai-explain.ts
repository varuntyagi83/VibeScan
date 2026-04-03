import { openai } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

interface FindingInput {
  id: string;
  title: string;
  severity: string;
  category: string;
  description: string;
  codeSnippet: string | null;
  ruleId: string;
}

interface AIAnalysis {
  explanation: string;
  attackVector: string;
  fixedCode: string;
  aiToolContext: string;
}

const SYSTEM_PROMPT = `You are a senior application security engineer reviewing AI-generated code for vulnerabilities.
Given a code snippet and a detected vulnerability, respond with a JSON object containing exactly these four fields:
- explanation: Plain-English explanation of why this is dangerous (2-3 sentences, specific to the code shown)
- attackVector: How an attacker would actually exploit this in practice (1-2 sentences, concrete)
- fixedCode: A corrected code snippet that fixes the issue (show only the relevant lines, no markdown fences)
- aiToolContext: Which AI coding tools commonly produce this exact pattern and why (1 sentence)

Respond with valid JSON only. No markdown, no explanation outside the JSON.`;

async function analyzeOneFinding(finding: FindingInput): Promise<AIAnalysis | null> {
  try {
    const userMessage = `Vulnerability: ${finding.title}
Severity: ${finding.severity}
Category: ${finding.category}
Rule: ${finding.ruleId}

Code snippet:
${finding.codeSnippet ?? "(no snippet available)"}

Background: ${finding.description}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 600,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;

    return JSON.parse(raw) as AIAnalysis;
  } catch {
    return null;
  }
}

export async function enrichFindingsWithAI(
  scanId: string,
  limit: number = Infinity
): Promise<number> {
  // Only analyse CRITICAL and HIGH findings that haven't been explained yet
  const findings = await prisma.finding.findMany({
    where: {
      scanId,
      severity: { in: ["CRITICAL", "HIGH"] },
      aiExplanation: null,
      falsePositive: false,
    },
    take: limit,
    orderBy: { severity: "asc" }, // CRITICAL first
  });

  if (findings.length === 0) return 0;

  // Process in batches of 5 (parallel within batch, sequential between batches)
  const BATCH_SIZE = 5;
  let enriched = 0;

  for (let i = 0; i < findings.length; i += BATCH_SIZE) {
    const batch = findings.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map((f) => analyzeOneFinding(f))
    );

    const updates = batch
      .map((f, idx) => ({ finding: f, analysis: results[idx] }))
      .filter(({ analysis }) => analysis !== null);

    await Promise.all(
      updates.map(({ finding, analysis }) =>
        prisma.finding.update({
          where: { id: finding.id },
          data: {
            aiExplanation: `${analysis!.explanation}\n\nAttack vector: ${analysis!.attackVector}\n\n${analysis!.aiToolContext}`,
            fixSuggestion: analysis!.fixedCode || finding.fixSuggestion,
          },
        })
      )
    );

    enriched += updates.length;
  }

  return enriched;
}
