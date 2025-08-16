import 'package:flutter/material.dart';
import '../models/survey.dart';
import '../models/question.dart';
import '../models/answer.dart';
import '../services/api_service.dart';
import 'results_screen.dart';

class SurveyFlowScreen extends StatefulWidget {
  final Survey survey;
  final int userId;

  const SurveyFlowScreen({
    super.key,
    required this.survey,
    required this.userId,
  });

  @override
  State<SurveyFlowScreen> createState() => _SurveyFlowScreenState();
}

class _SurveyFlowScreenState extends State<SurveyFlowScreen> {
  List<Question>? questions;
  Map<int, String> answers = {};
  int currentQuestionIndex = 0;
  bool isLoading = true;
  bool isSubmitting = false;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    try {
      final loadedQuestions = await ApiService.getQuestions(widget.survey.id);
      setState(() {
        questions = loadedQuestions;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        errorMessage = e.toString();
        isLoading = false;
      });
    }
  }

  void _saveAnswer(String answer) {
    if (questions != null && currentQuestionIndex < questions!.length) {
      setState(() {
        answers[questions![currentQuestionIndex].id] = answer;
      });
    }
  }

  void _nextQuestion() {
    if (currentQuestionIndex < questions!.length - 1) {
      setState(() {
        currentQuestionIndex++;
      });
    } else {
      _submitSurvey();
    }
  }

  void _previousQuestion() {
    if (currentQuestionIndex > 0) {
      setState(() {
        currentQuestionIndex--;
      });
    }
  }

  Future<void> _submitSurvey() async {
    setState(() {
      isSubmitting = true;
    });

    try {
      final answerList = answers.entries.map((entry) => Answer(
        userId: widget.userId,
        surveyId: widget.survey.id,
        questionId: entry.key,
        answer: entry.value,
      )).toList();

      final success = await ApiService.submitAnswers(answerList);
      
      if (success && mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => ResultsScreen(
              survey: widget.survey,
              userId: widget.userId,
            ),
          ),
        );
      } else {
        throw Exception('Failed to submit answers');
      }
    } catch (e) {
      setState(() {
        isSubmitting = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error submitting survey: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.survey.title),
        elevation: 0,
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
            Text('Loading questions...'),
          ],
        ),
      );
    }

    if (errorMessage != null) {
      return Center(
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
              'Failed to load questions',
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
                _loadQuestions();
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (questions?.isEmpty ?? true) {
      return const Center(
        child: Text('No questions available for this survey'),
      );
    }

    if (isSubmitting) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Submitting your answers...'),
          ],
        ),
      );
    }

    final question = questions![currentQuestionIndex];
    final currentAnswer = answers[question.id];

    return Column(
      children: [
        // Progress indicator
        LinearProgressIndicator(
          value: (currentQuestionIndex + 1) / questions!.length,
          backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
        ),
        
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Question number and total
                Text(
                  'Question ${currentQuestionIndex + 1} of ${questions!.length}',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 16),
                
                // Question text
                Text(
                  question.text,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                
                if (question.helpText != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    question.helpText!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                    ),
                  ),
                ],
                
                const SizedBox(height: 32),
                
                // Answer input
                Expanded(
                  child: _buildAnswerInput(question, currentAnswer),
                ),
              ],
            ),
          ),
        ),
        
        // Navigation buttons
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 4,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: Row(
            children: [
              if (currentQuestionIndex > 0) ...[
                OutlinedButton.icon(
                  onPressed: _previousQuestion,
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Previous'),
                ),
                const SizedBox(width: 16),
              ],
              Expanded(
                child: FilledButton.icon(
                  onPressed: currentAnswer != null ? _nextQuestion : null,
                  icon: Icon(
                    currentQuestionIndex == questions!.length - 1
                        ? Icons.check
                        : Icons.arrow_forward,
                  ),
                  label: Text(
                    currentQuestionIndex == questions!.length - 1
                        ? 'Submit Survey'
                        : 'Next',
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAnswerInput(Question question, String? currentAnswer) {
    switch (question.type.toLowerCase()) {
      case 'multiple_choice':
      case 'likert':
      case 'radio':
        return _buildMultipleChoice(question, currentAnswer);
      case 'rating':
        return _buildRating(question, currentAnswer);
      case 'text':
        return _buildTextInput(question, currentAnswer);
      case 'numeric':
        return _buildNumericInput(question, currentAnswer);
      case 'boolean':
        return _buildBooleanInput(question, currentAnswer);
      default:
        // Fallback to multiple choice if options exist, otherwise text
        if (question.options != null && question.options!.isNotEmpty) {
          return _buildMultipleChoice(question, currentAnswer);
        }
        return _buildTextInput(question, currentAnswer);
    }
  }

  Widget _buildMultipleChoice(Question question, String? currentAnswer) {
    if (question.options == null || question.options!.isEmpty) {
      return _buildTextInput(question, currentAnswer);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: question.options!.map((option) {
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: RadioListTile<String>(
            title: Text(option),
            value: option,
            groupValue: currentAnswer,
            onChanged: (value) {
              if (value != null) {
                _saveAnswer(value);
              }
            },
          ),
        );
      }).toList(),
    );
  }

  Widget _buildRating(Question question, String? currentAnswer) {
    final minValue = question.minValue ?? 1;
    final maxValue = question.maxValue ?? 5;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Select a rating from $minValue to $maxValue',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          children: List.generate(maxValue - minValue + 1, (index) {
            final value = (minValue + index).toString();
            final isSelected = currentAnswer == value;
            
            return ChoiceChip(
              label: Text(value),
              selected: isSelected,
              onSelected: (selected) {
                if (selected) {
                  _saveAnswer(value);
                }
              },
            );
          }),
        ),
      ],
    );
  }

  Widget _buildNumericInput(Question question, String? currentAnswer) {
    return TextField(
      controller: TextEditingController(text: currentAnswer ?? ''),
      decoration: InputDecoration(
        border: const OutlineInputBorder(),
        hintText: question.minValue != null && question.maxValue != null
            ? 'Enter a number (${question.minValue}-${question.maxValue})'
            : 'Enter a number...',
      ),
      keyboardType: TextInputType.number,
      onChanged: _saveAnswer,
    );
  }

  Widget _buildBooleanInput(Question question, String? currentAnswer) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: RadioListTile<String>(
            title: const Text('Yes'),
            value: 'true',
            groupValue: currentAnswer,
            onChanged: (value) {
              if (value != null) {
                _saveAnswer(value);
              }
            },
          ),
        ),
        Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: RadioListTile<String>(
            title: const Text('No'),
            value: 'false',
            groupValue: currentAnswer,
            onChanged: (value) {
              if (value != null) {
                _saveAnswer(value);
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildTextInput(Question question, String? currentAnswer) {
    return TextField(
      controller: TextEditingController(text: currentAnswer ?? ''),
      decoration: InputDecoration(
        border: const OutlineInputBorder(),
        hintText: question.helpText ?? 'Enter your answer...',
      ),
      maxLines: 3,
      onChanged: _saveAnswer,
    );
  }
}
