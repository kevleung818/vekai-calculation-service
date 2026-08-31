import { getHexagramReading } from './hexagramReadings.js';

const MAP = {
  1: [1, 1, 1], 2: [0, 1, 1], 3: [1, 0, 1], 4: [0, 0, 1],
  5: [1, 1, 0], 6: [0, 1, 0], 7: [1, 0, 0], 8: [0, 0, 0]
};

const MEANINGS = {
  11: ['Emperor, leader, powerful, self-improvement', '皇帝、领导、强大、自我提升'],
  12: ['Average luck, relationships, cautious and courteous', '运势一般、人际关系、谨慎有礼'],
  13: ['Teamwork prospers, united in purpose', '团队合作顺利、目标一致'],
  14: ['Mistakes may happen, recovery follows', '容易犯错、但能够恢复'],
  15: ['Versatile and sophisticated, overly materialistic', '多才多艺但可能过于物质'],
  16: ['Disputes, gossip, lawsuits, recklessness', '争执、流言、诉讼、鲁莽'],
  17: ['Avoidance, retirement, shirking responsibility', '回避、退隐、逃避责任'],
  18: ['Arrogance, excessive talking, petty people', '傲慢、多言、容易招惹小人'],
  21: ['Major choices, reverse thinking', '重大选择、逆向思考'],
  22: ['Gentle outside, firm inside, suitable for accounting', '外柔内刚、适合会计'],
  23: ['Innovation brings luck, reform, change', '创新带来好运、改革、变化'],
  24: ['Mixed good and bad, adapt to circumstances', '吉凶参半、顺应环境'],
  25: ['Overcoming storms, expert problem solver', '跨越风浪、善于解决问题'],
  26: ['Trapped by wealth, love, and emotions', '困于财富、爱情和情绪'],
  27: ['Keen intuition, investment and romance luck', '直觉敏锐、投资和异性缘佳'],
  28: ['Talented people around you, popular, educational', '人才众多、受欢迎、有利于教育'],
  31: ['Prosperous, successful, wishes come true', '兴旺、成功、心愿实现'],
  32: ['Friendship friction, intolerance, anger', '友谊摩擦、缺乏包容、易怒'],
  33: ['Beautiful, spiritual, passionate, proactive', '美好、精神、热情、主动'],
  34: ['Difficult to endure, gossip attracts', '难以忍耐、容易招来流言'],
  35: ['Good for restaurants, respected authority', '适合餐饮、受人尊敬'],
  36: ['Strong start but difficulty finishing', '起头很猛但难以收尾'],
  37: ['Unstable, isolated, arduous journey', '不稳定、孤立、道路艰辛'],
  38: ['Promotion in work and studies, proactive', '工作学习晋升、积极主动'],
  41: ['Famous and useful, flourishing and growing', '有名有用、繁荣成长'],
  42: ['Goals are difficult, indecisive, unreliable staff', '目标难成、优柔寡断'],
  43: ['Earn money, distribute fairly, avoid conflict', '赚钱后公平分配、避免冲突'],
  44: ['Thunderous shock, fluctuating luck', '震动冲击、运势起伏'],
  45: ['Marriage, affection, patience', '婚姻、感情、耐心'],
  46: ['Lawsuits resolve, relaxed, limited sales support', '诉讼可解、轻松、销售助力有限'],
  47: ['Mistakes, slow reaction, missed opportunities', '犯错、反应慢、错失机会'],
  48: ['Planning ahead, a person with plans', '未雨绸缪、胸有成竹'],
  51: ['Breakup, divorce, loneliness, family friction', '分手、离婚、孤独、家庭摩擦'],
  52: ['Integrity, trust, late luck, waiting', '正直、可信、好运来得晚'],
  53: ['Partners cooperate and fulfill responsibilities', '伙伴合作、各尽其责'],
  54: ['Helping people, mutual benefit', '帮助他人、互相受益'],
  55: ['Uncertain progress, many schemes, humble', '进退不定、计谋多、谦逊'],
  56: ['Many obstacles, lack of focus', '障碍很多、缺乏专注'],
  57: ['Gradually stable, auspicious for women', '逐渐稳定、女性使用吉祥'],
  58: ['Inspecting and managing people and land', '考察和管理人员与土地'],
  61: ['Waiting for opportunity, lacking resources', '等待机会、资源不足'],
  62: ['Poor finances, unsmooth cash flow, frugal', '财运不佳、现金流不顺'],
  63: ['Initially auspicious, ultimately chaotic', '先吉后乱'],
  64: ['Difficult startup, loves learning', '起步困难、喜欢学习'],
  65: ['Often taken advantage of, orderly', '常被利用、井然有序'],
  66: ['Dark, depressed, extremely unlucky', '黑暗、压抑、极度不走运'],
  67: ['Pessimistic, difficulties drag people down', '悲观、困难拖累他人'],
  68: ['Many supporters, good relationships, generous', '支持者众多、人际关系好'],
  71: ['Many business opportunities, able to earn and save', '商机多、能赚能存'],
  72: ['Loss of money, serious illness, harmful', '破财、重病、伤人伤己'],
  73: ['Beauty promotion, reports good news', '适合美业推广、报喜不报忧'],
  74: ['Food, drink, comfortable earnings', '爱吃喝、赚钱轻松'],
  75: ['Internal sabotage, cunning then resolves it', '内部破坏、先狡猾后解决'],
  76: ['Confused, no direction or confidence', '困惑、没有方向和信心'],
  77: ['Obstruction, stagnation, endurance', '阻碍、停滞、耐力'],
  78: ['Losses, overspending, poor money management', '损失、过度消费、理财不佳'],
  81: ['Good luck, communication, soft outside and firm inside', '好运、沟通、外柔内刚'],
  82: ['Executives, accomplishment, stubbornness', '高管、有成就、固执'],
  83: ['Unrecognized talent, job changes', '才华未被认可、工作变化'],
  84: ['Ordinary, repeating old ways', '普通平凡、重复旧路'],
  85: ['Eager to learn, rising, meets a mentor', '求知、上升、遇贵人'],
  86: ['Hardworking, leading alone, little help', '劳碌、独自带头、帮助少'],
  87: ['Opposite-sex help, relationship risk', '异性相助、感情有风险'],
  88: ['Behind-the-scenes control, virtuous partner', '幕后掌控、伴侣贤德']
};

const sumDigits = (value) => [...value].reduce((sum, digit) => sum + Number(digit), 0);
const mod8 = (value) => value % 8 || 8;
const meaning = (number) => MEANINGS[number] || ['No description available', '暂无描述'];

function bitsToNumber(bits) {
  return Number(Object.entries(MAP).find(([, value]) => value.join('') === bits.join(''))?.[0] || 8);
}

function calculateSet(left, right) {
  const leftTotal = sumDigits(left);
  const rightTotal = sumDigits(right);
  const total = leftTotal + rightTotal;
  const movingLine = total % 6 || 6;
  const top = mod8(leftTotal);
  const bottom = mod8(rightTotal);
  const bits = [...MAP[top], ...MAP[bottom]];
  bits[6 - movingLine] = bits[6 - movingLine] ? 0 : 1;
  const resultTop = bitsToNumber(bits.slice(0, 3));
  const resultBottom = bitsToNumber(bits.slice(3));
  const baseNumber = Number(`${top}${bottom}`);
  const resultNumber = Number(`${resultTop}${resultBottom}`);
  return {
    split: { left, right },
    sums: { left: leftTotal, right: rightTotal, total },
    movingLine,
    base: { top, bottom, number: baseNumber, meaning: meaning(baseNumber), reading: getHexagramReading(baseNumber) },
    result: { top: resultTop, bottom: resultBottom, number: resultNumber, meaning: meaning(resultNumber), reading: getHexagramReading(resultNumber) }
  };
}

export function calculateNumerology(rawInput) {
  const input = String(rawInput ?? '').replace(/\D/g, '');
  if (input.length < 8 || input.length > 64) {
    const error = new Error('Input must contain between 8 and 64 digits.');
    error.status = 400;
    throw error;
  }
  const firstGroupLength = input.length === 11 ? 6 : Math.floor(input.length / 2);
  const first = input.slice(0, firstGroupLength);
  const second = input.slice(firstGroupLength);
  const secondSplit = Math.floor(second.length / 2);
  return {
    inputLength: input.length,
    format: input.length === 11 ? 'china-mobile-11' : 'legacy',
    groups: {
      first: { digits: first, total: sumDigits(first) },
      second: { digits: second, total: sumDigits(second) }
    },
    primary: calculateSet(first, second),
    secondary: calculateSet(second.slice(0, secondSplit), second.slice(secondSplit))
  };
}
