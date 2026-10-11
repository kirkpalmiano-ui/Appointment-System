import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/utils/validation.dart';
import 'package:cliniquick/widgets/common.dart';
import 'package:cliniquick/widgets/resend_button.dart';

// Three steps on one screen: email -> 6-digit code -> new password.
class ForgotPasswordState extends StatefulWidget {
  const ForgotPasswordState({super.key});
  @override
  State<ForgotPasswordState> createState() => ForgotPasswordPage();
}

class ForgotPasswordPage extends State<ForgotPasswordState> {
  TextEditingController emailController = TextEditingController();
  TextEditingController codeController = TextEditingController();
  TextEditingController passwordController = TextEditingController();
  TextEditingController confirmController = TextEditingController();

  int step = 0;
  String resetToken = "";
  String serverError = "";
  String notice = "";
  bool loading = false;

  String get email => emailController.text.trim().toLowerCase();

  @override
  void dispose() {
    for (final controller in [emailController, codeController, passwordController, confirmController]) {
      controller.dispose();
    }
    super.dispose();
  }

  // Runs an API call with the loading spinner and error message handled.
  Future<void> run(Future<void> Function() action) async {
    setState(() {
      loading = true;
      serverError = "";
    });
    try {
      await action();
    } on ApiException catch (error) {
      setState(() => serverError = error.message);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> sendCode() async {
    final emailError = validateEmail(emailController.text);
    if (emailError != null) {
      setState(() => serverError = emailError);
      return;
    }
    await run(() async {
      final data = await Api.post("/auth/forgot-password", {"email": email});
      setState(() {
        notice = data["message"] ?? "";
        step = 1;
      });
    });
  }

  Future<void> checkCode() async {
    final codeError = validateCode(codeController.text);
    if (codeError != null) {
      setState(() => serverError = codeError);
      return;
    }
    await run(() async {
      final data = await Api.post("/auth/verify-reset-otp", {"email": email, "otp": codeController.text.trim()});
      setState(() {
        resetToken = data["resetToken"];
        step = 2;
      });
    });
    codeController.clear();
  }

  Future<void> savePassword() async {
    final passwordError = validatePassword(passwordController.text);
    if (passwordError != null || confirmController.text != passwordController.text) {
      setState(() => serverError = passwordError ?? "Passwords do not match.");
      return;
    }
    await run(() async {
      await Api.post("/auth/reset-password", {"email": email, "resetToken": resetToken, "password": passwordController.text});
      if (!mounted) return;
      showMessage(context, "Password updated. Log in with your new password.");
      Navigator.pop(context);
    });
  }

  Future<int> resend() async {
    try {
      final data = await Api.post("/auth/resend-otp", {"email": email, "purpose": "reset-password"});
      setState(() => notice = "A new code is on its way. Earlier codes no longer work.");
      return data["resendAvailableIn"] ?? 60;
    } on ApiException catch (error) {
      setState(() => serverError = error.message);
      return error.retryAfter ?? 0;
    }
  }

  Widget button(String label, VoidCallback onPressed) {
    return FilledButton(
      onPressed: loading ? null : onPressed,
      child: Padding(padding: const EdgeInsets.all(12), child: Text(loading ? "Please wait..." : label)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final steps = ["Email", "Code", "New password"];
    return Scaffold(
      appBar: AppBar(title: const Text("Reset your password")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 12,
          children: [
            Text("Step ${step + 1} of 3: ${steps[step]}", style: const TextStyle(fontWeight: FontWeight.bold)),
            LinearProgressIndicator(value: (step + 1) / 3),
            if (notice.isNotEmpty && serverError.isEmpty && step == 1) Text(notice, style: const TextStyle(color: Colors.green)),
            if (serverError.isNotEmpty) errorBox(serverError),
            if (step == 0) ...[
              const Text("Enter your account's email and we'll send you a 6-digit code."),
              TextField(
                controller: emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: "Email", border: OutlineInputBorder()),
              ),
              button("Send code", sendCode),
            ],
            if (step == 1) ...[
              Text("Enter the code sent to $email. It expires in 10 minutes."),
              TextField(
                controller: codeController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 28, letterSpacing: 12, fontWeight: FontWeight.bold),
                decoration: const InputDecoration(hintText: "000000", border: OutlineInputBorder(), counterText: ""),
              ),
              button("Continue", checkCode),
              ResendButton(onResend: resend),
            ],
            if (step == 2) ...[
              TextField(
                controller: passwordController,
                obscureText: true,
                decoration: const InputDecoration(labelText: "New password", border: OutlineInputBorder()),
              ),
              const Text("8 to 32 characters, with a letter and a number", style: TextStyle(color: Colors.black54, fontSize: 12)),
              TextField(
                controller: confirmController,
                obscureText: true,
                decoration: const InputDecoration(labelText: "Confirm new password", border: OutlineInputBorder()),
              ),
              button("Update password", savePassword),
            ],
          ],
        ),
      ),
    );
  }
}
