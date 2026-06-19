# UI布局系统（CodeBuddy）

## 1. GameHUD（主游戏界面）

```ts
<GameHUD>
  <TopStatusBar />
  <DialoguePanel />
  <ChoiceList />
</GameHUD>
```

---

## 2. Dialogue Scene（对话场景）

```ts
<DialogueUI>
  <TopStatusBar />
  <DialoguePanel />
  <ChoiceList />
</DialogueUI>
```

---

## 3. Archive Scene（档案系统核心）

```ts
<ArchiveUI>
  <HistoryPanel />
  <LetterPaper />
  <EventFrame />
</ArchiveUI>
```

---

## 4. Season Journal（季节日志）

```ts
<SeasonJournalUI>
  <SeasonPanel />
</SeasonJournalUI>
```

---

## 5. Journey Review（旅程回顾）

```ts
<JourneyUI>
  <JourneyMap />
  <DocumentPins />
</JourneyUI>
```

---

## 6. UI切换规则

- Dialogue Scene → 玩家对话/选择
- Archive Scene → 历史资料阅读
- Journal Scene → 情绪/季节记录
- Journey Scene → 路线与回忆复盘

---

## 7. 核心原则

UI不是页面切换，而是“档案系统状态切换”

所有UI必须保持：
- 1930s历史档案风格
- 纸质 + 印章 + 文件结构
- 非现代界面逻辑
