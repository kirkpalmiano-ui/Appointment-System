import 'package:flutter/foundation.dart';

// Address of the CliniQuick backend API.
//
// The Android emulator reaches your computer's localhost at 10.0.2.2;
// in Chrome (flutter run -d chrome) it is plain localhost.
// For a real phone or the deployed backend, run the app with:
//   flutter run --dart-define=API_URL=https://your-backend.onrender.com/api
const String _apiUrlOverride = String.fromEnvironment("API_URL");

String get apiBaseUrl {
  if (_apiUrlOverride.isNotEmpty) return _apiUrlOverride;
  return kIsWeb ? "http://localhost:5000/api" : "http://10.0.2.2:5000/api";
}

const String appName = "CliniQuick";
