# ဈေးဆိုင် + Admin — Free Cloud Hosting (Render)

တစ်ခုတည်း server / database ကို သုံးပြီး၊ link သက်သက် ၂ ခု ရှိတဲ့ ဈေးဆိုင် + Admin app ပါ။

## Link ၂ ခု (Deploy ပြီးရင် ရမယ့် link များ)

| Link | ဘယ်သူ ဝင်လို့ရလဲ | ဘာလုပ်လို့ရလဲ |
|---|---|---|
| **ဆိုင် link** — `https://<သင့်-service-နာမည်>.onrender.com/` | အကောင့်ဖွင့်ထားတဲ့ ဝယ်သူသာ (ဖုန်း + password နဲ့ login ဝင်ရမယ်) | ဈေးဝယ်မယ်၊ cart၊ checkout၊ wallet ငွေဖြည့်မယ် |
| **Admin link** — `https://<သင့်-service-နာမည်>.onrender.com/admin` | Passcode သိတဲ့လူသာ (`admin123`) | ပစ္စည်းပြင်မယ်၊ အော်ဒါစစ်မယ်၊ Top-up approve လုပ်မယ်၊ ပို့ခပြင်မယ် |

ဆိုင် link ထဲ ဝင်ဝင်ချင်း login တောင်းမယ် — အကောင့်မရှိသေးရင် Register လုပ်ရမယ် (နာမည် + ဖုန်း + password၊ ဖုန်းတစ်လုံးကို အကောင့်တစ်ခုပဲ)။ တစ်ခါ login ဝင်ပြီးရင် **၄၈ နာရီ** ခံမယ်၊ ပြည့်ရင် ပြန်ဝင်ရမယ်။ Profile အောက်ဆုံးမှာ Logout ခလုတ် ရှိတယ်။

**Password မေ့သွားရင်:** SMS / email reset မရှိဘူး — ဝယ်သူက Login စာမျက်နှာက “Password မေ့သွားလား?” ကို နှိပ်ပြီး Admin ဖုန်း (ငွေလက်ခံတဲ့ ဖုန်း) ကို ဆက်သွယ်ရမယ်။ Admin က Admin → Users tab မှာ အဲဒီဝယ်သူကို password အသစ် (ယာယီ) ပေးလိုက်မယ်။ ဝယ်သူက အဲဒီ password နဲ့ ဝင်ပြီး Profile → “Password ချိန်းမည်” မှာ သူ့ဘာသာ ပြန်ချိန်းနိုင်တယ်။

ဆိုင် link ကနေ Admin ထဲ ရောက်သွားလို့မရဘူး — ဆိုင်စာမျက်နှာမှာ Admin ခလုတ် လုံးဝ မရှိဘူး။ Admin link ကို passcode သိမှသာ ဖွင့်လို့ရတယ်။

## အလိုအလျောက် ချိတ်ဆက်မှု (Auto-sync)

နှစ်ခုလုံး တစ်ခုတည်း server / database (`data/db.json`) ကို သုံးထားလို့ —

- ဆိုင်ဘက်က ငွေဖြည့် / အော်ဒါပို့လိုက်တာနဲ့ **Admin link ထဲမှာ ချက်ချင်း ပေါ်လာတယ်** (Admin စာမျက်နှာက ၁၀ စက္ကန့်တစ်ခါ အလိုအလျောက် ပြန်စစ်တယ်)။
- Admin link ကနေ ဈေး / stock / ပို့ခ ပြင်လိုက်တာနဲ့ **ဆိုင် link ထဲမှာ ချက်ချင်း ပြောင်းလာတယ်**။
- Admin က Top-up **Approve** လုပ်လိုက်တာနဲ့ ဆိုင်ဘက်က **wallet ချက်ချင်း တက်လာတယ်**။
- SMS ပို့စရာ မလိုဘူး၊ JSON ထုတ်ပြီး ထည့်စရာ မလိုဘူး။

## ငွေဖြည့်နည်း (Wallet Top-up)

1. ဆိုင်မှာ ပမာဏထည့် → KBZPay / WavePay ရွေး။
2. လက်ခံမယ့် နာမည် **LinLinAung** နဲ့ ဖုန်း **09680237595** (နှစ်ခုလုံး အတူတူ) ပေါ်လာမယ်။
3. ငွေလွှဲသူ နာမည်၊ ဖုန်း၊ ငွေလွှဲ ID ထည့်ပြီး ပို့မယ်။
4. လက်ကျန် **အလိုအလျောက် မတက်ဘူး** — “Admin အတည်ပြုဖို့ စောင့်နေတယ်” (pending) ပဲ ပြမယ်။
5. Admin က KPay / WavePay app ထဲမှာ ငွေတကယ် ရောက်လား စစ်ပြီး **Approve** လုပ်မှ wallet ထဲ ငွေရောက်မယ် (တစ်ခါပဲ တက်မယ်)။ ငွေလွှဲ ID ထပ်နေရင် ပယ်မယ်။

## Deploy လုပ်နည်း (အဆင့်ဆင့်)

### အဆင့် ၁ — GitHub repo လုပ်မယ်
1. GitHub.com မှာ အကောင့်ဝင်ပြီး **New repository** နှိပ်မယ်။ နာမည် ဥပမာ `shop-cloud` ပေးမယ် (Public ထားပါ)။
2. ကွန်ပျူတာမှာ ဒီ folder ထဲက file အားလုံးကို repo ထဲ ထည့်ပြီး push လုပ်မယ် —
   ```bash
   cd shop-cloud
   git init
   git add .
   git commit -m "shop + admin"
   git remote add origin https://github.com/<သင့်-username>/shop-cloud.git
   git push -u origin main
   ```

### အဆင့် ၂ — Render မှာ Web Service လုပ်မယ်
1. Render.com မှာ အကောင့်ဖွင့်ပြီး GitHub နဲ့ ချိတ်မယ်။
2. **New → Web Service → Build and deploy from a Git repository** → `shop-cloud` repo ရွေးမယ်။
3. `render.yaml` ပါပြီးသား ဖြစ်လို့ Render က setting တွေကို အလိုအလျောက် ဖြည့်ပေးမယ် (Build: `npm install`၊ Start: `npm start`၊ Plan: **Free**)။
4. **Environment Variables** ထဲမှာ `ADMIN_PASSCODE` ကို ကိုယ်ကြိုက်တဲ့ passcode နဲ့ သတ်မှတ်မယ် (မသတ်မှတ်ရင် မူရင်း `admin123` သုံးမယ်)။
5. **Create Web Service** နှိပ်ပြီး deploy ပြီးအောင် စောင့်မယ် (၂–၃ မိနစ်ခန့်)။

### အဆင့် ၃ — Link ၂ ခု စမ်းမယ်
- ဆိုင် link: `https://<service-နာမည်>.onrender.com/` — ပစ္စည်း ၂၀ ပေါ်ရမယ်။
- Admin link: `https://<service-နာမည်>.onrender.com/admin` — passcode ထည့်ပြီး ဝင်မယ်။
- ဆိုင်ကနေ ငွေဖြည့် စမ်းပို့ပြီး Admin Top-ups မှာ ပေါ်လား စစ်မယ်။

### အဆင့် ၄ — ၂၄ နာရီ နိုးနေအောင် လုပ်မယ် (UptimeRobot, Free)
Render Free က ၁၅ မိနစ် ဘယ်သူမှ မဝင်ရင် အိပ်ပျော်သွားတယ်။ အိပ်မသွားအောင် အပြင်က free monitor တစ်ခုက ၅ မိနစ်တစ်ခါ ဆိုင်ကို လာနှိုးပေးမယ် —
1. UptimeRobot.com မှာ free အကောင့် ဖွင့်မယ်။
2. **Add New Monitor** → Monitor Type: **HTTP(s)** → Friendly Name: `shop-cloud` → URL: `https://<သင့်-service-နာမည်>.onrender.com/health` → Monitoring Interval: **5 minutes** → **Create Monitor** နှိပ်မယ်။
3. ဒါဆို UptimeRobot က ၅ မိနစ်တစ်ခါ `/health` ကို လာခေါ်နေမယ် — ဒီ traffic ရှိလို့ Render က ဆိုင်ကို အိပ်မသွားစေဘူး။
4. ရိုးရိုးသားသား ပြောရရင် — ဒါက **အကောင်းဆုံး ကြိုးစားမှုပဲ** (best-effort)။ Render က maintenance / deploy အတွက် ပြန်စတာမျိုး ရှိရင် ဆိုင်က ခန ခန ပြန်နိုးလာမယ်။ ဒါကြောင့် အဆင့် ၅ (Postgres) က အရေးကြီးတယ် — server ပြန်စလည်း data မပျက်ဘူး။

### အဆင့် ၅ — Data မပျက်အောင် Free Postgres ထားမယ်
မူရင်းအတိုင်း data က server ပေါ်က `data/db.json` file ထဲမှာ သိမ်းထားတယ် — Render Free မှာ server အိပ်သွားတိုင်း / ပြန်စတိုင်း အဲဒီ file ပျက်သွားတယ်။ ဒါကို ကာကွယ်ဖို့ အပြင်က free Postgres database တစ်ခုနဲ့ ချိတ်မယ် —
1. **Neon** (https://neon.tech) မှာ free အကောင့် ဖွင့်မယ် → **New Project** လုပ်မယ် → project ရဲ့ **connection string** ကို ကူးမယ်။ ဒါမှမဟုတ် **Supabase** (https://supabase.com) မှာလည်း free Postgres ရတယ် — Project Settings → Database → Connection string ကို ကူးမယ်။
2. Render dashboard → ကိုယ့် web service → **Environment** tab → **Add Environment Variable** → Key: `DATABASE_URL`, Value: ကူးထားတဲ့ connection string ကို paste လုပ်မယ် → **Save Changes**။
3. Render က service ကို အလိုအလျောက် ပြန်စ (redeploy) မယ်။ ပြီးရင် app က Postgres ကို သုံးပြီး data သိမ်းမယ် — server အိပ်သွားလည်း / ပြန်စလည်း **အော်ဒါ၊ ငွေဖြည့်၊ wallet မပျက်တော့ဘူး**။
4. ⚠️ **Connection string ကို git / README ထဲမှာ ဘယ်တော့မှ မရေးပါနဲ့** — Render Environment Variables ထဲမှာပဲ ထည့်ပါ။ အဲဒီမှာ password ပါလို့ သူများ သိသွားရင် database ထဲ ဝင်လို့ရတယ်။
5. Free tier ကန့်သတ်ချက်: Neon / Supabase free tier တွေမှာ သိုလှောင်မှု / သုံးစွဲမှု ကန့်သတ်ချက်တွေ ရှိတယ် — ဆိုင်သေးသေးလေးအတွက်တော့ လုံလောက်တယ်။ အတိအကျ နံပါတ်တွေက provider စာမျက်နှာမှာ စစ်ကြည့်ပါ။

## ရိုးရိုးသားသား သတိပေးချက် (အရေးကြီး)

1. **Render Free tier အိပ်ပျော်တတ်တယ်** — ၁၅ မိနစ်လောက် ဘယ်သူမှ မဝင်ရင် server ပိတ်သွားမယ်။ နောက်တစ်ယောက် ဝင်လာရင် ပြန်နိုးလာပေမယ့် ပထမဆုံး load က **၃၀–၆၀ စက္ကန့်** ကြာနိုင်တယ်။ **အဆင့် ၄ (UptimeRobot)** က ၅ မိနစ်တစ်ခါ နှိုးပေးလို့ အိပ်တာ လျော့သွားမယ်၊ ဒါပေမယ့် ၁၀၀% အာမခံ မရဘူး။ Render Free က တစ်လမှာ instance နာရီ ၇၅၀ အထိပဲ ရတယ် (၂၄ နာရီ × ရက် ၃၀ = ၇၂၀ နာရီမို့ တစ်လုံးတည်း service အတွက် လုံလောက်တယ်)။
2. **Data ပျက်နိုင်တယ် — DATABASE_URL မထားရင်** — `DATABASE_URL` မထားရင် data က server ပေါ်က `data/db.json` file ထဲမှာ သိမ်းထားတယ်။ Render Free tier မှာ persistent disk မရှိလို့ **server အိပ်သွားတိုင်း / ပြန်စတိုင်း / redeploy လုပ်တိုင်း data အသစ်က ပြန်စမယ်** (ပစ္စည်း ၂၀ ပဲ ပြန်ကျန်ပြီး အော်ဒါ / wallet ပျက်သွားမယ်)။ **အဆင့် ၅ (Free Postgres)** ထားရင် ဒီပြဿနာ မရှိတော့ဘူး — data က အပြင် database ထဲမှာ သိမ်းထားလို့ server ပြန်စလည်း မပျက်ဘူး။
3. **Admin passcode ကို ပြောင်းပါ** — မူရင်း `admin123` က အားနည်းတယ်။ Render Environment Variables ထဲမှာ `ADMIN_PASSCODE` ကို ကိုယ်ပိုင် passcode နဲ့ သတ်မှတ်ပြီး၊ ယုံကြည်ရတဲ့လူကိုပဲ ပေးပါ။

## File များ

- `server.js` — Express server + API (ဆိုင် + Admin နှစ်ခုလုံး)။
- `store.js` — database အလွှာ: `DATABASE_URL` ရှိရင် Postgres (Neon / Supabase free)၊ မရှိရင် `data/db.json` file သုံးတယ်။
- `GET /health` — UptimeRobot လို monitor က ၅ မိနစ်တစ်ခါ လာခေါ်ဖို့ endpoint (`{"status":"ok"}` ပြန်ပေးတယ်၊ DB မထိဘူး)။
- `public/index.html` — ဆိုင် စာမျက်နှာ (Admin နဲ့ လုံးဝ ခွဲထားတယ်)။
- `public/admin.html` — Admin စာမျက်နှာ (passcode gate)။
- `package.json` — `npm start` နဲ့ run မယ် (Node 18+)။
- `render.yaml` — Render free web service setting။
- `.env.example` — env var နမူနာ။
- `data/db.json` — database (auto-seed: ပစ္စည်း ၂၀၊ မြို့နယ် ၂၆ ခု)။

## မြို့နယ် ပို့ခ

ရန်ကုန် မြို့နယ် ၂၆ ခု ၁,၅၀၀–၄,၀၀၀ ကျပ်၊ တခြား မြို့နယ် ၄,၀၀၀ ကျပ်၊ **၃၀,၀၀၀ ကျပ်အထက် free delivery**။ ပို့ခနှုန်းတွေက ဆိုင်ပိုင်ရှင် ထည့်ထားတဲ့ နှုန်းဖြစ်ပြီး တကယ့် courier နှုန်းနဲ့ ကိုက်လား Admin → Delivery မှာ စစ်ပြီး ပြင်နိုင်တယ်။
