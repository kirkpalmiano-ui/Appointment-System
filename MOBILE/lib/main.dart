import 'package:flutter/material.dart';
import 'package:cliniquick/config.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/services/session_store.dart';
import 'package:cliniquick/tempstore/activesession.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/screens/login.dart';
import 'package:cliniquick/screens/register.dart';
import 'package:cliniquick/screens/verify_email.dart';
import 'package:cliniquick/screens/forgot_password.dart';
import 'package:cliniquick/screens/home.dart';
import 'package:cliniquick/screens/book.dart';
import 'package:cliniquick/screens/appointments.dart';
import 'package:cliniquick/screens/profile.dart';
import 'package:cliniquick/screens/staff_schedule.dart';
import 'package:cliniquick/screens/staff_timeoff.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
final GlobalKey<ScaffoldMessengerState> messengerKey = GlobalKey<ScaffoldMessengerState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Remembered theme, email and (if "Keep me signed in" was ticked) the session.
  await SessionStore.load();
  themeMode.value = SessionStore.savedTheme;
  themeMode.addListener(() => SessionStore.saveTheme(themeMode.value));

  // A kept session opens straight on the user's home screen. If the token has expired,
  // the first request gets a 401 and onSessionExpired below sends them back to login.
  var initialRoute = "/login";
  if (SessionStore.savedToken.isNotEmpty) {
    Activesession.start(SessionStore.savedToken, SessionStore.savedUser);
    initialRoute = Activesession.isStaff ? "/staff" : "/home";
  }

  // When the server rejects the saved token (expired or revoked), go back to login.
  Api.onSessionExpired = (message) {
    navigatorKey.currentState?.pushNamedAndRemoveUntil("/login", (route) => false);
    messengerKey.currentState?.showSnackBar(SnackBar(content: Text(message)));
  };
  runApp(MyApp(initialRoute: initialRoute));
}

// Pages that need a session. On the web a restart reopens the page in the address bar,
// so without a session these show the login screen instead of failing.
Widget _signedIn(Widget page) => Activesession.isLoggedIn ? page : const LoginState();

class MyApp extends StatelessWidget {
  final String initialRoute;
  const MyApp({super.key, this.initialRoute = "/login"});

  @override
  Widget build(BuildContext context) {
    // Rebuilds when Profile → "Dark mode" changes `themeMode`.
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: themeMode,
      builder: (context, mode, _) => _app(mode),
    );
  }

  Widget _app(ThemeMode mode) {
    return MaterialApp(
      title: appName,
      debugShowCheckedModeBanner: false,
      navigatorKey: navigatorKey,
      scaffoldMessengerKey: messengerKey,
      theme: buildTheme(Brightness.light),
      darkTheme: buildTheme(Brightness.dark),
      themeMode: mode,
      initialRoute: initialRoute,
      routes: {
        "/login": (context) => const LoginState(),
        "/register": (context) => const RegisterState(),
        "/verify-email": (context) => const VerifyEmailState(),
        "/forgot-password": (context) => const ForgotPasswordState(),
        "/home": (context) => _signedIn(const HomeState()),
        "/book": (context) => _signedIn(const BookState()),
        "/appointments": (context) => _signedIn(const AppointmentsState()),
        "/profile": (context) => _signedIn(const ProfileState()),
        "/staff": (context) => _signedIn(const StaffScheduleState()),
        "/staff/time-off": (context) => _signedIn(const StaffTimeOffState()),
      },
    );
  }
}
