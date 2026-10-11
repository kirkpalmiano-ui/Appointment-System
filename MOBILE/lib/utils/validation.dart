// Client-side checks that mirror the backend rules, so users get instant
// feedback. The server still validates everything.

final RegExp _emailPattern = RegExp(r"^[^\s@]+@[^\s@]+\.[^\s@]+$");
// Letters separated by single spaces, hyphens, apostrophes or periods.
final RegExp _namePattern = RegExp(r"^[A-Za-zÀ-ÿñÑ]+(?:(?:[ '-]|\. ?)[A-Za-zÀ-ÿñÑ]+)*\.?$");

String? validateEmail(String value) {
  final email = value.trim();
  if (email.isEmpty) return "Email is required.";
  if (email.length > 64) return "Email must be 64 characters or less.";
  if (!_emailPattern.hasMatch(email)) return "Please enter a valid email address.";
  return null;
}

String? validateName(String value, String label) {
  final name = value.trim().replaceAll(RegExp(r"\s+"), " ");
  if (name.isEmpty) return "$label is required.";
  if (name.length < 2 || name.length > 30) return "$label must be 2 to 30 characters.";
  if (!_namePattern.hasMatch(name)) return "$label can only contain letters, spaces, hyphens, apostrophes and periods.";
  return null;
}

String? validatePassword(String value) {
  if (value.isEmpty) return "Password is required.";
  if (value.length < 8 || value.length > 32) return "Password must be 8 to 32 characters.";
  if (!RegExp(r"[A-Za-z]").hasMatch(value)) return "Password must contain a letter.";
  if (!RegExp(r"\d").hasMatch(value)) return "Password must contain a number.";
  return null;
}

String? validatePhone(String value) {
  final phone = value.trim();
  if (phone.isEmpty) return null; // optional
  if (!RegExp(r"^[0-9+\-\s()]{7,20}$").hasMatch(phone)) return "Please enter a valid phone number.";
  return null;
}

String? validateCode(String value) {
  if (!RegExp(r"^\d{6}$").hasMatch(value.trim())) return "Enter the 6-digit code from your email.";
  return null;
}
