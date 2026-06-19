# 《雪落之前》P3A：剧情扩容骨架接入

> 适用仓库：`https://github.com/Thexus-THX/snow-before-new.git`  
> 工作分支：`develop`  
> 输入蓝图：`docs/snow_before_story_expansion_v2.md`  
> 本阶段性质：剧情体量扩容 + 人物关系加厚 + 主流程逻辑增强  
> 当前目标：先接入无选择剧情节点，不做全文终稿润色  
> 明确不做：新增美术、音频、角色立绘、主结局、有效选择、关键选择、数值系统改动

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
docs/07_DATA_SCHEMA.md
docs/snow_before_story_expansion_v2.md
docs/snow_before_player_text_optimized_v1_1.md

src/content/game-data.json
src/content/__tests__/
src/schemas/types.ts
src/schemas/gameSchema.ts
src/app/stores/gameStore.ts
src/engine/gameEngine.ts
src/engine/sceneHistory.ts
```

如果 `docs/snow_before_story_expansion_v2.md` 不存在，请先停止并说明缺失，不要凭空写。

---

# 1. 本阶段目标

当前版本已经能跑通，但剧情体量偏小、人物刻画不够、场景之间的因果链较弱。P3A 的目标是：

```text
在不改变玩法逻辑的前提下，把剧情从“大纲式可玩流程”扩展成更像完整视觉小说的叙事流程。
```

具体目标：

```text
1. 新增一批无选择剧情节点、对白节点、内心独白节点和过渡节点。
2. 强化沈怀远、陈绍衡、娜佳、别洛夫、伊万的关系线。
3. 补足 Day1 → Day8 的因果链。
4. 让归国动机从 1931 到 1937 逐步形成，而不是后期突然出现。
5. 让关键选择前后有更强的情绪铺垫与后果回响。
6. 保持所有原有选择、数值、结局条件不变。
```

建议最终体量：

```text
当前约 48 个场景
P3A 后建议增加到约 75–85 个场景
新增场景大多为无选择剧情节点
```

---

# 2. 绝对禁止事项

本阶段不要：

- 创建新 Git 分支；
- 切换到其他分支；
- 新增任何美术素材；
- 新增任何背景图；
- 新增任何角色立绘；
- 新增任何 UI 图片；
- 新增任何 BGM、环境音、SFX、配音；
- 修改或重命名现有素材；
- 修改 BGM / Ambience / SFX 接入逻辑；
- 新增主结局；
- 新增角色；
- 新增有效选择；
- 新增关键选择；
- 修改原有选择文本含义；
- 修改原有选择 effects；
- 修改原有条件判断；
- 修改结局条件门槛；
- 修改存档、回滚、历史系统底层；
- 重写 SceneRenderer；
- 重写 AudioManager；
- 引入大型剧情脚本库；
- 把文字写进图片。

本阶段只允许：

```text
1. 修改 src/content/game-data.json 中的剧情链路与文本；
2. 新增无选择剧情场景；
3. 新增 dialogue / narration / innerThought 类型文本；
4. 调整 nextSceneId，让新增节点插入主流程；
5. 补充测试，确保所有新增节点可达；
6. 更新玩家文本清单与 PROGRESS.md。
```

---

# 3. 新增场景原则

所有新增场景默认应为：

```text
template: "standardDialogue"
choices: 不存在或空
effects: 不存在或空
nextSceneId: 必须指向已存在场景
autoSavePoint: 通常不要新增
```

新增场景必须：

```text
1. 有唯一 scene.id；
2. 有明确 chapterId；
3. 有合适 background，优先复用该章节原背景；
4. 不新增 portraitAsset，除非已有角色立绘路径已存在且当前场景本来就使用该角色；
5. 不改变已有选择场景的选择数量；
6. 不改变关键选择数量；
7. 不造成死循环；
8. 不让任何原有结局不可达；
9. 不让 BGM 因连续场景反复重启。
```

新增节点优先采用：

```text
原 A.nextSceneId = B

改为：

A.nextSceneId = 新节点 X
X.nextSceneId = B
```

如果 A 是选择场景，优先在选择结果场景之后插入桥段，不要直接改选择效果和选择数值。

---

# 4. 必做新增场景

请从 `docs/snow_before_story_expansion_v2.md` 中接入以下 12 个核心新增节点，文本以该文档为准：

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

这 12 个主要解决：

```text
人物刻画不足
场景跳跃太快
归国动机不连续
最终选择情绪不足
```

接入时请严格保持：

```text
无 choices
无 effects
不新增条件
不修改结局计算
```

---

# 5. 推荐追加新增场景

完成必做 12 个后，如时间允许，请继续从 `docs/snow_before_story_expansion_v2.md` 接入以下节点，建议总新增 30–40 个：

```text
prologue_platform_language
prologue_nadya_first_help
d1_lab_morning_corridor
d1_belov_observes
d1_after_failure_private_reaction
d2_factory_gate
d2_canteen_short_talk
d2_after_quality_consequence
d3_post_office_queue
d3_library_chinese_notes
d4_snowfield_journey
d4_nadya_cold_hands
d4_belov_private_offer_seed
d4_invitation_aftertaste
d5_before_showcase_pressure
d5_nadya_before_stage
d6_chinese_students_room
d6_belov_warning
d7_route_map_table
d7_documents_office
d7_nadya_materials_night
d7_after_material_choice_reaction
d8_morning_snow
d8_chen_farewell
d8_belov_last_words
d8_ivan_small_tool
ending_return_after_echo
ending_lamp_after_echo
```

如果总场景数超过 90，或某章明显拖慢，请优先保留人物对白节点，删减重复环境旁白节点。

---

# 6. 原有重点场景加厚

允许适度加厚以下原有场景文本，但不得改变选择含义、选择数量、数值效果和结局条件：

```text
d1_k1_failure
d3_chen_night
d5_c2_tech_use
d6_k1_first_action
d8_k2_final
```

加厚方向以 `docs/snow_before_story_expansion_v2.md` 的“重点原有文本加厚建议”为准。

注意：

```text
不要把加厚文本写得过长。
每个原有场景正文建议控制在 100–220 字。
不要把选择项改成新的含义。
不要新增选择。
```

---

# 7. 人物语气要求

## 沈怀远

```text
克制、观察力强、责任感逐渐形成、不是天生英雄。
不要频繁说豪言。
多写停顿、记录、整理、反复权衡。
```

## 陈绍衡

```text
急迫、行动派、爱国但不扁平。
他的急，是因为他更早意识到时间不等人。
他可以说重话，但不能像反派。
```

## 娜佳

```text
专业伙伴、异乡理解者、情感克制。
不要写成单纯恋爱线。
她支持沈怀远，但这种支持有痛感。
```

## 别洛夫

```text
科学秩序、合规边界、导师的严厉与保护。
不要写成阻止归国的外国导师。
```

## 伊万

```text
工匠伦理、机器与人的关系、少言但有重量。
台词短而硬，像从工厂里磨出来。
```

## 家庭

```text
克制、生活压力、不是狗血苦难。
母亲不写大道理，只写家中小事。
父亲话少，但每句话有重量。
兰英代表时间流逝。
```

---

# 8. 数据与测试要求

新增或更新测试，至少覆盖：

```text
1. 所有新增 scene.id 唯一。
2. 所有新增 scene.nextSceneId 存在。
3. 所有新增节点可从 startSceneId 到达。
4. 所有原有 ending 仍可达。
5. journey_review 和 thank_you 仍可达。
6. 新增节点不包含 choices。
7. 新增节点不包含 effects。
8. 有效选择数量不变。
9. 关键选择数量不变。
10. 结局条件不变。
11. 所有新增文本不为空。
12. 所有新增 dialogue 的 speakerId 对应现有角色。
13. innerThought 类型若 schema 支持则使用；如果 schema 不支持，不要改 schema，可使用 narration 并保持内心独白语气。
14. npm run check 通过。
15. npm run build 通过。
```

建议新增或扩展：

```text
src/content/__tests__/storyExpansionIntegrity.test.ts
src/content/__tests__/gameDataIntegrity.test.ts
src/engine/__tests__/routeSimulation.test.ts
```

---

# 9. 玩家文本清单更新

如果项目中已有玩家文本清单，例如：

```text
docs/player-text-list.md
```

或同类文档，请同步更新。

必须包含：

```text
新增场景 ID
新增场景标题
新增文本正文
新增对白说话人
新增内心独白
原有场景加厚文本
```

如果当前仓库没有玩家文本清单文档，则新增：

```text
docs/player-text-list-v2.md
```

不要覆盖用户原始审阅文档，除非仓库中已有固定维护文件。

---

# 10. PROGRESS.md 更新要求

完成后更新：

```text
PROGRESS.md
```

新增：

```text
### ✅ P3A 剧情扩容骨架接入（日期）
```

写明：

```text
新增剧情节点数量
新增对白节点数量
新增内心独白节点数量
总场景数变化
是否新增选择：必须为否
是否新增关键选择：必须为否
是否修改选择 effects：必须为否
是否修改结局条件：必须为否
是否新增美术/音频素材：必须为否
新增测试数量与结果
npm run check 结果
npm run build 结果
```

---

# 11. 手动验收路线

启动：

```bash
npm run dev
```

手动至少跑一条完整路线，确认：

```text
1. 开场不拖沓。
2. 序章到五年后过渡更自然。
3. Day1 娜佳与别洛夫关系更清楚。
4. Day2 伊万的工匠伦理更明确。
5. Day3 陈绍衡归国分歧提前埋线。
6. Day5 “技术为谁服务”成为中点。
7. Day6 卢沟桥冲击更强。
8. Day7 分歧和资料选择更有重量。
9. Day8 告别与最终选择更有仪式感。
10. 两个结局仍然可达。
11. BGM 不因新增场景频繁重启。
```

如果新增场景导致某章明显拖慢，请优先压缩重复旁白，不要删除关键人物对白。

---

# 12. 完成命令

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
git commit -m "扩充剧情体量与人物关系桥段"
git push origin develop
```

完成后停止，不进入 P3B 全文润色。

---

# 13. 完成报告格式

完成后必须汇报：

```text
1. 当前分支
2. 修改文件列表
3. 新增场景数量
4. 新增场景 ID 列表
5. 新增对白节点数量
6. 新增内心独白节点数量
7. 总场景数变化
8. 是否新增选择：必须为否
9. 是否新增关键选择：必须为否
10. 是否修改选择 effects：必须为否
11. 是否修改结局条件：必须为否
12. 是否新增美术/音频素材：必须为否
13. 测试文件与测试数量
14. npm run check 结果
15. npm run build 结果
16. 手动验收结果
17. Git commit hash
18. 遗留风险
```
