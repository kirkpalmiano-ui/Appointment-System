// Holds the signed-in user while the app is open.
// The token is kept in memory only, so closing the app signs the user out.
class Activesession {
  static String token = "";
  static Map<String, dynamic> user = {};

  static bool get isLoggedIn => token.isNotEmpty;
  static bool get isStaff => user["role"] == "staff";

  static void start(String newToken, Map<String, dynamic> newUser) {
    token = newToken;
    user = newUser;
  }

  static void clear() {
    token = "";
    user = {};
  }
}
