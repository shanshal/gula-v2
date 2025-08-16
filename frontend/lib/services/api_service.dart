import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/survey.dart';
import '../models/question.dart';
import '../models/answer.dart';
import '../models/result.dart';
import '../models/package.dart';

class ApiService {
  // TODO: Replace with your actual backend URL
  static const String baseUrl = 'http://localhost:8080';

  // Survey endpoints
  static Future<List<Survey>> getSurveys() async {
    final response = await http.get(Uri.parse('$baseUrl/surveys'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Survey.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load surveys');
    }
  }

  // Question endpoints
  static Future<List<Question>> getQuestions(int surveyId) async {
    final response = await http.get(Uri.parse('$baseUrl/questions?survey_id=$surveyId'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Question.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load questions for survey $surveyId');
    }
  }

  // Answer submission
  static Future<bool> submitAnswers(List<Answer> answers) async {
    final response = await http.post(
      Uri.parse('$baseUrl/answers/bulk'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'answers': answers.map((answer) => answer.toJson()).toList(),
      }),
    );
    return response.statusCode == 200 || response.statusCode == 201;
  }

  // Results calculation
  static Future<Result> calculateResults(int userId, int surveyId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/results/calculate'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'userId': userId,
        'surveyId': surveyId,
        'calculationMethod': 'auto', // Let backend auto-detect the method
      }),
    );
    
    if (response.statusCode == 200) {
      final responseData = json.decode(response.body);
      // Handle the nested response structure
      if (responseData['success'] == true && responseData['data'] != null) {
        return Result.fromJson(responseData['data']);
      } else {
        throw Exception('Invalid response format: ${responseData}');
      }
    } else {
      final errorData = json.decode(response.body);
      throw Exception('Failed to calculate results: ${errorData['error'] ?? 'Unknown error'}');
    }
  }

  // Get packages from database
  static Future<List<Package>> getPackages() async {
    final response = await http.get(Uri.parse('$baseUrl/packages'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Package.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load packages');
    }
  }
}
