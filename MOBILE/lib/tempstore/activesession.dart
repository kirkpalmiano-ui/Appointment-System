import 'package:cliniquick/services/session_store.dart';

// Holds the signed-in user while the app is open.
// The token lives in memory; it is also kept in secure storage only when the user ticked
// "Keep me signed in" (see SessionStore), so the next launch can skip the login screen.
class Activesession {
  static String token = "";
  static Map<String, dynamic> user = {};

  static bool get isLoggedIn => token.isNotEmpty;
  static bool get isStaff => user["role"] == "staff";

  static void start(String newToken, Map<String, dynamic> newUser) {
    token = newToken;
    user = newUser;
  }

  // Sign out: also forgets a stored token (the remembered email/name stay).
  static void clear() {
    token = "";
    user = {};
    SessionStore.clearSession();
  }
}
