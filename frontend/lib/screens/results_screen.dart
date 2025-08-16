import 'package:flutter/material.dart';
import '../models/survey.dart';
import '../models/result.dart';
import '../services/api_service.dart';

class ResultsScreen extends StatefulWidget {
  final Survey survey;
  final int userId;

  const ResultsScreen({
    super.key,
    required this.survey,
    required this.userId,
  });

  @override
  State<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends State<ResultsScreen> {
  Result? result;
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    _calculateResults();
  }

  Future<void> _calculateResults() async {
    try {
      final calculatedResult = await ApiService.calculateResults(
        widget.userId,
        widget.survey.id,
      );
      setState(() {
        result = calculatedResult;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        errorMessage = e.toString();
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Survey Results'),
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            onPressed: () {
              Navigator.popUntil(context, (route) => route.isFirst);
            },
            icon: const Icon(Icons.home),
            tooltip: 'Back to Home',
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Calculating your results...'),
          ],
        ),
      );
    }

    if (errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: Theme.of(context).colorScheme.error,
              ),
              const SizedBox(height: 16),
              Text(
                'Failed to calculate results',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                errorMessage!,
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    isLoading = true;
                    errorMessage = null;
                  });
                  _calculateResults();
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Survey completion celebration
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Theme.of(context).colorScheme.primaryContainer,
                  Theme.of(context).colorScheme.secondaryContainer,
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.celebration,
                  size: 48,
                  color: Theme.of(context).colorScheme.onPrimaryContainer,
                ),
                const SizedBox(height: 12),
                Text(
                  'Survey Completed!',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: Theme.of(context).colorScheme.onPrimaryContainer,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  widget.survey.title,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onPrimaryContainer.withOpacity(0.8),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Results display
          if (result != null) ...[
            Text(
              'Your Results',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            _buildResultCard(),
            
            // Show interpretation info for numeric scores
            if (result!.score is num) ...[
              const SizedBox(height: 16),
              _buildInterpretationInfo(),
            ],
            
            // Show detailed breakdown for complex results
            if (result!.score is Map && 
                (result!.score.containsKey('scores') || result!.score.containsKey('primary'))) ...[
              const SizedBox(height: 16),
              _buildDetailedScores(),
            ],
            
            if (result!.additionalData != null) ...[
              const SizedBox(height: 16),
              _buildAdditionalData(),
            ],
          ],
          
          const SizedBox(height: 32),
          
          // Action buttons
          _buildActionButtons(),
        ],
      ),
    );
  }

  Widget _buildResultCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.analytics,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Score',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Column(
                  children: [
                    Text(
                      _formatScore(result!.score),
                      style: Theme.of(context).textTheme.displayMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (result!.score is num) ...[
                      Text(
                        'Raw Score: ${result!.score}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onPrimaryContainer.withOpacity(0.8),
                        ),
                      ),
                      const SizedBox(height: 4),
                    ],
                    if (result!.method != null) ...[
                      Text(
                        'Method: ${result!.method}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onPrimaryContainer.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInterpretationInfo() {
    final score = result!.score as num;
    final surveyName = widget.survey.title.toLowerCase();
    
    String info = '';
    Color cardColor = Theme.of(context).colorScheme.surfaceVariant;
    IconData icon = Icons.info_outline;
    
    // Provide context-specific information
    if (surveyName.contains('physical') || surveyName.contains('symptoms') || 
        surveyName.contains('جسدية') || surveyName.contains('أعراض')) {
      info = 'This assessment measures the frequency and intensity of physical symptoms you may be experiencing. Higher scores indicate more frequent or severe symptoms.';
      if (score > 30) {
        cardColor = Theme.of(context).colorScheme.errorContainer;
        icon = Icons.warning_outlined;
      }
    } else if (surveyName.contains('phq') || surveyName.contains('depression') || 
               surveyName.contains('اكتئاب') || surveyName.contains('صحة نفسية')) {
      info = 'This is a screening tool for depression. It is not a diagnosis. If you scored high, consider consulting with a healthcare professional.';
      if (score > 14) {
        cardColor = Theme.of(context).colorScheme.errorContainer;
        icon = Icons.health_and_safety_outlined;
      }
    } else if (surveyName.contains('gad') || surveyName.contains('anxiety') || 
               surveyName.contains('قلق')) {
      info = 'This measures anxiety levels. Moderate to severe scores may benefit from professional evaluation and support.';
      if (score > 9) {
        cardColor = Theme.of(context).colorScheme.errorContainer;
        icon = Icons.psychology_outlined;
      }
    } else if (surveyName.contains('pss') || surveyName.contains('stress') || 
               surveyName.contains('ضغط')) {
      info = 'This measures your perception of stress. High stress levels can impact physical and mental health.';
      if (score > 26) {
        cardColor = Theme.of(context).colorScheme.errorContainer;
        icon = Icons.psychology_outlined;
      }
    } else if (surveyName.contains('asrs') || surveyName.contains('adhd') || 
               surveyName.contains('فرط الحركة')) {
      info = 'This is a screening tool for ADHD in adults. Higher scores suggest symptoms consistent with ADHD but require professional evaluation.';
      if (score > 24) {
        cardColor = Theme.of(context).colorScheme.errorContainer;
        icon = Icons.psychology_outlined;
      }
    } else if (surveyName.contains('epds') || surveyName.contains('postpartum') || 
               surveyName.contains('بعد الولادة') || surveyName.contains('إدنبرة')) {
      info = 'This screens for postpartum depression. Scores above 12 suggest seeking professional support is recommended.';
      if (score > 8) {
        cardColor = Theme.of(context).colorScheme.errorContainer;
        icon = Icons.health_and_safety_outlined;
      }
    } else {
      info = 'This is your assessment result. Results are interpreted based on established scoring guidelines.';
    }
    
    return Card(
      color: cardColor,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(
              icon,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              size: 24,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                info,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailedScores() {
    final score = result!.score as Map;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.bar_chart,
                  color: Theme.of(context).colorScheme.secondary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Score Breakdown',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // Leadership scores breakdown
            if (score.containsKey('scores')) ...[
              ...((score['scores'] as Map).entries.map((entry) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: Text(
                        _formatLeadershipStyle(entry.key),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    Expanded(
                      flex: 1,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.primaryContainer,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          entry.value.toString(),
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.onPrimaryContainer,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                  ],
                ),
              ))),
            ],
            
            // Love languages breakdown
            if (score.containsKey('primary') && score.containsKey('secondary')) ...[
              _buildLanguageItem('Primary', score['primary']),
              const SizedBox(height: 12),
              _buildLanguageItem('Secondary', score['secondary']),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildLanguageItem(String label, dynamic languageData) {
    if (languageData is Map && languageData.containsKey('name') && languageData.containsKey('score')) {
      return Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              '$label Language',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              '${languageData['name']} (${languageData['score']})',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      );
    }
    return const SizedBox.shrink();
  }

  String _formatLeadershipStyle(String style) {
    switch (style.toLowerCase()) {
      case 'authoritarian':
        return 'Authoritarian';
      case 'democratic':
        return 'Democratic';
      case 'laissezfaire':
        return 'Laissez-Faire';
      default:
        return style;
    }
  }

  Widget _buildAdditionalData() {
    final additionalData = result!.additionalData!;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.insights,
                  color: Theme.of(context).colorScheme.secondary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Additional Information',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            ...additionalData.entries.map((entry) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 2,
                    child: Text(
                      _formatKey(entry.key),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 3,
                    child: Text(
                      _formatValue(entry.value),
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            )).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: () {
              Navigator.popUntil(context, (route) => route.isFirst);
            },
            icon: const Icon(Icons.home),
            label: const Text('Back to Home'),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () {
              setState(() {
                isLoading = true;
                errorMessage = null;
                result = null;
              });
              _calculateResults();
            },
            icon: const Icon(Icons.refresh),
            label: const Text('Calculate Again'),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            icon: const Icon(Icons.assignment),
            label: const Text('Take Another Survey'),
          ),
        ),
      ],
    );
  }

  String _formatScore(dynamic score) {
    if (score is num) {
      // Interpret numeric scores based on survey type
      return _interpretNumericScore(score.toInt());
    } else if (score is Map) {
      // Handle complex scores (like leadership styles)
      if (score.containsKey('classification') && score.containsKey('scores')) {
        // Leadership assessment format
        return score['classification']?.toString() ?? 'Unknown';
      } else if (score.containsKey('primary') && score.containsKey('secondary')) {
        // Love languages format
        final primary = score['primary'];
        if (primary is Map && primary.containsKey('name')) {
          return primary['name']?.toString() ?? 'Unknown';
        }
      }
      // Fallback for other complex objects
      final entries = score.entries.toList();
      if (entries.isNotEmpty) {
        return entries.first.value.toString();
      }
    }
    return score.toString();
  }

  String _interpretNumericScore(int score) {
    final surveyName = widget.survey.title.toLowerCase();
    
    // Physical Symptoms Survey (استبيان الأعراض الجسدية)
    if (surveyName.contains('physical') || surveyName.contains('symptoms') || 
        surveyName.contains('جسدية') || surveyName.contains('أعراض')) {
      if (score <= 10) return 'Minimal Symptoms';
      if (score <= 20) return 'Mild Symptoms';
      if (score <= 30) return 'Moderate Symptoms';
      if (score <= 40) return 'High Symptoms';
      return 'Very High Symptoms';
    }
    
    // PHQ-9 Depression Screening (استبيان الصحة النفسية)
    if (surveyName.contains('phq') || surveyName.contains('depression') || 
        surveyName.contains('اكتئاب') || surveyName.contains('صحة نفسية')) {
      if (score <= 4) return 'Minimal Depression';
      if (score <= 9) return 'Mild Depression';
      if (score <= 14) return 'Moderate Depression';
      if (score <= 19) return 'Moderately Severe Depression';
      return 'Severe Depression';
    }
    
    // GAD-7 Anxiety Screening (مقياس اضطراب القلق العام)
    if (surveyName.contains('gad') || surveyName.contains('anxiety') || 
        surveyName.contains('قلق')) {
      if (score <= 4) return 'Minimal Anxiety';
      if (score <= 9) return 'Mild Anxiety';
      if (score <= 14) return 'Moderate Anxiety';
      return 'Severe Anxiety';
    }
    
    // PSS Perceived Stress Scale (مقياس الضغط النفسي المدرك)
    if (surveyName.contains('pss') || surveyName.contains('stress') || 
        surveyName.contains('ضغط')) {
      if (score <= 13) return 'Low Stress';
      if (score <= 26) return 'Moderate Stress';
      return 'High Stress';
    }
    
    // ASRS ADHD Screening (مقياس التقرير الذاتي لاضطراب فرط الحركة)
    if (surveyName.contains('asrs') || surveyName.contains('adhd') || 
        surveyName.contains('فرط الحركة')) {
      if (score <= 12) return 'Low ADHD Likelihood';
      if (score <= 24) return 'Moderate ADHD Likelihood';
      return 'High ADHD Likelihood';
    }
    
    // EPDS Postpartum Depression (مقياس إدنبرة للاكتئاب ما بعد الولادة)
    if (surveyName.contains('epds') || surveyName.contains('postpartum') || 
        surveyName.contains('بعد الولادة') || surveyName.contains('إدنبرة')) {
      if (score <= 8) return 'Normal Range';
      if (score <= 12) return 'Mild Depression Risk';
      return 'Significant Depression Risk';
    }
    
    // Test Assessment or unknown surveys - provide general interpretation
    if (surveyName.contains('test')) {
      if (score <= 20) return 'Low Score';
      if (score <= 40) return 'Moderate Score';
      if (score <= 60) return 'High Score';
      return 'Very High Score';
    }
    
    // Generic interpretation for unknown survey types
    return 'Score: $score';
  }

  String _formatKey(String key) {
    return key.split('_').map((word) => 
      word.isNotEmpty ? word[0].toUpperCase() + word.substring(1) : word
    ).join(' ');
  }

  String _formatValue(dynamic value) {
    if (value is num) {
      return value.toString();
    } else if (value is bool) {
      return value ? 'Yes' : 'No';
    } else if (value is List) {
      return value.join(', ');
    }
    return value.toString();
  }
}
