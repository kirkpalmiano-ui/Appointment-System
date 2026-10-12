import 'package:flutter/material.dart';
import 'package:cliniquick/theme.dart';

// Notched-label text field for forms (Form + validator), styled by the app's InputDecorationTheme.
// Errors show inline under the field as red text with a warning icon, and the border turns red.
// `externalError` shows a message from the server (e.g. "Incorrect email or password") the same way;
// the screen clears it when the user types again. Validators should read the controller's text.
class AppTextField extends FormField<String> {
  AppTextField({
    super.key,
    required TextEditingController controller,
    required String label,
    String? hint,
    IconData? icon,
    bool password = false,
    super.enabled,
    String? externalError,
    FocusNode? focusNode,
    TextInputType? keyboardType,
    TextInputAction? textInputAction,
    Iterable<String>? autofillHints,
    bool autocorrect = true,
    bool enableSuggestions = true,
    ValueChanged<String>? onChanged,
    ValueChanged<String>? onSubmitted,
    super.validator,
    super.autovalidateMode,
  }) : super(
         initialValue: controller.text,
         builder: (field) => _AppTextFieldView(
           field: field as _AppTextFieldState,
           controller: controller,
           label: label,
           hint: hint,
           icon: icon,
           password: password,
           enabled: field.widget.enabled,
           externalError: externalError,
           focusNode: focusNode,
           keyboardType: keyboardType,
           textInputAction: textInputAction,
           autofillHints: autofillHints,
           autocorrect: autocorrect,
           enableSuggestions: enableSuggestions,
           onChanged: onChanged,
           onSubmitted: onSubmitted,
         ),
       );

  @override
  FormFieldState<String> createState() => _AppTextFieldState();
}

class _AppTextFieldState extends FormFieldState<String> {
  bool obscured = true;

  void toggleObscured() => setState(() => obscured = !obscured);
}

class _AppTextFieldView extends StatelessWidget {
  final _AppTextFieldState field;
  final TextEditingController controller;
  final String label;
  final String? hint;
  final IconData? icon;
  final bool password;
  final bool enabled;
  final String? externalError;
  final FocusNode? focusNode;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final bool autocorrect;
  final bool enableSuggestions;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;

  const _AppTextFieldView({
    required this.field,
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    required this.password,
    required this.enabled,
    required this.externalError,
    required this.focusNode,
    required this.keyboardType,
    required this.textInputAction,
    required this.autofillHints,
    required this.autocorrect,
    required this.enableSuggestions,
    required this.onChanged,
    required this.onSubmitted,
  });

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final error = field.errorText ?? externalError;

    return TextField(
      controller: controller,
      focusNode: focusNode,
      enabled: enabled,
      obscureText: password && field.obscured,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      autofillHints: enabled ? autofillHints : null,
      autocorrect: password ? false : autocorrect,
      enableSuggestions: password ? false : enableSuggestions,
      style: TextStyle(fontSize: 16, color: c.text),
      onChanged: (value) {
        field.didChange(value);
        onChanged?.call(value);
      },
      onSubmitted: onSubmitted,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: icon == null ? null : Icon(icon, size: 20),
        suffixIcon: password
            ? IconButton(
                tooltip: field.obscured ? "Show password" : "Hide password",
                icon: Icon(field.obscured ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 20),
                onPressed: enabled ? field.toggleObscured : null,
              )
            : null,
        // Our own error row (icon + text) instead of errorText, so it can carry the warning icon.
        error: error == null
            ? null
            : Semantics(
                liveRegion: true,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(top: 1),
                      child: Icon(Icons.error_outline_rounded, size: 16, color: c.danger),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        error,
                        style: TextStyle(color: c.danger, fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
