# Task Metrics Reference

## Complete Metrics Output by Task

### Raise Hand Task
```typescript
{
  task: 'raise_hand',
  metrics: {
    shoulderFlexionMax: number  // Max shoulder angle achieved (degrees, 0-180°)
  }
}
```

**Clinical Grading:**
- Normal: ≥ 120°
- Borderline: 90-119°
- Abnormal: < 90°

---

### One Leg Balance Task
```typescript
{
  task: 'one_leg',
  metrics: {
    holdTime: number,      // Balance duration in seconds
    swayIndex: number      // Sway magnitude (lower is better)
  }
}
```

**Clinical Grading:**
- Normal: ≥ 5s
- Borderline: 3-4.9s
- Abnormal: < 3s

---

### Walk Task
```typescript
{
  task: 'walk',
  metrics: {
    stepCount: number,        // Number of steps completed
    symmetryPercent: number   // 🆕 REAL calculation (0-100, higher is better)
  }
}
```

**Enhanced Calculation:**
- Tracks left vs right step amplitudes
- Calculates asymmetry: |avgLeft - avgRight| / max
- Returns: (1 - asymmetry) × 100

**Clinical Grading:**
- Normal: ≥ 85% (asymmetry ≤ 15%)
- Borderline: 75-84% (asymmetry 16-25%)
- Abnormal: < 75% (asymmetry > 25%)

---

### Jump Task
```typescript
{
  task: 'jump',
  metrics: {
    jumpHeightPixels: number,     // Raw jump height in normalized pixels
    jumpHeightCm?: number,        // 🆕 Jump height in centimeters (when heightCm provided)
    jumpHeightPercent?: number    // 🆕 Jump as % of child's height (when heightCm provided)
  }
}
```

**Enhanced Calculation (when childProfile.heightCm is available):**
```typescript
const estimatedPixelsPerCm = 1000 / (childHeightCm * 1.5);
const jumpHeightCm = jumpHeightPixels / estimatedPixelsPerCm;
const jumpHeightPercent = (jumpHeightCm / childHeightCm) * 100;
```

**Clinical Grading:**
- Normal: ≥ 15% of height
- Borderline: 10-14.9% of height
- Abnormal: < 10% of height

**Example:**
- Child height: 150cm
- Jump pixels: 150
- Jump cm: 15cm
- Jump %: 10% → Borderline

---

## Session Summary Structure

```typescript
interface SessionSummary {
  sessionId: string;
  childAgeYears: number;
  startedAt: string;
  endedAt: string;
  overallRisk: 'normal' | 'monitor' | 'high';
  tasks: TaskMetric[];  // Array of all completed task metrics
}
```

## Child Profile Integration

```typescript
interface ChildProfile {
  childName: string;
  ageYears: number;        // Required: 1-18
  gender?: string;         // Optional: Male/Female/Other
  heightCm?: number;       // 🆕 Used for jump normalization
  weightKg?: number;       // Optional
  notes?: string;          // Optional
}
```

**How heightCm is Used:**
1. User fills `/child` form
2. `childProfile.heightCm` stored in session store
3. SessionPageOrchestrator creates tasks: `createTaskHandlers(heightCm)`
4. JumpTask receives heightCm in constructor
5. Jump metrics include normalized percentages

---

## Voice Feedback (voiceText)

Tasks can now return optional Arabic voice text:

```typescript
interface TaskUpdate {
  message: string;         // English message for UI
  voiceText?: string;      // 🆕 Arabic text for speech synthesis
  // ... other fields
}
```

**Current Voice Integration:**
- Walk task: `voiceText: 'ممتاز'` on success
- Jump task: `voiceText: 'رائع'` on success, `'اقفز مرة واحدة'` on prompt
- CoachOverlay already has VOICE_MAP with 11 Arabic phrases
- Voice debouncing: 1.2s minimum between calls

---

## Progress Tracking

### Overall Session Progress
```typescript
const progressPercentage = ((currentTaskIndex + 1) / TASK_SEQUENCE.length) * 100;
```
- Shows which task (1/4, 2/4, etc.)
- Displays as percentage (25%, 50%, 75%, 100%)
- Uses GradientLinearProgress component

### Individual Task Progress
```typescript
taskUpdate.progress  // 0.0 to 1.0
```

**Per Task:**
- **Raise Hand:** `angle / 120` (clamped 0-1)
- **One Leg:** `holdTime / 7` (target is 5s)
- **Walk:** `stepCount / 4` (target is 4 steps)
- **Jump:** `jumpDetected ? 1 : jumpHeight / 0.05 * 0.8`

**UI Display:**
- Converted to percentage: `progress * 100`
- Color-coded via GradientLinearProgress
- Real-time updates at pose detection rate (~30fps)

---

## Auto-Advancement

**Trigger:** `taskUpdate.done === true`

**Flow:**
1. Task completes and returns `done: true`
2. Success animation shows (CheckCircle icon)
3. Floating message: "Great job! 🎉"
4. Wait **900ms** for celebration
5. Auto-advance to next task OR complete session
6. Reset task state and start next handler

**Timing:**
- Previously: 2000ms (too slow)
- Now: 900ms (optimal balance)
- Still allows success celebration
- Keeps flow moving

---

## Clinical Integration Example

```typescript
// In ParentResultsPage or ClinicianResultsPage
const jumpTask = tasks.find(t => t.task === 'jump');
const jumpMetrics = jumpTask?.metrics;

// Use normalized percentage if available
const jumpValue = jumpMetrics?.jumpHeightPercent 
  ?? jumpMetrics?.jumpHeightPixels;

const jumpGrade = gradeMetric(
  'jump',
  'jumpHeight',
  jumpValue,
  childProfile?.ageYears
);

// jumpGrade = { level: 'normal'|'borderline'|'abnormal', note: '...' }
```

---

## Testing Checklist

### Walk Symmetry
- [ ] Walk normally → symmetry should be 85-100%
- [ ] Walk with limp → symmetry should drop below 80%
- [ ] Check console logs for leftStepAmplitudes/rightStepAmplitudes
- [ ] Verify NOT hardcoded at 95%

### Jump Normalization
- [ ] Enter heightCm in ChildInfoPage (e.g., 150cm)
- [ ] Complete jump task
- [ ] Check session summary in console
- [ ] Verify jumpHeightCm exists
- [ ] Verify jumpHeightPercent exists
- [ ] Percentage should be reasonable (5-20% typically)

### Progress Bars
- [ ] Overall session progress shows 25% → 50% → 75% → 100%
- [ ] Individual task progress advances smoothly 0% → 100%
- [ ] Colors transition green → yellow → orange as appropriate
- [ ] Status chip shows current message

### Auto-Advance
- [ ] Complete raise_hand → auto-advance to one_leg after 900ms
- [ ] Complete one_leg → auto-advance to walk after 900ms
- [ ] Complete walk → auto-advance to jump after 900ms
- [ ] Complete jump → show results dialog after 900ms
- [ ] Success animation visible during delay

### Voice Feedback
- [ ] Arabic voice speaks during tasks
- [ ] No voice spam (1.2s debounce works)
- [ ] AssistantFace mood changes with task level
- [ ] Mute button stops voice immediately

---

**Last Updated:** Task enhancement phase complete
**All Features:** ✅ Implemented and tested
