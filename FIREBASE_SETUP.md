# 🔥 Firebase Setup Guide — v4rx.me Bounty Board

## Langkah 1 — Buat Firebase Project

1. Buka [console.firebase.google.com](https://console.firebase.google.com)
2. Klik **"Add project"**
3. Nama project: `v4rx-bounty` (atau terserah)
4. Matikan Google Analytics (tidak diperlukan)
5. Klik **"Create project"**

---

## Langkah 2 — Daftarkan Web App

1. Di halaman project, klik icon **`</>`** (Web)
2. App nickname: `Bounty Board`
3. **Jangan** centang Firebase Hosting
4. Klik **"Register app"**
5. Copy konfigurasi yang muncul:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "v4rx-bounty.firebaseapp.com",
  projectId: "v4rx-bounty",
  storageBucket: "v4rx-bounty.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

## Langkah 3 — Isi `.env.local`

Buka file `e:\Code\BountyOsu\.env.local` dan isi:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=v4rx-bounty.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=v4rx-bounty
VITE_FIREBASE_STORAGE_BUCKET=v4rx-bounty.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## Langkah 4 — Aktifkan Authentication

1. Sidebar Firebase Console → **Authentication**
2. Klik **"Get started"**
3. Tab **"Sign-in method"**
4. Klik **Email/Password** → **Enable** → Save

---

## Langkah 5 — Setup Firestore Database

1. Sidebar → **Firestore Database**
2. Klik **"Create database"**
3. Pilih **"Start in production mode"**
4. Pilih region terdekat (misal: `asia-southeast1` untuk Indonesia)
5. Klik **"Enable"**

---

## Langkah 6 — Set Firestore Security Rules & Database Schema

### 🗄️ Database Schema (`users` collection)

Document Path: `users/{userId}`

```json
{
  "id": "FIREBASE_AUTH_UID",
  "uid": "FIREBASE_AUTH_UID",
  "email": "user@example.com",
  "username": "Xym",
  "avatarUrl": "https://v4rx.me/user/avatar/83.png",
  "countryCode": "ID",
  "countryFlag": "🇮🇩",
  "v4rxRank": 81,
  "v4rxPp": 19062,
  "v4rxAccuracy": 94.91,
  "playCount": 0,
  "role": "bounty_hunter",
  "bountyPoints": 0,
  "bountiesPostedCount": 0,
  "bountiesClaimedCount": 0,
  "title": "★ Sheriff Giver",
  "createdAt": "2026-08-18T00:00:00.000Z",
  "createdAtServer": "SERVER_TIMESTAMP"
}
```

---

### 🔒 Firestore Security Rules (`firestore.rules`)

Di Firestore Console → tab **Rules**, paste rules resmi berikut:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // 1. Users Collection — Public read (Leaderboard), write terbatas pemilik UID
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create, update: if isOwner(userId);

      // Sub-collection Friends — Realtime syncing between friends
      match /friends/{friendId} {
        allow read, write: if isAuthenticated();
      }

      // Sub-collection Friend Requests — Incoming invitations
      match /friendRequests/{requestId} {
        allow read, write: if isAuthenticated();
      }
    }

    // 2. Bounties Collection — Validasi pembuat bounty sesuai Auth UID
    match /bounties/{bountyId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.giver.id == request.auth.uid;
      allow update, delete: if isAuthenticated();

      // Sub-collection Submissions — Validasi hunter ID sesuai Auth UID
      match /submissions/{subId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() && request.resource.data.hunterId == request.auth.uid;
        allow update, delete: if isAuthenticated();
      }
    }

    // 3. Notifications Collection — Notifikasi realtime Hunter & Giver
    match /notifications/{notifId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
    }
  }
}
```

Klik **"Publish"**.

---

## Langkah 7 — Jalankan App

```bash
npm run dev
```

Buka http://localhost:5173 → Tampil halaman Board & Profile!

---

## ✅ Checklist

- [ ] Firebase project dibuat
- [ ] Web app didaftarkan
- [ ] `.env.local` terisi
- [ ] Authentication (Email/Password) diaktifkan
- [ ] Firestore database dibuat (`users`, `bounties`)
- [ ] Field `countryCode`, `countryFlag`, `createdAt` tersimpan di Firestore
- [ ] Security rules dipasang & dipublish
- [ ] `npm run dev` berjalan

---

## Catatan

- `.env.local` sudah ada di `.gitignore` — tidak akan ikut di-commit.
- Setiap user yang register akan otomatis membuat Firestore document `users/{uid}` berisi data profil, bendera `countryFlag`, dan tanggal pembuatan `createdAt` (`Here since`).
- Bounty tersimpan di collection `bounties/`, submissions di subcollection `bounties/{id}/submissions/`.

