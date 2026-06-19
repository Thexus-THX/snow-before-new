# 《雪落之前》P3B：全文润色、人物语气统一与流程节奏校对

> 适用仓库：`https://github.com/Thexus-THX/snow-before-new.git`  
> 工作分支：`develop`  
> 前置阶段：P3A 已完成，场景数 65 → 77，新增 12 个核心剧情节点  
> 当前阶段性质：文本润色 + 人物语气统一 + 叙事节奏校对 + 完整流程 QA  
> 明确不做：新增场景、删除场景、新增选择、修改 effects、修改结局条件、新增素材

---

## 0. 开始前必须确认

本阶段统一以 `develop` 为最新开发分支。

开始前执行：

```bash
git fetch origin
git checkout develop
git pull --rebase origin develop
git branch --show-current
npm ci
npm run check
```

`git branch --show-current` 必须输出：

```text
develop
```

如果不是 `develop`，立即停止。

如果 P3A commit 尚未成功 push，请先执行：

```bash
git status
git log --oneline -1
git push origin develop
```

P3A commit 应为：

```text
42f8c66
```

如果 push 仍因 GitHub 网络问题失败，不要进入 P3B，先汇报网络问题。  
不要 reset，不要 force push，不要改 remote，不要新建分支。

必须先阅读：

```text
PROGRESS.md
docs/snow_before_story_expansion_v2.md
src/content/game-data.json
src/content/__tests__/
src/schemas/types.ts
src/schemas/gameSchema.ts
src/app/stores/gameStore.ts
src/engine/gameEngine.ts
```

---

# 1. 本阶段目标

P3A 已经完成剧情扩容骨架，但新增节点只是“接入”。P3B 要做的是让全文真正像一部统一风格的视觉小说。

目标：

```text
1. 统一 77 个场景的叙事语气。
2. 润色新增 12 个剧情节点，使其与原文自然衔接。
3. 统一沈怀远、陈绍衡、娜佳、别洛夫、伊万的角色口吻。
4. 检查 Day1 → Day8 的因果链是否顺畅。
5. 检查新增场景是否拖慢节奏。
6. 修正错别字、标点、重复表达、现代感过强的词。
7. 保持剧情逻辑、数值系统、结局条件完全不变。
```

---

# 2. 绝对禁止事项

本阶段不要：

- 新增 scene；
- 删除 scene；
- 重命名 scene.id；
- 修改 startSceneId；
- 修改 nextSceneId，除非发现明显断链或死链；
- 新增 choices；
- 删除 choices；
- 修改 choices 数量；
- 修改 choice effects；
- 修改关键选择标记；
- 修改结局条件；
- 新增主结局；
- 新增角色；
- 新增美术素材；
- 新增音频素材；
- 修改 BGM / Ambience / SFX / Voice 逻辑；
- 修改存档、回滚、历史系统；
- 修改 UI 布局；
- 修改 schema；
- 为了文字效果引入新库。

本阶段只允许：

```text
1. 修改玩家可见文本；
2. 微调场景标题；
3. 微调旁白、对白、内心独白；
4. 修正错别字和标点；
5. 修正说话人字段错误；
6. 更新玩家文本清单；
7. 更新测试；
8. 更新 PROGRESS.md。
```

---

# 3. 需要特别检查的 P3A 报告问题

P3A 完成报告中有一个数量表述需要核对：

```text
新增对白：5 个（娜佳×3、陈绍衡×3、伊万×1）
```

括号内合计为 7 个，不是 5 个。  
请在代码中重新统计真实 dialogue 数量，并在 PROGRESS.md 中写准确值。

不要为了让数字一致而删除文本。  
以 `game-data.json` 的真实数据为准。

---

# 4. 润色总风格

全文统一为：

```text
高精度叙事像素风对应的文字气质
历史档案感
克制
冷静
有余味
不现代网文
不口号化
不煽情过度
不把角色写成工具人
```

避免：

```text
太直白地解释主题
过度使用“责任”“家国”“使命”这类大词
现代口语，例如“搞定”“压力山大”“别纠结”
网文式内心独白
把娜佳写成恋爱工具人
把陈绍衡写成单纯冲动
把别洛夫写成阻碍归国的人
把伊万写成只会讲大道理的人
```

推荐表达方式：

```text
用物件承载情绪：信纸、票证、记录本、围巾、螺丝刀、电台、雪、车站钟声。
用动作代替解释：停笔、折报纸、压低声音、重新系文件袋。
用短句制造停顿，但不要碎片化过度。
```

---

# 5. 人物语气标准

## 5.1 沈怀远

关键词：

```text
克制、观察细、责任感慢慢形成、不是天生英雄。
```

写法：

```text
少说豪言。
多写他如何看、如何记、如何停顿、如何权衡。
他的成长不是突然“觉醒”，而是从一次次具体选择中形成判断。
```

## 5.2 陈绍衡

关键词：

```text
急迫、行动派、害怕来不及、有分寸的锋利。
```

写法：

```text
他可以催促沈怀远，但不是反派。
他的急不是鲁莽，而是他比沈怀远更早感到时间在收紧。
他说话应直接、有压迫感，但不能像口号。
```

## 5.3 娜佳

关键词：

```text
专业伙伴、技术判断强、异乡理解者、情感克制。
```

写法：

```text
她首先是技术同伴，不是恋爱功能角色。
她理解沈怀远可能要走，但不会用情绪绑住他。
她的温柔应通过专业帮助和克制告别体现。
```

## 5.4 别洛夫

关键词：

```text
科学秩序、合规边界、严厉但保护学生。
```

写法：

```text
他不是阻碍归国的人。
他提醒的是边界、后果和正直。
他的句子应简短、准确、有导师感。
```

## 5.5 伊万

关键词：

```text
工匠伦理、少言、有生活重量。
```

写法：

```text
台词要短。
不要像演讲。
多用工厂、机器、工具、返工、螺丝这类具体事物。
```

---

# 6. 重点润色区域

请重点检查以下 P3A 新增节点：

```text
prologue_dorm_first_night
prologue_study_montage_1931_1936
d1_nadya_record_argument
d2_ivan_worker_lesson
d3_chen_first_conflict_seed
d3_reply_unsent
d5_chen_after_tech_use
d6_radio_fragments
d6_nadya_understands_distance
d7_chen_quarrel_full
d8_nadya_farewell
d8_before_final_silence
```

要求：

```text
1. 每个新增节点都要与前后场景自然衔接。
2. 不要出现信息重复。
3. 不要在连续两个节点中反复表达同一种情绪。
4. 每个节点都要有明确作用：
   - 补动机
   - 补关系
   - 补时代压力
   - 补选择前铺垫
   - 补选择后回响
```

也要重点检查以下原有场景是否已经加厚得自然：

```text
d1_k1_failure
d3_chen_night
d5_c2_tech_use
d6_k1_first_action
d8_k2_final
```

如果文本过长，可以压缩，但不要删掉核心情绪。

---

# 7. 节奏检查规则

每章阅读节奏建议：

```text
开场旁白：1–2 屏
人物对白：1–3 屏
选择前铺垫：1–2 屏
选择结果回响：1–2 屏
札记/结尾：1 屏
```

避免：

```text
同一章节连续 4 个长旁白节点
同一角色连续 3 次重复表达相同立场
连续多次用“忽然意识到”
连续多次用“他明白”
连续多次用“沉默”
```

如发现某章拖慢，可压缩旁白，但不要减少选择和结局逻辑。

---

# 8. 用词与标点规范

统一：

```text
1936 年春
1937 年夏
卢沟桥
莫斯科
苏联
无线电
电波
归国
留苏
```

中文标点：

```text
使用中文引号：“”
使用中文省略号：……
使用中文破折号：——
数字与年份前后空格保持项目现有风格一致
```

避免英文半角标点混入正文。  
不要出现现代互联网语气。

---

# 9. 数据完整性要求

润色后必须保证：

```text
1. 总场景数仍为 77，除非只修正明显错误。
2. 新增选择数仍为 0。
3. 新增关键选择数仍为 0。
4. choice effects 不变。
5. ending 条件不变。
6. 所有 scene.id 不变。
7. 所有 nextSceneId 有效。
8. 所有从 startSceneId 可达的节点仍可达。
9. 两个主结局仍可达。
10. journey_review 和 thank_you 仍可达。
11. BGM 不因文字润色变化而受影响。
```

如果发现 P3A 遗留断链或不可达节点，可以修复 nextSceneId，但必须在完成报告中单独说明。

---

# 10. 测试要求

执行并确保通过：

```bash
npm run check
npm run build
```

新增或更新测试，至少覆盖：

```text
1. 总场景数为 77。
2. 有效选择数量不变。
3. 关键选择数量不变。
4. effects 未变化。
5. ending 条件未变化。
6. 所有 nextSceneId 有效。
7. 所有新增 P3A 节点仍可达。
8. 两个结局仍可达。
9. 文本字段不为空。
10. dialogue 的 speakerId 均存在。
11. 无明显空白文本。
12. 没有未替换占位符，例如 TODO、待补、xxx。
```

---

# 11. 玩家文本清单更新

同步更新玩家文本清单，例如：

```text
docs/player-text-list.md
docs/player-text-list-v2.md
```

如果项目已有固定维护文件，以现有文件为准。  
不要删除用户原始审阅用文件。

文本清单要反映 P3B 润色后的最新正文。

---

# 12. PROGRESS.md 更新要求

完成后更新：

```text
PROGRESS.md
```

新增：

```text
### ✅ P3B 全文润色与人物语气统一（日期）
```

写明：

```text
总场景数
润色场景数量
新增/删除场景数量：必须为 0
新增选择数量：必须为 0
新增关键选择数量：必须为 0
choice effects 是否变化：必须为否
结局条件是否变化：必须为否
美术/音频素材是否变化：必须为否
P3A dialogue 数量复核结果
测试结果
npm run check 结果
npm run build 结果
```

---

# 13. 完成命令

执行：

```bash
npm run check
npm run build
git status
git diff --stat
```

提交并推送：

```bash
git add .
git commit -m "润色全文并统一人物语气"
git push origin develop
```

完成后停止，不进入部署或答辩材料阶段。

---

# 14. 完成报告格式

完成后必须汇报：

```text
1. 当前分支
2. 修改文件列表
3. 润色场景数量
4. 总场景数
5. 新增/删除场景数量
6. 新增选择数量
7. 新增关键选择数量
8. choice effects 是否变化
9. 结局条件是否变化
10. 美术/音频素材是否变化
11. P3A dialogue 数量复核结果
12. 文本清单更新结果
13. 测试文件与测试数量
14. npm run check 结果
15. npm run build 结果
16. Git commit hash
17. push 是否成功
18. 遗留风险
```
