import { config } from '../config';

const MOCK_PHRASES = [
  '氣勢如虹！下一個號碼開出：{num}！',
  '看過來！幸運之神眷顧的號碼是：{num}！',
  '全場屏息以待... 恭喜 {num} 號登場！',
  '這顆號碼等好久了吧！{num}！',
  '號碼開出：{num}！有沒有人聽牌了？',
  '激戰時刻，關鍵號碼：{num}！',
  '命中注定！號碼開出：{num}！',
  '手氣正旺！請看大螢幕：{num}！',
  '這一球價值連城！號碼：{num}！',
  '太刺激了！開出幸運號碼：{num}！',
  '賓果之王即將誕生！號碼：{num}！',
  '誰在等這顆？{num} 出現了！',
  '全場歡呼！{num} 降臨！',
  '離勝利又近了一步！號碼：{num}！',
  '聽牌的朋友心跳加速了嗎？號碼：{num}！',
  '熱騰騰剛出爐的號碼：{num}！',
  '勝利的號角吹響！開出：{num}！',
  '今晚手氣無敵！恭喜開出：{num}！',
  '壓軸好戲！號碼：{num}！',
  'B-I-N-G-O！關鍵第 {num} 號！'
];

export const generateCallingPhrase = async (number: number): Promise<string> => {
  if (config.MOCK_AZURE) {
    const randomIndex = Math.floor(Math.random() * MOCK_PHRASES.length);
    return MOCK_PHRASES[randomIndex].replace('{num}', number.toString());
  }

  // Real Azure OpenAI integration if MOCK_AZURE=false
  try {
    const endpoint = config.AZURE_OPENAI_ENDPOINT!;
    const apiKey = config.AZURE_OPENAI_API_KEY!;
    const deployment = config.AZURE_OPENAI_DEPLOYMENT;

    const res = await fetch(
      `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: '你是熱情洋溢的線上賓果大會主持人，請用一句繁體中文幽默報號。'
            },
            {
              role: 'user',
              content: `現在開出的號碼是 ${number}，請報號！`
            }
          ],
          max_tokens: 50
        })
      }
    );

    if (res.ok) {
      const data: any = await res.json();
      return data.choices[0]?.message?.content || `號碼開出：${number}！`;
    }
  } catch (_) {}

  return `號碼開出：${number}！`;
};
