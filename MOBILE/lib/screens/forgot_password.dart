import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/validation.dart';
import 'package:cliniquick/widgets/auth/auth_frame.dart';
import 'package:cliniquick/widgets/common.dart';
import 'package:cliniquick/widgets/motion.dart';
import 'package:cliniquick/widgets/resend_button.dart';
import 'package:cliniquick/widgets/ui.dart';

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
    return AuthSubmitButton(label: label, busy: loading, onPressed: onPressed);
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final steps = ["Email", "Code", "New password"];
    final mutedStyle = TextStyle(fontSize: 15, height: 1.4, color: c.muted);
    final Widget subtitle = switch (step) {
      0 => Text("Enter your account's email and we'll send you a 6-digit code.", style: mutedStyle),
      1 => Text.rich(
          TextSpan(children: [
            const TextSpan(text: "Enter the code sent to "),
            TextSpan(text: email, style: TextStyle(fontWeight: FontWeight.w700, color: c.text)),
            const TextSpan(text: ". It expires in 10 minutes."),
          ]),
          style: mutedStyle,
        ),
      _ => Text("Choose a new password for your account.", style: mutedStyle),
    };
    return AuthFrame(
      headline: "Forgot your password?",
      lede: "No problem. We'll email you a code so you can set a new one.",
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Step indicator: "STEP 1 OF 3 · EMAIL" and a rounded progress bar.
          Semantics(
            label: "Step ${step + 1} of 3: ${steps[step]}",
            excludeSemantics: true,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Eyebrow("Step ${step + 1} of 3 · ${steps[step]}"),
                const SizedBox(height: 8),
                TweenAnimationBuilder<double>(
                  tween: Tween(end: (step + 1) / 3),
                  duration: reduceMotion(context) ? Duration.zero : const Duration(milliseconds: 350),
                  curve: Curves.easeOutCubic,
                  builder: (context, value, _) => ClipRRect(
                    borderRadius: BorderRadius.circular(99),
                    child: LinearProgressIndicator(value: value, minHeight: 6, color: c.primary, backgroundColor: c.border),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          AuthHeading("Reset your password", subtitleWidget: subtitle),
          if (notice.isNotEmpty && serverError.isEmpty && step == 1) AuthMessage(notice, success: true),
          if (serverError.isNotEmpty) AuthMessage(serverError),
          if (step == 0) ...[
            AuthField(
              controller: emailController,
              label: "Email",
              hint: "you@example.com",
              icon: Icons.mail_outline_rounded,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.done,
              autofillHints: const [AutofillHints.email],
              onSubmitted: (_) {
                if (!loading) sendCode();
              },
            ),
            const SizedBox(height: 18),
            button("Send code", sendCode),
          ],
          if (step == 1) ...[
            AuthCodeField(controller: codeController),
            const SizedBox(height: 16),
            button("Continue", checkCode),
            const SizedBox(height: 10),
            Center(child: ResendButton(onResend: resend)),
          ],
          if (step == 2) ...[
            AuthField(
              controller: passwordController,
              label: "New password",
              icon: Icons.lock_outline_rounded,
              password: true,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.newPassword],
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(4, 6, 4, 16),
              child: AuthHint("8 to 32 characters, with a letter and a number"),
            ),
            AuthField(
              controller: confirmController,
              label: "Confirm new password",
              icon: Icons.lock_outline_rounded,
              password: true,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) {
                if (!loading) savePassword();
              },
            ),
            const SizedBox(height: 18),
            button("Update password", savePassword),
          ],
        ],
      ),
    );
  }
}
