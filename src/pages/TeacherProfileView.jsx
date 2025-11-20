import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Plus,
  Sparkles,
  BookOpen,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileCheck,
  Brain,
  Loader2,
  ChevronRight,
  Target,
  BarChart3,
  Award,
  Lightbulb,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { useAuth } from '../contexts/AuthContext';
import { processFile } from '../lib/fileProcessing';
import { analyzeTeacherProfile, generateTeacherSpecificContent } from '../lib/aiHelpers';

// Local storage functions for teacher profiles (no Firebase)
const TEACHER_PROFILES_KEY = 'teacherProfiles';

const saveTeacherProfileLocal = (teacherProfile) => {
  const profiles = getTeacherProfilesLocal();
  const existingIndex = profiles.findIndex(t => t.id === teacherProfile.id);
  if (existingIndex >= 0) {
    profiles[existingIndex] = teacherProfile;
  } else {
    profiles.push(teacherProfile);
  }
  localStorage.setItem(TEACHER_PROFILES_KEY, JSON.stringify(profiles));
};

const getTeacherProfilesLocal = () => {
  try {
    const stored = localStorage.getItem(TEACHER_PROFILES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading teacher profiles:', error);
    return [];
  }
};

const updateTeacherProfileLocal = (teacherId, updates) => {
  const profiles = getTeacherProfilesLocal();
  const index = profiles.findIndex(t => t.id === teacherId);
  if (index >= 0) {
    profiles[index] = {
      ...profiles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(TEACHER_PROFILES_KEY, JSON.stringify(profiles));
  }
};

const deleteTeacherProfileLocal = (teacherId) => {
  const profiles = getTeacherProfilesLocal().filter(t => t.id !== teacherId);
  localStorage.setItem(TEACHER_PROFILES_KEY, JSON.stringify(profiles));
};

const TeacherProfileView = () => {
  const { currentUser } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisProgress, setAnalysisProgress] = useState('');
  
  // Form state
  const [teacherName, setTeacherName] = useState('');
  const [subject, setSubject] = useState('');
  const [school, setSchool] = useState('');
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = () => {
    try {
      const profiles = getTeacherProfilesLocal();
      setTeachers(profiles || []);
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      for (const file of files) {
        const fileData = await processFile(file);
        setUploadedFiles(prev => [...prev, {
          ...fileData,
          id: Date.now() + Math.random(),
          uploadedAt: new Date().toISOString(),
        }]);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert(`Error uploading file: ${error.message}`);
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleCreateTeacher = () => {
    if (!teacherName || !subject) {
      alert('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      const teacherId = `teacher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newTeacher = {
        id: teacherId,
        name: teacherName,
        subject,
        school: school || 'Not specified',
        courseName: courseName || subject,
        files: uploadedFiles,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveTeacherProfileLocal(newTeacher);
      loadTeachers();
      
      // Reset form
      setTeacherName('');
      setSubject('');
      setSchool('');
      setCourseName('');
      setUploadedFiles([]);
      setIsCreating(false);
      setShowCreateForm(false);
      
      // Auto-select and analyze
      setSelectedTeacher(newTeacher);
      handleAnalyzeTeacher(newTeacher);
    } catch (error) {
      console.error('Error creating teacher:', error);
      alert('Failed to create teacher profile. Please try again.');
      setIsCreating(false);
    }
  };

  const handleAnalyzeTeacher = async (teacher = selectedTeacher) => {
    if (!teacher) return;

    setIsAnalyzing(true);
    setAnalysisProgress('Analyzing teacher patterns...');

    try {
      // Extract text from all uploaded files
      const allText = teacher.files
        .map(file => {
          if (file.type === 'pdf' || file.type === 'text') {
            return file.content;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n\n---\n\n');

      setAnalysisProgress('Learning question style and difficulty patterns...');
      const analysis = await analyzeTeacherProfile(teacher, allText);

      setAnalysisProgress('Saving analysis results...');
      updateTeacherProfileLocal(teacher.id, {
        analysis,
        analyzedAt: new Date().toISOString(),
      });

      loadTeachers();
      // Update selected teacher with new analysis
      setSelectedTeacher({
        ...teacher,
        analysis,
        analyzedAt: new Date().toISOString(),
      });
      setAnalysisProgress('');
      setIsAnalyzing(false);
    } catch (error) {
      console.error('Error analyzing teacher:', error);
      alert('Failed to analyze teacher profile. Please try again.');
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  const handleDeleteTeacher = (teacherId) => {
    if (!confirm('Are you sure you want to delete this teacher profile?')) return;

    try {
      deleteTeacherProfileLocal(teacherId);
      loadTeachers();
      if (selectedTeacher?.id === teacherId) {
        setSelectedTeacher(null);
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      alert('Failed to delete teacher profile.');
    }
  };


  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          AI Teacher Profiles
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload materials to learn how your teacher tests, grades, and explains concepts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teacher List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Your Teachers</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(true);
                    setSelectedTeacher(null);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {teachers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No teachers added yet</p>
                </div>
              ) : (
                teachers.map((teacher) => (
                  <motion.div
                    key={teacher.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedTeacher?.id === teacher.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-muted/30 border-0 hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedTeacher(teacher)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{teacher.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {teacher.courseName || teacher.subject}
                          </p>
                          {teacher.analysis && (
                            <div className="mt-1.5 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-muted-foreground">Analyzed</span>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTeacher(teacher.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {showCreateForm ? (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Add New Teacher</CardTitle>
                <CardDescription className="text-sm">
                  Upload syllabi, tests, assignments, and notes to help AI learn their teaching style
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="teacher-name">Teacher Name *</Label>
                  <Input
                    id="teacher-name"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="e.g., Mrs. Torres"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., APUSH, Chemistry"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">Course Name</Label>
                    <Input
                      id="course"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="e.g., AP US History"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Input
                    id="school"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="e.g., Lincoln High School"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload Materials</Label>
                  <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium mb-1">Click to upload files</p>
                      <p className="text-xs text-muted-foreground">
                        PDFs, images of tests/quizzes, syllabi, rubrics
                      </p>
                    </label>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowCreateForm(false);
                      setTeacherName('');
                      setSubject('');
                      setSchool('');
                      setCourseName('');
                      setUploadedFiles([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCreateTeacher}
                    disabled={isCreating || !teacherName || !subject}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Profile'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedTeacher ? (
            <TeacherDetailView
              teacher={selectedTeacher}
              onAnalyze={handleAnalyzeTeacher}
              isAnalyzing={isAnalyzing}
              analysisProgress={analysisProgress}
              onBack={() => {
                setSelectedTeacher(null);
                setAnalysisProgress('');
              }}
            />
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                <h2 className="text-lg font-semibold mb-2">Select a Teacher</h2>
                <p className="text-sm text-muted-foreground">
                  Choose a teacher from the list to view their profile and generate study materials
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const TeacherDetailView = ({ teacher, onAnalyze, isAnalyzing, analysisProgress, onBack }) => {
  const [generatedContent, setGeneratedContent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateContent = async (type) => {
    setIsGenerating(true);
    try {
      const content = await generateTeacherSpecificContent(teacher, type);
      setGeneratedContent({ type, content });
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{teacher.name}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {teacher.courseName || teacher.subject} • {teacher.school}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onBack}>
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!teacher.analysis ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-3">
                  Upload materials and analyze to unlock teacher-specific study tools
                </p>
                <Button
                  onClick={() => onAnalyze(teacher)}
                  disabled={isAnalyzing || teacher.files.length === 0}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {analysisProgress || 'Analyzing...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Teacher Profile
                    </>
                  )}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Uploaded Files: {teacher.files.length}</p>
                {teacher.files.map((file, idx) => (
                  <p key={idx} className="truncate">• {file.name}</p>
                ))}
              </div>
            </div>
          ) : (
            <>
              <TeacherAnalysisView teacher={teacher} onGenerate={handleGenerateContent} isGenerating={isGenerating} />
              {generatedContent && (
                <GeneratedContentDisplay content={generatedContent} />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const TeacherAnalysisView = ({ teacher, onGenerate, isGenerating }) => {
  const analysis = teacher.analysis || {};

  return (
    <div className="space-y-6">
      {/* Analysis Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Question Style</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {analysis.questionStyle?.mcqRatio ? `${Math.round(analysis.questionStyle.mcqRatio * 100)}% MCQ` : 'Analyzing...'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Difficulty Level</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {analysis.difficultyLevel || 'Analyzing...'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generate Content Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start"
          onClick={() => onGenerate('practice-questions')}
          disabled={isGenerating}
        >
          <BookOpen className="h-5 w-5 mb-2" />
          <span className="font-semibold">Practice Questions</span>
          <span className="text-xs text-muted-foreground mt-1">
            Teacher-style questions
          </span>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start"
          onClick={() => onGenerate('study-guide')}
          disabled={isGenerating}
        >
          <FileText className="h-5 w-5 mb-2" />
          <span className="font-semibold">Study Guide</span>
          <span className="text-xs text-muted-foreground mt-1">
            What your teacher emphasizes
          </span>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start"
          onClick={() => onGenerate('test-prediction')}
          disabled={isGenerating}
        >
          <Target className="h-5 w-5 mb-2" />
          <span className="font-semibold">Test Prediction</span>
          <span className="text-xs text-muted-foreground mt-1">
            Probability heatmap
          </span>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start"
          onClick={() => onGenerate('essay-grader')}
          disabled={isGenerating}
        >
          <CheckCircle className="h-5 w-5 mb-2" />
          <span className="font-semibold">Essay Grader</span>
          <span className="text-xs text-muted-foreground mt-1">
            Grade like your teacher
          </span>
        </Button>
      </div>
    </div>
  );
};

// Enhanced content display components
const GeneratedContentDisplay = ({ content }) => {
  const { type, content: rawContent } = content;

  switch (type) {
    case 'practice-questions':
      return <PracticeQuestionsDisplay content={rawContent} />;
    case 'study-guide':
      return <StudyGuideDisplay content={rawContent} />;
    case 'test-prediction':
      return <TestPredictionDisplay content={rawContent} />;
    case 'essay-grader':
      return <EssayGraderDisplay content={rawContent} />;
    default:
      return <DefaultContentDisplay content={rawContent} />;
  }
};

// Parse and display practice questions beautifully
const PracticeQuestionsDisplay = ({ content }) => {
  const questions = useMemo(() => {
    const lines = content.split('\n').filter(l => l.trim());
    const parsed = [];
    let currentQ = null;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      // Question number
      if (/^\d+\./.test(trimmed)) {
        if (currentQ) parsed.push(currentQ);
        currentQ = {
          number: trimmed.match(/^\d+\./)[0],
          question: trimmed.replace(/^\d+\./, '').trim(),
          options: [],
          correct: null,
          explanation: null,
        };
      }
      // Options A-D
      else if (/^[A-D][\)\.]\s*/.test(trimmed) && currentQ) {
        const optionText = trimmed.replace(/^[A-D][\)\.]\s*/, '').trim();
        const letter = trimmed.charAt(0);
        currentQ.options.push({ letter, text: optionText });
      }
      // Correct answer
      else if (/^correct[:\s]/i.test(trimmed) && currentQ) {
        const match = trimmed.match(/[A-D]/i);
        if (match) currentQ.correct = match[0].toUpperCase();
      }
      // Explanation
      else if (/^explanation[:\s]/i.test(trimmed) && currentQ) {
        currentQ.explanation = trimmed.replace(/^explanation[:\s]*/i, '').trim();
      }
      // Last question
      if (idx === lines.length - 1 && currentQ) {
        parsed.push(currentQ);
      }
    });

    return parsed.length > 0 ? parsed : [{ question: content, options: [], correct: null }];
  }, [content]);

  return (
    <Card className="border-0 shadow-sm mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Practice Questions</CardTitle>
        </div>
        <CardDescription className="text-sm">
          {questions.length} teacher-style questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((q, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-5 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                {q.number || idx + 1}
              </div>
              <p className="text-base font-medium leading-relaxed flex-1">{q.question}</p>
            </div>
            
            {q.options.length > 0 && (
              <div className="space-y-2 ml-11">
                {q.options.map((opt, optIdx) => (
                  <div
                    key={optIdx}
                    className={`p-3 rounded-lg border transition-colors ${
                      q.correct === opt.letter
                        ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400'
                        : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        q.correct === opt.letter
                          ? 'bg-green-500 text-white'
                          : 'bg-muted border border-border'
                      }`}>
                        {opt.letter}
                      </div>
                      <span className="flex-1">{opt.text}</span>
                      {q.correct === opt.letter && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {q.explanation && (
              <div className="mt-4 ml-11 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">{q.explanation}</p>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

// Beautiful study guide display
const StudyGuideDisplay = ({ content }) => {
  const sections = useMemo(() => {
    const lines = content.split('\n').filter(l => l.trim());
    const parsed = [];
    let currentSection = null;

    lines.forEach((line) => {
      const trimmed = line.trim();
      
      // Section headers (numbered or bold)
      if (/^\d+\./.test(trimmed) || /^[A-Z][^a-z]*$/.test(trimmed) && trimmed.length < 50) {
        if (currentSection) parsed.push(currentSection);
        currentSection = {
          title: trimmed.replace(/^\d+\.\s*/, ''),
          points: [],
        };
      }
      // Bullet points
      else if (/^[-•*]\s*/.test(trimmed) || /^\d+[\)\.]\s*/.test(trimmed)) {
        if (currentSection) {
          currentSection.points.push(trimmed.replace(/^[-•*]\s*/, '').replace(/^\d+[\)\.]\s*/, ''));
        } else {
          // Create default section if none exists
          if (!currentSection) {
            currentSection = { title: 'Key Points', points: [] };
          }
          currentSection.points.push(trimmed.replace(/^[-•*]\s*/, '').replace(/^\d+[\)\.]\s*/, ''));
        }
      }
      // Regular text
      else if (trimmed && currentSection) {
        currentSection.points.push(trimmed);
      }
    });

    if (currentSection) parsed.push(currentSection);
    return parsed.length > 0 ? parsed : [{ title: 'Study Guide', points: [content] }];
  }, [content]);

  return (
    <Card className="border-0 shadow-sm mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Study Guide</CardTitle>
        </div>
        <CardDescription className="text-sm">
          What your teacher emphasizes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-5 rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50"
          >
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              {section.title}
            </h3>
            <ul className="space-y-2">
              {section.points.map((point, pointIdx) => (
                <li key={pointIdx} className="flex items-start gap-3 text-sm leading-relaxed">
                  <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <span className="flex-1">{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

// Test prediction with charts
const TestPredictionDisplay = ({ content }) => {
  const { topics, chartData, highProbability } = useMemo(() => {
    const lines = content.split('\n').filter(l => l.trim());
    const topics = [];
    const chartData = [];
    const highProbability = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      
      // Extract probability percentages
      const probMatch = trimmed.match(/(\d+)%|(\d+)\s*percent/i);
      if (probMatch) {
        const percent = parseInt(probMatch[1] || probMatch[2]);
        const topicMatch = trimmed.match(/(?:unit|topic|chapter)[\s:]*([^0-9%]+)/i) || 
                          trimmed.match(/^([^:0-9]+)[:\s]*\d+/i);
        
        if (topicMatch) {
          const topicName = topicMatch[1].trim().replace(/[:\-]/g, '').substring(0, 30);
          topics.push({ name: topicName, probability: percent });
          chartData.push({ name: topicName.substring(0, 15), value: percent });
          
          if (percent >= 50) {
            highProbability.push({ name: topicName, probability: percent });
          }
        }
      }
    });

    // If no structured data found, create sample from content
    if (topics.length === 0) {
      const units = content.match(/unit\s*\d+/gi) || content.match(/chapter\s*\d+/gi) || [];
      units.slice(0, 5).forEach((unit, idx) => {
        const prob = 80 - (idx * 15);
        topics.push({ name: unit, probability: Math.max(10, prob) });
        chartData.push({ name: unit.substring(0, 15), value: Math.max(10, prob) });
      });
    }

    return { topics, chartData, highProbability };
  }, [content]);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <Card className="border-0 shadow-sm mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Test Prediction</CardTitle>
        </div>
        <CardDescription className="text-sm">
          Probability heatmap for upcoming test
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart */}
        {chartData.length > 0 && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <h3 className="text-sm font-semibold mb-4">Topic Probability</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={11} angle={-45} textAnchor="end" height={80} />
                  <YAxis domain={[0, 100]} fontSize={11} />
                  <Tooltip 
                    formatter={(value) => `${value}%`}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* High Probability Topics */}
        {highProbability.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              High-Probability Topics (Focus Here!)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {highProbability.map((topic, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{topic.name}</span>
                    <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      {topic.probability}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${topic.probability}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All Topics */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">All Topics</h3>
          <div className="space-y-2">
            {topics.map((topic, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{topic.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          topic.probability >= 70 ? 'bg-green-500' :
                          topic.probability >= 50 ? 'bg-yellow-500' :
                          'bg-muted-foreground/30'
                        }`}
                        style={{ width: `${topic.probability}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{topic.probability}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Essay grader with professional feedback
const EssayGraderDisplay = ({ content }) => {
  const sections = useMemo(() => {
    const lines = content.split('\n').filter(l => l.trim());
    const parsed = {
      score: null,
      feedback: [],
      strengths: [],
      improvements: [],
      rubric: [],
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      
      // Score
      if (/score|grade|points/i.test(trimmed)) {
        const scoreMatch = trimmed.match(/(\d+)\s*\/\s*(\d+)|(\d+)%|(\d+)\s*points/i);
        if (scoreMatch) {
          parsed.score = scoreMatch[0];
        }
      }
      // Strengths
      else if (/strength|good|well done|excellent/i.test(trimmed) && !/improve/i.test(trimmed)) {
        parsed.strengths.push(trimmed);
      }
      // Improvements
      else if (/improve|need|should|weakness|issue/i.test(trimmed)) {
        parsed.improvements.push(trimmed);
      }
      // General feedback
      else if (trimmed.length > 20) {
        parsed.feedback.push(trimmed);
      }
    });

    return parsed;
  }, [content]);

  return (
    <Card className="border-0 shadow-sm mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Essay Feedback</CardTitle>
        </div>
        <CardDescription className="text-sm">
          Graded in your teacher's style
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.score && (
          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">{sections.score}</div>
              <div className="text-sm text-muted-foreground">Estimated Score</div>
            </div>
          </div>
        )}

        {sections.strengths.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              Strengths
            </h3>
            <div className="space-y-2">
              {sections.strengths.map((strength, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm">{strength}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {sections.improvements.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertCircle className="h-4 w-4" />
              Areas for Improvement
            </h3>
            <div className="space-y-2">
              {sections.improvements.map((improvement, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className="text-sm">{improvement}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {sections.feedback.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Detailed Feedback</h3>
            <div className="space-y-3">
              {sections.feedback.map((feedback, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-sm leading-relaxed">{feedback}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {sections.feedback.length === 0 && sections.strengths.length === 0 && sections.improvements.length === 0 && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Default fallback display
const DefaultContentDisplay = ({ content }) => {
  return (
    <Card className="border-0 shadow-sm mt-6">
      <CardContent className="p-6">
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-lg border-0">
            {content}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherProfileView;

