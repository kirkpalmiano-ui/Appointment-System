import 'package:flutter/material.dart';
import 'package:cliniquick/services/api.dart';
import 'package:cliniquick/tempstore/activesession.dart';
import 'package:cliniquick/utils/validation.dart';
import 'package:cliniquick/widgets/common.dart';

// Edit name and phone, and change the password.
class ProfileState extends StatefulWidget {
  const ProfileState({super.key});
  @override
  State<ProfileState> createState() => ProfilePage();
}

class ProfilePage extends State<ProfileState> {
  TextEditingController firstNameController = TextEditingController();
  TextEditingController lastNameController = TextEditingController();
  TextEditingController phoneController = TextEditingController();
  TextEditingController currentPasswordController = TextEditingController();
  TextEditingController newPasswordController = TextEditingController();
  TextEditingController confirmController = TextEditingController();

  String phoneCountry = "PH";
  Map<String, String?> errors = {};
  bool savingProfile = false;
  bool savingPassword = false;

  @override
  void initState() {
    super.initState();
    fillForm(Activesession.user);
    // Refresh from the server in case the profile changed on the website.
    Api.get("/users/me").then((data) {
      Activesession.user = Map<String, dynamic>.from(data["user"]);
      if (mounted) setState(() => fillForm(Activesession.user));
    }).catchError((_) {});
  }

  void fillForm(Map<String, dynamic> user) {
    final parts = (user["name"] ?? "").toString().split(" ");
    firstNameController.text = user["firstName"] ?? parts.first;
    lastNameController.text = user["lastName"] ?? parts.skip(1).join(" ");
    phoneController.text = user["phone"] ?? "";
    final country = (user["phoneCountry"] ?? "").toString();
    phoneCountry = phoneCountries.any((c) => c[0] == country) ? country : "PH";
  }

  @override
  void dispose() {
    for (final controller in [
      firstNameController,
      lastNameController,
      phoneController,
      currentPasswordController,
      newPasswordController,
      confirmController,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> saveProfile() async {
    final newErrors = {
      "firstName": validateName(firstNameController.text, "First name"),
      "lastName": validateName(lastNameController.text, "Last name"),
      "phone": validatePhone(phoneController.text),
    };
    setState(() => errors = newErrors);
    if (newErrors.values.any((message) => message != null)) return;

    setState(() => savingProfile = true);
    try {
      final data = await Api.put("/users/me", {
        "firstName": firstNameController.text.trim(),
        "lastName": lastNameController.text.trim(),
        "phone": phoneController.text.trim(),
        "phoneCountry": phoneCountry,
      });
      Activesession.user = Map<String, dynamic>.from(data["user"]);
      if (mounted) showMessage(context, "Profile saved.");
    } on ApiException catch (e) {
      setState(() => errors = {...errors, ...e.fieldErrors});
      if (mounted) showMessage(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => savingProfile = false);
    }
  }

  Future<void> changePassword() async {
    final newErrors = {
      "currentPassword": currentPasswordController.text.isEmpty ? "Enter your current password." : null,
      "newPassword": validatePassword(newPasswordController.text),
      "confirm": confirmController.text != newPasswordController.text ? "Passwords do not match." : null,
    };
    setState(() => errors = newErrors);
    if (newErrors.values.any((message) => message != null)) return;

    setState(() => savingPassword = true);
    try {
      final data = await Api.put("/users/me", {
        "currentPassword": currentPasswordController.text,
        "newPassword": newPasswordController.text,
      });
      // Older sessions are signed out; keep this one with the new token.
      Activesession.start(data["token"], Map<String, dynamic>.from(data["user"]));
      currentPasswordController.clear();
      newPasswordController.clear();
      confirmController.clear();
      if (mounted) showMessage(context, "Password changed. Other devices were signed out.");
    } on ApiException catch (e) {
      setState(() => errors = {...errors, ...e.fieldErrors});
      if (mounted) showMessage(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => savingPassword = false);
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
    final user = Activesession.user;
    return Scaffold(
      appBar: AppBar(title: const Text("My Profile")),
      drawer: const AppDrawer(),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 12,
                children: [
                  const Text("Personal details", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  TextFormField(
                    enabled: false,
                    initialValue: user["email"] ?? "",
                    decoration: InputDecoration(
                      labelText: "Email",
                      border: const OutlineInputBorder(),
                      helperText: Activesession.isStaff ? "Ask the clinic admin to change your email." : "Change your email on the CliniQuick website.",
                    ),
                  ),
                  field("firstName", "First name", firstNameController),
                  field("lastName", "Last name", lastNameController),
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
                  FilledButton(
                    onPressed: savingProfile ? null : saveProfile,
                    child: Text(savingProfile ? "Saving..." : "Save changes"),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 12,
                children: [
                  const Text("Change password", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  field("currentPassword", "Current password", currentPasswordController, password: true),
                  field("newPassword", "New password", newPasswordController, password: true),
                  field("confirm", "Confirm new password", confirmController, password: true),
                  OutlinedButton(
                    onPressed: savingPassword ? null : changePassword,
                    child: Text(savingPassword ? "Saving..." : "Change password"),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: () => logout(context),
            icon: const Icon(Icons.logout, color: Colors.red),
            label: const Text("Log out", style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
