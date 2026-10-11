import 'package:flutter/material.dart';
import 'package:cliniquick/config.dart';
import 'package:cliniquick/services/api.dart';
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

void main() {
  // When the server rejects the saved token (expired or revoked), go back to login.
  Api.onSessionExpired = (message) {
    navigatorKey.currentState?.pushNamedAndRemoveUntil("/login", (route) => false);
    messengerKey.currentState?.showSnackBar(SnackBar(content: Text(message)));
  };
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: appName,
      debugShowCheckedModeBanner: false,
      navigatorKey: navigatorKey,
      scaffoldMessengerKey: messengerKey,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF4F46E5)),
        scaffoldBackgroundColor: const Color.fromARGB(255, 240, 237, 250),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color.fromARGB(255, 190, 177, 226),
        ),
      ),
      initialRoute: "/login",
      routes: {
        "/login": (context) => const LoginState(),
        "/register": (context) => const RegisterState(),
        "/verify-email": (context) => const VerifyEmailState(),
        "/forgot-password": (context) => const ForgotPasswordState(),
        "/home": (context) => const HomeState(),
        "/book": (context) => const BookState(),
        "/appointments": (context) => const AppointmentsState(),
        "/profile": (context) => const ProfileState(),
        "/staff": (context) => const StaffScheduleState(),
        "/staff/time-off": (context) => const StaffTimeOffState(),
      },
    );
  }
}
