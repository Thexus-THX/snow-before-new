# 《雪落之前》P1B：特殊场景内容接入与数据闭环

> 适用仓库：`https://github.com/Thexus-THX/snow-before-new.git`  
> 工作分支：`develop`  
> 本阶段性质：剧情数据接入 + 运行时验收  
> 前置条件：P1A 统一场景渲染底层已完成  
> 本阶段不开发编辑器，不开发完整音频系统，不重写运行时底层

---

## 0. 开始前必须确认

本阶段统一以 `develop` 为最新开发分支。

开始前执行：

```bash
git fetch origin
git checkout develop
git pull origin develop
git branch --show-current
npm ci
npm run check
```

`git branch --show-current` 必须输出：

```text
develop
```

如果不是 `develop`，立即停止。

必须先阅读：

```text
PROGRESS.md
docs/00_README.md
docs/02_GAME_LOGIC.md
docs/03_STORY_BLUEPRINT.md
docs/04_ART_ASSET_SPEC.md
docs/07_DATA_SCHEMA.md

src/content/game-data.json
src/schemas/types.ts
src/schemas/gameSchema.ts
src/components/scenes/SceneRenderer.tsx
src/components/scenes/LetterScene.tsx
src/components/scenes/HistoricalEventScene.tsx
src/components/scenes/SeasonJournalScene.tsx
src/components/scenes/FreeLayoutScene.tsx
src/components/scenes/EndingScene.tsx
src/engine/sceneHistory.ts
src/app/stores/gameStore.ts
```

当前 P1A 已完成：

```text
standardDialogue: 43 场景
chapterIntro: 1 场景
ending: 2 场景
freeLayout: 2 场景，但 elements 为空，只走安全降级
letter: 0 场景
historicalEvent: 0 场景
seasonJournal: 0 场景
```

P1B 的目标是：**把已经完成的特殊场景组件真正接入剧情数据，形成玩家可见的家书、历史事件、季节札记、创作说明/时间说明自由布局和旅程回顾。**

---

# 1. 本阶段总目标

完成以下数据闭环：

```text
freeLayout 不再只是安全降级
letter 至少有 3 个正式场景
historicalEvent 至少有 1 个正式场景
seasonJournal 至少有 8 个正式场景
ending 两个结局页面保持可达
journeyReview/thanks 页面使用 freeLayout 或合适模板正常显示
```

完成后，玩家从序章到结局时应能看到：

```text
创作说明页
时间说明页
三封主要家书
卢沟桥事变历史事件页
每季结束札记页
两个结局页
旅程回顾页
```

---

# 2. 严格禁止事项

本阶段不要：

- 创建新 Git 分支；
- 切换到 `feat/runtime-foundation-p0` 或其他分支；
- 开发 `/editor` 可视化编辑器；
- 开发完整音频系统；
- 重写 P0/P0.1 的存档、回滚、commitChoice；
- 重写 P1A 的 SceneRenderer 架构；
- 修改 19 次有效选择数量；
- 修改 7 次关键选择数量；
- 修改选择的数值效果；
- 修改结局条件门槛；
- 新增角色；
- 新增主结局；
- 新增需要玩家选择的互动分支；
- 修改已有图片和音频文件；
- 把文字烘焙进图片；
- 为了好看引入大型 UI 框架或动画库。

允许修改 `game-data.json`，但只能用于：

```text
把已有剧情节点改成对应特殊模板
插入不改变分支逻辑的展示型特殊场景
补充 content.letter / historicalEvent / journal / elements 字段
调整 nextSceneId 让展示型场景接入主流程
```

不得改变剧情核心含义、选择后果和结局判断。

---

# 3. 接入策略

## 3.1 不要一次性重写 48 个场景

优先采用“插入展示节点”的方式：

```text
原场景 A
  nextSceneId: B

改为：

原场景 A
  nextSceneId: 新特殊场景 X

新特殊场景 X
  nextSceneId: B
```

这样不破坏原有选择、数值、标记和回滚逻辑。

## 3.2 特殊场景原则

特殊场景通常：

```text
没有 choices
没有 effects
没有 stats 修改
没有 trust 修改
没有 preparation 修改
只有 content + nextSceneId + background + template
```

如果必须带 `autoSavePoint`，只允许使用已有节点语义：

```text
chapterStart
chapterEnd
beforeEnding
```

不要给普通展示页随意加关键存档点。

## 3.3 场景 ID 命名规范

新增场景 ID 使用以下风格：

```text
note_creative_opening
note_time_structure
letter_1936_spring_family
letter_1936_autumn_family
letter_1937_winter_family
event_1937_lugouqiao
journal_day01_spring_1936
journal_day02_summer_1936
journal_day03_autumn_1936
journal_day04_winter_1936
journal_day05_spring_1937
journal_day06_summer_1937
journal_day07_autumn_1937
journal_day08_winter_1937
review_journey
```

如果现有 JSON 已有接近名称，优先沿用现有 ID，不要无意义改名。

---

# 4. FreeLayout 接入

当前有 2 个 `freeLayout` 场景但没有 `elements`，只走安全降级。本阶段要补齐。

## 4.1 创作说明页

目标：玩家开场先看到创作说明，而不是只有标题/普通对白。

建议内容：

```text
本作取材于李强等二十世纪二三十年代留苏先辈的真实经历，并在史料基础上进行了艺术化重构。你将以一名虚构留学生的身份，走过求学、抉择与归途，感受一代青年在时代洪流中的理想、牵挂与担当。

游戏中的人物、事件及时间线为综合创作，不对应单一历史人物。
```

数据要求：

```text
template: freeLayout
background: /assets/backgrounds/bg_creative_note.webp
elements:
  - 档案式标题文字
  - 主体说明文字
  - 小号补充说明
  - 可选档案/纸张/印章图形元素
```

文字必须由网页渲染，不要生成图片文字。

## 4.2 时间说明页

建议内容：

```text
接下来的八个游戏日，并非连续的八天。每一日代表一个季节，也代表留学岁月中的一个重要片段。两度春夏秋冬，将共同构成这段跨越两年的求学旅程。
```

数据要求：

```text
template: freeLayout 或 chapterIntro
background: /assets/backgrounds/bg_time_note_four_seasons.webp
elements:
  - 标题：“两度春夏秋冬”
  - 主体说明文字
  - 小号提示：“点击继续”
```

如果现有 `prologue_time_skip` 已是 `chapterIntro` 且效果正常，不必强行改成 freeLayout；只需保证它不再是空白或安全降级。

---

# 5. Letter 接入

本阶段至少接入 3 封主要家书。

## 5.1 家书一：序章或第一日早期

作用：

```text
建立母亲声音、家乡牵挂和“阿远”称呼。
```

建议接入位置：

```text
序章后半段，或第一日实验室正式开始前
```

字段要求：

```json
{
  "template": "letter",
  "background": "/assets/backgrounds/bg_creative_note.webp 或当前合适背景",
  "content": {
    "letter": {
      "date": "民国二十年冬 / 或一九三一年冬",
      "salutation": "阿远：",
      "pages": [
        "……"
      ],
      "postscript": "……",
      "signature": "母亲 字"
    }
  }
}
```

## 5.2 家书二：1936年秋

作用：

```text
父亲收入减少、妹妹学费、家乡不安，但不写疾病/死亡狗血。
```

建议接入位置：

```text
第三日·秋，邮局/宿舍相关场景之后。
```

建议正文方向：

```text
阿远：
信到时，不知你那里是否已经转冷。家中一切尚可，你不必挂心。你父亲近来账房差事少了些，仍旧每日早出晚归；兰英的学费我们会想办法，她也说等哥哥回来，要让哥哥看看她新写的字。
镇上近来消息杂，米价也起落不定，街口常有人议论北方的事。你在外求学，最要紧是保重身体，把该学的本事学稳。家里盼你有出息，也盼你平安。
母亲 字
```

## 5.3 家书三：1937年冬最终家书

作用：

```text
最终家庭线回收，接在第八日最终方向选择之前。
```

建议接入位置：

```text
第八日冬，家人告别/最终选择之前。
```

建议正文方向：

```text
阿远：
这封信写得慢，落笔几次，又停下。家中仍在设法过日子，你不要只想着亏欠。你父亲说，人在外面学成本事，是为了有一日能用得上；若路难走，也要先护住自己。
兰英托我问你，雪是不是像书上写的那样一夜白尽。她说等你回来，要听你讲火车、工厂和会说话的电波。
你若能归，家门自然等你；你若一时不能，也要把心安放在正处。母亲只愿你记得，家不是要拖住你的地方，是盼你走得稳的地方。
母亲 字
```

### 家书数据要求

每封信：

```text
pages: 1-3 页
paperAsset: /assets/ui/ui_letter_paper.png
historyPlainText: 用于历史面板的纯文本摘要
postscript: 可选
signature: 必填
```

注意：

- 不要超过 LetterScene 当前可显示容量；
- 每页文字不要太长；
- 家书不要写现代口语；
- 不要加入重大疾病、死亡或过度煽情；
- 不要把母亲写得像现代心理咨询；
- 不要产生新的选择或数值。

---

# 6. HistoricalEvent 接入

本阶段接入 1 个历史事件页：卢沟桥事变。

## 6.1 接入位置

建议位置：

```text
第六日·1937夏
消息被无线电/报纸/中国学生多方确认之后
正式路线行动选择之前
```

即逻辑顺序应类似：

```text
消息传来
→ 多方确认
→ 历史事件页
→ 玩家选择第一步行动
```

## 6.2 数据结构

```json
{
  "template": "historicalEvent",
  "background": "/assets/backgrounds/bg_day06_summer_lab_radio.webp",
  "content": {
    "historicalEvent": {
      "date": "1937年7月7日",
      "title": "卢沟桥事变",
      "imageAsset": "/assets/props/prop_newspaper_lugouqiao_1937.png",
      "paragraphs": [
        "1937年7月7日夜，日军在北平西南卢沟桥附近进行军事演习，并借口士兵失踪要求进入宛平城搜查，遭到中国守军拒绝。",
        "随后冲突扩大，卢沟桥事变成为全面抗战爆发的重要标志。消息经由报纸、电报与口耳相传逐渐传至海外，也改变了许多留学生对未来去向的判断。"
      ],
      "gameplayNotice": "此后，归国路线、通信联络与技术资料处理将变得更加紧迫。",
      "sourceNote": "本页为历史背景说明，具体人物与情节为艺术化重构。"
    }
  }
}
```

## 6.3 注意

- 不要写血腥细节；
- 不要使用现代新闻客户端语气；
- 不要把事件页做成策略游戏弹窗；
- 不要加入游戏外百科链接；
- 不要修改第六日关键选择效果；
- 如果现有剧情已有相同内容，优先整合原文，不重复讲两遍。

---

# 7. SeasonJournal 接入

本阶段接入 8 个季节札记，分别位于每一日/每一季结束后。

## 7.1 接入位置

建议在每章主剧情结束、进入下一章之前插入：

```text
Day01 结束 → journal_day01_spring_1936 → Day02 intro
Day02 结束 → journal_day02_summer_1936 → Day03 intro
...
Day08 结束 → journal_day08_winter_1937 → 最终结局或旅程回顾
```

如果现有剧情没有独立 chapterIntro，不强行重构所有章节，只在自然过渡处接入。

## 7.2 内容原则

`visibleSummary` 只显示显性状态：

```text
学识：……
身心状态：……
行动准备：……
```

不要显示：

```text
担当
故土牵挂
人际信任
角色信任数值
归国倾向
留苏倾向
隐藏标记
结局公式
```

`journalText` 使用沈怀远第一人称，长度控制在 80-160 字。

`keepsakes` 1-3项即可。

## 7.3 八季札记建议方向

### Day01 春 1936

```text
journalText:
今日的实验并不平顺。电流、线圈和人的判断一样，都不能只看表面。导师没有多说，但我知道，他看见了我如何处理一次失误。娜佳说，记录里的一个小数点有时比一句豪言更可靠。我想，也许真正的学习，是从承认自己会错开始。

keepsakes:
- 实验记录上的修正痕迹
- 导师短暂的点头
```

### Day02 夏 1936

```text
journalText:
工厂里的机器声比课堂更响，也更不容人辩解。交付期限压在每个人肩上，可一台不可靠的设备送出去，终究会压到更远处的人身上。伊万师傅没有夸我，只把扳手递得更近了些。我记住了那一刻。

keepsakes:
- 带油污的检修单
- 伊万师傅递来的扳手
```

### Day03 秋 1936

```text
journalText:
家信来得迟，纸上的字却像隔着很近。母亲说家中尚可，可我读得出她省去的部分。图书馆窗外的树叶落得很轻，心里却不轻。我曾以为远行只是为了学成，如今才明白，远方和故乡从来不是两件事。

keepsakes:
- 母亲的来信
- 未写完的回信
```

### Day04 冬 1936

```text
journalText:
雪地里的电波断断续续，像人在风里说话。测试站的寒冷让手指发僵，也让每一个判断变得清楚。别洛夫导师提到更长远的研究安排，那本该令人高兴。可雪落下来时，我忽然想起，归途也许不会总等在原处。

keepsakes:
- 雪地测试记录
- 长期研究邀请
```

### Day05 春 1937

```text
journalText:
展示成功时，掌声来得很近。那些线圈、图纸和电波终于证明了自己的价值，也证明了我这些年的努力。但当人们谈起技术的用途，我心里反而多了一层疑问。学识若只停在奖章和报告里，是否仍算完成了它该去的地方？

keepsakes:
- 成果展示记录
- 未拆开的家信
```

### Day06 夏 1937

```text
journalText:
消息最初只是杂音，后来成了报纸上的黑字，也成了每个人沉默时避不开的事实。陈绍衡说不能再等，导师说冲动会毁掉能带走的东西。娜佳没有劝我留下，只问我路是否真的能走通。我知道，从今日起，许多选择不再只是关于自己。

keepsakes:
- 卢沟桥事变报纸
- 匆忙记下的路线线索
```

### Day07 秋 1937

```text
journalText:
准备归途并不像收拾行李那样简单。路线、票证、资料、联系人，每一样都牵动另一处风险。我与陈绍衡争执许久，却并非谁更勇敢、谁更退缩。只是我们都想把有限的东西带到更需要它的地方，而有限二字，今日格外清楚。

keepsakes:
- 整理过的技术资料
- 一张尚未确认的路线纸条
```

### Day08 冬 1937

```text
journalText:
雪比预想中来得更早。车站、宿舍、实验室，都像被同一层白色覆盖，只剩下一些必须立刻作出的取舍。信写到最后，我才明白告别不是把话说尽，而是在话未说尽时仍然向前。无论选择哪条路，今夜之后，都不再是原来的我。

keepsakes:
- 最后一封家书
- 娜佳留下的围巾
- 即将带走或留下的研究笔记
```

---

# 8. Ending 与 Journey Review 接入

## 8.1 EndingScene

确认两个结局场景：

```text
ending_electric_wave_return
ending_foreign_lamp
```

或现有等价 ID 已经：

```text
template: ending
background:
  /assets/backgrounds/bg_ending_electric_wave_return.webp
  /assets/backgrounds/bg_ending_foreign_lamp.webp
```

要求：

- 不显示 GOOD/BAD；
- 不显示“完美结局/失败结局”；
- 文案保持克制；
- 进入旅程回顾页。

## 8.2 Journey Review

如果现有旅程回顾是 `freeLayout` 但无 `elements`，补齐 elements。

显示内容：

```text
旅程回顾
本周目选择的最终方向
3-5项关键经历/帮助/失去/带走的事物
返回标题
```

数据可以从已有结局/历史/flags 摘要中静态呈现。不要在本阶段开发复杂动态回顾生成器。

如果已有 journeyReview 逻辑能动态生成，保留现有逻辑，只补齐视觉展示。

---

# 9. 数据校验

更新或新增测试，至少覆盖：

```text
letter 场景数量 >= 3
historicalEvent 场景数量 >= 1
seasonJournal 场景数量 >= 8
freeLayout 场景不再全部缺 elements
所有新增场景 ID 唯一
所有 nextSceneId 存在
所有新增特殊场景可从主流程到达
所有特殊场景没有 choices/effects，除非有明确现有原因
19 次有效选择数量不变
7 次关键选择数量不变
两个 ending 仍可达
npm run check 通过
```

建议新增或扩展：

```text
src/content/__tests__/specialScenesData.test.ts
src/content/__tests__/gameDataIntegrity.test.ts
```

如果当前项目已有类似测试文件，直接扩展，不重复创建同名职责文件。

---

# 10. 手动验收路线

启动：

```bash
npm run dev
```

至少手动跑一条路线，确认能看到：

```text
标题页
创作说明
时间说明
序章
第一封家书
1936秋家书
卢沟桥历史事件页
至少两个季节札记
1937冬最终家书
一个最终选择
一个结局页
旅程回顾页
```

再快速跑另一条结局路线，确认：

```text
另一个结局页也能进入旅程回顾
存档继续能恢复到特殊场景
特殊场景点击/键盘推进不会重复跳场景
```

---

# 11. PROGRESS.md 更新要求

完成后更新：

```text
PROGRESS.md
```

新增：

```text
### ✅ P1B 特殊场景内容接入（日期）
```

写明：

```text
freeLayout 接入数量
letter 接入数量
historicalEvent 接入数量
seasonJournal 接入数量
journeyReview 接入状态
测试数量与结果
是否修改 game-data.json
是否改变选择数量：必须为否
是否改变关键选择数量：必须为否
```

---

# 12. 完成命令

执行：

```bash
npm run check
npm run build
git status
git diff --stat
```

然后提交并推送：

```bash
git add .
git commit -m "接入家书历史事件与季节札记数据"
git push origin develop
```

完成后停止，不进入 P2 音频系统。

---

# 13. 完成报告格式

完成后必须汇报：

```text
1. 当前分支
2. 修改文件列表
3. 新增/改造的特殊场景 ID 列表
4. letter / historicalEvent / seasonJournal / freeLayout 数量变化
5. 是否修改选择数量：是/否
6. 是否修改关键选择数量：是/否
7. 是否修改结局条件：是/否
8. 新增测试与结果
9. npm run check 结果
10. npm run build 结果
11. 手动验收路线
12. Git commit hash
13. 遗留风险
```
