# Store Health Card - Clickable Areas Documentation

## Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│                  STORE HEALTH CARD                      │
│                                                         │
│  ┌──────────────┐              ┌──────────────────┐   │
│  │   LEFT SIDE  │              │   RIGHT SIDE     │   │
│  │    (Label)   │              │ (Pie Chart Area) │   │
│  │              │              │                  │   │
│  │   STORE      │              │     ╱─╲          │   │
│  │   HEALTH     │              │    │ ○ │  • 3   │   │
│  │              │              │     ╲─╱   • 10  │   │
│  │              │              │           • 0   │   │
│  │              │              │                  │   │
│  │ [CLICKABLE]  │              │  [CLICKABLE]     │   │
│  └──────────────┘              └──────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Click Behavior

### LEFT SIDE - "STORE HEALTH" Label
**Action:** Opens **Health Breakdown Modal**
- Shows month-by-month trends
- Displays category distribution over time
- Historical performance analysis

**Code Location:**
```typescript
onLabelClick: () => setShowHealthBreakdown(true)
```

**Implementation:**
- Click handler on label `<div>` in `NowBarMobile.tsx`
- Uses `stopPropagation()` to prevent card tap
- Only triggers when `pill.id === 'store-health'`

---

### RIGHT SIDE - Pie Chart & Numbers
**Action:** Opens **Training Detail Modal** filtered by category
- Click pie segment → Filter by that health category
- Click number → Filter by that health category

**Categories:**
1. 🟢 **Perfect Shot** (81-100%) → Shows stores in this range
2. 🟡 **Brewing** (56-80%) → Shows stores in this range
3. 🔴 **Needs Attention** (0-55%) → Shows stores in this range

**Code Location:**
```typescript
// Pie segment clicks
onClick={(e) => {
  e.stopPropagation();
  setTrainingDetailFilter({ type: 'scoreRange', value: '0-55', title: 'Needs Attention' });
  setShowTrainingDetail(true);
}}

// Legend number clicks
onClick={(e) => {
  e.stopPropagation();
  // ... same filtering logic
}}
```

**Implementation:**
- Each pie `<path>` element has its own click handler
- Each legend item (colored dot + number) has click handler
- All use `stopPropagation()` on both `onClick` and `onPointerDown`
- Container div also has `stopPropagation()` to prevent bubbling

---

## Event Propagation Prevention

### Why `stopPropagation()` is Critical

The card uses Framer Motion's `onTap` event:
```typescript
<motion.div onTap={() => isTop && handleTap(pill)}>
```

Without `stopPropagation()`, clicks on the pie chart would:
1. Trigger the pie segment click ✅
2. Bubble up to the card's `onTap` ❌
3. Try to call `pill.onClick()` (which would open Health Breakdown)
4. Result: **Both modals open!** ❌❌

### Solution Layers

**Layer 1 - Container Level:**
```typescript
<div 
  onClick={(e) => e.stopPropagation()}
  onPointerDown={(e) => e.stopPropagation()}
>
```

**Layer 2 - SVG Level:**
```typescript
<svg 
  onClick={(e) => e.stopPropagation()}
  onPointerDown={(e) => e.stopPropagation()}
>
```

**Layer 3 - Interactive Elements:**
```typescript
// Pie segments
<path onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} />

// Legend items
<div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} />
```

---

## User Experience

### Desktop/Tablet
- Hovering over numbers shows opacity change (visual feedback)
- Cursor changes to pointer on interactive elements
- Clear visual separation between label and chart

### Mobile
- Tap label (left) → Health Breakdown
- Tap pie slice (right) → Category filter
- Tap number (right) → Category filter
- No conflicting actions
- Haptic feedback on successful tap

---

## Testing the Fix

### Before Fix ❌
1. Tap green pie slice
2. Training Detail Modal opens (filtered) ✅
3. Health Breakdown Modal ALSO opens ❌
4. Two modals stacked = confusing UX

### After Fix ✅
1. Tap "STORE HEALTH" label
2. Health Breakdown Modal opens ✅
3. Only one modal = clear UX

1. Tap green pie slice
2. Training Detail Modal opens (filtered) ✅
3. Health Breakdown does NOT open ✅
4. Only one modal = clear UX

---

## Code Files Modified

1. **`components/Dashboard.tsx`**
   - Added `stopPropagation()` to pie chart container
   - Added `stopPropagation()` to SVG element
   - Added `stopPropagation()` to all pie segments
   - Added `stopPropagation()` to all legend items
   - Added documentation comments

2. **`components/NowBarMobile.tsx`**
   - Added `onLabelClick` to Pill interface
   - Made label clickable for Store Health
   - Label click uses `stopPropagation()`

---

## Maintenance Notes

If you need to adjust clickable areas:

1. **Make label area bigger:** Increase padding on the label `<div>` in `NowBarMobile.tsx`
2. **Make pie chart bigger:** Increase SVG width/height in `Dashboard.tsx`
3. **Add more click zones:** Follow the pattern: add click handler + `stopPropagation()`

**Critical Rule:** Always use both `onClick` AND `onPointerDown` with `stopPropagation()` to prevent Framer Motion tap detection.
