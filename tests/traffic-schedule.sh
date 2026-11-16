#!/bin/zsh
# traffic-schedule.sh — run `node tests/traffic.mjs --weekly` every Wednesday
# on this Mac, so the weekly history fills itself in.
#
#   tests/traffic-schedule.sh install     start the weekly run
#   tests/traffic-schedule.sh uninstall   stop it and remove the schedule
#   tests/traffic-schedule.sh status      is it installed, and what did the last run say
#   tests/traffic-schedule.sh run         run it once now, through the scheduler
#
# Why here and not in GitHub Actions like the site's other schedules: the run
# needs the Google sign-in that lives in ~/.config/neobankbeat/, and what it
# saves (search queries, visit counts) goes to data/traffic/, which is kept out
# of the public repository.
#
# Wednesday, because a week ends on Sunday and Search Console needs about three
# days to settle. A missed Wednesday loses nothing: each run saves every
# finished week that is not on disk yet.
set -e

LABEL=com.neobankbeat.traffic-weekly
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
ROOT="${0:A:h:h}"
LOG="$ROOT/data/traffic/weekly.log"
DOMAIN="gui/$(id -u)"

case "${1:-status}" in
  install)
    NODE="$(command -v node)" || { echo "node is not on the PATH"; exit 1; }
    mkdir -p "$HOME/Library/LaunchAgents" "$ROOT/data/traffic"
    cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-c</string>
    <string>source ~/.zshrc 2>/dev/null; cd "$ROOT" &amp;&amp; date &amp;&amp; "$NODE" tests/traffic.mjs --weekly</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict><key>Weekday</key><integer>3</integer><key>Hour</key><integer>10</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
EOF
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    launchctl bootstrap "$DOMAIN" "$PLIST"
    echo "installed: Wednesdays at 10:00, log at ${LOG#$ROOT/}"
    ;;
  uninstall)
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    rm -f "$PLIST"
    echo "removed"
    ;;
  run)
    launchctl kickstart "$DOMAIN/$LABEL"
    echo "started; see ${LOG#$ROOT/}"
    ;;
  status)
    if launchctl print "$DOMAIN/$LABEL" >/dev/null 2>&1; then echo "installed: Wednesdays at 10:00"; else echo "not installed"; fi
    [ -f "$LOG" ] && { echo "last run:"; tail -n 30 "$LOG"; }
    ;;
  *)
    echo "usage: $0 install | uninstall | status | run"; exit 1
    ;;
esac
