# Claude Code Desktop Mascot

A tiny pixel Claude that lives above the prompt in the Claude Code desktop app (the Code tab), with a two-line status beside it.

```
9:42 PM · Sat 3 Oct · Opus 5.5
5h ▰▰▱▱▱ 42% ↻11:10 PM   week ▰▱▱▱▱ 18% ↻Thu   ctx 38%        [mascot]
```

**The mascot** sits on the right, about 90 × 48 px, with no background of its own:

- When Claude starts working, the laptop lid swings open in four steps; when Claude finishes, it swings shut.
- While Claude works, it types on a little laptop, stops for a sip of coffee, and stretches.
- When Claude is idle, the laptop is closed: it looks around, sips coffee, naps (little z's float up), then stretches.
- Click it and it hops, a heart pops up, and its eyes go happy ^ ^. Hover and it glances up.

**The status** on the left:

- The time, the date and the model answering.
- Your 5-hour and weekly usage: a bar, the percent used and when it resets. Green, then amber from 60%, red from 85%.
- How full the context window is: amber from 70%, red from 85%.

The usage figures are the ones Claude Code already has from its last reply, so they show a dash until the first reply of a session. On a narrow window the bars drop out so the line still fits.

## Install

1. Clone this repo somewhere permanent:

   ```bash
   git clone https://github.com/wazrah/ClaudecodedesktopMascot.git ~/code/ClaudecodedesktopMascot
   ```

2. Add the folder's full path to the `env` block of `~/.claude/settings.json`, keeping everything else in the file:

   ```json
   {
     "env": {
       "CLAUDE_CODE_PLUGIN_DIRS": "C:/Users/you/code/ClaudecodedesktopMascot"
     }
   }
   ```

   Several mod folders go in the same value, separated by `;` on Windows or `:` on macOS and Linux.

3. Quit the desktop app fully and open it again.

## Use

- `/mascot` hides or shows it; `/mascot on` and `/mascot off` work too. The choice is remembered across sessions.
- It draws in the desktop app only. In the terminal it draws nothing.

## Privacy and cost

No model calls, no network requests and no files written. It reads the clock and the usage figures Claude Code already holds, and keeps its one setting in Claude Code's plugin storage.

## Develop

```bash
claude plugin validate .
```

```bash
claude plugin test .
```

The art is in `hooks/mascot.ts` (pixel art on a 36 × 19 grid, CSS keyframe loops, SMIL for the click), the band's layout in `hooks/band.tsx`, the formatting in `hooks/info.ts`, and the hooks in `hooks/register.tsx`. The SVG is drawn in a sandboxed frame with no scripts, so every motion is CSS or SMIL. It declares `color-scheme: light dark`, or the desktop app paints the frame white in dark mode.

Claude Code's mod API is in early access and may change between releases.
