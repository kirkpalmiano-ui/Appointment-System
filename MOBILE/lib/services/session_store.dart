import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// Things the app remembers between launches, kept in the platform's secure storage
// (Keychain on iOS, Keystore-backed on Android):
//   - the login token + user, only when "Keep me signed in" was ticked
//   - the last email and first name, so the login screen can greet a returning user
//   - the light/dark choice
// `load()` runs once in main() so the values are ready before the first screen draws.
class SessionStore {
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  static const _tokenKey = "session_token";
  static const _userKey = "session_user";
  static const _emailKey = "remembered_email";
  static const _nameKey = "remembered_first_name";
  static const _themeKey = "theme_mode";
  static const _keepKey = "keep_signed_in";

  // Read by the login screen and main() after load().
  static String savedToken = "";
  static Map<String, dynamic> savedUser = {};
  static String rememberedEmail = "";
  static String rememberedFirstName = "";
  static ThemeMode savedTheme = ThemeMode.system;
  static bool keepSignedIn = true;

  static bool get hasRememberedUser => rememberedEmail.isNotEmpty;

  // Storage can be unavailable (tests, some browsers): the app then simply forgets everything.
  static Future<void> load() async {
    try {
      final all = await _storage.readAll();
      savedToken = all[_tokenKey] ?? "";
      savedUser = _decode(all[_userKey]);
      rememberedEmail = all[_emailKey] ?? "";
      rememberedFirstName = all[_nameKey] ?? "";
      keepSignedIn = all[_keepKey] != "false";
      savedTheme = switch (all[_themeKey]) {
        "light" => ThemeMode.light,
        "dark" => ThemeMode.dark,
        _ => ThemeMode.system,
      };
      if (savedToken.isEmpty || savedUser.isEmpty) savedToken = "";
    } catch (_) {
      savedToken = "";
    }
  }

  // After a successful login. The token is only written to storage when the user asked to stay signed in.
  static Future<void> saveLogin({required String token, required Map<String, dynamic> user, required bool keep}) async {
    keepSignedIn = keep;
    rememberedEmail = (user["email"] ?? "").toString();
    rememberedFirstName = (user["firstName"] ?? user["name"]?.toString().split(" ").first ?? "").toString();
    await _write({
      _emailKey: rememberedEmail,
      _nameKey: rememberedFirstName,
      _keepKey: keep ? "true" : "false",
      _tokenKey: keep ? token : null,
      _userKey: keep ? jsonEncode(user) : null,
    });
  }

  // Sign out (or an expired token): forget the session but keep the remembered email and name.
  static Future<void> clearSession() async {
    savedToken = "";
    savedUser = {};
    await _write({_tokenKey: null, _userKey: null});
  }

  // "Not you? Use another account".
  static Future<void> forgetUser() async {
    rememberedEmail = "";
    rememberedFirstName = "";
    await _write({_emailKey: null, _nameKey: null});
  }

  static Future<void> saveTheme(ThemeMode mode) async {
    savedTheme = mode;
    await _write({_themeKey: mode.name});
  }

  // null deletes the key. Failures are ignored: remembering is a convenience, never required.
  static Future<void> _write(Map<String, String?> values) async {
    for (final entry in values.entries) {
      try {
        if (entry.value == null) {
          await _storage.delete(key: entry.key);
        } else {
          await _storage.write(key: entry.key, value: entry.value);
        }
      } catch (_) {}
    }
  }

  static Map<String, dynamic> _decode(String? raw) {
    if (raw == null || raw.isEmpty) return {};
    try {
      return Map<String, dynamic>.from(jsonDecode(raw) as Map);
    } catch (_) {
      return {};
    }
  }
}
