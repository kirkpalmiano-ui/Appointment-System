import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/theme.dart';
import 'package:cliniquick/utils/validation.dart';
import 'package:cliniquick/widgets/auth/auth_frame.dart';
import 'package:cliniquick/widgets/common.dart';

// Sign-up screen. A 6-digit code is emailed; the account is verified on the next screen.
class RegisterState extends StatefulWidget {
  const RegisterState({super.key});
  @override
  State<RegisterState> createState() => RegisterPage();
}

class RegisterPage extends State<RegisterState> {
  TextEditingController firstNameController = TextEditingController();
  TextEditingController lastNameController = TextEditingController();
  TextEditingController emailController = TextEditingController();
  TextEditingController phoneController = TextEditingController();
  TextEditingController passwordController = TextEditingController();
  TextEditingController confirmController = TextEditingController();

  String phoneCountry = "PH";
  Map<String, String?> errors = {};
  String serverError = "";
  bool loading = false;

  @override
  void dispose() {
    for (final controller in [firstNameController, lastNameController, emailController, phoneController, passwordController, confirmController]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> createNewAcc() async {
    final newErrors = <String, String?>{
      "firstName": validateName(firstNameController.text, "First name"),
      "lastName": validateName(lastNameController.text, "Last name"),
      "email": validateEmail(emailController.text),
      "phone": validatePhone(phoneController.text),
      "password": validatePassword(passwordController.text),
      "confirm": confirmController.text != passwordController.text ? "Passwords do not match." : null,
    };
    setState(() {
      errors = newErrors;
      serverError = "";
    });
    if (newErrors.values.any((message) => message != null)) return;

    setState(() => loading = true);
    final email = emailController.text.trim().toLowerCase();
    final phone = phoneController.text.trim();
    try {
      await Api.post("/auth/register", {
        "firstName": firstNameController.text.trim(),
        "lastName": lastNameController.text.trim(),
        "email": email,
        "password": passwordController.text,
        if (phone.isNotEmpty) "phone": phone,
        if (phone.isNotEmpty) "phoneCountry": phoneCountry,
      });
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, "/verify-email", arguments: email);
    } on ApiException catch (error) {
      // Signed up again within the resend cooldown: the earlier code still works.
      if (error.code == "OTP_COOLDOWN" && mounted) {
        Navigator.pushReplacementNamed(context, "/verify-email", arguments: email);
        return;
      }
      setState(() {
        serverError = error.message;
        errors = {...errors, ...error.fieldErrors};
        loading = false;
      });
    }
  }

  Widget field(String key, String label, TextEditingController controller,
      {bool password = false, TextInputType? type, IconData? icon, String? hint, Iterable<String>? autofill}) {
    return AuthField(
      controller: controller,
      label: label,
      hint: hint,
      icon: icon,
      error: errors[key],
      password: password,
      keyboardType: type,
      textInputAction: TextInputAction.next,
      autofillHints: autofill,
    );
  }

  void goToLogin() {
    // Usually opened from the login screen; otherwise open it fresh.
    if (Navigator.canPop(context)) {
      Navigator.pop(context);
    } else {
      Navigator.pushReplacementNamed(context, "/login");
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return AuthFrame(
      headline: "Book visits without the phone calls.",
      lede: "Sign up to book visits, get confirmations and manage every appointment in one place.",
      child: AutofillGroup(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 16,
          children: [
            const AuthHeading("Create your account", subtitle: "It only takes a minute to start booking."),
            if (serverError.isNotEmpty) AuthMessage(serverError),
            field("firstName", "First name", firstNameController, icon: Icons.person_outline_rounded, autofill: const [AutofillHints.givenName]),
            field("lastName", "Last name", lastNameController, icon: Icons.person_outline_rounded, autofill: const [AutofillHints.familyName]),
            field("email", "Email", emailController,
                type: TextInputType.emailAddress, icon: Icons.mail_outline_rounded, hint: "you@example.com", autofill: const [AutofillHints.email]),
            ScrollIntoViewOnFocus(
              child: DropdownButtonFormField<String>(
                initialValue: phoneCountry,
                isExpanded: true,
                style: TextStyle(fontSize: 16, color: c.text),
                dropdownColor: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(14),
                decoration: InputDecoration(
                  labelText: "Phone country",
                  prefixIcon: Icon(Icons.public_rounded, size: 20, color: c.muted),
                ),
                items: [
                  for (final country in phoneCountries)
                    DropdownMenuItem(value: country[0], child: Text(country[1], overflow: TextOverflow.ellipsis)),
                ],
                onChanged: (value) => setState(() => phoneCountry = value ?? "PH"),
              ),
            ),
            field("phone", "Phone (optional)", phoneController,
                type: TextInputType.phone, icon: Icons.phone_outlined, autofill: const [AutofillHints.telephoneNumber]),
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 6,
              children: [
                field("password", "Password", passwordController,
                    password: true, icon: Icons.lock_outline_rounded, autofill: const [AutofillHints.newPassword]),
                const Padding(
                  padding: EdgeInsets.only(left: 4),
                  child: AuthHint("8 to 32 characters, with a letter and a number"),
                ),
              ],
            ),
            field("confirm", "Confirm password", confirmController, password: true, icon: Icons.lock_outline_rounded),
            const SizedBox(height: 2),
            AuthSubmitButton(label: "Create account", busyLabel: "Creating account...", busy: loading, onPressed: createNewAcc, arrow: true),
            AuthLinkLine(prompt: "Already have an account?", label: "Log in", onTap: goToLogin),
          ],
        ),
      ),
    );
  }
}
