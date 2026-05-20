'use client';

import { useState } from 'react';
import styles from './SubmissionAssistantPanel.module.css';

const AssistantIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8.01" y2="16" />
    <line x1="16" y1="16" x2="16.01" y2="16" />
  </svg>
);

export default function SubmissionAssistantPanel({ submission, maxPoints, onUseFeedback, onUsePoints }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    const willOpen = !open;
    setOpen(willOpen);

    if (willOpen && !analysis && !loading) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/submissions/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submission, maxPoints })
        });

        if (!res.ok) throw new Error('Failed to generate AI review');
        const data = await res.json();
        setAnalysis(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.assistant}>
      <button type="button" className={styles.toggle} onClick={handleToggle}>
        <AssistantIcon />
        <span>Gemini AI Review Assistant</span>
        {analysis && <span className={styles.verdict}>{analysis.verdict}</span>}
      </button>

      {open && (
        <div className={styles.panel}>
          {loading ? (
            <p className={styles.muted}>Gemini is analyzing the submission...</p>
          ) : error ? (
            <p className={styles.muted} style={{ color: '#ff4757' }}>{error}</p>
          ) : analysis ? (
            <>
              <div className={styles.summaryRow}>
                <div>
                  <span className={styles.label}>Summary</span>
                  <p>{analysis.summary}</p>
                </div>
                <div className={styles.pointsBox}>
                  <span className={styles.label}>Suggested</span>
                  <strong>{analysis.suggestedPoints}</strong>
                  <span>/ {maxPoints} pts</span>
                </div>
              </div>

              <div className={styles.columns}>
                <div>
                  <span className={styles.label}>Strengths</span>
                  {analysis.strengths?.length > 0 ? (
                    <ul>{analysis.strengths.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  ) : (
                    <p className={styles.muted}>No strong signals found automatically.</p>
                  )}
                </div>
                <div>
                  <span className={styles.label}>Check Carefully</span>
                  {analysis.concerns?.length > 0 ? (
                    <ul>{analysis.concerns.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  ) : (
                    <p className={styles.muted}>No obvious issues detected.</p>
                  )}
                </div>
              </div>

              {analysis.questions?.length > 0 && (
                <div className={styles.questions}>
                  <span className={styles.label}>Reviewer prompts</span>
                  <ul>{analysis.questions.map((item, i) => <li key={i}>{item}</li>)}</ul>
                </div>
              )}

              <div className={styles.actions}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onUseFeedback(analysis.suggestedFeedback)}>
                  Use Feedback
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onUsePoints(analysis.suggestedPoints)}>
                  Use Points
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}