class Result {
  final int userId;
  final int surveyId;
  final dynamic score;
  final String? method;
  final Map<String, dynamic>? additionalData;

  Result({
    required this.userId,
    required this.surveyId,
    required this.score,
    this.method,
    this.additionalData,
  });

  factory Result.fromJson(Map<String, dynamic> json) {
    return Result(
      userId: (json['userId'] as num?)?.toInt() ?? 0,
      surveyId: (json['surveyId'] as num?)?.toInt() ?? 0,
      score: json['score'] ?? json['result'], // Handle both 'score' and 'result' fields
      method: json['method'] as String? ?? json['calculationMethod'] as String?,
      additionalData: json['additionalData'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'surveyId': surveyId,
      'score': score,
      'method': method,
      'additionalData': additionalData,
    };
  }
}
