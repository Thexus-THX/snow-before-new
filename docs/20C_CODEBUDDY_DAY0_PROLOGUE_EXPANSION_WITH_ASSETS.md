# 《雪落之前》P5A-Day0：序章扩写 + 新增美术素材接入

> 适用仓库：`https://github.com/Thexus-THX/snow-before-new.git`  
> 工作分支：`develop`  
> 当前阶段：一天一天增加内容的第一步——序章 1931  
> 本轮目标：扩写序章 + 接入 3 张新增序章背景图  
> 本轮新增美术：登记窗口、无线电教室、宿舍第一夜  
> 明确不做：新增主结局、新增音频、新增角色立绘、重构系统

---

## 0. 开始前必须确认

```bash
git fetch origin
git checkout develop
git pull --rebase origin develop
git branch --show-current
npm ci
npm run check
npm run build
```

`git branch --show-current` 必须输出：

```text
develop
```

如果不是 `develop`，立即停止。

必须先阅读：

```text
PROGRESS.md
docs/20B_DAY0_ART_ASSET_PROMPTS_WITH_FILENAMES.md
src/content/game-data.json
src/content/__tests__/
src/schemas/types.ts
src/schemas/gameSchema.ts
src/engine/gameEngine.ts
src/app/stores/gameStore.ts
```

并确认 P3C 已经在 `develop` 中：

```text
P3C commit: 6549eaa
已完成：contact 修复、21 flags、结局条件重构、d8_readiness_report
```

---

# 1. 必须检查的新增美术文件

本轮需要接入 3 张新增背景图。  
CodeBuddy 不得生成图片，不得下载图片，不得改名图片。  
只检查并引用以下已存在文件：

```text
public/assets/backgrounds/bg_prologue_registration_station.webp
public/assets/backgrounds/bg_prologue_radio_room_1931.webp
public/assets/backgrounds/bg_prologue_dorm_first_night.webp
```

代码引用路径应遵循项目现有 background 写法。  
如果现有 `game-data.json` 中使用 `/assets/backgrounds/xxx.webp`，则新背景也使用：

```text
/assets/backgrounds/bg_prologue_registration_station.webp
/assets/backgrounds/bg_prologue_radio_room_1931.webp
/assets/backgrounds/bg_prologue_dorm_first_night.webp
```

开始前必须检查文件存在：

```bash
test -f public/assets/backgrounds/bg_prologue_registration_station.webp
test -f public/assets/backgrounds/bg_prologue_radio_room_1931.webp
test -f public/assets/backgrounds/bg_prologue_dorm_first_night.webp
```

如果任何一个文件缺失：

```text
立即停止。
不要创建占位图片。
不要改用不存在路径。
不要自动生成素材。
在报告中列出缺失文件。
```

---

# 2. 本轮核心目标

本轮只处理：

```text
序章 · 1931
```

目标是让序章承担四个功能：

```text
1. 建立初到苏联的异乡感；
2. 建立沈怀远学习无线电的初始动机；
3. 让娜佳第一次出现更有记忆点；
4. 让 1931 → 1936 的五年过渡不再像一句话跳过。
```

---

# 3. 严格禁止事项

本轮不要：

```text
新增音频素材
新增角色立绘
新增 UI 素材
新增主结局
新增新的主要角色
新增有效选择
新增关键选择
修改结局条件
修改 P3C 的 ending conditions
修改存档/回滚/历史系统底层
修改 BGM / Ambience / SFX / Voice 逻辑
改标题页/设置页 UI
重命名美术文件
移动美术文件
```

本轮允许：

```text
新增少量无选择剧情节点
接入指定 3 张背景图
润色序章已有文本
给 prologue_choice 三个选项增加轻量 flags
增强 journey_review 对序章初始选择的回响
补充测试
更新 PROGRESS.md
```

---

# 4. 新增 / 调整节点总览

## 新增节点

```text
prologue_platform_language
prologue_customs_and_registration
prologue_nadya_first_help
prologue_first_radio_room
```

## 润色已有节点

如果已存在则润色，不要重复创建：

```text
prologue_dorm_first_night
prologue_study_montage_1931_1936
```

如果上述两个节点不存在，则按下文创建。

---

# 5. 接入顺序建议

不要重写整个 prologue。采用插入节点方式。

建议顺序：

```text
原序章开场
→ prologue_platform_language
→ prologue_customs_and_registration
→ prologue_choice
→ 三个 prologue_choice 结果场景
→ prologue_nadya_first_help
→ prologue_first_radio_room
→ prologue_dorm_first_night
→ prologue_study_montage_1931_1936
→ 原 1936 春 / Day1 开始节点
```

如果现有 `game-data.json` 中 prologue_choice 结果分支结构不同，请先分析实际链路，再保证：

```text
1. 三个初始选择结果都能汇入 prologue_nadya_first_help；
2. 不丢失原有 choice effects；
3. 不让任何原序章节点变成不可达；
4. 最终仍能进入 Day1。
```

---

# 6. 新增节点正文与背景

## 6.1 `prologue_platform_language`

类型：

```text
narration
```

背景：

```text
/assets/backgrounds/bg_prologue_1931_station.webp
```

正文：

```text
站台广播响起时，沈怀远一个词也没听懂。

那些卷着舌音的俄语从头顶掠过，像另一种天气。身旁有人催促，他只好跟着人流向前走。行李箱很沉，手心被冻得发疼。

他第一次清楚地意识到，远行并不只是离开家门，而是连一句问路的话都要重新学起。
```

---

## 6.2 `prologue_customs_and_registration`

类型：

```text
narration
```

背景：

```text
/assets/backgrounds/bg_prologue_registration_station.webp
```

正文：

```text
登记窗口前排着长队。每个人手里都攥着文件、介绍信和写着陌生字母的纸条。

沈怀远把自己的证件递过去，又在对方示意下慌忙翻出另一份表格。印章落下时，他才松了一口气。

那一声很轻，却像是在提醒他：从今天起，他在这里的一切，都要先被纸面上的名字确认。
```

---

## 6.3 `prologue_nadya_first_help`

类型：

```text
dialogue
```

说话人：

```text
娜佳
```

背景：

```text
/assets/backgrounds/bg_prologue_1931_station.webp
```

正文：

```text
“你要去无线电学院的宿舍？这边。”

她指了指站台外的方向，又看了一眼他手里的登记条。

“先别把这张纸收得太深。出了车站还要查一次。”

沈怀远慢了一拍才听明白她在帮自己。他想道谢，对方却已经放慢语速，又把那句话重复了一遍。

“别担心。第一次来这里的人，都会觉得这些牌子像一堵墙。”
```

---

## 6.4 `prologue_first_radio_room`

类型：

```text
narration 或 innerThought
```

背景：

```text
/assets/backgrounds/bg_prologue_radio_room_1931.webp
```

正文：

```text
入学后的第一个傍晚，沈怀远被带进无线电教室。墙边的设备还没有全部通电，金属外壳在灯下泛着冷光。

有人旋动旋钮，耳机里忽然传出一阵断续的杂音。那声音并不好听，却让他停住了脚步。

电波看不见，也握不住，却能越过城市、雪原和国境，比一个人的脚步走得更远。那一刻，他第一次觉得，自己选择的并不只是一门技术。
```

---

## 6.5 `prologue_dorm_first_night`

类型：

```text
innerThought；如果 schema 不支持 innerThought，则用 narration
```

背景：

```text
/assets/backgrounds/bg_prologue_dorm_first_night.webp
```

正文：

```text
夜里，宿舍的暖气管发出细小的敲击声。

沈怀远把母亲的信压在枕边，摊开俄文字母表，又合上。窗外雪光映在天花板上，白得像一张未写完的纸。

他想起父亲临行前只说了一句：“到了外头，话少些，眼睛亮些。”

那时他觉得这句话太短，如今却觉得，短得正好够他在异乡的第一夜反复咀嚼。
```

---

## 6.6 `prologue_study_montage_1931_1936`

类型：

```text
narration
```

背景：

```text
/assets/backgrounds/bg_prologue_radio_room_1931.webp
```

正文：

```text
后来的几年里，沈怀远学会了在清晨排队领热汤，学会了把俄语笔记写得比中文还整齐，也学会了在电流杂音里辨认真正的信号。

有时他会在实验楼外看见娜佳抱着一摞资料匆匆走过；有时会在图书馆里遇见陈绍衡，两人隔着桌灯点一下头。

别洛夫导师的评语总是简短，伊万师傅的工厂检修单则总是沾着油污。

异乡并没有变成熟悉的家，只是渐渐有了可以辨认的方向。
```

---

# 7. 初始选择增加轻量 flags

当前 `prologue_choice` 已有三个选项：

```text
先拆开母亲的来信 → 思乡 +1
先观察陌生的无线电设备 → 学识 +1
主动与身边的同学攀谈 → 娜佳信任 +1
```

请保留原有效果，并新增轻量 flags：

| 选项 | 新增 flag |
|---|---|
| 先拆开母亲的来信 | `flag_prologue_first_letter` |
| 先观察陌生的无线电设备 | `flag_prologue_first_radio` |
| 主动与身边的同学攀谈 | `flag_prologue_first_people` |

这些 flags 不用于锁结局，只用于：

```text
journey_review 回响
玩家开局倾向记录
未来结局图鉴说明
```

---

# 8. Journey Review 增强

在 `journey_review` 或现有回顾系统中加入序章初始选择回响。

建议文本：

```text
如果 flag_prologue_first_letter:
最初抵达异乡时，他先拆开了母亲的信。许多年后，那封信仍像一枚很轻的锚，把他和故土系在一起。

如果 flag_prologue_first_radio:
最初吸引他的，是一台陌生的无线电设备。电波的杂音并不好听，却让他相信，距离并非永远无法越过。

如果 flag_prologue_first_people:
他曾在陌生站台上主动向身边的人开口。后来他才明白，归途并不只靠路线，也靠那些愿意同行或送行的人。
```

要求：

```text
1. 不要影响结局条件；
2. 不要新增主结局；
3. 不要破坏 P3C journey_review 的其他 flags 回响。
```

---

# 9. 测试要求

新增或更新测试，至少覆盖：

```text
1. 三个新增背景文件路径存在。
2. 新增序章节点 scene.id 唯一。
3. 新增序章节点全部可从 startSceneId 到达。
4. 三个 prologue_choice 分支都能汇入主线。
5. prologue_choice 原有效果仍保留。
6. 三个新增 prologue flags 能正确写入 state。
7. journey_review 能读取至少一个 prologue flag。
8. 序章最终仍能进入 Day1。
9. 不新增有效选择。
10. 不新增关键选择。
11. 不修改结局条件。
12. npm run check 通过。
13. npm run build 通过。
```

建议测试文件：

```text
src/content/__tests__/prologueExpansion.test.ts
src/engine/__tests__/prologueFlagRegression.test.ts
src/content/__tests__/assetPathIntegrity.test.ts
```

---

# 10. PROGRESS.md 更新

完成后更新：

```text
### ✅ P5A-Day0 序章内容扩写与美术接入（日期）
```

写明：

```text
新增序章节点数量
润色已有序章节点数量
新增 flags 数量
新增背景素材数量：3
新增背景素材文件名
是否新增音频素材：否
是否新增角色立绘：否
是否新增选择：否
是否新增关键选择：否
是否修改结局条件：否
新增/修改测试数量
npm run check 结果
npm run build 结果
```

---

# 11. 完成命令

```bash
npm run check
npm run build
git status
git diff --stat
git add .
git commit -m "扩写序章并接入新增背景"
git push origin develop
```

完成后停止，不进入 Day1。
