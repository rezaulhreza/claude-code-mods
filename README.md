# Claude Code mods

Four mods for the Claude Code terminal. Each one shows true information about the session, not decoration. Install one, or all four. Each mod is separate.

| Mod | What changes |
| --- | --- |
| **pulse** | The spinner says what Claude does now. The turn line counts the work. The status line shows model, effort, context, limits and cost. |
| **crew** | A pane lists your subagents, each with its own avatar. Press an agent to open it in its own pane and send it a message. |
| **brief** | At a new session, a band shows the project, git state and where your last session in this folder stopped. |
| **ledger** | Every tool call is one line: status, verb, target, result. |

## What it looks like

**pulse**

```
✻ Running php artisan test --filter=PriceCalc… (14s · ↓ 2.1k tokens)
✓ Done in 1m 04s · 9 tools · 3 files changed · +48 −12
opus-5.5 high · context 76k/200k (38%), 124k left · 5h limit 22% · week limit 31% · $0.61
```

**crew** (docked beside the chat in a wide fullscreen terminal)

```
Agents  2 running · 1 done

▄█▀▀█▄  ● Explore  1m 12s
█ ▀▀ █    find PriceCalc callers
▀▄██▄▀    sonnet · 14 · reading app/Jobs/SyncOrders.php

▀█▄▄█▀  ✓ Plan  2m 40s
▄▀██▀▄    design tax rules
          opus · 22 tools · finished
```

One agent's own pane:

```
✓ Search  "PriceCalc" in app/          9 · 6 files
you       Skip tests/. Only app code.  delivered
● Read    app/Listeners/OrderPaid.php  running
╭ Message Explore ─────────────────────────────╮
```

**brief**

```
shop  ~/Developer/shop
branch  feat/price-rules · 3 changed · 2 ahead
commit  2h ago  Add tax rules to PriceCalc
last    18h ago  Tests pass. Wire it into checkout next.
```

**ledger**

```
✓ Read    app/Services/PriceCalc.php             212 lines
✓ Edit    app/Services/PriceCalc.php             +14 −3
✗ Bash    php artisan test --filter=PriceCalc    exit 1 · short order floor failed
● Bash    php artisan test --filter=PriceCalc    running
✓ Read 3 files · searched 2 patterns
```

## Requirements

Claude Code with mods (function hooks). These mods were built and tested on Claude Code 2.1.307. The mods API is early access and can change between releases.

## Install

At the prompt of a Claude Code terminal session, install the mods you want:

```
/plugin install pulse --marketplace rezaulhreza/claude-code-mods
/plugin install crew --marketplace rezaulhreza/claude-code-mods
/plugin install brief --marketplace rezaulhreza/claude-code-mods
/plugin install ledger --marketplace rezaulhreza/claude-code-mods
```

The first install asks to add the marketplace: answer `y`, then pick a scope. User scope loads the mod in every session.

From a shell:

```
claude plugin install pulse --marketplace rezaulhreza/claude-code-mods
```

In the desktop app: click + next to the prompt box, then Plugins, Add marketplace with `rezaulhreza/claude-code-mods`, then Add plugin.

## Options

Change options in `/config`. Each option is one row there. The install also shows them.

| Mod | Option | Default | What it does |
| --- | --- | --- | --- |
| pulse | `spinner` | on | Spinner says what Claude does now |
| pulse | `turnLine` | on | Turn line counts tools, files and diff size |
| pulse | `statusLine` | on | Status line with model, effort, context, limits and cost |
| pulse | `contextWarn` | 75 | Adds "compact soon" past this context percentage |
| crew | `accent` | `#D97757` | Colour of running agents and your messages |
| crew | `autoOpen` | `auto` | `auto` opens the pane on the first spawn in a wide fullscreen terminal; `command` opens it only with `/crew` |
| brief | `accent` | `#D97757` | Colour of the project name |
| brief | `showLast` | on | Shows where your last session in this folder stopped |
| ledger | `accent` | `#D97757` | Colour of running rows |
| ledger | `keepDiffs` | on | Keeps the diff under Edit and Write rows; off makes every call one line |

## Commands

- `/crew` opens the agents pane.
- `/crew explore` opens the first agent whose type, task or id matches.
- In an agent's pane, type a message and press Enter. A running agent reads the message at its next step. A finished agent resumes with it. Press `v` for the agent's full transcript.
- `ctrl+x tab` moves the keys into a pane. `Esc` gives them back to the prompt.

## Customise further

Fork the repository and change the code. Good places to start:

- `crew/hooks/avatar.ts`: avatar colours per agent type (`HUES`) and the identicon pattern.
- `*/hooks/describe.ts`: the verbs and summaries for each tool. The file is the same in pulse, crew and ledger, so change all three copies.
- `*/hooks/register.tsx`: the layout of each line, pane and band.

Run a mod from your fork while you edit it:

```
claude --plugin-dir ./crew
```

Check a mod before you share it:

```
claude plugin validate ./crew
claude plugin test ./crew
```

## Privacy

Everything stays on your machine. brief keeps the first line of Claude's last reply for each folder in the plugin's local store, so it can show where you stopped. Turn `showLast` off to hide that line.

## Licence

MIT. See [LICENSE](LICENSE).
