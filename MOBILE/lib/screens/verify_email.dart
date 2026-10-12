import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/tempstore/activesession.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/validation.dart';
import 'package:cliniquick/widgets/auth/auth_frame.dart';
import 'package:cliniquick/widgets/common.dart';
import 'package:cliniquick/widgets/resend_button.dart';
import 'package:cliniquick/widgets/ui.dart';

// Enter the 6-digit code sent to the email after signing up.
class VerifyEmailState extends StatefulWidget {
  const VerifyEmailState({super.key});
  @override
  State<VerifyEmailState> createState() => VerifyEmailPage();
}

class VerifyEmailPage extends State<VerifyEmailState> {
  TextEditingController codeController = TextEditingController();
  String serverError = "";
  String notice = "";
  bool loading = false;

  @override
  void dispose() {
    codeController.dispose();
    super.dispose();
  }

  // Passed by the login / sign-up screen. Missing when the page is opened directly
  // (e.g. the web app restarted on #/verify-email), which is handled in build().
  String? get emailArg => ModalRoute.of(context)?.settings.arguments as String?;
  String get email => emailArg ?? "";

  Future<void> verify() async {
    final codeError = validateCode(codeController.text);
    if (codeError != null) {
      setState(() => serverError = codeError);
      return;
    }
    setState(() {
      loading = true;
      serverError = "";
    });
    try {
      final data = await Api.post("/auth/verify-email", {"email": email, "otp": codeController.text.trim()});
      Activesession.start(data["token"], Map<String, dynamic>.from(data["user"]));
      if (!mounted) return;
      Navigator.pushNamedAndRemoveUntil(context, "/home", (route) => false);
    } on ApiException catch (error) {
      if (error.code == "ALREADY_VERIFIED" && mounted) {
        showMessage(context, "Your email is already verified. Please log in.");
        Navigator.pushNamedAndRemoveUntil(context, "/login", (route) => false);
        return;
      }
      setState(() {
        serverError = error.message;
        loading = false;
      });
      codeController.clear();
    }
  }

  Future<int> resend() async {
    try {
      final data = await Api.post("/auth/resend-otp", {"email": email, "purpose": "verify-email"});
      setState(() {
        notice = "A new code is on its way. Earlier codes no longer work.";
        serverError = "";
      });
      return data["resendAvailableIn"] ?? 60;
    } on ApiException catch (error) {
      setState(() => serverError = error.message);
      return error.retryAfter ?? 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    // No email to verify: go back to the login screen instead of crashing.
    if (emailArg == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) Navigator.pushNamedAndRemoveUntil(context, "/login", (route) => false);
      });
      return const Scaffold(body: SizedBox.shrink());
    }
    return AuthFrame(
      headline: "One last step.",
      lede: "Enter the 6-digit code we emailed you to confirm your account.",
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Padding(
            padding: EdgeInsets.only(bottom: 14),
            child: Align(alignment: Alignment.centerLeft, child: IconTile(Icons.mark_email_read_outlined, size: 48)),
          ),
          AuthHeading(
            "Check your email",
            subtitleWidget: Text.rich(
              TextSpan(children: [
                const TextSpan(text: "We sent a 6-digit code to "),
                TextSpan(text: email, style: TextStyle(fontWeight: FontWeight.w700, color: c.text)),
                const TextSpan(text: ". It expires in 10 minutes."),
              ]),
              style: TextStyle(fontSize: 15, height: 1.4, color: c.muted),
            ),
          ),
          if (notice.isNotEmpty && serverError.isEmpty) AuthMessage(notice, success: true),
          if (serverError.isNotEmpty) AuthMessage(serverError),
          AuthCodeField(
            controller: codeController,
            onChanged: (value) {
              // Submit automatically once all 6 digits are typed.
              if (value.length == 6 && !loading) verify();
            },
          ),
          const SizedBox(height: 16),
          AuthSubmitButton(label: "Verify email", busyLabel: "Verifying...", busy: loading, onPressed: verify),
          const SizedBox(height: 10),
          Center(child: ResendButton(onResend: resend)),
          const SizedBox(height: 6),
          const AuthHint("Check your spam folder too.", align: TextAlign.center),
        ],
      ),
    );
  }
}
