class Survey {
  final int id;
  final String title;
  final String? description;
  final DateTime? createdAt;

  Survey({
    required this.id,
    required this.title,
    this.description,
    this.createdAt,
  });

  factory Survey.fromJson(Map<String, dynamic> json) {
    return Survey(
      id: json['id'] as int,
      title: json['title'] as String? ?? json['name'] as String, // Handle both title and name
      description: json['description'] as String?,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'created_at': createdAt?.toIso8601String(),
    };
  }
}
