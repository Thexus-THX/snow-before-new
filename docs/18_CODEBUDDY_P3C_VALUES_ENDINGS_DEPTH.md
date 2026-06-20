# 《雪落之前》P3C：选择、数值与结局深度重构 CodeBuddy 提示词

> 适用仓库：`https://github.com/Thexus-THX/snow-before-new.git`  
> 工作分支：`develop`  
> 输入设计文档：`docs/17_STORY_SYSTEM_DEPTH_REDESIGN.md`  
> 本阶段性质：机制深度优化  
> 明确不做：新增美术、音频、主结局、大量新剧情、UI 大改

---

## 0. 开始前

```bash
git fetch origin
git checkout develop
git pull --rebase origin develop
git branch --show-current
npm ci
npm run check
```

必须在 `develop` 分支。

先阅读：

```text
PROGRESS.md
docs/17_STORY_SYSTEM_DEPTH_REDESIGN.md
src/content/game-data.json
src/content/__tests__/
src/engine/gameEngine.ts
src/app/stores/gameStore.ts
src/schemas/types.ts
src/schemas/gameSchema.ts
```

---

## 1. 本阶段目标

玩家反馈当前剧情、数值、结局“玩起来没什么深度”。P3C 要解决的不是再加文字，而是让选择真正产生代价和回响。

重点完成：

```text
1. 修复 contact 无法获得的问题。
2. 让 returnTendency / stayTendency 真正影响结局。
3. 让坏选择拥有短期收益 + 长期风险。
4. 增加 flags，用于结局锁定和 journey_review 回响。
5. 重构结局变体条件，让高级结局更有门槛。
6. 保留 fallback 结局，但让准备不足产生明显文本代价。
7. 增加最终准备报告场景 d8_readiness_report。
8. 增加结局回顾差异，不新增主结局。
```

---

## 2. 严格禁止

不要：

```text
新增美术素材
新增音频素材
新增主结局
新增大量剧情节点
重命名 scene.id
删除 scene
删除选择
改 UI 大布局
改存档/回滚底层
改 BGM/SFX/环境音逻辑
```

允许：

```text
修改 choice effects
新增 flags
调整 ending conditions
新增 1 个最终准备报告场景
增强 journey_review 条件文本
更新测试
更新 PROGRESS.md
```

---

## 3. 必做修改

### 3.1 修复 contact

为以下选择增加 contact：

```text
D6_K1_A：contact +1
D7_C1_A：contact +1
D8_C1_B：contact +1
```

并确保完整归国条件中的 `contact >= 1` 可达。

---

### 3.2 新增重要 flags

至少实现：

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

---

### 3.3 关键选择效果调整

按 `docs/17_STORY_SYSTEM_DEPTH_REDESIGN.md` 第 5 节调整：

```text
D1_K1
D2_K1
D4_K1
D5_K1
D6_K1
D7_K1
D8_K1
```

要求：

```text
坏选择不要只有惩罚，也要有短期收益。
危险选择必须留下 flags。
合规选择要解锁高级结局。
归国/留下倾向要在关键节点明确增加。
```

---

### 3.4 结局条件重构

完整归国建议条件：

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

同伴协助归国建议条件：

```text
route >= 1
contact >= 1
reliableCount >= 1
returnTendency >= 1
not flag_restricted_materials
```

留下支援建议条件：

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

继续研究建议条件：

```text
stayTendency >= 2 OR flag_accepted_long_term_research
```

仓促归国、等待时机可以保留 fallback，但文本必须体现准备不足的代价。

---

### 3.5 新增最终准备报告场景

新增：

```text
d8_readiness_report
```

位置：

```text
d8_k2_final 前
```

或最终归国/留下二选一之前。

文本核心：

```text
出发前，沈怀远重新清点了手中的东西：路线、票证、资料、联系人、还能信任的人。有些已经准备好，有些仍然空缺。这些空缺不会阻止他做选择，却会改变选择抵达的地方。
```

---

### 3.6 Journey Review 增强

根据 flags 和 trust 增加差异化回顾。

至少覆盖：

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

不要新增主结局，只增强回顾文本。

---

## 4. 测试要求

新增或更新测试，至少覆盖：

```text
1. contact 可以通过 D6/D7/D8 获得。
2. 完整归国可达。
3. 完整归国会被 flag_restricted_materials 锁定。
4. 同伴协助归国可达。
5. 留下支援可达。
6. 继续研究需要 stayTendency 或 accepted_long_term_research。
7. 仓促归国 fallback 仍可达。
8. 等待时机 fallback 仍可达。
9. returnTendency 影响归国高级选项。
10. stayTendency 影响留下高级选项。
11. D1/D2 风险选择有短期收益和长期 flag。
12. journey_review 能根据 flags 变化。
13. 所有 nextSceneId 有效。
14. npm run check 通过。
15. npm run build 通过。
```

---

## 5. PROGRESS.md

更新：

```text
### ✅ P3C 选择数值与结局深度重构（日期）
```

写明：

```text
contact 修复情况
新增 flags 数量
调整关键选择数量
结局条件调整情况
是否新增主结局：否
是否新增素材：否
新增测试数量
npm run check 结果
npm run build 结果
```

---

## 6. 完成命令

```bash
npm run check
npm run build
git status
git diff --stat
git add .
git commit -m "重构选择数值与结局深度"
git push origin develop
```

完成后停止。
