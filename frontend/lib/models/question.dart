class Question {
  final int id;
  final int surveyId;
  final String text;
  final String type;
  final List<String>? options;
  final String? helpText;
  final int? minValue;
  final int? maxValue;

  Question({
    required this.id,
    required this.surveyId,
    required this.text,
    required this.type,
    this.options,
    this.helpText,
    this.minValue,
    this.maxValue,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    return Question(
      id: json['id'] as int,
      surveyId: json['survey_id'] as int,
      text: json['text'] as String,
      type: json['type'] as String,
      options: json['options'] != null 
          ? List<String>.from(json['options'] as List)
          : null,
      helpText: json['help_text'] as String?,
      minValue: json['min_value'] as int?,
      maxValue: json['max_value'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'survey_id': surveyId,
      'text': text,
      'type': type,
      'options': options,
      'help_text': helpText,
      'min_value': minValue,
      'max_value': maxValue,
    };
  }
}
