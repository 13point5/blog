"use client";
import { useState } from "react";

export function RewardLab() {
  const [weight, setWeight] = useState(50);
  // Deliberately illustrative scores, not measured model performance.
  const concise = 0.95 * (1 - weight / 100) + 0.4 * weight / 100;
  const thorough = 0.5 * (1 - weight / 100) + 0.9 * weight / 100;
  return <div className="reward-lab"><label htmlFor="reward-weight"><span>Favor brevity</span><span>Favor completeness</span></label><input id="reward-weight" type="range" min="0" max="100" value={weight} aria-label="Completeness weight" aria-valuetext={`${weight} percent completeness`} onChange={e => setWeight(Number(e.target.value))} /><div className="reward-track" aria-hidden="true"><div style={{width: `${weight}%`}} /></div><output htmlFor="reward-weight">Completeness weight: {weight}%<br />Short answer: <strong>{concise.toFixed(2)}</strong> · Detailed answer: <strong>{thorough.toFixed(2)}</strong><br />Preferred by this reward: <strong>{concise > thorough ? 'short answer' : 'detailed answer'}</strong></output><small>A toy calculation with invented scores. Change the reward, change the preference.</small></div>;
}
