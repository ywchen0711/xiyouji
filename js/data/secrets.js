// 秘境: hidden places off the road. On some maps a faint glimmer marks a hidden path (it shows itself only to those who
// come near); following it leads to a small realm of its own, with richer chests and, at its end, a trial:
//   waves — fight wave after wave with no rest between;
//   limit — beat the keeper within so many rounds, or it slips away;
//   solo  — one pilgrim goes in alone;
//   seal  — a spell on the place: no arts can be used, only blows and things;
//   riddle — the keeper asks about the story first; each wrong answer brings an ambush.
// Passing the trial gives a treasure found nowhere else. Losing only puts the pilgrims back on the road, to try again.
export const SECRETS = [
  { id: 's01', ep: 'e04', name: '龍宮寶庫', map: { theme: 'sea', name: '龍宮寶庫', size: 1, foes: ['蝦兵', '蟹將', '龜精'], chests: 3 },
    intro: '-|珊瑚叢後頭，隱隱有一道暗門，門縫裡透出寶光。\n-|守庫的蝦兵蟹將嚷道：「要進寶庫，得連過三陣！」',
    trial: { waves: [['蝦兵', '蟹將'], ['龜精', '魚妖'], ['鯊將軍']] }, reward: '藕絲步雲履' },
  { id: 's02', ep: 'e13', name: '鷹愁澗水府', map: { theme: 'river', name: '鷹愁澗水府', size: 1, foes: ['蛇妖', '魚妖', '蛤蟆精'], chests: 3 },
    intro: '-|澗底水草分開，露出一座小小的水府，門上兩隻石龜開口說話。',
    trial: { riddle: 3, foes: ['蛟精', '蛇妖'] }, reward: '龍鱗靴' },
  { id: 's03', ep: 'e17', name: '小須彌山', map: { theme: 'mount', name: '小須彌山', size: 1, foes: ['貂妖', '山羊精', '石精'], chests: 3 },
    intro: '-|山坳裡藏著一條羊腸小道，盡頭的石台上，一隻貂鼠精正捧著一卷經書。\n-|它見了你們，轉身就要逃——五回合內不拿下，它便鑽進風裡去了！',
    trial: { limit: 5, foes: ['貂鼠小校', '貂妖', '貂妖'] }, reward: '靈吉頭巾' },
  { id: 's04', ep: 'e20', name: '人參果園地窖', map: { theme: 'forest', name: '人參果園地窖', size: 1, foes: ['樹精', '花妖', '山魈'], chests: 3 },
    intro: '八戒|師兄，那後園的地窖裡，聞著好香！讓老豬一個人去探探，你們在外頭把風！\n-|地窖窄小，只容得下八戒一個人。',
    trial: { solo: '八戒', foes: ['山魈王'] }, reward: '天蓬盔' },
  { id: 's05', ep: 'e23', name: '蓮花洞寶庫', map: { theme: 'cave', name: '蓮花洞寶庫', size: 1, foes: ['小妖', '狐妖', '蝙蝠精'], chests: 3 },
    intro: '-|洞壁上一塊石頭鬆動，推開來是金角、銀角藏寶的密室。\n-|守門的小妖說：「答得出大王的謎題，才放你進去！」',
    trial: { riddle: 3, foes: ['巴山虎', '倚海龍', '小妖'] }, reward: '七星寶劍' },
  { id: 's06', ep: 'e28', name: '通天河冰窟', map: { theme: 'ice', name: '通天河冰窟', size: 1, foes: ['雪狼', '龜精', '魚妖'], chests: 3 },
    intro: '-|冰面裂開一道口子，下面是一座冰窟。四壁寒氣逼人，連法術都凍住了，施展不出來。',
    trial: { seal: true, foes: ['鱖婆', '龜精', '雪狼'] }, reward: '白黿甲' },
  { id: 's07', ep: 'e33', name: '火焰山火窟', map: { theme: 'fire', name: '火焰山火窟', size: 1, foes: ['火鴉', '火妖', '石精'], chests: 3 },
    intro: '-|熔岩之間有一條火窟，窟裡一隻火鼠的皮毛閃著光——四面八方的火精都撲了上來。',
    trial: { waves: [['火鴉', '火鴉'], ['火妖', '石精', '火鴉'], ['急如火', '火妖']] }, reward: '火鼠裘' },
  { id: 's08', ep: 'e35', name: '木仙庵後園', map: { theme: 'thorn', name: '木仙庵後園', size: 1, foes: ['花妖', '樹精', '兔精'], chests: 3 },
    intro: '-|荊棘深處一座小園，園中杏花盛開，幾個樹精正在吟詩。\n杏仙|聖僧來得正好，且考考你們的學問。',
    trial: { riddle: 3, foes: ['杏仙', '樹精', '花妖'] }, reward: '紫竹冠' },
  { id: 's09', ep: 'e40', name: '萬妖洞', map: { theme: 'mount', name: '萬妖洞', size: 1, foes: ['獅妖', '象妖', '鳥妖'], chests: 3 },
    intro: '-|山後有個萬妖洞，洞裡的小妖正敲鑼集合。\n悟空|趁他們還沒排好陣，六回合之內打散他們！',
    trial: { limit: 6, foes: ['獅妖', '象妖', '小鑽風'] }, reward: '金翅雲靴' },
  { id: 's10', ep: 'e46', name: '盤桓洞深處', map: { theme: 'cave', name: '盤桓洞深處', size: 1, foes: ['獅妖', '蝙蝠精', '石精'], chests: 3 },
    intro: '悟淨|這條暗道只容一人，大師兄、二師兄，讓我去罷。\n-|沙悟淨持著降妖寶杖，獨自走進黑暗裡。',
    trial: { solo: '悟淨', foes: ['獅妖', '獅妖'] }, reward: '降妖寶冠' },
  { id: 's11', ep: 'e48', name: '布金禪寺塔林', map: { theme: 'mount', name: '布金禪寺塔林', size: 1, foes: ['兔精', '狐妖', '山貓精'], chests: 3 },
    intro: '-|塔林盡頭一座古塔，塔門上寫著：「答我三問，限七回合。」',
    trial: { riddle: 3, limit: 7, foes: ['兔先鋒', '兔精', '兔精'] }, reward: '金剛念珠' },
  { id: 's12', ep: 'e51', name: '通天河古龍宮', map: { theme: 'river', name: '通天河古龍宮', size: 1, foes: ['鬼魅', '夜叉兵', '蟹將'], chests: 3 },
    intro: '-|河底沉著一座古龍宮，宮門大開，一陣接一陣的水族殺了出來。',
    trial: { waves: [['夜叉兵', '蟹將'], ['鬼魅', '鬼魅', '殭屍'], ['溺鬼頭目', '夜叉兵'], ['龍子', '夜叉兵', '蟹將']] }, reward: '五佛冠' },
];
// questions about the story (the right answer first; they are shuffled when asked)
export const RIDDLES = [
  ['孫悟空的如意金箍棒有多重？', '一萬三千五百斤', '八千八百斤', '三萬六千斤'],
  ['孫悟空在天庭第一次做的官叫什麼？', '弼馬溫', '齊天大聖', '捲簾大將'],
  ['豬八戒原本在天上是什麼神？', '天蓬元帥', '捲簾大將', '托塔天王'],
  ['沙悟淨原本在天庭當什麼官？', '捲簾大將', '天蓬元帥', '巨靈神'],
  ['白龍馬原本是誰的兒子？', '西海龍王', '東海龍王', '涇河龍王'],
  ['菩提祖師住在什麼洞？', '斜月三星洞', '水簾洞', '盤絲洞'],
  ['唐僧取經一共歷經多少難？', '八十一難', '七十二難', '一百零八難'],
  ['銀角大王叫一聲名字就能收人的寶貝是？', '紫金紅葫蘆', '羊脂玉淨瓶', '陰陽二氣瓶'],
  ['紅孩兒的父親是誰？', '牛魔王', '黃風怪', '二郎神'],
  ['芭蕉扇原本在誰手裡？', '鐵扇公主', '玉面公主', '觀音菩薩'],
  ['孫悟空被壓在哪座山下五百年？', '五行山', '火焰山', '花果山'],
  ['人參果樹長在哪裡？', '萬壽山五莊觀', '花果山', '蟠桃園'],
  ['盤絲洞裡住著幾個蜘蛛精？', '七個', '九個', '五個'],
  ['觔斗雲一個筋斗翻多遠？', '十萬八千里', '八萬四千里', '三千里'],
  ['孫悟空在八卦爐裡煉出了什麼？', '火眼金睛', '銅頭鐵臂', '七十二變'],
  ['唐僧騎的白馬，原本在哪裡吃了唐僧的馬？', '鷹愁澗', '流沙河', '通天河'],
  ['觀音菩薩給孫悟空頭上戴的是什麼？', '緊箍兒', '金剛琢', '幌金繩'],
  ['車遲國的三個大仙，不是哪一個？', '牛力大仙', '虎力大仙', '鹿力大仙'],
];
