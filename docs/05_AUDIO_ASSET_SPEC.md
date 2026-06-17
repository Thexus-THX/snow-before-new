# 《雪落之前》V1 音效、音乐与关键配音规范

## 一、声音方向

整体声音应克制、历史感强、不过度英雄化。

关键词：

- 无线电杂音。
- 纸张与笔尖。
- 工厂机械节奏。
- 风雪与车站。
- 室内木质空间。
- 少量弦乐、钢琴、手风琴或低调民族化音色。
- 避免现代电子鼓、电影预告片式轰鸣和过度煽情合唱。

V1 只做关键句配音，不做全流程角色配音。

---

## 二、音频格式

- 首选：`.ogg`。
- 备选：`.mp3`。
- 背景音乐和环境音应可循环时提供无明显断点版本。
- 所有文件需标准化响度，避免切换时音量突变。
- 语音与音效不得内嵌在视频中。

---

## 三、背景音乐文件名

目录：

```text
public/assets/audio/bgm/
```

| 文件名 | 建议时长 | 使用场景 | 描述 |
|---|---:|---|---|
| `bgm_00_title.ogg` | 80—120秒循环 | 标题页 | 冬夜、远方车站与未完成旅途，旋律克制。 |
| `bgm_01_prologue.ogg` | 90—120秒循环 | 序章 | 初到异乡，轻微陌生感与希望。 |
| `bgm_02_spring_research.ogg` | 100—150秒循环 | 第一、第五日 | 理性、清澈、研究与春日光线。 |
| `bgm_03_summer_factory.ogg` | 100—150秒循环 | 第二日 | 机械节奏与暖色活力，不要过度工业噪声。 |
| `bgm_04_autumn_letter.ogg` | 100—150秒循环 | 第三日、部分第七日 | 秋日、家书、含蓄思念。 |
| `bgm_05_winter_snow.ogg` | 100—150秒循环 | 第四、第八日 | 风雪、停顿与未决定的道路。 |
| `bgm_06_historical_turn.ogg` | 90—130秒循环 | 第六、第七日 | 低频紧张、无线电与局势改变，不要英雄化。 |
| `bgm_07_ending_return.ogg` | 90—150秒 | 《电波归途》 | 含克制希望与远行感。 |
| `bgm_08_ending_stay.ogg` | 90—150秒 | 《异乡长灯》 | 稳定、温暖但带无法消散的遗憾。 |

音乐切换使用 0.8—1.5 秒淡入淡出，不得硬切。

---

## 四、环境音文件名

目录：

```text
public/assets/audio/ambience/
```

| 文件名 | 类型 | 使用场景 |
|---|---|---|
| `amb_lab_hum_loop.ogg` | 循环 | 实验室设备低频与室内空间 |
| `amb_factory_floor_loop.ogg` | 循环 | 工厂装配线与机械运转 |
| `amb_library_room_loop.ogg` | 循环 | 图书馆轻微翻页、远处脚步 |
| `amb_dorm_night_loop.ogg` | 循环 | 宿舍夜晚、窗外风声 |
| `amb_radio_static_loop.ogg` | 循环 | 无线电接收和重大消息前后 |
| `amb_winter_wind_loop.ogg` | 循环 | 雪地测试、第八日风雪 |
| `amb_station_winter_loop.ogg` | 循环 | 冬季车站、列车与远处广播 |
| `amb_postoffice_room_loop.ogg` | 循环 | 邮局、木柜和纸张声 |
| `amb_exhibition_hall_loop.ogg` | 循环 | 成果展示现场低声交谈 |
| `amb_archive_room_loop.ogg` | 循环 | 档案室、纸张、抽屉与脚步 |

环境音默认音量低于背景音乐，不得盖过文字和配音。

---

## 五、UI 与事件音效

目录：

```text
public/assets/audio/sfx/
```

| 文件名 | 用途 |
|---|---|
| `sfx_ui_confirm.ogg` | 普通按钮确认 |
| `sfx_ui_back.ogg` | 返回与取消 |
| `sfx_ui_locked.ogg` | 点击锁定选项 |
| `sfx_critical_choice.ogg` | 关键选择二次确认，短促克制 |
| `sfx_status_change.ogg` | 显性数值高亮变化 |
| `sfx_letter_unfold.ogg` | 家书纸张展开 |
| `sfx_letter_fold.ogg` | 收起家书 |
| `sfx_page_turn.ogg` | 家书翻页 |
| `sfx_pen_write.ogg` | 回信结果或告别信提示 |
| `sfx_newspaper_open.ogg` | 历史事件页打开 |
| `sfx_radio_tune.ogg` | 调频、确认消息 |
| `sfx_radio_signal_found.ogg` | 找到清晰信号 |
| `sfx_train_distant.ogg` | 第八日或结局远处列车 |
| `sfx_snow_step.ogg` | 雪地脚步，少量使用 |
| `sfx_auto_save.ogg` | 自动保存提示，音量很低 |

不要为每次点击都播放明显音效，避免疲劳。

---

## 六、关键句配音文件名

目录：

```text
public/assets/audio/voice/
```

### 1. 开场旁白

文件：

```text
voice_narrator_opening.ogg
```

文本：

> 有些选择发生在一日之内，有些选择，要经过四季才能看清。

要求：中性、克制、稍慢，不要预告片腔。

### 2. 母亲家书

文件：

```text
voice_mother_letter.ogg
```

文本：

> 家中诸事，你不必过分挂心，只管把该学的本事学好。

要求：朴素、温和、年长女性，不现代播音腔。

### 3. 卢沟桥事变后的沈怀远

文件：

```text
voice_shen_after_lugouqiao.ogg
```

文本：

> 从这一夜起，每一道电波，似乎都指向了故乡。

要求：压低情绪，先停顿，再说后半句。

### 4. 娜佳告别

文件：

```text
voice_nadya_farewell.ogg
```

文本：

> 无论你走向哪里，别让那些电波只剩下回声。

要求：中文为主，可有极轻微俄语口音，但必须自然，不做夸张模仿。

### 5. 《电波归途》结尾

文件：

```text
voice_ending_return.ogg
```

文本：

> 雪落之前，他把异乡学得的本事，带回了需要它的地方。

要求：克制希望，不做高亢英雄式朗诵。

### 6. 《异乡长灯》结尾

文件：

```text
voice_ending_stay.ogg
```

文本：

> 异乡的灯终年未熄，而那场未竟的归途，也从未真正远去。

要求：平静、留白、带轻微遗憾。

---

## 七、章节音频使用建议

| 章节 | BGM | 环境音 | 重点音效 |
|---|---|---|---|
| 标题页 | `bgm_00_title.ogg` | `amb_station_winter_loop.ogg` | 无 |
| 序章 | `bgm_01_prologue.ogg` | `amb_station_winter_loop.ogg` | 家书展开 |
| 第一日 | `bgm_02_spring_research.ogg` | `amb_lab_hum_loop.ogg` | 调频、状态变化 |
| 第二日 | `bgm_03_summer_factory.ogg` | `amb_factory_floor_loop.ogg` | 机械停顿、关键选择 |
| 第三日 | `bgm_04_autumn_letter.ogg` | 邮局或宿舍环境 | 家书展开、翻页、笔尖 |
| 第四日 | `bgm_05_winter_snow.ogg` | `amb_winter_wind_loop.ogg` | 雪地脚步、调频 |
| 第五日 | `bgm_02_spring_research.ogg` | `amb_exhibition_hall_loop.ogg` | 设备启动 |
| 第六日 | `bgm_06_historical_turn.ogg` | `amb_radio_static_loop.ogg` | 报纸打开、信号确认 |
| 第七日 | `bgm_06_historical_turn.ogg` 或秋日曲 | `amb_archive_room_loop.ogg` | 抽屉、纸张、门声 |
| 第八日 | `bgm_05_winter_snow.ogg` | `amb_station_winter_loop.ogg` | 家书、列车、关键选择 |
| 电波归途 | `bgm_07_ending_return.ogg` | 远处列车 | 结尾语音 |
| 异乡长灯 | `bgm_08_ending_stay.ogg` | 研究室低频 | 结尾语音 |

---

## 八、音量设置

设置页只需提供：

- 主音量。
- 音乐音量。
- 音效音量。
- 语音音量。
- 静音。

V1 不做复杂均衡器。

---

## 九、缺失文件处理

若音频尚未提供：

- 游戏继续运行。
- 控制台输出一次 warning。
- 不重复报错。
- 不自动寻找其他名称的音频。
- 用户按本文件名补齐后，无需改代码即可生效。
