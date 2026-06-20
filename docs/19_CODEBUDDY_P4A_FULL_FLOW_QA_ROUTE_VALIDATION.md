# 《雪落之前》P4A：完整试玩 QA 与结局路线验收

> 适用仓库：`https://github.com/Thexus-THX/snow-before-new.git`  
> 工作分支：`develop`  
> 前置阶段：P3C 已完成，commit `6549eaa` 已推送到 `develop`  
> 当前阶段性质：全流程质量验收 + 路线可达性测试 + 小范围 bugfix  
> 明确不做：新增剧情、扩写文本、调整数值平衡、新增素材、部署、答辩材料

---

## 0. 开始前必须确认

本阶段统一以 `develop` 为最新开发分支。

开始前执行：

```bash
git fetch origin
git checkout develop
git pull --rebase origin develop
git branch --show-current
git log --oneline -5
npm ci
npm run check
npm run build
```

`git branch --show-current` 必须输出：

```text
develop
```

最近提交中应能看到：

```text
6549eaa
```

如果没有看到 P3C commit，不要继续，先汇报。

---

# 1. 本阶段目标

P3C 已经完成选择、数值与结局深度重构。P4A 的目标不是继续加内容，而是验证：

```text
1. 六条主要路线都能正常打通。
2. P3C 新增 flags、contact、returnTendency、stayTendency 真实生效。
3. 高级结局有门槛，fallback 结局不卡死。
4. d8_readiness_report 正确出现在最终选择前。
5. journey_review 能根据玩家选择变化。
6. 新增 D7_K1 第四选项不会破坏布局和选择逻辑。
7. BGM、存档、回滚、历史记录、设置页都不被 P3C 破坏。
```

---

# 2. 绝对禁止事项

本阶段不要：

```text
新增剧情节点
删除剧情节点
重命名 scene.id
新增选择
删除选择
重写数值系统
大幅调整结局条件
新增主结局
新增美术素材
新增音频素材
新增 UI 素材
修改 BGM / Ambience / SFX 逻辑
修改角色立绘
修改背景图
改存档结构
改回滚底层
部署上线
制作答辩材料
```

本阶段只允许：

```text
1. 修复断链、不可达、条件错误等 bug。
2. 修复明显布局问题。
3. 修复文本错别字和标点小问题。
4. 修复测试遗漏。
5. 修复 journey_review 回顾条件显示错误。
6. 修复 d8_readiness_report 不出现或位置错误。
7. 更新 PROGRESS.md。
```

如果发现数值平衡需要大改，只记录到 `docs/P4A_QA_FINDINGS.md`，不要直接大改。

---

# 3. 必查路线

必须验证 6 条路线。

## 3.1 完整归国路线

目标：

```text
进入《电波归途》的高级/完整归国变体。
```

建议条件：

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

重点检查：

```text
1. contact 能通过 D6_K1_A / D7_C1_A / D8_C1_B 获得。
2. returnTendency >= 2 后高级归国选项可解锁。
3. 没有 flag_restricted_materials 时高级归国可选。
4. 选择后进入正确结局和正确 journey_review。
```

---

## 3.2 同伴协助归国路线

目标：

```text
进入《电波归途》的同伴协助变体。
```

建议条件：

```text
route >= 1
contact >= 1
reliableCount >= 1
returnTendency >= 1
not flag_restricted_materials
```

重点检查：

```text
1. 只要有一个可靠同伴，应可触发协助归国。
2. 陈绍衡初始 6，只需 +1 达到可靠，应验证可达。
3. flag_restricted_materials 存在时应锁定或降级。
```

---

## 3.3 仓促归国路线

目标：

```text
准备不足也能进入《电波归途》的仓促归国变体。
```

重点检查：

```text
1. fallback 不会被全部锁死。
2. 准备不足时文本体现代价。
3. route = 0 / documents = 0 / reliableCount = 0 等情况应有不同回响，至少 journey_review 不能像完美归国。
4. 如果携带受限资料，应显示风险或阴影。
```

---

## 3.4 留下支援路线

目标：

```text
进入《异乡长灯》的高级“留下支援”变体。
```

建议条件：

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

重点检查：

```text
1. 高担当 + 高学识 + 技术资料能解锁。
2. 私自带受限资料后应锁定。
3. 留下支援文本不能像失败结局，应体现主动选择和远程支援。
```

---

## 3.5 继续研究路线

目标：

```text
进入《异乡长灯》的继续研究变体。
```

建议条件：

```text
stayTendency >= 2 OR flag_accepted_long_term_research
```

重点检查：

```text
1. D4 接受长期研究邀请后，应能进入更完整的继续研究文本。
2. stayTendency 多次积累后，应能支持继续研究。
3. 如果没有任何留下倾向，继续研究不应像主动选择，应降级或转向等待时机。
```

---

## 3.6 等待时机路线

目标：

```text
进入《异乡长灯》的等待时机 / 暂缓变体。
```

重点检查：

```text
1. fallback 不会被锁死。
2. 如果 returnTendency 高但准备不足，文本应有遗憾。
3. 如果 wellbeing 低，文本应体现身心透支。
4. 如果 reliableCount 低，文本应体现关系孤立。
```

---

# 4. P3C 重点回归检查

## 4.1 contact 修复

必须写测试或脚本验证：

```text
D6_K1_A -> contact +1
D7_C1_A -> contact +1
D8_C1_B -> contact +1
```

不能只看文本，要看实际 state/effects。

---

## 4.2 21 个 flags

检查：

```text
1. 所有 flags 命名一致。
2. 所有 flags 能被写入 save state。
3. 结局条件读取的是同一批 flags。
4. journey_review 读取的是同一批 flags。
5. 不存在拼写不一致导致永远不触发的 flag。
```

---

## 4.3 D7_K1 第四选项

检查：

```text
1. 四个选项都能显示。
2. 选项面板不溢出、不遮挡。
3. 键盘/鼠标选择正常。
4. 回滚后第四选项状态正确。
5. 第四选项效果符合 P3C 设计。
```

---

## 4.4 d8_readiness_report

检查：

```text
1. 最终选择前必定出现。
2. 不重复出现。
3. 回滚后不会跳过。
4. 文本清楚提醒路线、票证、资料、联系人、同伴等准备状态。
5. BGM 不因该节点反复重启。
```

---

## 4.5 journey_review

至少验证以下回响：

```text
flag_concealed_lab_anomaly
flag_factory_rushed_delivery
flag_clean_materials
flag_restricted_materials
trust.chen >= 7
trust.nadya >= 7
trust.belov >= 7
trust.ivan >= 7
```

要求：

```text
1. 不同路线的 journey_review 不应完全一样。
2. 风险选择应有回响。
3. 可靠同伴应有回响。
4. 受限资料 flag 应明显影响回顾。
```

---

# 5. 自动测试要求

新增或扩展测试文件，建议：

```text
src/content/__tests__/p4aRouteValidation.test.ts
src/engine/__tests__/endingRouteSimulation.test.ts
src/engine/__tests__/choiceEffectRegression.test.ts
```

至少覆盖：

```text
1. 完整归国可达。
2. 同伴协助归国可达。
3. 仓促归国可达。
4. 留下支援可达。
5. 继续研究可达。
6. 等待时机可达。
7. flag_restricted_materials 锁定高级归国。
8. flag_restricted_materials 锁定留下支援。
9. contact 三条来源都有效。
10. returnTendency 影响归国高级选项。
11. stayTendency 影响留下高级选项。
12. D7_K1 第四选项存在并有效。
13. d8_readiness_report 可达且位于最终选择前。
14. journey_review 根据至少 4 种 flags 变化。
15. 所有 nextSceneId 有效。
16. 所有场景可达或明确标记为条件分支可达。
17. npm run check 通过。
18. npm run build 通过。
```

---

# 6. 手动 QA 记录

新增或更新：

```text
docs/P4A_QA_FINDINGS.md
```

记录格式：

```text
# P4A QA Findings

## 环境
- 分支：
- commit：
- 浏览器：
- 日期：

## 路线结果

### 完整归国
- 是否可达：
- 使用关键选择：
- 是否有异常：
- journey_review 是否匹配：

### 同伴协助归国
- 是否可达：
- 使用关键选择：
- 是否有异常：
- journey_review 是否匹配：

### 仓促归国
- 是否可达：
- 使用关键选择：
- 是否有异常：
- journey_review 是否匹配：

### 留下支援
- 是否可达：
- 使用关键选择：
- 是否有异常：
- journey_review 是否匹配：

### 继续研究
- 是否可达：
- 使用关键选择：
- 是否有异常：
- journey_review 是否匹配：

### 等待时机
- 是否可达：
- 使用关键选择：
- 是否有异常：
- journey_review 是否匹配：

## Bug 列表
| 等级 | 问题 | 位置 | 是否已修 |
|---|---|---|---|

## 暂不处理的问题
| 问题 | 原因 | 后续阶段 |
|---|---|---|
```

---

# 7. PROGRESS.md 更新要求

完成后更新：

```text
### ✅ P4A 完整试玩 QA 与结局路线验收（日期）
```

写明：

```text
验证路线数量
完整归国是否可达
同伴协助归国是否可达
仓促归国是否可达
留下支援是否可达
继续研究是否可达
等待时机是否可达
contact 修复复核结果
flag_restricted_materials 锁定复核结果
d8_readiness_report 复核结果
journey_review 变化复核结果
新增/修改测试数量
npm run check 结果
npm run build 结果
是否新增剧情：否
是否新增素材：否
是否部署：否
```

---

# 8. 完成命令

执行：

```bash
npm run check
npm run build
git status
git diff --stat
```

如果有修复或文档更新：

```bash
git add .
git commit -m "完成全流程路线验收与QA修复"
git push origin develop
```

如果没有任何代码或文档变化，只需汇报无需 commit。

---

# 9. 完成报告格式

完成后必须汇报：

```text
1. 当前分支
2. 当前 commit
3. 是否产生新 commit
4. 六条路线可达性结果
5. contact 复核结果
6. 21 flags 复核结果
7. D7_K1 第四选项验收结果
8. d8_readiness_report 验收结果
9. journey_review 差异验收结果
10. 修复的 bug 列表
11. 暂不处理的问题
12. 新增/修改测试数量
13. npm run check 结果
14. npm run build 结果
15. 是否新增剧情：必须为否
16. 是否新增素材：必须为否
17. 是否部署：必须为否
18. 遗留风险
```
