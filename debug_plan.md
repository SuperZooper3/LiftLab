# LiftLab Debugging Plan 🕵️‍♂️

## Issue: Passengers appearing and disappearing immediately

### Test 1: React State Isolation
**Goal**: Check if React state updates are working correctly

**Steps**:
1. Start simulation
2. Look at "Waiting Now" counter in UI
3. Check console for initialization logs

**Expected Results**:
- "Waiting Now" should show `3` initially
- Console should show: `🧪 Adding test passengers: [...]`
- Console should show: `✅ Simulation initialized with passengers: 3`

**If FAIL**: React state issue
**If PASS**: Go to Test 2

---

### Test 2: Simulation Loop Check
**Goal**: See if passengers survive the first simulation tick

**Steps**:
1. Start simulation and immediately pause (within 1 second)
2. Check "Waiting Now" counter
3. Look for these console logs:
   - `🔄 Start of tick passengers: [test-1, test-2, test-3]`
   - `📊 End of tick - waiting passengers: 3`

**Expected Results**:
- "Waiting Now" should still show `3` after pause
- Should see passenger IDs in start/end tick logs

**If FAIL**: Passengers being removed in simulation loop
**If PASS**: Go to Test 3

---

### Test 3: Elevator Interaction Check
**Goal**: See if elevators are incorrectly boarding passengers

**Steps**:
1. Start simulation
2. Look for these specific console logs:
   - `🏢 Elevator X on floor Y: {doors: "closed", passengersWaiting: N}`
   - `🚶‍♂️ Elevator X boarded passengers: [...]`
   - `❌ Removed N boarded passengers from waiting list`

**Expected Results**:
- Should NOT see boarding logs unless doors are "open"
- Should NOT see removal logs unless passengers actually boarded

**If FAIL**: Incorrect boarding logic
**If PASS**: Go to Test 4

---

### Test 4: Canvas Rendering Check  
**Goal**: Check if passengers are in state but not rendering

**Steps**:
1. Start simulation
2. Open browser dev tools → React DevTools
3. Find `BuildingCanvas` component
4. Check `waitingPassengers` prop

**Expected Results**:
- `waitingPassengers` prop should contain 3 passenger objects
- Objects should have `id`, `startFloor`, `destinationFloor`

**If FAIL**: Props not passing correctly
**If PASS**: Canvas rendering issue

---

### Test 5: Disable Simulation Loop
**Goal**: Test passengers without any simulation logic

**Action**: I'll create a version with simulation loop disabled
**Steps**:
1. Start "simulation" (no actual ticking)
2. Check if passengers stay visible
3. Manually test canvas rendering

---

## Quick Reference - What to Report

For each test, please report:
1. ✅ PASS or ❌ FAIL
2. What you see in "Waiting Now" counter
3. Any relevant console logs (copy/paste)
4. How long passengers stay visible (seconds)

## Test Results Template

```
Test 1: ✅ PASS / ❌ FAIL
- Waiting Now counter: ___
- Console logs: ___
- Notes: ___

Test 2: ✅ PASS / ❌ FAIL  
- Waiting Now after pause: ___
- Start tick logs: ___
- End tick logs: ___

Test 3: ✅ PASS / ❌ FAIL
- Boarding logs seen: ___
- Door states observed: ___
- Removal logs: ___

Test 4: ✅ PASS / ❌ FAIL
- waitingPassengers prop: ___
- Passenger objects: ___

Test 5: ✅ PASS / ❌ FAIL
- Passengers stay visible: ___
- Duration: ___
```

Let's start with Test 1! 🚀
