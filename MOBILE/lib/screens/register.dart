import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/utils/validation.dart';
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

  Widget field(String key, String label, TextEditingController controller, {bool password = false, TextInputType? type}) {
    return TextField(
      controller: controller,
      obscureText: password,
      keyboardType: type,
      decoration: InputDecoration(labelText: label, errorText: errors[key], border: const OutlineInputBorder()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Create your account")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 12,
          children: [
            if (serverError.isNotEmpty) errorBox(serverError),
            field("firstName", "First name", firstNameController),
            field("lastName", "Last name", lastNameController),
            field("email", "Email", emailController, type: TextInputType.emailAddress),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 8,
              children: [
                SizedBox(
                  width: 120,
                  child: DropdownButtonFormField<String>(
                    initialValue: phoneCountry,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: "Country", border: OutlineInputBorder()),
                    items: [
                      for (final country in phoneCountries)
                        DropdownMenuItem(value: country[0], child: Text(country[1], overflow: TextOverflow.ellipsis)),
                    ],
                    onChanged: (value) => setState(() => phoneCountry = value ?? "PH"),
                  ),
                ),
                Expanded(child: field("phone", "Phone (optional)", phoneController, type: TextInputType.phone)),
              ],
            ),
            field("password", "Password", passwordController, password: true),
            const Text("8 to 32 characters, with a letter and a number", style: TextStyle(color: Colors.black54, fontSize: 12)),
            field("confirm", "Confirm password", confirmController, password: true),
            FilledButton(
              onPressed: loading ? null : createNewAcc,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: loading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text("Create account"),
              ),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Already have an account? Log in"),
            ),
          ],
        ),
      ),
    );
  }
}
