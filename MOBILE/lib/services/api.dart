import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:cliniquick/config.dart';
import 'package:cliniquick/tempstore/activesession.dart';

// An error returned by the backend (or a network problem).
class ApiException implements Exception {
  final int status;
  final String message;
  final String? code;
  final int? retryAfter;
  final Map<String, String> fieldErrors;

  ApiException(this.status, this.message, {this.code, this.retryAfter, this.fieldErrors = const {}});

  @override
  String toString() => message;
}

// Small wrapper around the http package for the CliniQuick REST API.
// Adds the login token to every request and turns error responses into ApiException.
class Api {
  // Render's free plan can take ~50 s to wake up, so allow a generous timeout.
  static const Duration timeout = Duration(seconds: 60);

  // Set in main.dart: called when the server says the session is no longer valid.
  static void Function(String message)? onSessionExpired;

  static Future<dynamic> get(String path, {Map<String, String>? query}) => _send("GET", path, query: query);
  static Future<dynamic> post(String path, [Map<String, dynamic>? body]) => _send("POST", path, body: body);
  static Future<dynamic> put(String path, [Map<String, dynamic>? body]) => _send("PUT", path, body: body);
  static Future<dynamic> patch(String path, [Map<String, dynamic>? body]) => _send("PATCH", path, body: body);
  static Future<dynamic> delete(String path) => _send("DELETE", path);

  // Sends one file as multipart/form-data (e.g. the profile photo).
  static Future<dynamic> upload(String method, String path, {required String field, required List<int> bytes, required String filename}) async {
    final hadToken = Activesession.isLoggedIn;
    final request = http.MultipartRequest(method, Uri.parse("$apiBaseUrl$path"))
      ..headers["Accept"] = "application/json"
      ..files.add(http.MultipartFile.fromBytes(field, bytes, filename: filename));
    if (hadToken) request.headers["Authorization"] = "Bearer ${Activesession.token}";

    http.Response response;
    try {
      response = await http.Response.fromStream(await request.send().timeout(timeout));
    } catch (error) {
      throw ApiException(0, "Cannot reach the server. Check your internet connection and try again.");
    }
    return _handle(response, hadToken);
  }

  static Future<dynamic> _send(String method, String path, {Map<String, String>? query, Map<String, dynamic>? body}) async {
    // Leave out empty filters so the URL stays clean.
    final cleanQuery = query == null ? null : (Map.of(query)..removeWhere((key, value) => value.isEmpty));
    final uri = Uri.parse("$apiBaseUrl$path").replace(queryParameters: cleanQuery);

    final hadToken = Activesession.isLoggedIn;
    final headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      if (hadToken) "Authorization": "Bearer ${Activesession.token}",
    };
    final encoded = body == null ? null : jsonEncode(body);

    http.Response response;
    try {
      final request = switch (method) {
        "GET" => http.get(uri, headers: headers),
        "POST" => http.post(uri, headers: headers, body: encoded),
        "PUT" => http.put(uri, headers: headers, body: encoded),
        "PATCH" => http.patch(uri, headers: headers, body: encoded),
        _ => http.delete(uri, headers: headers),
      };
      response = await request.timeout(timeout);
    } catch (error) {
      throw ApiException(0, "Cannot reach the server. Check your internet connection and try again.");
    }
    return _handle(response, hadToken);
  }

  // Returns the JSON body of a successful response, or throws an ApiException.
  static dynamic _handle(http.Response response, bool hadToken) {
    dynamic data;
    try {
      data = response.body.isEmpty ? null : jsonDecode(response.body);
    } catch (error) {
      data = null;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    final json = data is Map<String, dynamic> ? data : <String, dynamic>{};
    final fieldErrors = <String, String>{};
    if (json["errors"] is List) {
      for (final item in json["errors"]) {
        if (item is Map && item["field"] != null && !fieldErrors.containsKey(item["field"])) {
          fieldErrors[item["field"].toString()] = item["message"].toString();
        }
      }
    }
    final message = json["message"]?.toString() ?? "Something went wrong. Please try again.";

    // Expired, revoked or replaced session: sign out and go back to the login screen.
    if (response.statusCode == 401 && hadToken) {
      Activesession.clear();
      onSessionExpired?.call(message);
    }

    throw ApiException(
      response.statusCode,
      message,
      code: json["code"]?.toString(),
      retryAfter: json["retryAfter"] is int ? json["retryAfter"] : null,
      fieldErrors: fieldErrors,
    );
  }
}
