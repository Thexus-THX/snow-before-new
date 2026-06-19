# 《雪落之前》P2A：无配音版音频底层系统

> 适用仓库：`https://github.com/Thexus-THX/snow-before-new.git`  
> 工作分支：`develop`  
> 本阶段性质：音频运行时底层开发  
> 音频范围：BGM + 环境音 + SFX  
> 本阶段明确不做：配音 / voice 资源接入 / 新增音频素材文件

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
docs/05_AUDIO_ASSET_SPEC.md
docs/07_DATA_SCHEMA.md

src/pages/TitlePage.tsx
src/pages/SettingsPage.tsx
src/app/stores/settingsStore.ts
src/app/stores/gameStore.ts
src/content/game-data.json
src/schemas/types.ts
src/schemas/gameSchema.ts
src/components/scenes/
src/components/game/
```

当前事实：

```text
已有标题 BGM：
public/assets/audio/bgm/bgm_00_title.ogg

当前只有标题页 BGM 就绪。
BGM 01-08、环境音、音效 SFX 尚未由用户提供。
本阶段不做配音。
```

---

# 1. 本阶段目标

建立统一音频系统，使后续用户提供 BGM、环境音和 SFX 后，可以通过配置接入场景。

P2A 只完成底层：

```text
统一 AudioManager
音频 manifest
BGM / ambience / SFX 三通道
分轨音量
全局静音
首次交互解锁播放
BGM 淡入淡出
环境音循环
SFX 可重叠播放
场景切换自动更新音频
缺失音频安全跳过
标题页迁移到统一 AudioManager
设置页控制所有音频通道
测试覆盖核心行为
```

本阶段完成后，游戏仍只保证标题 BGM 可播放；其他音频因文件尚未提供，应安全跳过，不得报错或白屏。

---

# 2. 严格禁止事项

本阶段不要：

- 创建新 Git 分支；
- 切换到 `feat/runtime-foundation-p0` 或其他分支；
- 新增任何 `.ogg` / `.mp3` / `.wav` 文件；
- 生成、下载、替换、重命名任何音频素材；
- 擅自新增 BGM、环境音、音效、配音文件名；
- 接入配音 voice；
- 修改已有图片、美术和 UI 素材；
- 修改剧情文本；
- 修改选择数量；
- 修改选择效果；
- 修改结局条件；
- 开发编辑器；
- 引入大型音频库；
- 使用 WebAudio 做过度复杂的混音系统。

如果发现需要音频素材：

```text
只在完成报告中列为“待用户提供音频素材”。
不要自行创建占位音频文件。
不要引用不存在的具体音频文件路径。
```

唯一允许直接引用的音频文件：

```text
/assets/audio/bgm/bgm_00_title.ogg
```

---

# 3. 建议文件结构

新增：

```text
src/audio/
├── audioTypes.ts
├── audioManifest.ts
├── AudioManager.ts
├── audioSceneMap.ts
├── useSceneAudio.ts
└── __tests__/
    ├── AudioManager.test.ts
    ├── audioManifest.test.ts
    └── useSceneAudio.test.ts
```

如果项目已有 `audioManager.ts`，不要简单重复造一个同名混乱文件。可以：

```text
1. 将旧 audioManager.ts 迁移到 src/audio/AudioManager.ts；
2. 保持一个兼容导出；
3. 更新 TitlePage / SettingsPage 的 import；
4. 删除或保留旧文件必须保证构建通过。
```

---

# 4. 音频类型设计

只启用三类通道：

```ts
type AudioChannel = "bgm" | "ambience" | "sfx";
```

可以在类型中预留：

```ts
type FutureAudioChannel = "voice";
```

但本阶段不得接入 voice 通道播放，不得要求配音文件，不得在 UI 中强制显示可用语音。

建议类型：

```ts
interface AudioAssetDefinition {
  id: string;
  channel: "bgm" | "ambience" | "sfx";
  src: string | null;
  loop?: boolean;
  optional?: boolean;
  defaultVolume?: number;
  fadeInMs?: number;
  fadeOutMs?: number;
  description?: string;
}

interface SceneAudioConfig {
  bgm?: string | null;
  ambience?: string[];
  enterSfx?: string | null;
}
```

要求：

- `src: null` 表示未来待接入素材；
- `optional: true` 表示文件缺失时不报错；
- 所有音量 clamp 到 0-1；
- 所有播放失败都要被捕获并静默降级；
- 控制台 warning 只能在开发环境输出。

---

# 5. audioManifest

本阶段只允许一个实际可播放文件：

```ts
{
  id: "bgm.title",
  channel: "bgm",
  src: "/assets/audio/bgm/bgm_00_title.ogg",
  loop: true,
  optional: false,
  defaultVolume: 0.8
}
```

其他计划音频可以只登记 ID，但不得写不存在的具体文件路径：

```ts
{
  id: "bgm.prologue",
  channel: "bgm",
  src: null,
  loop: true,
  optional: true,
  description: "待用户提供：序章车站 BGM"
}
```

允许预留的无配音版 ID：

```text
BGM:
bgm.title
bgm.prologue
bgm.spring_lab
bgm.factory
bgm.autumn_letter
bgm.winter_field
bgm.lugouqiao_tension
bgm.ending_return
bgm.ending_lamp

Ambience:
amb.station_winter
amb.lab_radio
amb.factory_machines
amb.snowfield_wind
amb.dorm_quiet
amb.archive_room

SFX:
sfx.ui_click
sfx.choice_confirm
sfx.choice_locked
sfx.letter_open
sfx.page_turn
sfx.radio_static_short
sfx.train_whistle_distant
sfx.stamp_paper
```

注意：

```text
这些只是逻辑 ID，不是资源文件名。
不得在 P2A 中写不存在的 /assets/audio/... 路径。
```

---

# 6. AudioManager 要求

实现单例 AudioManager，支持：

```text
playBgm(id)
stopBgm()
crossfadeBgm(id)
playAmbience(ids)
stopAmbience()
playSfx(id)
stopAll()
setMasterVolume(value)
setBgmVolume(value)
setAmbienceVolume(value)
setSfxVolume(value)
setMuted(boolean)
unlock()
```

### BGM

- 同一时间只允许一首 BGM；
- 播放同一首 BGM 时不重启；
- 切换 BGM 时淡出旧曲，淡入新曲；
- 标题 BGM 使用 loop；
- 浏览器阻止 autoplay 时，等待首次用户交互后重试；
- 页面 visibility hidden 时暂停或降低资源占用，visible 后按状态恢复。

### Ambience

- 支持循环；
- 场景切换时停止旧环境音，播放新环境音；
- 同一环境音重复请求不重启；
- P2A 由于无实际环境音文件，应只安全跳过。

### SFX

- 支持短音效重叠播放；
- 点击音效、确认音效、翻页音效如果没有素材，静默跳过；
- SFX 播放失败不得影响 UI。

### 缺失文件

- manifest 中 `src: null`：直接跳过；
- `optional: true` 文件加载失败：跳过；
- `optional: false` 文件失败：开发环境 warning，生产仍不白屏；
- 不允许未捕获 Promise rejection。

---

# 7. useSceneAudio

新增 hook：

```ts
useSceneAudio(scene)
```

职责：

- 根据当前 scene.id / chapterId / template 从 `audioSceneMap.ts` 找音频逻辑 ID；
- 调用 AudioManager 切换 BGM 和 ambience；
- 场景进入时可播放 enterSfx；
- 组件卸载或场景变化时清理不再需要的 ambience；
- 不直接读取 DOM；
- 不绕过 settingsStore。

### P2A 的 audioSceneMap

可以建立逻辑映射，但不得引用不存在的真实路径。

建议映射：

```text
title page -> bgm.title

note_creative_opening / note_time_structure / prologue_* -> bgm.prologue + amb.station_winter
day01 / day05 -> bgm.spring_lab + amb.lab_radio
day02 -> bgm.factory + amb.factory_machines
day03 / letter_* -> bgm.autumn_letter + amb.dorm_quiet
day04 / day08 -> bgm.winter_field + amb.snowfield_wind
day06 / event_1937_lugouqiao / day07 -> bgm.lugouqiao_tension
ending_electric_wave -> bgm.ending_return
ending_foreign_lamp -> bgm.ending_lamp
```

由于这些实际音频尚未提供，除 `bgm.title` 外，其余都应安全跳过。

---

# 8. TitlePage 迁移

当前标题页已有 BGM 播放逻辑。P2A 要求：

- 移除标题页内直接 `<audio>` 管理；
- 改用统一 `AudioManager.playBgm("bgm.title")`；
- 保留首次交互解锁；
- 保留页面切后台暂停/恢复逻辑，或迁移到 AudioManager 统一处理；
- 标题页按钮点击可尝试播放 `sfx.ui_click`，但无素材时静默跳过；
- 不影响标题页雪花、烟雾、灯光特效。

---

# 9. GamePage / SceneRenderer 接入

要求：

- 在 `GamePage` 或顶层场景渲染处调用 `useSceneAudio(currentScene)`；
- 不在每个具体 Scene 组件里重复写音频逻辑；
- LetterScene 翻页按钮可调用 `playSfx("sfx.page_turn")`，打开信件可调用 `playSfx("sfx.letter_open")`，但无素材时必须安全跳过；
- ChoicePanel 可调用：
  - 普通点击：`sfx.ui_click`
  - 关键确认：`sfx.choice_confirm`
  - 锁定点击：`sfx.choice_locked`
- HistoricalEventScene 可在进入时调用 `sfx.stamp_paper` 或 `sfx.radio_static_short`，但无素材时安全跳过。

本阶段不得为了音效修改选择逻辑。

---

# 10. SettingsPage / settingsStore

完善设置项：

```text
主音量 masterVolume
音乐 bgmVolume
环境音 ambienceVolume
音效 sfxVolume
静音 muted
文字速度 textSpeed
```

如果现在已有 `musicVolume` 命名，可以二选一：

```text
方案A：保留 musicVolume，但在 AudioManager 中作为 bgmVolume 使用；
方案B：迁移为 bgmVolume，并兼容旧 localStorage。
```

要求：

- 设置改动立即同步到 AudioManager；
- 设置存入 localStorage；
- 静音开关立即生效；
- 重开页面后设置保留；
- 本阶段不显示或禁用“语音”滑杆；
- 如果保留“语音”字段，只能标注“暂未启用”，不得要求 voice 资源；
- 不影响文字速度设置。

---

# 11. 测试

新增或扩展测试：

```text
src/audio/__tests__/AudioManager.test.ts
src/audio/__tests__/audioManifest.test.ts
src/audio/__tests__/useSceneAudio.test.ts
src/pages/__tests__/TitlePage.audio.test.tsx
src/pages/__tests__/SettingsPage.audio.test.tsx
```

覆盖：

```text
1. manifest 中只有 bgm.title 拥有真实 src
2. src:null 的 planned audio 不会触发网络加载
3. playBgm 同一 ID 不重复重启
4. crossfadeBgm 可切换状态
5. muted 后所有通道音量归零或暂停
6. master/bgm/ambience/sfx 音量 clamp 到 0-1
7. SFX 缺素材时不抛错
8. ambience 缺素材时不抛错
9. TitlePage 使用 AudioManager 播放 bgm.title
10. SettingsPage 改音量会调用 AudioManager
11. useSceneAudio 根据 scene id 返回正确逻辑音频 ID
12. 缺失音频不会导致未捕获 Promise rejection
13. 原有 P0/P1 测试全部继续通过
```

可使用 mock HTMLAudioElement，不依赖真实浏览器播放。

---

# 12. 手动验收

启动：

```bash
npm run dev
```

检查：

```text
1. 标题页 BGM 仍能播放
2. 浏览器阻止自动播放时，点击任意按钮后 BGM 可恢复
3. 设置页调主音量和音乐音量时，标题 BGM 音量变化
4. 静音开关生效
5. 进入游戏后不报错
6. 因其他 BGM/ambience/SFX 文件未提供，控制台不出现持续报错
7. 页面切后台/切回来，标题 BGM 状态正常
8. npm run check 通过
9. npm run build 通过
```

---

# 13. PROGRESS.md 更新要求

完成后更新：

```text
PROGRESS.md
```

新增：

```text
### ✅ P2A 无配音版音频底层系统（日期）
```

写明：

```text
AudioManager 实现状态
BGM / ambience / SFX 三通道状态
标题 BGM 迁移状态
设置页音量控制状态
manifest 中真实素材数量：1
manifest 中待用户提供素材数量
是否接入配音：否
是否新增音频文件：否
测试文件数量与测试用例数量
npm run check 结果
npm run build 结果
```

---

# 14. 完成命令

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
git commit -m "实现无配音版音频底层系统"
git push origin develop
```

完成后停止，不进入 P2B 音频素材接入。

---

# 15. 完成报告格式

完成后必须汇报：

```text
1. 当前分支
2. 新增文件
3. 修改文件
4. 是否新增音频素材：必须为否
5. 是否接入配音：必须为否
6. AudioManager 功能完成情况
7. TitlePage 迁移结果
8. SettingsPage 音量控制结果
9. manifest 真实音频数量与待提供数量
10. 新增测试数量与结果
11. npm run check 结果
12. npm run build 结果
13. 待用户提供的无配音音频素材清单
14. Git commit hash
15. 遗留风险
```
