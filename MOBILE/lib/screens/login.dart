import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/services/session_store.dart';
import 'package:cliniquick/tempstore/activesession.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/validation.dart';
import 'package:cliniquick/widgets/auth/app_text_field.dart';
import 'package:cliniquick/widgets/auth/auth_frame.dart';
import 'package:cliniquick/widgets/auth/gradient_background.dart';
import 'package:cliniquick/widgets/ui.dart';

// Login screen for clients and staff (admins use the admin website).
// No card: the fields sit on the pastel background and the button sits low, within thumb reach.
// A returning user gets their email prefilled and "Welcome back, {name}."
class LoginState extends StatefulWidget {
  const LoginState({super.key});
  @override
  State<LoginState> createState() => LoginPage();
}

class LoginPage extends State<LoginState> {
  final formKey = GlobalKey<FormState>();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final emailFocus = FocusNode();
  final passwordFocus = FocusNode();

  String serverError = ""; // network / lockout / server problems, shown above the button
  String credentialsError = ""; // wrong email or password, shown under the password field
  bool loading = false;
  bool submitted = false; // validate as the user types only after the first attempt
  bool keepSignedIn = SessionStore.keepSignedIn;
  bool returning = SessionStore.hasRememberedUser;

  @override
  void initState() {
    super.initState();
    if (returning) {
      emailController.text = SessionStore.rememberedEmail;
      // Only the password is missing, so start there.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) passwordFocus.requestFocus();
      });
    }
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    emailFocus.dispose();
    passwordFocus.dispose();
    super.dispose();
  }

  String? checkEmail(String? _) {
    final email = emailController.text.trim();
    if (email.isEmpty) return "Email is required.";
    if (validateEmail(email) != null) return "Enter a valid email, like name@example.com";
    return null;
  }

  String? checkPassword(String? _) => passwordController.text.isEmpty ? "Password is required." : null;

  Future<void> loginAcc() async {
    if (loading) return;
    setState(() {
      submitted = true;
      serverError = "";
      credentialsError = "";
    });
    if (!formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();

    setState(() => loading = true);
    final email = emailController.text.trim().toLowerCase();
    try {
      final data = await Api.post("/auth/login", {"email": email, "password": passwordController.text});
      final token = data["token"] as String;
      final user = Map<String, dynamic>.from(data["user"]);
      Activesession.start(token, user);
      // Remember the email and first name; store the token only if "Keep me signed in" is ticked.
      await SessionStore.saveLogin(token: token, user: user, keep: keepSignedIn);
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
      if (!mounted) return;
      // Keep the email, clear only the password, and show the server's message inline. Resetting the
      // form stops the now-empty password from also showing "Password is required."
      final wrongCredentials = error.status == 401;
      passwordController.clear();
      formKey.currentState?.reset();
      setState(() {
        submitted = false;
        credentialsError = wrongCredentials ? error.message : "";
        serverError = wrongCredentials ? "" : error.message;
        loading = false;
      });
      passwordFocus.requestFocus();
    }
  }

  void clearServerErrors() => setState(() {
    serverError = "";
    credentialsError = "";
  });

  // "Not you? Use another account": forget the remembered email/name and start fresh.
  Future<void> useAnotherAccount() async {
    await SessionStore.forgetUser();
    if (!mounted) return;
    emailController.clear();
    passwordController.clear();
    formKey.currentState?.reset();
    setState(() {
      returning = false;
      submitted = false;
      serverError = "";
      credentialsError = "";
    });
    emailFocus.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final firstName = SessionStore.rememberedFirstName;
    final headline = returning && firstName.isNotEmpty ? "Welcome back, $firstName." : "Welcome back.";

    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: Colors.transparent,
      body: GestureDetector(
        // Tap anywhere outside a field to close the keyboard.
        behavior: HitTestBehavior.translucent,
        onTap: () => FocusScope.of(context).unfocus(),
        child: GradientBackground(
          child: SafeArea(
            child: LayoutBuilder(
              builder: (context, box) => SingleChildScrollView(
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                // At least one screen tall, so the top and bottom groups can sit apart (button low,
                // within thumb reach). Taller content (keyboard open, big text) simply scrolls.
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: box.maxHeight),
                  child: Padding(
                    // 20px gutters; on tablets the content stays a phone-width column in the middle.
                    padding: EdgeInsets.fromLTRB(math.max(20, (box.maxWidth - 480) / 2), 12, math.max(20, (box.maxWidth - 480) / 2), 24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Flexible(child: AuthLogo()),
                                ThemeToggleButton(),
                              ],
                            ),
                            const SizedBox(height: 26),
                            const SoftChip("Patient Portal"),
                            const SizedBox(height: 14),
                            Semantics(
                              header: true,
                              child: Text(
                                headline,
                                style: TextStyle(fontSize: 42, fontWeight: FontWeight.w800, letterSpacing: -2.3, height: 1.0, color: c.text),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text("Log in to manage your appointments.", style: TextStyle(fontSize: 16, height: 1.4, color: c.muted)),
                            const SizedBox(height: 28),
                            _form(c),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const SizedBox(height: 24),
                            if (serverError.isNotEmpty) _ServerError(serverError),
                            _LoginButton(loading: loading, onPressed: loginAcc),
                            const SizedBox(height: 14),
                            Center(
                              child: returning
                                  ? AuthLinkLine(prompt: "Not you?", label: "Use another account", onTap: useAnotherAccount)
                                  : AuthLinkLine(prompt: "Don't have an account?", label: "Sign up", onTap: () => Navigator.pushNamed(context, "/register")),
                            ),
                            const SizedBox(height: 6),
                            const AuthHint("Your health data is encrypted and private", icon: Icons.shield_outlined, align: TextAlign.center),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _form(AppColors c) {
    return Form(
      key: formKey,
      autovalidateMode: submitted ? AutovalidateMode.onUserInteraction : AutovalidateMode.disabled,
      child: AutofillGroup(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AppTextField(
              controller: emailController,
              focusNode: emailFocus,
              label: "Email",
              hint: "you@example.com",
              icon: Icons.mail_outline_rounded,
              enabled: !loading,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.email, AutofillHints.username],
              autocorrect: false,
              enableSuggestions: false,
              validator: checkEmail,
              onChanged: (_) {
                if (serverError.isNotEmpty || credentialsError.isNotEmpty) clearServerErrors();
              },
              onSubmitted: (_) => passwordFocus.requestFocus(),
            ),
            const SizedBox(height: 20),
            AppTextField(
              controller: passwordController,
              focusNode: passwordFocus,
              label: "Password",
              hint: "Enter your password",
              icon: Icons.lock_outline_rounded,
              password: true,
              enabled: !loading,
              textInputAction: TextInputAction.done,
              autofillHints: const [AutofillHints.password],
              validator: checkPassword,
              externalError: credentialsError.isEmpty ? null : credentialsError,
              onChanged: (_) {
                if (serverError.isNotEmpty || credentialsError.isNotEmpty) clearServerErrors();
              },
              onSubmitted: (_) => loginAcc(),
            ),
            const SizedBox(height: 8),
            // Side by side when they fit; on narrow phones with large text "Forgot password?" drops to its own line.
            Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                // The whole "☐ Keep me signed in" area toggles the box and reads as one control.
                MergeSemantics(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(10),
                    onTap: loading ? null : () => setState(() => keepSignedIn = !keepSignedIn),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(minHeight: 44),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Checkbox(
                            value: keepSignedIn,
                            onChanged: loading ? null : (value) => setState(() => keepSignedIn = value ?? false),
                            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            visualDensity: VisualDensity.compact,
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text("Keep me signed in", style: TextStyle(fontSize: 14, color: c.text)),
                          ),
                          const SizedBox(width: 6),
                        ],
                      ),
                    ),
                  ),
                ),
                TextButton(
                  onPressed: loading ? null : () => Navigator.pushNamed(context, "/forgot-password"),
                  style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8)),
                  child: const Text("Forgot password?", style: TextStyle(fontSize: 14)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// Message from the server (wrong password, locked account, no connection), shown right above the button.
class _ServerError extends StatelessWidget {
  final String message;
  const _ServerError(this.message);

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Semantics(
      liveRegion: true,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 1),
              child: Icon(Icons.error_outline_rounded, size: 18, color: c.danger),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                message,
                style: TextStyle(color: c.danger, fontSize: 14, fontWeight: FontWeight.w600, height: 1.35),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Full-width "Log in →" with a soft primary shadow; shows a spinner + "Signing in…" while the request runs.
class _LoginButton extends StatelessWidget {
  final bool loading;
  final VoidCallback onPressed;
  const _LoginButton({required this.loading, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        boxShadow: [BoxShadow(color: c.primary.withValues(alpha: 0.35), blurRadius: 24, spreadRadius: -6, offset: const Offset(0, 12))],
      ),
      child: SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: loading ? null : onPressed,
          // Stay in brand colour while busy instead of turning grey.
          style: FilledButton.styleFrom(disabledBackgroundColor: c.primary.withValues(alpha: 0.75), disabledForegroundColor: c.onPrimary),
          child: loading
              ? Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2.2, color: c.onPrimary)),
                    const SizedBox(width: 12),
                    const Text("Signing in…"),
                  ],
                )
              : const Row(mainAxisSize: MainAxisSize.min, children: [Text("Log in"), SizedBox(width: 8), Icon(Icons.arrow_forward_rounded, size: 20)]),
        ),
      ),
    );
  }
}
