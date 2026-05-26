// admin-portal/src/app/api/submissions/analyze/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { submission, maxPoints, otherSubmissions = [], isTeam = false } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured on the server.');
        }

        const submissionContent = typeof submission.content === 'string' ? submission.content : JSON.stringify(submission.content);
        const otherContents = otherSubmissions.map(s => typeof s === 'string' ? s : JSON.stringify(s)).slice(0, 10); // Limit to 10 to avoid bloat

        const entity = isTeam ? 'team' : 'student';

        const prompt = `
      You are a STRICT and EXPERT teaching assistant grading a ${entity} submission. You uphold high academic standards.
      Do NOT blindly award maximum points. Deduct points for poor effort, lack of detail, incorrect information, or lack of originality.
      
      Task Max Points: ${maxPoints}
      Submission Type: ${submission.type || 'text'}
      Submission Content: ${submissionContent}
      
      Other ${entity}s' Submissions for this exact same task (for similarity/plagiarism checking):
      ${otherContents.length > 0 ? otherContents.map((c, i) => `[Other ${i + 1}]: ${c}`).join('\n') : 'No other submissions yet.'}
      
      Instructions:
      1. CRITICALLY evaluate the submission.
      2. If it is highly similar or identical to any of the "Other ${entity}s' Submissions", drastically reduce points (e.g. give 0 or 1) and explicitly flag it for plagiarism in the "concerns".
      3. If the submission is too short, low effort, or incorrect, deduct points accordingly.
      4. Provide a JSON response EXACTLY matching this schema without any markdown formatting wrappers:
      {
        "verdict": "Needs reviewer attention" OR "Review before approving" OR "Ready to approve",
        "summary": "A 1-2 sentence summary of the submission",
        "strengths": ["list of 1-3 strengths"],
        "concerns": ["list of 0-3 issues, errors, plagiarism flags, or missing elements"],
        "questions": ["list of 0-2 prompts for the human reviewer to verify"],
        "suggestedPoints": <number between 0 and ${maxPoints}>,
        "suggestedFeedback": "A polite, constructive feedback message to send to the student, mentioning why points were deducted if any"
      }
    `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;

        return NextResponse.json(JSON.parse(aiText));
    } catch (error) {
        console.error('Gemini API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}