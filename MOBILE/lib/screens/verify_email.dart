import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/tempstore/activesession.dart';
import 'package:cliniquick/utils/validation.dart';
import 'package:cliniquick/widgets/common.dart';
import 'package:cliniquick/widgets/resend_button.dart';

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

  String get email => ModalRoute.of(context)!.settings.arguments as String;

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
    return Scaffold(
      appBar: AppBar(title: const Text("Check your email")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 12,
          children: [
            const Icon(Icons.mark_email_read_outlined, size: 56, color: Colors.deepPurple),
            Text("We sent a 6-digit code to $email. It expires in 10 minutes.", textAlign: TextAlign.center),
            if (notice.isNotEmpty && serverError.isEmpty) Text(notice, textAlign: TextAlign.center, style: const TextStyle(color: Colors.green)),
            if (serverError.isNotEmpty) errorBox(serverError),
            TextField(
              controller: codeController,
              keyboardType: TextInputType.number,
              maxLength: 6,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 28, letterSpacing: 12, fontWeight: FontWeight.bold),
              decoration: const InputDecoration(hintText: "000000", border: OutlineInputBorder(), counterText: ""),
              onChanged: (value) {
                // Submit automatically once all 6 digits are typed.
                if (value.length == 6 && !loading) verify();
              },
            ),
            FilledButton(
              onPressed: loading ? null : verify,
              child: Padding(padding: const EdgeInsets.all(12), child: Text(loading ? "Verifying..." : "Verify email")),
            ),
            ResendButton(onResend: resend),
            const Text("Check your spam folder too.", textAlign: TextAlign.center, style: TextStyle(color: Colors.black54, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
