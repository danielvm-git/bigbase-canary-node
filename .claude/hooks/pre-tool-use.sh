#!/usr/bin/env bash
# guard-git pre-tool-use hook (bigpowers) — blocks destructive/undisciplined git ops
# from Claude Code Bash tool calls. Mode defaults to "claude" (stderr + exit 2 on block).

set -euo pipefail

MODE="${GIT_GUARDRAILS_MODE:-claude}"
INPUT="$(cat)"
CMD="$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"

block() {
  local msg="$1"
  if [ "$MODE" = "gemini" ]; then
    printf '{"decision":"block","reason":%s}\n' "$(printf '%s' "$msg" | jq -Rs .)"
  else
    echo "guard-git: $msg" >&2
  fi
  exit 2
}

[ -z "$CMD" ] && exit 0

# --- Safety: destructive ops ---
if printf '%s' "$CMD" | grep -qE '(^|[[:space:]])git[[:space:]]+push[[:space:]]+.*--force([[:space:]]|$)'; then
  block "git push --force is blocked. Ask the user to run it themselves if truly needed."
fi
if printf '%s' "$CMD" | grep -qE '(^|[[:space:]])git[[:space:]]+reset[[:space:]]+--hard'; then
  block "git reset --hard is blocked. Stash or commit first."
fi
if printf '%s' "$CMD" | grep -qE '(^|[[:space:]])git[[:space:]]+clean[[:space:]]+.*-f'; then
  block "git clean -f is blocked."
fi
if printf '%s' "$CMD" | grep -qE '(^|[[:space:]])git[[:space:]]+branch[[:space:]]+-D'; then
  block "git branch -D is blocked. Use -d, or ask the user to force-delete."
fi
if printf '%s' "$CMD" | grep -qE '(^|[[:space:]])git[[:space:]]+(checkout|restore)[[:space:]]+\.([[:space:]]|$)'; then
  block "git checkout/restore . is blocked (discards uncommitted work)."
fi

# --- Discipline: no direct commits/pushes to main/master ---
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
if printf '%s' "$CMD" | grep -qE '(^|[[:space:]])git[[:space:]]+commit'; then
  if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    if [ "${GIT_BIGPOWERS_LAND:-0}" != "1" ]; then
      block "Direct commit on $CURRENT_BRANCH blocked. Use kickoff-branch + land-branch.sh."
    fi
  fi
  # --- Standardization: Conventional Commits on -m messages ---
  MSG="$(printf '%s' "$CMD" | grep -oE -- "-m[[:space:]]+['\"][^'\"]*['\"]" | head -1 | sed -E "s/^-m[[:space:]]+['\"]//; s/['\"]$//")"
  if [ -n "$MSG" ]; then
    if ! printf '%s' "$MSG" | grep -qE '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?: '; then
      block "Commit message does not follow Conventional Commits: $MSG"
    fi
    if printf '%s' "$MSG" | grep -qiE 'co-authored-by:'; then
      block "Co-Authored-By trailer blocked — commits must not attribute AI agents."
    fi
  fi
fi
if printf '%s' "$CMD" | grep -qE '(^|[[:space:]])git[[:space:]]+push([[:space:]]|$)'; then
  if printf '%s' "$CMD" | grep -qE '(main|master)([[:space:]]|$)'; then
    if [ "${GIT_BIGPOWERS_LAND:-0}" != "1" ]; then
      block "Direct push to main/master blocked outside land-branch.sh."
    fi
  fi
fi

# --- Secrets: block obvious secret patterns in the command itself ---
if printf '%s' "$CMD" | grep -qE 'sk-[A-Za-z0-9]{16,}|gh[po]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{12,}|xoxb-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----'; then
  block "Command appears to contain a secret literal — blocked."
fi

exit 0
