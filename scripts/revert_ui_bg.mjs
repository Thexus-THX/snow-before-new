import { readFileSync, writeFileSync } from "fs";

const files = {
  "src/components/game/DialoguePanel.tsx": [
    [/url\(\/assets\/ui\/ui_dialogue_panel_transparent\.png\) center\/100% 100% no-repeat var\(--color-bg-dialogue\)/g, "var(--color-bg-dialogue)"],
  ],
  "src/components/game/HistoryPanel.tsx": [
    [/url\(\/assets\/ui\/ui_history_panel_transparent\.png\) center\/100% 100% no-repeat rgba\(20,17,13,0\.96\)/g, "rgba(20,17,13,0.96)"],
  ],
  "src/components/game/StatusBar.tsx": [
    [/url\(\/assets\/ui\/ui_top_status_bar_transparent\.png\) center\/100% 100% no-repeat #1c1612/g, "#1c1612"],
  ],
  "src/components/scenes/SeasonJournalScene.tsx": [
    [/url\(\/assets\/ui\/ui_season_journal_panel_transparent\.png\) center\/100% 100% no-repeat rgba\(26,22,16,0\.94\)/g, "rgba(26,22,16,0.94)"],
  ],
  "src/components/scenes/HistoricalEventScene.tsx": [
    [/url\(\/assets\/ui\/ui_historical_event_frame_transparent\.png\) center\/100% 100% no-repeat rgba\(26,22,16,0\.92\)/g, "rgba(26,22,16,0.92)"],
  ],
  "src/pages/TitlePage.tsx": [
    [/url\(\/assets\/ui\/ui_button_primary_transparent\.png\) center\/100% 100% no-repeat/g, "rgba(42, 34, 24, 0.55)"],
    [/url\(\/assets\/ui\/ui_button_secondary_transparent\.png\) center\/100% 100% no-repeat/g, "rgba(42, 34, 24, 0.55)"],
    [/border: "none"/g, 'border: "1px solid #5a5040"'],
  ],
  "src/components/game/ChoicePanel.tsx": [
    [/url\(\/assets\/ui\/ui_choice_critical_transparent\.png\) center\/100% 100% no-repeat/g, "var(--color-choice-critical)"],
    [/url\(\/assets\/ui\/ui_choice_normal_transparent\.png\) center\/100% 100% no-repeat/g, "var(--color-choice-bg)"],
    [/url\(\/assets\/ui\/ui_choice_locked_transparent\.png\) center\/100% 100% no-repeat/g, "rgba(30, 25, 18, 0.5)"],
    [/border: "none"/g, 'border: "1px solid var(--color-choice-border)"'],
  ],
};

for (const [file, reps] of Object.entries(files)) {
  let content = readFileSync(file, "utf8");
  for (const [re, replacement] of reps) {
    content = content.replace(re, replacement);
  }
  writeFileSync(file, content);
  console.log(file + " done");
}
