import { randomInt } from 'node:crypto';
import { config } from '../config';

const phrases = [
  '氣勢如虹！下一個號碼開出：{num}！', '幸運之神眷顧的號碼是：{num}！',
  '全場屏息以待，{num} 號登場！', '等好久了吧！{num}！',
  '號碼開出：{num}！有人聽牌了嗎？', '激戰時刻，關鍵號碼：{num}！',
  '命中注定！號碼：{num}！', '手氣正旺！請看：{num}！',
  '這一球價值連城！{num}！', '太刺激了！幸運號碼：{num}！',
  '賓果之王即將誕生！{num}！', '誰在等這顆？{num} 出現了！',
  '全場歡呼！{num} 降臨！', '離勝利又近一步！{num}！',
  '聽牌的朋友心跳加速了嗎？{num}！', '熱騰騰剛出爐：{num}！',
  '勝利的號角！開出：{num}！', '今晚手氣無敵！{num}！',
  '壓軸好戲！號碼：{num}！', 'B-I-N-G-O！第 {num} 號！'
];

export async function generateCallingPhrase(number: number): Promise<string> {
  if (!config.MOCK_AZURE) throw new Error('Azure calling is not implemented in this local build');
  return phrases[randomInt(phrases.length)].replace('{num}', String(number));
}
