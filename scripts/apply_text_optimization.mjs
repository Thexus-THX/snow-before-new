/**
 * apply_text_optimization.mjs
 * 根据 docs/snow_before_player_text_optimized_v1_1.md 批量优化 game-data.json 文本
 */
import { readFileSync, writeFileSync } from "fs";

const data = JSON.parse(readFileSync("src/content/game-data.json", "utf8"));

// ============================================================
// 场景文本替换表（按场景 ID）
// ============================================================

const sceneTexts = {
  // ---- 序章 ----
  "prologue_train": {
    text: "1931 年末，一列火车缓缓驶入苏联境内。车窗外是连绵的雪原与陌生的站台。沈怀远抱紧行李箱，箱底夹层里，母亲临行前塞进的那封家书，是他此刻唯一熟悉的东西。"
  },
  "prologue_choice": {
    text: "月台上人声交错，搬运工推着行李车从身旁经过。陌生的俄语、煤烟与冷风一同涌来。沈怀远站在人群之间，手指扣紧行李箱把手。母亲的信还在夹层里；不远处，几名中国同学正低声交谈；长椅旁，一台无线电设备发出细微的电流声。"
  },
  "prologue_letter_result": {
    text: "沈怀远拆开信封。母亲的字迹工整而克制，只说家中一切尚可，要他安心求学。兰英在末尾添了两行小字，问异乡是不是常下雪。纸上的墨迹微微晕开，不知是旅途潮气，还是有人写信时停笔太久。"
  },
  "prologue_radio_result": {
    text: "他走向长椅，俯身观察那台无线电设备。面板上的俄文标识仍显陌生，旋钮转动时的阻尼却与书中描述相合。手指触到冰冷的金属外壳时，沈怀远忽然意识到，未来数年里，他最常相伴的也许正是这种低低的电流声。"
  },
  "prologue_people_result": {
    text: "他朝那几名同学走去。人群中，一位金发姑娘转过头来，用略带口音的中文向他问好。她说自己叫娜佳，也在学习无线电。她的笑容并不热烈，却有一种令人安心的笃定，像是早已知道他们会在这片雪地相遇。"
  },
  "prologue_time_skip": {
    chapterTitle: "时光流转",
    backgroundText: "从 1931 年到 1936 年，沈怀远在苏联度过了数年求学时光。无线电技术在他手中，渐渐从陌生的蜂鸣变成可以辨认的语言。而现在，1936 年春天，一场例行实验即将开始。",
    text: "五年后。"
  },

  // ---- 序章选项文本优化 ----
  // prologue_choice choices
  "P0_LETTER": { text: "先拆开母亲的来信" },
  "P0_RADIO": { text: "先观察那台无线电设备" },
  "P0_PEOPLE": { text: "主动与身边的同学攀谈" },

  // ---- 第一日 ----
  "d1_lab_intro": {
    text: "记录表里有一组数值不太对。你是先去看设备，还是和我把记录再核一遍？"
  },
  "d1_after_choice": {
    text: "实验开始不久，仪器面板上的读数出现了明显偏离。别洛夫导师还在隔壁房间，尚未注意到异常。沈怀远必须在进度、责任与风险之间，尽快做出判断。"
  },
  "d1_k1_failure": {
    text: "数据异常已经无法忽视。娜佳看了一眼仪表，眉头微蹙。走廊尽头传来别洛夫的脚步声。时间只够沈怀远做出一个决定。"
  },
  "d1_reported_result": {
    text: "你做得对。数据不会撒谎，人却会。今天你选择了诚实，这在研究中比任何技巧都重要。"
  },
  "d1_team_repair_result": {
    text: "问题比预想的复杂，但我们至少找到了原因。导师听完说明后点了点头。他说，知道何时求助，也是一种能力。"
  },
  "d1_concealed_result": {
    text: "演示勉强完成了。别洛夫事后检查数据时发现了偏差。他没有当场质问，只是沉默地合上记录本。沈怀远看得出，那目光里多了一层审视。"
  },
  "d1_end": {
    text: "一天结束。实验室的灯光逐一熄灭，走廊尽头的脚步声消失在夜色中。沈怀远收起记录表，心里却多了一份从前没有的分量。"
  },

  // ---- 第二日 ----
  "d2_factory_intro": {
    text: "离开安静的实验室后，沈怀远第一次走进莫斯科近郊的无线电设备工厂。装配线的轰鸣填满车间，工人们在机床与零件之间穿梭。伊万师傅站在生产线末端，抬手示意他过去。"
  },
  "d2_c1_factory": {
    text: "伊万指着装配线上的一排半成品，又看了一眼手中的检测记录。娜佳在旁翻着维修日志，抬头等他决定从哪里入手。"
  },
  "d2_k1_quality": {
    text: "一批无线电设备在最终检测中出现了信号波动。交付期限就在明天，厂方希望按期出货。伊万的表情很沉。沈怀远知道，眼前的问题不只是技术误差。"
  },
  "d2_full_reinspect_result": {
    text: "你是个认真的年轻人。工厂里许多人只盯着产量，你却还记得机器将被谁使用。我尊重这一点。"
  },
  "d2_risk_based_result": {
    text: "你比很多工程师都聪明。不是因为你找到了完美办法，而是因为你知道什么时候不能只追求完美。"
  },
  "d2_ignored_result": {
    text: "设备按期出厂了。伊万没有再多说，只把检测记录翻了过去。那一下很轻，却比任何责备都更让沈怀远难以忘记。"
  },
  "d2_end": {
    text: "工厂的机器声渐渐平息。离开时，沈怀远在门口回头看了一眼。那些冰冷的金属部件，原来也承载着人的判断与代价。"
  },

  // ---- 第三日 ----
  "d3_location_choice": {
    text: "一封迟到的家书穿过漫长路途，终于到了沈怀远手中。信封边角已经磨损，母亲的笔迹却仍然工整。今天他还能去一个地方——邮局，还是图书馆？"
  },
  "d3_c2_action": {
    text: "宿舍里，沈怀远摊开母亲的信。父亲收入减少，兰英的学费还要再设法。母亲仍劝他安心学习，不必急着回来，可字缝里的压力已经遮不住了。"
  },
  "d3_c3_reply": {
    text: "沈怀远拿起笔，准备给家里回信。母亲问他的近况，兰英问异乡是否常下雪。有些话可以说，有些话却不容易落到纸上。"
  },
  "d3_end": {
    text: "秋夜渐深，窗外的莫斯科已有凉意。沈怀远把写好的回信放在桌上，心中某个模糊的念头开始成形——有些牵挂不是催人立刻回头，而是让人想清楚，远行究竟为了什么。"
  },

  // ---- 第四日 ----
  "d4_field_intro": {
    text: "冬季无线电测试被安排在莫斯科郊外的临时站点。风雪比预想中更大，低温让设备变得不稳定，也让每个人的判断更难隐藏。"
  },
  "d4_c1_field": {
    text: "信号异常点出现在远处。风雪越下越紧，娜佳在临时站里重新计算数据，伊万教过的现场排查方法也在沈怀远脑海中浮现。"
  },
  "d4_k1_invitation": {
    text: "怀远，你在测试中表现出的判断力，已经超出了我对一个学生的期待。我想邀请你加入一个长期研究项目。它需要数年时间，但成果会影响未来的通信技术。"
  },
  "d4_end": {
    text: "风雪渐息。离开测试站时，沈怀远回头望了一眼。那里已经为他留下一个位置。可他是否会选择留下，答案还要交给更长的时间。"
  },

  // ---- 第五日 ----
  "d5_showcase_intro": {
    text: "研究迎来了阶段性展示。沈怀远的前途从未如此清晰——导师进一步明确长期机会，而这次展示，也将决定外界如何看待他的工作。"
  },
  "d5_c1_showcase": {
    text: "展示就在明天。技术讲解还来得及再改一遍，设备演示也可以再排一次。你想先顾哪边？"
  },
  "d5_c2_tech_use": {
    text: "展示结束后，一位参观者问道：这项通信技术，最终将为谁服务？陈绍衡在旁微微皱眉，伊万放下手中的工具。这个问题，比技术本身更难回答。"
  },
  "d5_end": {
    text: "前途最明亮的一刻，第一丝不安也随之出现。陈绍衡与他的看法开始出现微妙差别。展示厅的灯光熄灭时，沈怀远注意到桌上有一封尚未拆开的国内来信。"
  },

  // ---- 第六日 ----
  "d6_news_intro": {
    text: "零碎消息最先从电波和报纸边角传来。实验室的指示灯仍一明一灭，空气中的气氛却已经变了。更多来源彼此印证之后，日常研究生活被时代打断。"
  },
  "d6_c1_source": {
    text: "消息尚未完全清晰。实验室的无线电设备能收到零碎信号，陈绍衡那里或许有最新报纸。沈怀远必须先确认，哪些消息是真的。"
  },
  "d6_k1_first_action": {
    text: "卢沟桥事变的消息已经确认。陈绍衡催他尽快判断下一步行动，导师提醒冲动会让多年研究落空，娜佳第一次意识到，\u201c回去\u201d也许意味着很长的分别。"
  },
  "d6_end": {
    text: "实验室的指示灯仍一明一灭。可从这一夜起，每一道电波似乎都指向了故乡。"
  },

  // ---- 第七日 ----
  "d7_preparation_intro": {
    text: "战事与天气都在收紧。归国不再是一句愿望，而是路线、票证、经费、资料与信任构成的现实问题。白天推进筹备，夜里真正的分歧也将浮出水面。"
  },
  "d7_c1_priority": {
    text: "时间有限。沈怀远只能优先处理一件事：与陈绍衡确认路线，通过学校补齐票证，与娜佳整理资料，或节省开支准备经费。"
  },
  "d7_k1_materials": {
    text: "夜里，沈怀远与陈绍衡爆发了真正的路线分歧。两人的目标仍然接近，判断却不再相同：是否立刻回去，是否先完成研究，是否带走尚未获准外传的资料。桌上的研究笔记提醒他，有些成果并不只属于个人。"
  },
  "d7_end": {
    text: "风暴前夜，行动与关系同时收紧。沈怀远至少已经做出了关于资料的选择。剩下的时间，只够告别与出发。"
  },

  // ---- 第八日 ----
  "d8_final_intro": {
    text: "风雪比预想中来得更早。路线可能中断，研究仍待交接，未说出口的话也只剩有限时间。这是最后的准备日。在离开或留下之前，沈怀远只能再处理一件事。"
  },
  "d8_c1_priority": {
    text: "在做出最终决定前，他还有时间处理最后一件事。导师的研究交接、与陈绍衡的路线确认、与娜佳的告别、行李与票证的整理——他只能选一样。"
  },
  "d8_k1_family": {
    text: "第三封家书静静躺在桌上。母亲的字迹依旧工整，通信与交通却已不再稳定。父亲没有催他回国，只提醒他对自己的选择负责。兰英的附笔也不似当年稚嫩。沈怀远拿起笔——这一次，他打算怎样回应？"
  },
  "d8_k2_final": {
    text: "一切准备都已就绪，或尚未就绪。风雪中的车站就在眼前。沈怀远站在月台上，知道接下来的选择将决定此后数年，乃至更久远的道路。先看清方向，再做最后的决定。"
  },
  "d8_final_return_options": {
    text: "归国的路不止一条，每条都有代价。准备越充分，路就越稳；准备越仓促，能带走的东西就越少。"
  },
  "d8_final_stay_options": {
    text: "留下并不等于逃避。沈怀远可以继续完成研究，设法把公开成果送回国内，也可以等待更安全的时机。"
  },

  // ---- 结局 ----
  "ending_electric_wave": {
    paragraphs: [
      "1938 年尾声，沈怀远抵达新的起点。",
      "他带回的并非传奇式的万能成果，而是可以被使用的技术经验、笔记、方法，以及一种更成熟的责任理解。",
      "列车驶过漫长雪原，窗外的风景从陌生重新变得熟悉。那些年在异国学得的本事，终于不再只属于实验室。",
      "有些选择发生在一日之内，有些选择，要经过四季才能看清。"
    ]
  },
  "ending_foreign_lamp": {
    paragraphs: [
      "沈怀远选择留下完成研究。时光流转，他取得了令人尊敬的技术成就，也拥有了相对安稳的生活。可时代没有停下来等他。",
      "研究室的灯终年未熄。在某些深夜，他仍会望向窗外的风雪，想起那条未竟的归途。",
      "异乡的灯照亮了他的学问，也照见了他心中始终没有远去的故乡。"
    ]
  },

  // ---- 旅程回顾与致谢 ----
  "journey_review": {
    chapterTitle: "旅程回顾",
    text: "旅程结束。感谢你陪伴沈怀远走过这段跨越风雪与岁月的旅程。\n\n那些选择、犹豫和告别，最终汇成了一条只属于你的路径。\n\n雪落之前，有人归去，有人留下。\n但每一个选择，都曾是风雪中真实的一步。"
  },
  "thank_you": {
    chapterTitle: "致谢",
    text: "本作取材于李强等二十世纪二三十年代留苏先辈的真实经历，并在史料基础上进行了艺术化重构。\n\n感谢你的游玩。\n\n雪落之前 · V1"
  }
};

// ============================================================
// 家书文本优化
// ============================================================

const letterTexts = {
  "letter_1931_winter_family": {
    date: "民国二十年冬",
    pages: [
      "你走以后，家中清静了许多。兰英每日放学回来，总要到你房里坐一会儿，翻翻你留下的书。她问我，哥哥那边是不是也下雪。我说是，雪大约比咱们这里还深。\n\n你父亲近来差事尚稳，每日早出晚归，话仍不多。偶尔提起你小时候拆收音机的事，他只说，那孩子从小坐得住，到了外头，是能学到真东西的。",
      "你在外求学，最要紧的是保重身体。学本事要稳，不要贪快。家里盼你有出息，也盼你平安。\n\n信封里夹了兰英描的一枝红梅。她说给你放在书里也好，枕边也好。纸薄，心意不薄。"
    ],
    postscript: "兰英问，那边的雪是不是一夜之间就能没过膝盖。",
    historyPlainText: "收到母亲来信：家中一切尚可，父亲差事尚稳，兰英想念哥哥。母亲嘱咐保重身体，学本事要稳。"
  },
  "letter_1936_autumn_family": {
    date: "民国二十五年秋",
    pages: [
      "信到时，不知你那里是否已经转冷。家中一切尚可，你不必挂心。\n\n你父亲近来账房差事少了些，仍旧每日早出晚归。兰英的学费我们会想办法，她也说，等哥哥回来，要让哥哥看看她新写的字。",
      "镇上近来消息杂，米价也起落不定，街口常有人议论北方的事。你在外求学，最要紧是保重身体，把该学的本事学稳。\n\n家里盼你有出息，也盼你平安。"
    ],
    historyPlainText: "母亲来信：父亲收入减少，兰英学费需设法。镇上消息杂，米价起落不定。母亲嘱咐保重身体、学稳本事。"
  },
  "letter_1937_winter_family": {
    date: "民国二十六年冬",
    pages: [
      "这封信写得慢，落笔几次，又停下。家中仍在设法过日子，你不要只想着亏欠。\n\n你父亲说，人在外面学成本事，是为了有一日能用得上；若路难走，也要先护住自己。",
      "兰英托我问你，雪是不是像书上写的那样一夜白尽。她说等你回来，要听你讲火车、工厂和会说话的电波。\n\n你若能归，家门自然等你；你若一时不能，也要把心安放在正处。",
      "母亲只愿你记得，家不是要拖住你的地方，是盼你走得稳的地方。\n\n无论走多远，你都是阿远。"
    ],
    historyPlainText: "母亲最后一封家书：家中仍在设法过日子。父亲说学成本事是为有朝一日用得上，若路难走先护住自己。兰英想听哥哥讲火车和电波。家不是拖住你的地方，是盼你走得稳的地方。"
  }
};

// ============================================================
// 历史事件文本优化
// ============================================================

const historicalEventTexts = {
  "event_1937_lugouqiao": {
    date: "1937年7月7日",
    paragraphs: [
      "1937 年 7 月 7 日夜，日军在北平西南卢沟桥附近进行军事演习，并借口士兵失踪要求进入宛平城搜查，遭到中国守军拒绝。",
      "随后冲突扩大，卢沟桥事变成为全面抗战爆发的重要标志。消息经由报纸、电报与口耳相传逐渐传至海外，也改变了许多留学生对未来去向的判断。"
    ],
    gameplayNotice: "此后，归国路线、通信联络与技术资料处理将变得更加紧迫。",
    sourceNote: "本页为历史背景说明，具体人物与情节为艺术化重构。"
  }
};

// ============================================================
// 季节札记文本优化
// ============================================================

const journalTexts = {
  "journal_day01_spring_1936": {
    journalText: "今日的实验并不平顺。电流、线圈和人的判断一样，都不能只看表面。导师没有多说，但我知道，他看见了我如何面对一次失误。娜佳说，记录里的一个小数点有时比一句豪言更可靠。我想，真正的学习也许正是从承认自己会错开始。"
  },
  // Day02-Day08 札记文本基本不变（原文已较好）
};

// ============================================================
// 创作说明与时间说明元素文本
// ============================================================

const elementTexts = {
  "note_creative_opening": {
    elements: {
      creative_title: { text: "创作说明" },
      creative_body: {
        text: "本作取材于李强等二十世纪二三十年代留苏先辈的真实经历，并在史料基础上进行综合与艺术化重构。\n\n你将以一名虚构留学生沈怀远的身份，走过求学、抉择与归途，感受一代青年在时代洪流中的理想、牵挂与担当。\n\n游戏中的人物、事件及时间线为综合创作，不对应单一真实人物。"
      }
    }
  },
  "note_time_structure": {
    elements: {
      time_body: {
        text: "接下来的八个游戏日，并非连续的八天。\n\n每一日代表一个季节，也代表留学岁月中一个无法绕开的片段。\n\n两度春夏秋冬，将共同构成这段跨越两年的求学与归途。"
      }
    }
  },
  "journey_review": {
    elements: {
      review_body: {
        text: "旅程结束。\n\n感谢你陪伴沈怀远走过这段跨越风雪与岁月的求学之路。\n\n那些选择、犹豫、帮助与告别，最终汇成了一条只属于你的路径。\n\n雪落之前，有人踏上归途，有人守着长灯。\n\n但每一个选择，都曾是风雪中真实的一步。"
      }
    }
  },
  "thank_you": {
    elements: {
      thanks_body: {
        text: "本作取材于李强等二十世纪二三十年代留苏先辈的真实经历，并在史料基础上进行综合与艺术化重构。\n\n感谢你的游玩。\n\n雪落之前 · V1"
      },
      thanks_hint: { text: "点击返回标题" }
    }
  }
};

// ============================================================
// 选项文本优化
// ============================================================

const choiceTexts = {
  "D2_K1_C": {
    confirmationText: "按期交付不会得罪任何人。但如果设备在真正需要时失灵，你也无法假装没有见过这些数据。确定不再追查吗？"
  },
  "D4_K1_A": {
    confirmationText: "接受邀请，意味着你将在苏联再停留数年。研究前途会更加明确，回国的路也会更远。确定要接受吗？"
  },
  "D4_K1_B": {
    confirmationText: "迟疑会让导师失望，但坦诚自己的牵挂，也许是一种更成熟的回答。确定要这样说吗？"
  },
  "D7_K1_A": {
    lockedHint: "需要别洛夫信任达到 7。"
  },
  "D7_K1_C": {
    confirmationText: "这是最危险的选择。一旦被发现，你将失去导师的信任，甚至面临更严重的后果。确定要冒这个险吗？"
  },
  "D7_K1_D": {
    confirmationText: "放弃多年研究成果并不容易。但人比资料更重要。确定要这样做吗？"
  },
  "D8_K1_A": {
    text: "坦诚写下自己的处境与选择",
    confirmationText: "坦诚意味着家人会知道你可能面对的风险。他们会担心，但也会理解。确定要如实写吗？"
  },
  "D8_K1_B": {
    confirmationText: "报平安能让他们安心，但你也知道这不是全部真相。确定吗？"
  },
  "D8_K1_C": {
    confirmationText: "不写回信也许是最务实的选择，但家人会继续等待一封不会抵达的信。确定吗？"
  },
  "FINAL_RETURN_SUPPORTED": {
    lockedHint: "需要至少一位可靠同伴的帮助，以及基本路线信息。"
  },
  "FINAL_RETURN_HASTY": {
    confirmationText: "准备并不充分，但时间不等人。放弃一部分东西，先踏上归途。确定吗？"
  },
  "FINAL_STAY_SUPPORT": {
    lockedHint: "需要足够的知识、担当、技术资料积累，以及至少两位可靠同伴的支持。"
  },
  "FINAL_STAY_RESEARCH": {
    confirmationText: "研究是你最熟悉的道路。把它完成，未来也许还有别的可能。确定吗？"
  },
  "FINAL_STAY_DELAY": {
    confirmationText: "等待可能意味着错过，也可能意味着更稳妥的时机。确定要等吗？"
  }
};

// ============================================================
// 应用替换
// ============================================================

let count = 0;

// 1. 场景文本
for (const [sceneId, updates] of Object.entries(sceneTexts)) {
  const scene = data.scenes[sceneId];
  if (!scene) continue;
  const content = scene.content;
  if (!content) continue;

  if (updates.text !== undefined) {
    content.text = updates.text;
    count++;
  }
  if (updates.chapterTitle !== undefined) {
    content.chapterTitle = updates.chapterTitle;
    count++;
  }
  if (updates.backgroundText !== undefined) {
    content.backgroundText = updates.backgroundText;
    count++;
  }
  if (updates.paragraphs && content.ending) {
    content.ending.paragraphs = updates.paragraphs;
    count++;
  }
}

// 2. 家书
for (const [letterId, updates] of Object.entries(letterTexts)) {
  const letter = data.scenes[letterId]?.content?.letter;
  if (!letter) continue;
  if (updates.date) { letter.date = updates.date; count++; }
  if (updates.pages) { letter.pages = updates.pages; count++; }
  if (updates.postscript !== undefined) { letter.postscript = updates.postscript; count++; }
  if (updates.historyPlainText) { letter.historyPlainText = updates.historyPlainText; count++; }
}

// 3. 历史事件
for (const [eventId, updates] of Object.entries(historicalEventTexts)) {
  const evt = data.scenes[eventId]?.content?.historicalEvent;
  if (!evt) continue;
  if (updates.date) { evt.date = updates.date; count++; }
  if (updates.paragraphs) { evt.paragraphs = updates.paragraphs; count++; }
  if (updates.gameplayNotice !== undefined) { evt.gameplayNotice = updates.gameplayNotice; count++; }
  if (updates.sourceNote !== undefined) { evt.sourceNote = updates.sourceNote; count++; }
}

// 4. 选项文本
for (const [choiceId, updates] of Object.entries(choiceTexts)) {
  for (const scene of Object.values(data.scenes)) {
    if (!scene.choices) continue;
    for (const ch of scene.choices) {
      if (ch.id === choiceId) {
        if (updates.text !== undefined) { ch.text = updates.text; count++; }
        if (updates.confirmationText !== undefined) { ch.confirmationText = updates.confirmationText; count++; }
        if (updates.lockedHint !== undefined) { ch.lockedHint = updates.lockedHint; count++; }
      }
    }
  }
}

// 5. 元素文本（freeLayout elements）
for (const [sceneId, updates] of Object.entries(elementTexts)) {
  const scene = data.scenes[sceneId];
  if (!scene?.elements) continue;
  const elemUpdates = updates.elements;
  if (!elemUpdates) continue;
  for (const [elemId, fields] of Object.entries(elemUpdates)) {
    const elem = scene.elements.find(e => e.id === elemId);
    if (elem) {
      Object.assign(elem, fields);
      count++;
    }
  }
}

// 写入
writeFileSync("src/content/game-data.json", JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`✅ 文本优化完成：${count} 处修改`);
