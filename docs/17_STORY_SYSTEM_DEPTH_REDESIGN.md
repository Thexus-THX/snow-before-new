# 《雪落之前》P3C：数值、选择与结局深度优化方案

> 目标：解决“剧情能跑通，但玩起来没深度”的问题。  
> 核心判断：现在不是继续堆文字，而是要让选择产生更清晰的代价、锁定、回响和结局差异。  
> 本方案不新增美术、不新增音频、不新增主结局；只优化选择效果、条件、分支反馈和结局变体。

---

## 1. 当前问题诊断

### 1.1 选择太像“加点题”

当前大部分普通选择都是：

```text
选 A：某数值 +1
选 B：另一个数值 +1
```

玩家很容易感到只是在刷数值，而不是在处理真实处境。需要让每个选择都带有收益、代价、人物反应、后续锁定或解锁、结局影响。

---

### 1.2 关键选择有“明显正确答案”

实验故障、工厂质量、资料真相这些选择里，坏选项通常是明显负收益。玩家只要避开明显坏选项，就能走得比较顺。这会削弱纠结感。

建议危险选项拥有短期收益，但带长期风险。例如：

```text
隐瞒异常：
短期：展示顺利，身心 +1，学识 +1
长期：flag_concealed_lab_anomaly，别洛夫信任 -2，后期导师帮助锁定

私自带资料：
短期：technicalMaterials +2
长期：flag_restricted_materials，完整归国 / 留下支援锁定，别洛夫信任 -3
```

---

### 1.3 完整归国目前有逻辑漏洞

完整归国要求：

```text
contact >= 1
```

但当前选择表中写着：

```text
联系人 >= 1 ← 未在当前选择中直接增加
```

这会导致“完整归国”在机制上几乎不可达，或者只能依赖隐藏逻辑。必须修正。

---

### 1.4 归国倾向 / 留下倾向没有真正进入结局

系统里有：

```text
returnTendency
stayTendency
```

但结局条件主要看路线、证件、资料、联系人、学识、担当、可靠同伴。这样会导致“前面一直偏向归国/留下”的角色塑造没有被最终结局读到。

建议：

```text
归国高级变体必须读取 returnTendency
留下高级变体必须读取 stayTendency 或 accepted_long_term_research flag
```

---

### 1.5 fallback 结局太安全

现在：

```text
仓促归国：无条件
继续研究：无条件
等待时机：无条件
```

好处是不会卡死；坏处是玩家没有失败感，也没有准备不足的后果。建议保留至少一个永远可选的 fallback，但让它有明显叙事代价。

---

## 2. 新深度目标

P3C 后，玩家应感到：

```text
1. 每次选择不是单纯加点，而是在牺牲某些东西。
2. 人物信任不是摆设，会改变后期能否获得帮助。
3. 归国/留下不是最后一刻点按钮，而是前面选择积累出的方向。
4. 坏选择不会立刻 Game Over，但会在后期变成锁定、变体降级或文本回响。
5. 两个主结局仍存在，但内部变体差异更明显。
```

---

## 3. 新增 flags

建议新增以下 flags，不新增 UI，但用于结局条件和回顾文本：

```text
flag_concealed_lab_anomaly
flag_factory_rushed_delivery
flag_accepted_long_term_research
flag_named_domestic_concern
flag_public_tech_value
flag_defense_tech_value
flag_lugouqiao_route_started
flag_lugouqiao_waited
flag_belov_compliant_help
flag_restricted_materials
flag_clean_materials
flag_farewell_nadya
flag_farewell_chen
flag_formal_handover
```

用途：

| flag | 来源 | 后续影响 |
|---|---|---|
| flag_concealed_lab_anomaly | D1 隐瞒异常 | 降低别洛夫相关帮助可信度，旅程回顾显示早期隐患 |
| flag_factory_rushed_delivery | D2 按期交付不追查 | 降低伊万信任，影响技术伦理评价 |
| flag_accepted_long_term_research | D4 接受长期邀请 | 解锁继续研究更完整文本 |
| flag_named_domestic_concern | D4 提到国内情况 | 增强归国线合理性 |
| flag_public_tech_value | D5 民用建设价值 | 支援国内 / 归国建设文本增强 |
| flag_defense_tech_value | D5 国防安全应用 | 留下研究或国防技术文本增强 |
| flag_lugouqiao_route_started | D6 打听路线 | 归国路线合理性增强 |
| flag_lugouqiao_waited | D6 等待消息 | 留下/等待文本增强，归国仓促文本带遗憾 |
| flag_belov_compliant_help | D7 坦白并获得合规帮助 | 完整归国重要条件 |
| flag_restricted_materials | D7 私自带资料 | 锁定完整归国/留下支援 |
| flag_clean_materials | D7 只带公开资料 | 解锁合规归国/留下支援文本 |
| flag_farewell_nadya | D8 见娜佳告别 | 结局回响增强 |
| flag_farewell_chen | D8 确认路线细节 | contact +1，归国协助增强 |
| flag_formal_handover | D8 研究交接 | documents +1，留下支援增强 |

---

## 4. 修正行动准备 contact

当前 contact 初始为 0，但没有直接增加路径。建议增加 3 条来源：

### 4.1 D6_K1_A：开始打听归国路线

建议调整为：

```text
route +1
contact +1
responsibility +1
homesickness +1
trust.chen +1
returnTendency +2
flag_lugouqiao_route_started
```

### 4.2 D7_C1_A：确认路线票证

建议调整为：

```text
route +1
contact +1
trust.chen +1
```

### 4.3 D8_C1_B：确认最后路线细节

建议调整为：

```text
route +1
contact +1
trust.chen +1
flag_farewell_chen
```

这样“完整归国”可达，但仍需要玩家在归国线持续投入。

---

## 5. 关键选择深度化改法

### 5.1 D1_K1：实验故障

| 选项 | 建议效果 |
|---|---|
| 立即停止测试，并向导师说明异常 | responsibility +2, wellbeing -1, trust.belov +1, flag_reported_lab_anomaly |
| 与娜佳一起先排查故障，再如实汇报 | knowledge +1, responsibility +1, trust.nadya +1, trust.belov +1 |
| 隐瞒异常，先让演示继续完成 | knowledge +1, wellbeing +1, responsibility -2, trust.belov -2, flag_concealed_lab_anomaly |

---

### 5.2 D2_K1：工厂质量

| 选项 | 建议效果 |
|---|---|
| 坚持暂停交付，全面返检设备 | knowledge +1, responsibility +2, wellbeing -2, trust.ivan +2, flag_factory_full_recheck |
| 先检查高风险批次，再维持其余生产 | knowledge +1, responsibility +1, trust.ivan +1, wellbeing -1 |
| 接受按期交付，不再追查异常 | wellbeing +1, responsibility -2, trust.ivan -2, flag_factory_rushed_delivery |

---

### 5.3 D4_K1：长期研究邀请

| 选项 | 建议效果 |
|---|---|
| 接受长期研究邀请，并承诺继续投入 | knowledge +1, trust.belov +2, stayTendency +2, flag_accepted_long_term_research |
| 请求时间，向导师提到国内情况和家庭考虑 | responsibility +1, homesickness +1, returnTendency +1, trust.belov +1, flag_named_domestic_concern |
| 询问能否把公开成果带回中国 | knowledge +1, responsibility +1, trust.belov +1, technicalMaterials +1, flag_clean_materials |

---

### 5.4 D5_K1：技术用途

| 选项 | 建议效果 |
|---|---|
| 强调通信技术的民用与建设价值 | responsibility +1, returnTendency +1, cooperationModifier +1, flag_public_tech_value |
| 关注技术的国防与安全应用 | knowledge +1, stayTendency +1, responsibility +1, flag_defense_tech_value |
| 承认两种可能并存，不下定论 | trust.belov +1, knowledge +1, flag_balanced_tech_view |

---

### 5.5 D6_K1：事变后第一步

| 选项 | 建议效果 |
|---|---|
| 立即开始打听归国路线 | route +1, contact +1, responsibility +1, homesickness +1, trust.chen +1, returnTendency +2, flag_lugouqiao_route_started |
| 保持研究，等待进一步消息再决定 | knowledge +1, wellbeing +1, stayTendency +1, flag_lugouqiao_waited |
| 与娜佳和导师商量，寻找兼顾的可能 | trust.nadya +1, trust.belov +1, responsibility +1, cooperationModifier +1 |

---

### 5.6 D7_K1：资料与真相

| 选项 | 条件 | 建议效果 |
|---|---|---|
| 坦白归国打算，并请求导师提供合规帮助 | trust.belov >= 7 | responsibility +2, trust.belov +2, documents +1, contact +1, flag_belov_compliant_help |
| 只整理公开笔记，不带走受限制材料 | 无 | technicalMaterials +1, responsibility +1, flag_clean_materials |
| 私下复制受限制资料 | 无 | technicalMaterials +2, responsibility -3, trust.belov -3, flag_restricted_materials |
| 放弃资料，优先确保行动安全 | 无 | wellbeing +1, responsibility +1, technicalMaterials -1, flag_prioritized_safety |

关键：私自带资料必须有短期诱惑，但它应锁死“完整归国”和“留下支援”。

---

### 5.7 D8_K1：最后家书

| 选项 | 建议效果 |
|---|---|
| 写完整家书，告诉家人准备启程 | responsibility +1, homesickness +1, returnTendency +1, flag_family_told_departure |
| 只写简短平安信，把精力留给现实准备 | wellbeing +1, documents +1 |
| 夹入兰英的画和技术笔记 | homesickness +1, technicalMaterials +1, stayTendency +1, flag_family_tech_note |

---

## 6. 结局条件重构

### 6.1 完整归国

推荐条件：

```text
route >= 1
documents >= 1
technicalMaterials >= 1
contact >= 1
knowledge >= 6
responsibility >= 6
reliableCount >= 2
returnTendency >= 2
not flag_restricted_materials
```

---

### 6.2 同伴协助归国

推荐条件：

```text
route >= 1
contact >= 1
reliableCount >= 1
returnTendency >= 1
not flag_restricted_materials
```

---

### 6.3 仓促归国

保留 fallback，但根据状态决定内部文本：

| 状态 | 文本方向 |
|---|---|
| route = 0 | 路线不明，启程更像赌博 |
| documents = 0 | 票证不全，旅途屡次受阻 |
| reliableCount = 0 | 没有人能真正送他一程 |
| flag_restricted_materials | 资料成为沉重风险 |
| wellbeing <= 3 | 身心透支，归途带伤 |

---

### 6.4 留下支援

推荐条件：

```text
knowledge >= 6
responsibility >= 7
technicalMaterials >= 1
reliableCount >= 2
not flag_restricted_materials
并且满足以下任一：
stayTendency >= 1
flag_public_tech_value
flag_accepted_long_term_research
```

---

### 6.5 继续研究

推荐条件：

```text
stayTendency >= 2 OR flag_accepted_long_term_research
```

如果不满足仍选择留下，则走“等待时机”或“被迫暂留”文本，而不是完整“继续研究”。

---

### 6.6 等待时机

保留 fallback，但文本分层：

| 状态 | 文本方向 |
|---|---|
| returnTendency 高 | 强烈遗憾，知道自己想走但没准备好 |
| stayTendency 高 | 主动暂缓，等待更成熟成果 |
| wellbeing 低 | 身心透支，不得不等 |
| reliableCount 低 | 关系孤立，缺少可托付的人 |

---

## 7. 新增最终准备报告场景

建议在最终归国/留下二选一之前新增一个无选择状态反馈场景：

```text
d8_readiness_report
```

固定文本：

```text
出发前，沈怀远重新清点了手中的东西：路线、票证、资料、联系人、还能信任的人。有些已经准备好，有些仍然空缺。这些空缺不会阻止他做选择，却会改变选择抵达的地方。
```

作用：

```text
让玩家在最终选择前感到自己的前面选择真的被系统记住了。
```

---

## 8. Journey Review 深度化

建议在 journey_review 中根据关键 flags 增加回顾条目。

### 技术伦理回顾

```text
如果 flag_concealed_lab_anomaly:
早年的一次隐瞒让他明白，技术上的侥幸会在更远处变成风险。

如果 flag_factory_rushed_delivery:
工厂里的那批设备后来常常出现在他的记忆里。按期完成并不总等于完成得正确。

如果 flag_clean_materials:
他带走的资料不算最多，却足够干净。那让他在多年后仍能坦然翻开那些笔记。

如果 flag_restricted_materials:
有些资料确实被带上了路，但它们不再只是成果，也成了阴影。
```

### 人物关系回顾

```text
如果 trust.chen >= 7:
陈绍衡没有替他决定方向，却让他知道路不是等出来的。

如果 trust.nadya >= 7:
娜佳没有把他留在异乡。她只是帮他把电波调得更清楚。

如果 trust.belov >= 7:
别洛夫给他的不是许可，而是一条关于边界的提醒。

如果 trust.ivan >= 7:
伊万留下的不是大道理，而是一种关于机器和人的朴素判断。
```

---

## 9. 最小可执行版本

如果时间不够，P3C 只做以下 5 件事也能明显提升深度：

```text
1. 修复 contact 无法获得的问题。
2. 让 returnTendency / stayTendency 进入结局条件。
3. 给 D7_K1 私自带资料添加 flag_restricted_materials，并锁定高级结局。
4. 给 D1/D2 坏选择添加短期收益 + 长期污点 flag。
5. 在最终选择前新增 d8_readiness_report。
```

---

## 10. P3C 完成标准

完成后应满足：

```text
1. 完整归国可达，但需要持续准备。
2. 高级留下可达，但需要学识、担当和资料。
3. 仓促归国仍可选，但代价明显。
4. 等待时机仍可选，但不再像免费结局。
5. contact 至少有 2–3 个获取方式。
6. returnTendency/stayTendency 至少影响 3 个最终选项。
7. restrictedMaterials 能明显影响结局。
8. journey_review 至少能根据 6 个 flags 显示差异。
9. 关键选择不再只有明显正确答案。
10. 测试覆盖所有结局变体可达性。
```
