class Answer {
  final int? id;
  final int userId;
  final int surveyId;
  final int questionId;
  final String answer;
  final DateTime? createdAt;

  Answer({
    this.id,
    required this.userId,
    required this.surveyId,
    required this.questionId,
    required this.answer,
    this.createdAt,
  });

  factory Answer.fromJson(Map<String, dynamic> json) {
    return Answer(
      id: json['id'] as int?,
      userId: json['user_id'] as int,
      surveyId: json['survey_id'] as int,
      questionId: json['question_id'] as int,
      answer: json['answer'] as String,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'survey_id': surveyId,
      'question_id': questionId,
      'answer': answer,
      'created_at': createdAt?.toIso8601String(),
    };
  }
}
