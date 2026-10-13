/* ===========================================================
   google-auth-sync.js
   جایگزین firebase-config.js + sync.js
   - ورود با گوگل: Google Identity Services (بدون Firebase)
   - همگام‌سازی پیشرفت: Google Drive, پوشه‌ی مخفی appDataFolder
     (کاربر هیچ‌وقت این فایل رو توی Drive خودش نمی‌بینه؛ فقط
      خودِ اپ بهش دسترسی داره)

   نکته امنیتی: اینجا فقط CLIENT_ID لازمه، هیچ secret ای نباید
   این‌جا یا هیچ فایل سمت کلاینت دیگه‌ای قرار بگیره.
   =========================================================== */

const GOOGLE_CLIENT_ID = '531890965633-n63u2n34kcnul4nms67t8vga8tlr93f3.apps.googleusercontent.com';

// اسکوپ appdata: فقط به فایل‌هایی که خودِ این اپ توی Drive کاربر
// می‌سازه دسترسی داره — نه به کل درایو کاربر.
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const PROGRESS_FILENAME = 'circuit-knight-progress.json';

let tokenClient = null;
let accessToken = null;
let currentUser = null; // { name, email, picture }

const accountBtn = document.getElementById('accountBtn');
const accountAvatar = document.getElementById('accountAvatar');
const accountLabel = document.getElementById('accountLabel');
const accountMenu = document.getElementById('accountMenu');
const accountSignOutBtn = document.getElementById('accountSignOutBtn');

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch (e) {
    return null;
  }
}

function updateAccountUI() {
  if (currentUser) {
    accountLabel.textContent = currentUser.name || currentUser.email;
    accountAvatar.src = currentUser.picture || '';
    accountAvatar.style.display = currentUser.picture ? 'inline-block' : 'none';
  } else {
    accountLabel.textContent = 'ورود با گوگل';
    accountAvatar.style.display = 'none';
  }
}

/* -----------------------------------------------------------
   1) ورود با گوگل (هویت کاربر — نام/ایمیل/عکس)
   از Google Identity Services (GIS) استفاده می‌کنیم که فقط
   client_id لازم داره، بدون هیچ secret ای.
   ----------------------------------------------------------- */
function initGoogleIdentity() {
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
    auto_select: false,
  });
}

function handleCredentialResponse(response) {
  const payload = parseJwt(response.credential);
  if (!payload) return;
  currentUser = {
    name: payload.name,
    email: payload.email,
    picture: payload.picture,
  };
  localStorage.setItem('ck_user', JSON.stringify(currentUser));
  updateAccountUI();
  requestDriveAccess(); // بلافاصله بعد از ورود، توکن دسترسی به Drive رو هم بگیر
}

/* -----------------------------------------------------------
   2) گرفتن Access Token برای خواندن/نوشتن روی Drive appData
   این بخش با Google Identity Services (OAuth token client)
   انجام میشه — هیچ‌کدوم نیازی به client_secret ندارن چون
   این جریان مخصوص اپ‌های سمت کلاینت (public client) هست.
   ----------------------------------------------------------- */
function initTokenClient() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      syncFromDrive(); // بعد از گرفتن دسترسی، پیشرفت رو از Drive بخون
    },
  });
}

function requestDriveAccess() {
  if (!tokenClient) return;
  tokenClient.requestAccessToken({ prompt: currentUser ? '' : 'consent' });
}

/* -----------------------------------------------------------
   3) خواندن/نوشتن فایل پیشرفت روی Drive appDataFolder
   ----------------------------------------------------------- */
async function findProgressFileId() {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${PROGRESS_FILENAME}'&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  return data.files && data.files.length ? data.files[0].id : null;
}

async function syncFromDrive() {
  if (!accessToken) return;
  try {
    const fileId = await findProgressFileId();
    if (!fileId) {
      // هنوز فایلی روی Drive نیست (اولین ورود کاربر) — پیشرفت فعلیِ
      // همین مرورگر رو به‌عنوان نسخه‌ی اول روی Drive می‌نویسیم.
      if (window.getQuestProgress) saveProgressToDrive(window.getQuestProgress());
      return;
    }
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const remoteProgress = await res.json();
    mergeAndApplyProgress(remoteProgress);
  } catch (e) {
    console.warn('Drive sync (read) failed:', e);
  }
}

async function saveProgressToDrive(progressObj) {
  if (!accessToken) return;
  try {
    const fileId = await findProgressFileId();
    const metadata = { name: PROGRESS_FILENAME, parents: fileId ? undefined : ['appDataFolder'] };
    const boundary = '-------ck_boundary';
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
      JSON.stringify(progressObj) +
      `\r\n--${boundary}--`;

    const url = fileId
      ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
      : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

    await fetch(url, {
      method: fileId ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });
  } catch (e) {
    console.warn('Drive sync (write) failed:', e);
  }
}

/* -----------------------------------------------------------
   4) هماهنگی با quest.js
   quest.js از قبل (برای همون sync.js قدیمی مبتنی بر Firestore)
   این قرارداد رو پیاده کرده و صادر (expose) کرده:

     - window.getQuestProgress()        -> {questId: true/false, ...}
     - window.applyCloudProgress(cloud) -> فقط id هایی که توی cloud
                                            true هستن رو روی local
                                            merge می‌کنه (یک‌طرفه:
                                            چیزی رو false نمی‌کنه)،
                                            بعدش خودش render() و
                                            localStorage.setItem
                                            رو انجام می‌ده.
     - window.cloudSaveProgress(progress) -> quest.js خودش این رو
                                            هر بار progress عوض شد
                                            صدا می‌زنه (اگه تعریف
                                            شده باشه). دقیقاً همین
                                            رو باید ما تعریف کنیم.

   پس دیگه نیازی به کلید localStorage جدا یا merge دستی نیست —
   فقط باید این دو تابع رو به Drive وصل کنیم.
   ----------------------------------------------------------- */

// quest.js موقع هر تغییر پیشرفت این رو صدا می‌زنه
window.cloudSaveProgress = function (progress) {
  saveProgressToDrive(progress);
};

function mergeAndApplyProgress(remoteProgress) {
  if (!remoteProgress) return;
  // applyCloudProgress خودش merge یک‌طرفه + render + localStorage رو انجام می‌ده
  const changed = window.applyCloudProgress && window.applyCloudProgress(remoteProgress);
  // بعد از merge، نسخه‌ی نهایی (لوکال + کلود) رو دوباره روی Drive بنویس
  // تا اگه لوکال چیزی جدیدتر داشت، کلود هم بهش برسه.
  const finalProgress = window.getQuestProgress ? window.getQuestProgress() : remoteProgress;
  saveProgressToDrive(finalProgress);
}

/* -----------------------------------------------------------
   5) رویدادهای دکمه‌های موجود در index.html
   ----------------------------------------------------------- */
accountBtn.addEventListener('click', () => {
  if (currentUser) {
    accountMenu.classList.toggle('open');
    if (!accessToken) requestDriveAccess(); // این کلیک صریح کاربره، پس مجازه
  } else if (window.google && window.google.accounts) {
    google.accounts.id.prompt(); // پنجره‌ی ورود با گوگل
  } else {
    alert('در حال اتصال به سرویس گوگل هستیم — چند ثانیه صبر کن یا صفحه رو رفرش کن. اگه ادامه داشت، فایروال/افزونه/شبکه‌ات ممکنه accounts.google.com رو مسدود کرده باشه.');
  }
});

accountSignOutBtn.addEventListener('click', () => {
  currentUser = null;
  accessToken = null;
  localStorage.removeItem('ck_user');
  google.accounts.id.disableAutoSelect();
  updateAccountUI();
  accountMenu.classList.remove('open');
});

/* -----------------------------------------------------------
   شروع
   ----------------------------------------------------------- */
window.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('ck_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateAccountUI();
  }
  waitForGoogleIdentity();
});

// اگه اسکریپت accounts.google.com/gsi/client هنوز لود نشده (کند بودن شبکه
// یا مسدود بودن موقتی)، صبر می‌کنیم تا لود بشه، به‌جای این‌که فوراً کرش کنیم.
function waitForGoogleIdentity(attempt = 0) {
  if (window.google && window.google.accounts) {
    initGoogleIdentity();
    initTokenClient();
    // عمداً requestDriveAccess اینجا صدا زده نمی‌شه: نباید همون اول بازی
    // و بدون کلیک کاربر، پنجره‌ی گوگل باز بشه. اگه کاربر قبلاً لاگین
    // بوده، دسترسی Drive فقط با کلیک خودش روی دکمه‌ی اکانت گرفته می‌شه
    // (به accountBtn.addEventListener پایین‌تر نگاه کن).
    return;
  }
  if (attempt === 0) {
    accountLabel.textContent = 'در حال اتصال به گوگل…';
  }
  if (attempt > 100) {
    // بعد از ~20 ثانیه هنوز لود نشده -> احتمالاً مسدوده (شبکه/افزونه/فایروال)
    accountLabel.textContent = 'اتصال به گوگل ممکن نشد';
    console.error('Google Identity Services script never loaded. Check network/ad-block/firewall for accounts.google.com.');
    return;
  }
  setTimeout(() => waitForGoogleIdentity(attempt + 1), 200);
}
