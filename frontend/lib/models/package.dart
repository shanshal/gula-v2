class Package {
  final int id;
  final String name;
  final String? content;
  final DateTime? createdAt;

  Package({
    required this.id,
    required this.name,
    this.content,
    this.createdAt,
  });

  factory Package.fromJson(Map<String, dynamic> json) {
    return Package(
      id: json['id'] as int,
      name: json['name'] as String,
      content: json['content'] as String?,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'content': content,
      'created_at': createdAt?.toIso8601String(),
    };
  }
}
