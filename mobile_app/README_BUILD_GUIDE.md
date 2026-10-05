# 📱 Kerala Superstore Manchester - Mobile App Guide (Flutter)

ഈ മൊബൈൽ ആപ്പ് **Kerala Superstore Manchester** വെബ്സൈറ്റിനും അഡ്മിൻ പാനലിനും അനുയോജ്യമായ രീതിയിൽ **Flutter & Firebase Cloud Messaging (FCM)** സാങ്കേതികവിദ്യ ഉപയോഗിച്ച് തയ്യാറാക്കിയതാണ്.

---

## 🌟 പ്രധാന സവിശേഷതകൾ (Key Features)

1. **തത്സമയ അപ്‌ഡേറ്റുകൾ (Live Storefront Sync):**
   - അഡ്മിൻ വെബ്സൈറ്റിൽ പുതിയ ഉൽപ്പന്നങ്ങൾ ചേർക്കുകയോ, വില മാറ്റുകയോ, ഡെയ്‌ലി സ്പെഷ്യൽ നൽകുകയോ ചെയ്യുമ്പോൾ ആപ്പ് റീ-ഇൻസ്റ്റാൾ ചെയ്യാതെ തന്നെ തത്സമയം ഉപഭോക്താവിന്റെ ഫോണിൽ അപ്‌ഡേറ്റ് ആകും.

2. **ഡെയ്‌ലി സ്പെഷ്യൽസ് & പുഷ് നോട്ടിഫിക്കേഷൻസ് (Daily Specials & FCM Push):**
   - അഡ്മിൻ പാനലിൽ (`/admin/specials`) നിന്നും **"Thalassery Chicken Dum Biriyani ready!"** അല്ലെങ്കിൽ ഫ്രഷ് എയർ കാർഗോ മെസ്സേജ് അയക്കുമ്പോൾ, ഈ ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്തിട്ടുള്ള എല്ലാ ഉപഭോക്താക്കളുടെയും ഫോണിലേക്ക് തത്സമയം ശബ്ദത്തോടും വൈബ്രേഷനോടും കൂടി നോട്ടിഫിക്കേഷൻ എത്തും.
   - ആപ്പ് ക്ലോസ് ചെയ്തു വെച്ചിരിക്കുകയാണെങ്കിലും (Background / Screen Locked) നോട്ടിഫിക്കേഷൻ ഫോൺ സ്ക്രീനിൽ തെളിയും.

3. **നേറ്റീവ് സ്പ്ലാഷ് സ്ക്രീൻ (Native Luxury Splash Screen):**
   - ആപ്പ് തുറക്കുമ്പോൾ Kerala Superstore-ന്റെ യഥാർത്ഥ ലോഗോ മനോഹരമായി തെളിയുന്ന ആനിമേഷൻ.

4. **ഓഫ്‌ലൈൻ സേഫ്റ്റി & വാട്സാപ്പ് ഇന്റഗ്രേഷൻ:**
   - ഇന്റർനെറ്റ് കട്ടായാൽ 'Offline Retry' സ്ക്രീൻ.
   - ഹോട്ട്‌ലൈൻ / വാട്സാപ്പ് ക്ലിക്ക് ചെയ്യുമ്പോൾ ഫോണിലെ WhatsApp ആപ്പ് തനിയെ ഓപ്പൺ ആകും.

---

## 🛠️ ആപ്പ് എങ്ങനെ ബിൽഡ് ചെയ്യാം? (How to Build APK)

### ഘട്ടം 1: കമ്പ്യൂട്ടറിൽ ഫ്ലട്ടർ സെറ്റ് ചെയ്യുക (One-time Setup)
1. [Flutter ഔദ്യോഗിക വെബ്സൈറ്റിൽ](https://docs.flutter.dev/get-started/install/windows/mobile) നിന്നും **Flutter SDK (Windows)** സിപ്പ് ഫയൽ ഡൗൺലോഡ് ചെയ്യുക.
2. അത് `C:\flutter` എന്നതിലേക്ക് Extract ചെയ്യുക.
3. വിൻഡോസ് എൻവയോൺമെന്റ് വേരിയബിളിൽ (Environment Variables -> System PATH) `C:\flutter\bin` ആഡ് ചെയ്യുക.
4. കമാൻഡ് പ്രോംപ്റ്റ് / ടെർമിനലിൽ `flutter doctor` എന്ന് റൺ ചെയ്ത് പരിശോധിക്കുക.

---

### ഘട്ടം 2: ഡിപെൻഡൻസികൾ ഇൻസ്റ്റാൾ ചെയ്യുക
ടെർമിനൽ തുറന്ന് `mobile_app` ഫോൾഡറിലേക്ക് പോകുക:
```bash
cd mobile_app
flutter pub get
```

---

### ഘട്ടം 3: ആപ്പ് ടെസ്റ്റ് ചെയ്യുക (Run on Phone or Emulator)
നിങ്ങളുടെ ആൻഡ്രോയിഡ് ഫോൺ USB വഴി കമ്പ്യൂട്ടറുമായി ബന്ധിപ്പിച്ച ശേഷം (USB Debugging ഓൺ ചെയ്യുക):
```bash
flutter run
```
നിങ്ങളുടെ ഫോണിൽ Kerala Superstore ആപ്പ് ഇൻസ്റ്റാൾ ആയി ഓപ്പൺ ആകും!

---

### ഘട്ടം 4: കസ്റ്റമേഴ്സിന് നൽകാനുള്ള APK ഫയൽ നിർമ്മിക്കുക (Production Build)
ടെർമിനലിൽ ഈ കമാൻഡ് നൽകുക:
```bash
flutter build apk --release
```

* കമാൻഡ് പൂർത്തിയാകുമ്പോൾ ഇൻസ്റ്റാൾ ചെയ്യാവുന്ന ഒറിജിനൽ APK ഫയൽ ഈ ലൊക്കേഷനിൽ ലഭിക്കും:
  👉 **`mobile_app/build/app/outputs/flutter-apk/app-release.apk`**

* ഈ `app-release.apk` ഫയലിന്റെ പേര് **`kerala-superstore.apk`** എന്ന് മാറ്റി നമ്മുടെ വെബ്സൈറ്റിന്റെ **`public/downloads/`** ഫോൾഡറിലേക്ക് കോപ്പി ചെയ്താൽ, കസ്റ്റമേഴ്സിന് വെബ്സൈറ്റിൽ നിന്നും ഒറ്റ ക്ലിക്കിൽ ആപ്പ് ഡൗൺലോഡ് ചെയ്യാം!

---

## 🔔 അഡ്മിൻ അയക്കുന്ന നോട്ടിഫിക്കേഷനുകൾ ഫോണിൽ ലഭിക്കാൻ (Firebase Setup)

Google-ന്റെ സൗജന്യ സർവീസായ **Firebase Cloud Messaging (FCM)** ആണ് ഇതിനായി ഉപയോഗിക്കുന്നത്:

1. [Firebase Console](https://console.firebase.google.com/) തുറക്കുക (സൗജന്യമാണ്).
2. **Add Project** ക്ലിക്ക് ചെയ്ത് `Kerala Superstore` എന്ന പേരിൽ പ്രോജക്റ്റ് ഉണ്ടാക്കുക.
3. പ്രോജക്റ്റിൽ **Add Android App** ക്ലിക്ക് ചെയ്യുക:
   - Package name: **`com.keralasuperstore.manchester`** നൽകുക.
4. ലഭിക്കുന്ന **`google-services.json`** ഫയൽ ഡൗൺലോഡ് ചെയ്ത് **`mobile_app/android/app/google-services.json`** എന്ന ലൊക്കേഷനിൽ ഇടുക.
5. Firebase പ്രൊജക്റ്റ് സെറ്റിങ്സിൽ (Project Settings -> Cloud Messaging) നിന്നും **Server Key** കോപ്പി ചെയ്ത് നമ്മുടെ വെബ്സൈറ്റിന്റെ `.env.local` ഫയലിൽ നൽകുക:
   ```env
   FCM_SERVER_KEY=your_firebase_server_key_here
   ```

ഇത്രയും കഴിഞ്ഞാൽ, അഡ്മിൻ പാനലിൽ (`http://localhost:3026/admin/specials`) നിന്നും **"Broadcast & Publish Special"** ക്ലിക്ക് ചെയ്യുന്ന നിമിഷം, ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്തിട്ടുള്ള എല്ലാവരുടെയും ഫോണിലേക്ക് ഓട്ടോമാറ്റിക് ആയി നോട്ടിഫിക്കേഷൻ എത്തും!
