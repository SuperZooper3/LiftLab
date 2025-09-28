# LiftLab – Expected Behaviors & Manual Test Guide

> Use this document to verify the MVP without automated testing. Each section lists **behaviors** the application must exhibit and a **manual test procedure** to confirm it.

---

## 1 · Application Boot

| ID | Behavior | Manual Test |
|----|----------|-------------|
| B-1.1 | The app loads in the browser at `http://localhost:5173` without console errors. | 1. Run `pnpm dev`. 2. Open the URL. 3. Observe browser console. ✅ No red error logs. |
| B-1.2 | The page title reads “LiftLab 🎢”. | Check browser tab title. ✅ Title matches. |

---

## 2 · Configuration Panel

| ID | Behavior | Manual Test |
|----|----------|-------------|
| B-2.1 | Floors input accepts integers **3–60** only. | Enter `2` → field shows error / reverts. Enter `61` → same. Enter `10` → accepted. |
| B-2.2 | Elevators input accepts integers **1–8** only. | Similar test as above. |
| B-2.3 | Speed slider ranges **0.25× – 4×**. | Drag slider to min/max; labels update accordingly. |
| B-2.4 | “Start” button disabled when config invalid. | Set floors to `0`. Observe Start disabled. |
| B-2.5 | Clicking “Reset” returns all inputs to defaults (e.g., 10 floors / 3 elevators / 1×). | Modify inputs, press Reset, verify defaults. |

---

## 3 · Simulation Controls

| ID | Behavior | Manual Test |
|----|----------|-------------|
| B-3.1 | Pressing “Start” initializes simulation with given config and disables config inputs. | Start sim; inputs become read-only. |
| B-3.2 | Pressing “Pause” freezes elevator motion and passenger spawning; button toggles to “Resume”. | Observe elevator stop; resume restores movement. |
| B-3.3 | Pressing “Reset” stops simulation, clears passengers, resets elevators to floor 0, and re-enables config inputs. | Verify all state cleared. |

---

## 4 · Elevator Visualization

| ID | Behavior | Manual Test |
|----|----------|-------------|
| B-4.1 | Each elevator shaft rendered as a gray rectangle spanning building height. | Visual check. |
| B-4.2 | Elevator cars move smoothly between floors proportional to speed slider. | Toggle speeds and observe animation rate. |
| B-4.3 | Elevator doors visually indicate open vs closed (e.g., color change or outline). | During pickups, door state changes visible. |

---

## 5 · Passenger Behavior

| ID | Behavior | Manual Test |
|----|----------|-------------|
| B-5.1 | Passengers spawn at random start floors (uniform distribution). | Observe dot appearance across floors over time. |
| B-5.2 | Passenger dot disappears from hallway when entering elevator (doors open). | Verify dot removed once boarded. |
| B-5.3 | Passenger dot disappears from car when dropped off at destination floor. | Verify dot removed at arrival. |

---

## 6 · Algorithm Selection

| ID | Behavior | Manual Test |
|----|----------|-------------|
| B-6.1 | Dropdown lists available algorithms (`Greedy` at MVP). | Open dropdown, Greedy present. |
| B-6.2 | Changing algorithm while simulation stopped updates kernel for next run. | Select different algorithm (later), start simulation, observe behavior difference. |

---

## 7 · Metrics Overlay

| ID | Behavior | Manual Test |
|----|----------|-------------|
| B-7.1 | Overlay displays **Average Wait Time** and **Average Travel Time** updating every second. | Observe numbers change while sim running. |
| B-7.2 | At simulation end, modal shows summary stats with same metrics plus total passengers served. | Let sim finish; modal appears. |
| B-7.3 | Closing modal returns to idle state ready for new run. | Click Close; UI reset. |

---

## 8 · Error Handling & Edge Cases

| ID | Behavior | Manual Test |
|----|----------|-------------|
| B-8.1 | Entering invalid config shows inline error message next to field. | Try 0 elevators. |
| B-8.2 | Simulation prevents elevator from moving outside top/bottom floors. | Monitor debug logs if enabled; no illegal moves. |
| B-8.3 | Browser tab visibility change (switch tabs) does not crash simulation; motion may pause if requestAnimationFrame throttles. | Switch tabs for 5 s, return; app still responsive. |

---

### How to Use This Guide
1. After implementing each milestone from `todo.md`, walk through the relevant behavior IDs.  
2. Check `✅` boxes in this file (or in your issue tracker) as behaviors are confirmed.  
3. Update behaviors as new features are added (e.g., Advanced Algorithms section).

---

> This document replaces automated tests for the MVP. Keep it updated to ensure consistent functionality as the project evolves.
