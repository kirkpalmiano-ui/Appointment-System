import 'package:flutter/material.dart';
import 'package:cliniquick/config.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/tempstore/activesession.dart';
import 'package:cliniquick/utils/validation.dart';
import 'package:cliniquick/widgets/common.dart';

// Login screen for clients and staff (admins use the admin website).
class LoginState extends StatefulWidget {
  const LoginState({super.key});
  @override
  State<LoginState> createState() => LoginPage();
}

class LoginPage extends State<LoginState> {
  TextEditingController emailController = TextEditingController();
  TextEditingController passwordController = TextEditingController();

  String? emailError;
  String? passwordError;
  String serverError = "";
  bool loading = false;
  bool showPassword = false;

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  Future<void> loginAcc() async {
    setState(() {
      emailError = validateEmail(emailController.text);
      passwordError = passwordController.text.isEmpty ? "Password is required." : null;
      serverError = "";
    });
    if (emailError != null || passwordError != null) return;

    setState(() => loading = true);
    final email = emailController.text.trim().toLowerCase();
    try {
      final data = await Api.post("/auth/login", {"email": email, "password": passwordController.text});
      Activesession.start(data["token"], Map<String, dynamic>.from(data["user"]));
      if (!mounted) return;
      // Staff go to their schedule, clients to their dashboard.
      Navigator.pushReplacementNamed(context, Activesession.isStaff ? "/staff" : "/home");
    } on ApiException catch (error) {
      if (error.code == "EMAIL_NOT_VERIFIED") {
        // Correct password but the email was never verified: send a new code.
        try {
          await Api.post("/auth/resend-otp", {"email": email, "purpose": "verify-email"});
        } catch (_) {
          // A code was sent recently; the user can use that one.
        }
        if (!mounted) return;
        setState(() => loading = false);
        Navigator.pushNamed(context, "/verify-email", arguments: email);
        return;
      }
      setState(() {
        serverError = error.message;
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(Icons.local_hospital, size: 56, color: Colors.deepPurple),
                const SizedBox(height: 8),
                const Text(appName, textAlign: TextAlign.center, style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                const Text("Log in to manage your appointments.", textAlign: TextAlign.center),
                const SizedBox(height: 24),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      spacing: 12,
                      children: [
                        if (serverError.isNotEmpty) errorBox(serverError),
                        TextField(
                          controller: emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: InputDecoration(labelText: "Email", errorText: emailError, border: const OutlineInputBorder()),
                        ),
                        TextField(
                          controller: passwordController,
                          obscureText: !showPassword,
                          decoration: InputDecoration(
                            labelText: "Password",
                            errorText: passwordError,
                            border: const OutlineInputBorder(),
                            suffixIcon: IconButton(
                              icon: Icon(showPassword ? Icons.visibility_off : Icons.visibility),
                              onPressed: () => setState(() => showPassword = !showPassword),
                            ),
                          ),
                        ),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () => Navigator.pushNamed(context, "/forgot-password"),
                            child: const Text("Forgot password?"),
                          ),
                        ),
                        FilledButton(
                          onPressed: loading ? null : loginAcc,
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: loading
                                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                                : const Text("Log in"),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => Navigator.pushNamed(context, "/register"),
                  child: const Text("Don't have an account? Sign up"),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
