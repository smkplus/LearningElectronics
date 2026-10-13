/* ========================================================================
   SYNC.JS — ورود با گوگل + ذخیره‌سازی ابری پیشرفت (Firestore)
   کاملاً اختیاری: اگر firebase-config.js پر نشده باشد، این فایل فقط
   دکمه‌ی حساب کاربری را به‌صورت غیرفعال نشان می‌دهد و هیچ خطایی
   تولید نمی‌کند. پیشرفت همیشه در localStorage هم ذخیره می‌شود (quest.js).
   ======================================================================== */

const accountBtn = document.getElementById('accountBtn');
const accountLabel = document.getElementById('accountLabel');
const accountAvatar = document.getElementById('accountAvatar');
const accountMenu = document.getElementById('accountMenu');
const accountSignOutBtn = document.getElementById('accountSignOutBtn');

function isFirebaseConfigured(){
  return typeof FIREBASE_CONFIG !== 'undefined'
    && FIREBASE_CONFIG.apiKey
    && FIREBASE_CONFIG.apiKey.indexOf('YOUR_') !== 0
    && typeof firebase !== 'undefined';
}

let auth = null;
let db = null;
let currentUser = null;

function setAccountUI(state){
  // state: 'disabled' | 'signedOut' | 'signedIn' | 'busy'
  accountMenu.classList.remove('open');
  if(state !== 'signedIn') accountBtn.classList.remove('signed-in');
  if(state === 'disabled'){
    accountBtn.classList.add('disabled');
    accountBtn.title = 'برای فعال‌سازی ورود با گوگل، اطلاعات Firebase را در firebase-config.js وارد کن';
    accountLabel.textContent = 'حالت آفلاین';
    accountAvatar.style.display = 'none';
  } else if(state === 'busy'){
    accountBtn.classList.remove('disabled');
    accountLabel.textContent = 'در حال اتصال…';
    accountAvatar.style.display = 'none';
  } else if(state === 'signedIn' && currentUser){
    accountBtn.classList.remove('disabled');
    accountBtn.title = 'حساب گوگل متصل — پیشرفتت روی هر دستگاهی همگام می‌شود';
    accountLabel.textContent = currentUser.displayName || 'شوالیه';
    if(currentUser.photoURL){
      accountAvatar.src = currentUser.photoURL;
      accountAvatar.style.display = 'block';
      accountBtn.classList.add('signed-in');
    } else {
      accountAvatar.style.display = 'none';
      accountBtn.classList.remove('signed-in');
    }
  } else {
    accountBtn.classList.remove('disabled');
    accountBtn.title = 'ورود با گوگل برای ذخیره‌ی ابری پیشرفت';
    accountLabel.textContent = 'ورود با گوگل';
    accountAvatar.style.display = 'none';
  }
}

async function pullAndMergeCloudProgress(uid){
  try{
    const docRef = db.collection('progress').doc(uid);
    const snap = await docRef.get();
    const local = window.getQuestProgress();
    if(snap.exists){
      const cloud = snap.data().quests || {};
      window.applyCloudProgress(cloud);
      // push merged (local ∪ cloud) back up so the cloud copy is complete too
      await docRef.set({ quests: window.getQuestProgress(), updatedAt: new Date().toISOString() }, { merge: true });
    } else {
      // first time this Google account signs in — seed the cloud with local progress
      await docRef.set({ quests: local, updatedAt: new Date().toISOString() });
    }
  }catch(e){
    console.warn('cloud sync failed:', e);
  }
}

// Called by quest.js (window.cloudSaveProgress) every time progress changes.
window.cloudSaveProgress = function(progress){
  if(!currentUser || !db) return;
  db.collection('progress').doc(currentUser.uid)
    .set({ quests: progress, updatedAt: new Date().toISOString() }, { merge: true })
    .catch(e => console.warn('cloud save failed:', e));
};

async function signInWithGoogle(){
  if(!auth) return;
  setAccountUI('busy');
  try{
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
    // onAuthStateChanged handles the rest
  }catch(e){
    console.warn('google sign-in failed:', e);
    setAccountUI(currentUser ? 'signedIn' : 'signedOut');
  }
}

function signOutUser(){
  if(!auth) return;
  auth.signOut();
}

if(isFirebaseConfigured()){
  try{
    firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
    setAccountUI('signedOut');

    auth.onAuthStateChanged(async (user) => {
      currentUser = user;
      if(user){
        setAccountUI('busy');
        await pullAndMergeCloudProgress(user.uid);
        setAccountUI('signedIn');
        track('cloud_signed_in', {});
      } else {
        setAccountUI('signedOut');
      }
    });

    accountBtn.addEventListener('click', (e) => {
      if(accountBtn.classList.contains('disabled')) return;
      if(currentUser){
        e.stopPropagation();
        accountMenu.classList.toggle('open');
      } else {
        signInWithGoogle();
      }
    });
    accountSignOutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      signOutUser();
    });
    document.addEventListener('click', (e) => {
      if(!accountMenu.contains(e.target) && e.target !== accountBtn){
        accountMenu.classList.remove('open');
      }
    });
  }catch(e){
    console.warn('firebase init failed:', e);
    setAccountUI('disabled');
  }
} else {
  // No config yet (or Firebase SDK failed to load, e.g. offline/blocked) —
  // keep the button visible but inert so the rest of the app is unaffected.
  setAccountUI('disabled');
  accountBtn.addEventListener('click', () => {
    knightLine.textContent = 'برای ورود با گوگل، اول باید در فایل firebase-config.js اطلاعات پروژه‌ی Firebase را وارد کنی. تا آن موقع پیشرفتت همین‌جا روی مرورگرت ذخیره می‌ماند.';
    const avatar = document.querySelector('.knight-avatar');
    if(avatar){ avatar.classList.remove('talk'); void avatar.offsetWidth; avatar.classList.add('talk'); }
  });
}
