// admin-portal/src/app/api/submissions/analyze/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { submission, maxPoints } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured on the server.');
        }

        const prompt = `
      You are an expert teaching assistant grading a student submission.
      Task Max Points: ${maxPoints}
      Submission Type: ${submission.type || 'text'}
      Submission Content: ${typeof submission.content === 'string' ? submission.content : JSON.stringify(submission.content)}
      
      Analyze the submission and provide a JSON response EXACTLY matching this schema:
      {
        "verdict": "Needs reviewer attention" OR "Review before approving" OR "Ready to approve",
        "summary": "A 1-2 sentence summary of the submission",
        "strengths": ["list of 1-3 strengths"],
        "concerns": ["list of 0-3 issues, errors, or missing elements"],
        "questions": ["list of 0-2 prompts for the human reviewer to verify"],
        "suggestedPoints": <number between 0 and ${maxPoints}>,
        "suggestedFeedback": "A polite, constructive feedback message to send to the student"
      }
    `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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