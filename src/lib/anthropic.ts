import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";

const client = new Anthropic();

export async function analyzeJobMatch(
  jobId: string,
  resumeText?: string
): Promise<{ confidenceScore: number; summary: string; skills: string[] }> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found");

  const profile = await prisma.userProfile.findFirst();

  const systemPrompt = `You are a career advisor AI. Analyze job postings and evaluate candidate fit. Be direct and honest about match quality. Return valid JSON only.`;

  const userPrompt = `Analyze this job and evaluate candidate fit.

JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Type: ${job.jobType || "Not specified"}
Salary: ${job.salary || "Not listed"}
Description: ${job.description}

${profile ? `CANDIDATE:
Name: ${profile.name}
Skills: ${profile.skills}
Experience: ${profile.experience}
${profile.resumeText ? `Resume: ${profile.resumeText}` : ""}` : resumeText ? `RESUME: ${resumeText}` : "No candidate profile available - provide a general analysis."}

Return JSON with:
{
  "confidenceScore": <0-100 match score>,
  "summary": "<2-3 sentence summary of the role and why it may or may not be a good fit>",
  "skills": ["<skill1>", "<skill2>", "...extracted required skills"]
}`;

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            confidenceScore: { type: "number" },
            summary: { type: "string" },
            skills: { type: "array", items: { type: "string" } },
          },
          required: ["confidenceScore", "summary", "skills"],
          additionalProperties: false,
        },
      },
    },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from AI");
  }

  const result = JSON.parse(textBlock.text);

  await prisma.job.update({
    where: { id: jobId },
    data: {
      confidenceScore: result.confidenceScore,
      summary: result.summary,
      skills: JSON.stringify(result.skills),
    },
  });

  return result;
}

export async function generateCoverLetter(
  jobId: string,
  tone: "professional" | "enthusiastic" | "technical" = "professional"
): Promise<string> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { coverLetters: true },
  });
  if (!job) throw new Error("Job not found");

  const profile = await prisma.userProfile.findFirst();

  const toneInstructions: Record<string, string> = {
    professional:
      "Write in a polished, professional tone. Focus on qualifications and experience alignment. Be confident but not arrogant.",
    enthusiastic:
      "Write with genuine enthusiasm and energy. Show passion for the role and company while remaining professional. Let personality shine through.",
    technical:
      "Lead with technical expertise and specific accomplishments. Use industry terminology. Focus on measurable impact and technical depth.",
  };

  const systemPrompt = `You are an expert career coach who writes compelling, personalized cover letters that get interviews. Never use generic phrases like "I am writing to express my interest" or "I believe I would be a great fit." Every sentence should be specific and impactful. ${toneInstructions[tone]}`;

  const userPrompt = `Write a cover letter for this position:

JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description}
${job.skills ? `Required Skills: ${job.skills}` : ""}

${profile ? `CANDIDATE:
Name: ${profile.name}
Skills: ${profile.skills}
Experience: ${profile.experience}
${profile.resumeText ? `Resume Summary: ${profile.resumeText}` : ""}` : "Write a template cover letter with placeholders [YOUR NAME], [YOUR EXPERIENCE], etc."}

Requirements:
- 3-4 paragraphs maximum
- Address the specific job requirements
- Highlight relevant experience and skills
- Include a strong opening that grabs attention
- End with a confident call to action
- Do NOT include the date or addresses - just the body text starting with "Dear Hiring Manager,"`;

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from AI");
  }

  const coverLetterContent = textBlock.text;
  const version = job.coverLetters.length + 1;

  await prisma.coverLetter.create({
    data: {
      jobId,
      content: coverLetterContent,
      tone,
      version,
    },
  });

  return coverLetterContent;
}

export async function analyzeMultipleJobs(jobIds: string[]): Promise<void> {
  for (const jobId of jobIds) {
    try {
      await analyzeJobMatch(jobId);
      // Small delay between API calls
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to analyze job ${jobId}:`, error);
    }
  }
}
