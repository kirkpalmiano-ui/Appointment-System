import 'package:flutter/material.dart';
import 'package:cliniquick/config.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/widgets/motion.dart';
import 'package:cliniquick/widgets/ui.dart';
import 'package:cliniquick/widgets/auth/gradient_background.dart';

// Shared frame for the login, sign-up, verify-email and forgot-password screens
// (same look as the website's mobile AuthLayout): top bar (back · logo · theme),
// "Patient Portal" badge, big headline, optional lede, and the form in a frosted card.

class AuthFrame extends StatelessWidget {
  final String headline;
  final String? lede;
  final Widget child;

  const AuthFrame({super.key, required this.headline, this.lede, required this.child});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: GradientBackground(
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 640),
              child: SingleChildScrollView(
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                padding: const EdgeInsets.fromLTRB(18, 8, 18, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const AuthTopBar(),
                    const SizedBox(height: 20),
                    FadeSlideIn(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SoftChip("Patient Portal"),
                          const SizedBox(height: 16),
                          Semantics(
                            header: true,
                            child: Text(
                              headline,
                              style: TextStyle(fontSize: 40, fontWeight: FontWeight.w800, letterSpacing: -2.2, height: 1.02, color: c.text),
                            ),
                          ),
                          if (lede != null) ...[const SizedBox(height: 14), Text(lede!, style: TextStyle(fontSize: 17, height: 1.45, color: c.muted))],
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    FadeSlideIn(
                      delay: const Duration(milliseconds: 80),
                      child: FrostedCard(padding: const EdgeInsets.all(20), child: child),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// Back (only when there is a page to go back to) · centred logo · light/dark toggle.
class AuthTopBar extends StatelessWidget {
  const AuthTopBar({super.key});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return SizedBox(
      height: 48,
      child: Row(
        children: [
          SizedBox(
            width: 48,
            child: Navigator.canPop(context)
                ? IconButton(
                    tooltip: "Back",
                    icon: Icon(Icons.arrow_back_rounded, color: c.text),
                    onPressed: () => Navigator.maybePop(context),
                  )
                : null,
          ),
          const Expanded(child: Center(child: AuthLogo())),
          const SizedBox(width: 48, child: Center(child: ThemeToggleButton())),
        ],
      ),
    );
  }
}

// 40px round outlined sun/moon button. Resolves "system" through the current brightness,
// then flips it; main.dart saves the choice so it sticks on the next launch.
class ThemeToggleButton extends StatelessWidget {
  const ThemeToggleButton({super.key});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final dark = isDark(context);
    return SizedBox(
      width: 40,
      height: 40,
      child: IconButton(
        tooltip: dark ? "Switch to light mode" : "Switch to dark mode",
        padding: EdgeInsets.zero,
        style: IconButton.styleFrom(
          backgroundColor: c.field.withValues(alpha: 0.7),
          side: BorderSide(color: c.border, width: 1.5),
          shape: const CircleBorder(),
        ),
        icon: Icon(dark ? Icons.light_mode_outlined : Icons.dark_mode_outlined, size: 20, color: c.text),
        onPressed: () => themeMode.value = dark ? ThemeMode.light : ThemeMode.dark,
      ),
    );
  }
}

// Rounded primary square with a white medical cross, plus the app name.
class AuthLogo extends StatelessWidget {
  const AuthLogo({super.key});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Semantics(
      label: appName,
      excludeSemantics: true,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(color: c.primary, borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.add_rounded, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              appName,
              maxLines: 1,
              overflow: TextOverflow.fade,
              softWrap: false,
              style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800, letterSpacing: -0.4, color: c.text),
            ),
          ),
        ],
      ),
    );
  }
}

// Card heading ("Log in") and its muted line underneath.
class AuthHeading extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? subtitleWidget;

  const AuthHeading(this.title, {super.key, this.subtitle, this.subtitleWidget});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Semantics(
            header: true,
            child: Text(
              title,
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, letterSpacing: -0.8, height: 1.15, color: c.text),
            ),
          ),
          if (subtitleWidget != null || subtitle != null) ...[
            const SizedBox(height: 6),
            subtitleWidget ?? Text(subtitle!, style: TextStyle(fontSize: 15, height: 1.4, color: c.muted)),
          ],
        ],
      ),
    );
  }
}

// Error / success message box in the soft theme colours (works in light and dark mode).
class AuthMessage extends StatelessWidget {
  final String message;
  final bool success;

  const AuthMessage(this.message, {super.key, this.success = false});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final fg = success ? c.successText : c.danger;
    final bg = success ? c.successBg : c.danger.withValues(alpha: 0.1);
    return Semantics(
      liveRegion: true,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: fg.withValues(alpha: 0.3)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(success ? Icons.check_circle_outline_rounded : Icons.error_outline_rounded, size: 20, color: fg),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: TextStyle(color: fg, fontWeight: FontWeight.w600, height: 1.35),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Scrolls its field to the middle of the screen once the on-screen keyboard has opened.
class ScrollIntoViewOnFocus extends StatelessWidget {
  final Widget child;
  const ScrollIntoViewOnFocus({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Focus(
      canRequestFocus: false,
      skipTraversal: true,
      onFocusChange: (focused) {
        if (!focused) return;
        Future.delayed(const Duration(milliseconds: 300), () {
          if (!context.mounted) return;
          Scrollable.ensureVisible(
            context,
            alignment: 0.5,
            duration: reduceMotion(context) ? Duration.zero : const Duration(milliseconds: 250),
            curve: Curves.easeOut,
          );
        });
      },
      child: child,
    );
  }
}

// Text field styled for the auth card: label, optional prefix icon, 16px text,
// and scroll-into-view on focus. Set `password` for a show/hide eye button.
class AuthField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final String? error;
  final IconData? icon;
  final bool password;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final Iterable<String>? autofillHints;

  const AuthField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.error,
    this.icon,
    this.password = false,
    this.keyboardType,
    this.textInputAction,
    this.onSubmitted,
    this.autofillHints,
  });

  @override
  State<AuthField> createState() => _AuthFieldState();
}

class _AuthFieldState extends State<AuthField> {
  bool visible = false;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return ScrollIntoViewOnFocus(
      child: TextField(
        controller: widget.controller,
        obscureText: widget.password && !visible,
        keyboardType: widget.keyboardType,
        textInputAction: widget.textInputAction,
        onSubmitted: widget.onSubmitted,
        autofillHints: widget.autofillHints,
        autocorrect: !widget.password && widget.keyboardType != TextInputType.emailAddress,
        enableSuggestions: !widget.password,
        style: TextStyle(fontSize: 16, color: c.text),
        decoration: InputDecoration(
          labelText: widget.label,
          hintText: widget.hint,
          errorText: widget.error,
          errorMaxLines: 3,
          prefixIcon: widget.icon == null ? null : Icon(widget.icon, size: 20, color: c.muted),
          suffixIcon: widget.password
              ? IconButton(
                  tooltip: visible ? "Hide password" : "Show password",
                  icon: Icon(visible ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: c.muted),
                  onPressed: () => setState(() => visible = !visible),
                )
              : null,
        ),
      ),
    );
  }
}

// Big centred 6-digit code input.
class AuthCodeField extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String>? onChanged;

  const AuthCodeField({super.key, required this.controller, this.onChanged});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return ScrollIntoViewOnFocus(
      child: TextField(
        controller: controller,
        keyboardType: TextInputType.number,
        maxLength: 6,
        textAlign: TextAlign.center,
        autofillHints: const [AutofillHints.oneTimeCode],
        style: TextStyle(fontSize: 28, letterSpacing: 12, fontWeight: FontWeight.w800, color: c.text),
        decoration: const InputDecoration(labelText: "6-digit code", hintText: "000000", counterText: ""),
        onChanged: onChanged,
      ),
    );
  }
}

// Full-width 52px primary button with a spinner while busy.
class AuthSubmitButton extends StatelessWidget {
  final String label;
  final String busyLabel;
  final bool busy;
  final VoidCallback onPressed;
  final bool arrow;

  const AuthSubmitButton({super.key, required this.label, required this.busy, required this.onPressed, this.busyLabel = "Please wait...", this.arrow = false});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return SizedBox(
      height: 52,
      width: double.infinity,
      child: FilledButton(
        onPressed: busy ? null : onPressed,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: busy
              ? [SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: c.muted)), const SizedBox(width: 10), Text(busyLabel)]
              : [
                  Text(label),
                  if (arrow) ...[const SizedBox(width: 8), const Icon(Icons.arrow_forward_rounded, size: 18)],
                ],
        ),
      ),
    );
  }
}

// "Prompt  Link" line, e.g. "Don't have an account? Sign up".
class AuthLinkLine extends StatelessWidget {
  final String prompt;
  final String label;
  final VoidCallback onTap;

  const AuthLinkLine({super.key, required this.prompt, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Text(prompt, style: TextStyle(fontSize: 14, color: c.muted)),
        TextButton(
          onPressed: onTap,
          style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 6)),
          child: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        ),
      ],
    );
  }
}

// Small muted helper line under a field.
class AuthHint extends StatelessWidget {
  final String text;
  final IconData? icon;
  final TextAlign align;

  const AuthHint(this.text, {super.key, this.icon, this.align = TextAlign.start});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final style = TextStyle(fontSize: 12.5, height: 1.4, color: c.muted);
    if (icon == null) return Text(text, textAlign: align, style: style);
    return Text.rich(
      TextSpan(
        children: [
          WidgetSpan(
            alignment: PlaceholderAlignment.middle,
            child: Padding(
              padding: const EdgeInsets.only(right: 6),
              child: Icon(icon, size: 14, color: c.muted),
            ),
          ),
          TextSpan(text: text),
        ],
      ),
      textAlign: align,
      style: style,
    );
  }
}
