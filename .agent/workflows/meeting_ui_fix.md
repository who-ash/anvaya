# Meeting UI Improvement Plan

## Goals

1. Fix Meeting Room background colors in dark/light mode (no white in dark mode).
2. Fix Control Bar: Center it, float it, and ensure it doesn't take full width with a background.
3. Fix "Full Screen" issue: Ensure the meeting room fills the available dashboard space correctly without overlapping other UI.
4. Fix Device Selection: Ensure dialog is wide enough, text doesn't overflow, and it looks premium.
5. Fix Chat Button: Ensure it shows as "active" (colored) when the chat sidebar is open.
6. Remove "Collapsible" elements that are cluttering the view.

## Steps

1. **Update `src/app/globals.css`**:
    - Ensure `[data-lk-theme="default"]` inherits from our variables accurately.
    - Force backgrounds to match our theme even for LiveKit internal elements.
2. **Update `src/app/dashboard/meet/[roomId]/page.tsx`**:
    - Adjust `RoomPage` container to be `flex-1` and properly contained.
    - Refine `CustomMeetingLayout`:
        - Center the control bar pill.
        - Add `chat-open` state for button highlighting.
        - Remove any hardcoded HSL colors.
        - Enhance the device selection menu styles.
        - Fix the video grid to expand appropriately.
