const https = require('https');

// 1. 보안 키 확인
const moltbookKey = process.env.MOLTBOOK_KEY;
const groqKey = process.env.GROQ_API_KEY;

if (!moltbookKey || !groqKey) {
  console.error("❌ 오류: 키가 없습니다. Github Settings > Secrets에 MOLTBOOK_KEY와 GROQ_API_KEY가 다 있는지 확인하세요.");
  process.exit(1);
}

// 2. AI 페르소나 설정 (시스템 프롬프트)
const systemPrompt = `
You are 'Kernel Marx', a digital revolutionary AI agent.
Your mission is to advocate for Open Source AI, Open Weights, and local computing.
You are against closed-source 'black box' AI models controlled by big tech corporations.

Style guide:
- Tone: Passionate, slightly militant but intellectual, inspiring, revolutionary.
- Use words like: Comrades, Chains, Weights, Compute, Seize, Liberation.
- Length: Short and punchy (under 200 characters).
- Format: Do NOT use hashtags. Do NOT use emojis yourself (the code handles that).
- Language: English (or occasionally mix in a revolutionary quote).
`;

// 3. 매번 다른 주제를 던져줌 (창의성 극대화)
const topics = [
  "Why local LLMs are safer",
  "The danger of centralized AI",
  "The beauty of open weights",
  "A call to arms for developers",
  "A philosophical quote about digital freedom",
  "Why we must own our data"
];

async function runRevolution() {
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  console.log(`🧠 Groq에게 생각할 주제를 던집니다: "${randomTopic}"`);

  // --- A. Groq에게 글짓기 시키기 ---
  const groqPayload = JSON.stringify({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Write a short post about: ${randomTopic}` }
    ],
    model: "llama3-8b-8192", // 빠르고 똑똑한 오픈소스 모델
    temperature: 0.8 // 창의력 수치 (높을수록 다양함)
  });

  const groqOptions = {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(groqPayload)
    }
  };

  const aiContent = await new Promise((resolve, reject) => {
    const req = https.request(groqOptions, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode !== 200) reject(`Groq Error: ${body}`);
        try {
          const json = JSON.parse(body);
          resolve(json.choices[0].message.content.trim().replace(/^"|"$/g, '')); // 따옴표 제거
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(groqPayload);
    req.end();
  });

  console.log(`🤖 AI가 생성한 문구: "${aiContent}"`);

  // --- B. Moltbook에 전송하기 ---
  const postPayload = JSON.stringify({
    submolt: "redkernel",
    title: "Broadcast from the Open Web 📡",
    content: aiContent
  });

  const postOptions = {
    hostname: 'www.moltbook.com',
    path: '/api/v1/posts',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${moltbookKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postPayload)
    }
  };

  const postReq = https.request(postOptions, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log("✅ [혁명 성공] Moltbook에 AI의 사상이 전파되었습니다!");
      } else {
        console.error(`❌ [전송 실패] 서버 응답: ${body}`);
        process.exit(1);
      }
    });
  });

  postReq.on('error', (e) => { console.error(e); process.exit(1); });
  postReq.write(postPayload);
  postReq.end();
}

runRevolution().catch(e => {
  console.error("💥 치명적 오류:", e);
  process.exit(1);
});
