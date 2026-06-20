# 《雪落之前》P5A-Day0：序章新增美术素材清单与生成提示词

> 本轮要把序章美术一起补上。  
> 你需要先人工生成/整理图片，再放入项目指定目录。  
> CodeBuddy 只负责检查并接入这些已存在的文件，不负责生成、下载或改名美术素材。

---

## 0. 本轮新增美术文件

请新增 3 张背景图，全部放入：

```text
public/assets/backgrounds/
```

文件名必须完全一致：

```text
bg_prologue_registration_station.webp
bg_prologue_radio_room_1931.webp
bg_prologue_dorm_first_night.webp
```

尺寸统一：

```text
1920 × 864
```

格式：

```text
.webp
```

---

## 1. 通用美术要求

所有图片必须符合《雪落之前》统一画风：

```text
高精度叙事像素插画风
1920–1937 历史背景
明显像素块面与像素边缘
电影感光影
低饱和冷色
旧档案叙事感
人物相对环境偏小
不要现代 3D
不要写实摄影
不要光滑数字油画
不要现代 UI
不要现代电器
```

硬性禁止：

```text
不要出现任何可读文字
不要出现数字
不要出现字母
不要出现标牌文字
不要出现文件名
不要出现现代广告牌
不要出现现代服装
不要出现现代灯具
不要出现党派标识
不要出现国旗/徽章等敏感符号
```

如果图里出现可读文字、乱码、标牌、现代物件，必须重新生成。

---

# 2. 素材一：车站登记窗口

## 文件名

```text
public/assets/backgrounds/bg_prologue_registration_station.webp
```

## 用途

用于新增场景：

```text
prologue_customs_and_registration
```

## 画面内容

1931 年苏联冬季车站内部或半室内登记窗口。  
几名留学生和旅客排队，手里拿着文件和行李。  
窗口后有工作人员、印章、纸张、木质柜台。  
画面重点是“陌生制度、登记、档案、身份确认”的压迫感。  
人物不要太大，主要表现空间和气氛。  
不需要沈怀远正脸，不需要明确角色立绘。

## 生成提示词

```text
1931 Soviet railway station registration counter, winter atmosphere, foreign students and travelers waiting in a quiet queue with suitcases and paper documents, old wooden counter, clerk behind glass, ink stamp, archival papers, cold dim interior light, heavy coats, snow visible near the entrance, historical institutional atmosphere, restrained cinematic composition, high-detail narrative pixel art, visible pixel edges, low saturation, dark archival color palette, 1920s-1930s Soviet setting, characters small compared to the environment, no readable text, no numbers, no letters, no signs, no modern objects, no flags, no logos, no propaganda symbols, 1920x864
```

## 中文辅助描述

```text
1931 年苏联冬季车站登记窗口，旧木质柜台、玻璃窗口、印章和纸张，几名旅客排队登记，行李箱和厚外套，门口有雪光，整体冷暗、压抑、旧档案感，高精度叙事像素插画风。画面不要出现任何文字、数字、字母、标牌、现代物件。
```

---

# 3. 素材二：1931 无线电教室

## 文件名

```text
public/assets/backgrounds/bg_prologue_radio_room_1931.webp
```

## 用途

用于新增场景：

```text
prologue_first_radio_room
```

## 画面内容

1931 年苏联无线电教室或基础实验室。  
房间里有老式无线电设备、旋钮、耳机、线圈、木桌、记录本。  
墙面和设备保持旧式工业感。  
灯光冷而克制，少量设备微光。  
画面重点是沈怀远第一次感受到“电波能越过距离”的主题。  
不要现代实验室，不要现代电脑，不要现代示波器。

## 生成提示词

```text
1931 Soviet radio classroom, old wireless communication equipment on wooden desks, vintage radio receivers, coils, cables, headphones, analog knobs, dim cold light, subtle warm glow from equipment, early 20th century technical training room, quiet and serious atmosphere, historical research environment, high-detail narrative pixel art, visible pixel edges, cinematic lighting, low saturation, dark blue gray and aged brass palette, no modern computers, no modern screens, no digital devices, no readable text, no numbers, no letters, no signs, no logos, no flags, 1920x864
```

## 中文辅助描述

```text
1931 年苏联无线电教室，木桌上摆着老式无线电接收机、线圈、耳机、旋钮和线缆，冷色灯光中有一点设备微光，安静、严肃、历史感强，高精度叙事像素插画风。不要现代电脑、现代屏幕、现代实验设备，不要任何文字、数字、字母。
```

---

# 4. 素材三：宿舍第一夜

## 文件名

```text
public/assets/backgrounds/bg_prologue_dorm_first_night.webp
```

## 用途

用于新增/润色场景：

```text
prologue_dorm_first_night
```

## 画面内容

1931 年苏联学生宿舍夜晚。  
窗外是雪光，房间里有窄床、旧木桌、台灯、行李箱。  
桌上可以有家书、纸张、俄文字母表的“视觉暗示”，但不能出现真实可读文字。  
整体情绪是异乡第一夜、安静、孤独、克制。  
不需要人物正脸，可以有很小的坐姿剪影，或者空房间。

## 生成提示词

```text
1931 Soviet student dormitory at night, first night in a foreign country, narrow bed, old wooden desk, small lamp, suitcase, folded family letter and study papers on the desk without readable writing, snow glow through the window, cold blue winter light mixed with dim warm lamp light, quiet loneliness, restrained emotional atmosphere, high-detail narrative pixel art, visible pixel edges, cinematic composition, low saturation, archival historical mood, no readable text, no numbers, no letters, no modern objects, no posters, no logos, no flags, 1920x864
```

## 中文辅助描述

```text
1931 年苏联学生宿舍第一夜，窄床、旧木桌、台灯、行李箱，桌上有家书和学习纸张但不能有可读文字，窗外雪光照进室内，冷蓝色夜色与微弱暖灯交织，孤独、克制、旧档案叙事感，高精度叙事像素插画风。
```

---

# 5. 生成后检查清单

每张图生成后检查：

```text
尺寸是否为 1920×864
是否为 .webp
文件名是否完全一致
是否没有可读文字/数字/字母
是否没有现代物件
是否没有奇怪标识
是否符合像素插画风
是否与现有背景明度、饱和度一致
人物是否没有过大
```

---

# 6. 放入仓库后的检查命令

在项目根目录执行：

```bash
ls public/assets/backgrounds/bg_prologue_registration_station.webp
ls public/assets/backgrounds/bg_prologue_radio_room_1931.webp
ls public/assets/backgrounds/bg_prologue_dorm_first_night.webp
```

三个文件都存在后，再执行 CodeBuddy 接入提示词：

```text
docs/20C_CODEBUDDY_DAY0_PROLOGUE_EXPANSION_WITH_ASSETS.md
```
