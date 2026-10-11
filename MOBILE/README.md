# CliniQuick Mobile (Flutter)

Android/iOS app for CliniQuick clients and staff. It talks to the same Express API
as the website (it never connects to MongoDB directly). Admins use the ADMIN website.

## Run

1. Start the backend (`BACKEND`, port 5000).
2. Start an Android emulator (Android Studio → Device Manager) or plug in a phone.
3. In this folder:

```bash
flutter pub get
flutter run
```

No Android emulator? Run it in Chrome instead (port 5500 is allowed in the backend's `CLIENT_URL`):

```bash
flutter run -d chrome --web-port 5500
```

The emulator reaches your PC's backend at `http://10.0.2.2:5000/api` (the default).

To use the deployed backend on Render instead (also needed for a real phone):

```bash
flutter run --dart-define=API_URL=https://YOUR-RENDER-APP.onrender.com/api
```

Build an APK: `flutter build apk --dart-define=API_URL=https://YOUR-RENDER-APP.onrender.com/api`

## Structure

- `lib/main.dart` – app, theme and named routes
- `lib/screens/` – one file per page (login, register, verify_email, forgot_password,
  home, book, appointments, profile, staff_schedule, staff_timeoff)
- `lib/tempstore/activesession.dart` – logged-in token and user (kept in memory)
- `lib/services/api.dart` – HTTP calls and error handling
- `lib/utils/` – date/price formatting and form validation
- `lib/widgets/` – drawer, appointment card, resend-code button, shared helpers
