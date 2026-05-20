'use client';

import { useMemo, useState } from 'react';
import { analyzeSubmission } from '@/lib/submissionAssistant';
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
  const analysis = useMemo(
    () => analyzeSubmission(submission, maxPoints),
    [submission, maxPoints]
  );

  return (
    <div className={styles.assistant}>
      <button type="button" className={styles.toggle} onClick={() => setOpen(value => !value)}>
        <AssistantIcon />
        <span>AI review assistant</span>
        <span className={styles.verdict}>{analysis.verdict}</span>
      </button>

      {open && (
        <div className={styles.panel}>
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
              {analysis.strengths.length > 0 ? (
                <ul>
                  {analysis.strengths.map(item => <li key={item}>{item}</li>)}
                </ul>
              ) : (
                <p className={styles.muted}>No strong signals found automatically.</p>
              )}
            </div>
            <div>
              <span className={styles.label}>Check Carefully</span>
              {analysis.concerns.length > 0 ? (
                <ul>
                  {analysis.concerns.map(item => <li key={item}>{item}</li>)}
                </ul>
              ) : (
                <p className={styles.muted}>No obvious issues detected.</p>
              )}
            </div>
          </div>

          {analysis.questions.length > 0 && (
            <div className={styles.questions}>
              <span className={styles.label}>Reviewer prompts</span>
              <ul>
                {analysis.questions.map(item => <li key={item}>{item}</li>)}
              </ul>
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
        </div>
      )}
    </div>
  );
}
