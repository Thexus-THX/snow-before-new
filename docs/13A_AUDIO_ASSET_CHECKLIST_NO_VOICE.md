# 《雪落之前》P2B 无配音版音频素材清单

> 本清单给用户制作/提供音频用。  
> 不要让 CodeBuddy 擅自生成、下载、替换或改名音频文件。  
> 本阶段不做配音，因此没有 `voice/` 文件需求。

---

## 目录结构

请将文件放入：

```text
public/assets/audio/
├── bgm/
├── ambience/
└── sfx/
```

格式建议：

```text
.ogg
44.1kHz 或 48kHz
BGM 可循环
环境音可无缝循环
SFX 短小、干净、无明显现代电子音色
```

---

# 一、BGM：8 首新增

已有：

```text
public/assets/audio/bgm/bgm_00_title.ogg
```

需要新增：

| 文件名 | 用途 | 氛围要求 |
|---|---|---|
| `bgm_01_prologue_station.ogg` | 创作说明、时间说明、序章车站 | 冷冽、远行、低沉火车感、轻微苏联年代感 |
| `bgm_02_lab_spring.ogg` | 第一日实验室、第五日成果展示 | 克制、理性、轻微希望感、低音无线电氛围 |
| `bgm_03_factory_summer.ogg` | 第二日工厂 | 工业节奏、机械感、压迫但不吵 |
| `bgm_04_autumn_letter.ogg` | 第三日秋、家书、思乡 | 纸张、旧信、温柔但克制 |
| `bgm_05_winter_field.ogg` | 第四日雪地、第八日风雪 | 冷风、空旷、犹豫、命运感 |
| `bgm_06_lugouqiao_tension.ogg` | 第六日卢沟桥、第七日筹备 | 新闻、电波、紧张、历史压迫感，不要战斗音乐 |
| `bgm_07_ending_return.ogg` | 《电波归途》 | 克制的希望、归途、火车、风雪后微光 |
| `bgm_08_ending_foreign_lamp.ogg` | 《异乡长灯》 | 安静、遗憾、长灯、异乡感，不要悲情过满 |

---

# 二、环境音 Ambience：6 个循环

| 文件名 | 用途 | 要求 |
|---|---|---|
| `amb_station_winter_loop.ogg` | 车站、序章、风雪月台 | 远处火车、低风声、人声极轻，循环自然 |
| `amb_lab_radio_loop.ogg` | 实验室、无线电、成果展示 | 低频机器、电流声、轻微无线电噪声 |
| `amb_factory_machines_loop.ogg` | 工厂 | 机械、金属、远处装配线，不要过响 |
| `amb_snowfield_wind_loop.ogg` | 雪地测试站、第八日风雪 | 冷风、空旷、少量电线/木屋声 |
| `amb_dorm_quiet_loop.ogg` | 宿舍、家书、夜谈 | 静夜、纸张、远处城市声，很轻 |
| `amb_archive_room_loop.ogg` | 档案室、图书馆 | 翻纸、空间静音感、轻微脚步或木质回声 |

---

# 三、音效 SFX：8 个

| 文件名 | 用途 | 要求 |
|---|---|---|
| `sfx_ui_click.ogg` | 普通点击 | 低调纸质/木质点击，不要现代按钮音 |
| `sfx_choice_confirm.ogg` | 关键选择确认 | 稍重、像印章/机械卡扣，克制 |
| `sfx_choice_locked.ogg` | 锁定选项点击 | 轻微阻断感，不刺耳 |
| `sfx_letter_open.ogg` | 打开家书 | 信封/纸张展开 |
| `sfx_page_turn.ogg` | 家书翻页 | 干净短纸页声 |
| `sfx_radio_static_short.ogg` | 电波/新闻切入 | 短无线电杂音，不要太尖 |
| `sfx_train_whistle_distant.ogg` | 车站/结局远处汽笛 | 远、冷、带空间感 |
| `sfx_stamp_paper.ogg` | 历史事件页/档案落印 | 纸张+印章/落印感 |

---

# 四、不做配音

本阶段不需要：

```text
voice_01_opening_narration.ogg
voice_02_mother_letter.ogg
voice_03_lugouqiao_monologue.ogg
voice_04_nadya_farewell.ogg
voice_05_ending_return.ogg
voice_06_ending_lamp.ogg
```

这些可以留到未来 P2C 或最终润色阶段。

---

# 五、整体声音风格

关键词：

```text
1930年代
苏联工业感
旧电台
风雪
纸张档案
克制叙事
低频温暖
轻微时代感
不要现代电子舞曲
不要影视大片过度煽情
不要战斗游戏音乐
不要过亮的动漫风
```

建议所有 BGM 都能无缝循环，长度 60-120 秒即可。
