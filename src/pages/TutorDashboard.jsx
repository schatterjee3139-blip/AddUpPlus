import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Users, 
  BarChart3, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Clock, 
  Award,
  GraduationCap,
  Download,
  Upload,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { getAllStudentsData, getTutorMaterials, saveTutorMaterial, getUserData, getTutorRequests, getStudentsScheduledWithTutor } from '../lib/localStorage';

export const TutorDashboard = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ title: '', description: '', type: 'worksheet', content: '' });
  const [tutorInfo, setTutorInfo] = useState(null);

  useEffect(() => {
    loadTutorInfo();
  }, [currentUser]);

  useEffect(() => {
    if (tutorInfo || currentUser) {
      loadStudentsAndMaterials();
    }
  }, [tutorInfo, currentUser]);

  const loadTutorInfo = async () => {
    // For tutors, get info from currentUser (no Firebase needed)
    if (currentUser?.isTutor && currentUser?.tutorInfo) {
      setTutorInfo(currentUser.tutorInfo);
      return;
    }
    
    // Fallback to Firestore for regular users (shouldn't happen for tutors)
    if (!currentUser?.uid) return;
    try {
      const userData = await getUserData(currentUser.uid);
      if (userData?.tutorInfo) {
        setTutorInfo(userData.tutorInfo);
      }
    } catch (error) {
      console.error('Error loading tutor info:', error);
    }
  };

  const loadStudentsAndMaterials = async () => {
    setLoading(true);
    try {
      // Ensure tutor info is loaded (from currentUser for tutors, or Firestore for others)
      let currentTutorInfo = tutorInfo;
      if (!currentTutorInfo) {
        if (currentUser?.isTutor && currentUser?.tutorInfo) {
          currentTutorInfo = currentUser.tutorInfo;
          setTutorInfo(currentTutorInfo);
        } else if (currentUser?.uid) {
          const userData = await getUserData(currentUser.uid);
          if (userData?.tutorInfo) {
            currentTutorInfo = userData.tutorInfo;
            setTutorInfo(currentTutorInfo);
          }
        }
      }

      // Get tutor requests to find students who scheduled with this tutor
      const tutorRequests = await getTutorRequests();
      const tutorId = currentTutorInfo?.id || currentUser?.email?.split('@')[0];
      
      // Filter requests for this tutor
      const myTutorRequests = tutorRequests.filter(req => {
        // Match by tutor ID or tutor name
        return req.tutorId === tutorId || 
               req.tutorName === currentTutorInfo?.name ||
               (currentTutorInfo?.name && req.tutorName?.includes(currentTutorInfo.name.split(' ')[0]));
      });

      // Get unique student emails from requests
      const studentEmails = [...new Set(myTutorRequests.map(req => req.studentEmail).filter(Boolean))];
      
      // Load all students' data
      const allStudentsData = await getAllStudentsData();
      
      // Filter to only students who scheduled with this tutor
      const myStudents = allStudentsData.filter(student => 
        studentEmails.includes(student.profile?.email) || 
        studentEmails.includes(student.id)
      );

      setStudents(myStudents);

      // Load tutor materials (only if we have a uid, skip for non-Firebase tutors)
      if (currentUser?.uid && !currentUser?.isTutor) {
        const tutorMaterials = await getTutorMaterials(currentUser.uid);
        setMaterials(tutorMaterials || []);
      } else {
        // For non-Firebase tutors, use localStorage for materials
        const storedMaterials = localStorage.getItem(`tutor_materials_${currentTutorInfo?.id}`);
        if (storedMaterials) {
          try {
            setMaterials(JSON.parse(storedMaterials));
          } catch (e) {
            setMaterials([]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading tutor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMaterial = async () => {
    if (!newMaterial.title.trim()) return;
    
    try {
      if (currentUser?.uid && !currentUser?.isTutor) {
        // Use Firestore for regular users
        await saveTutorMaterial(currentUser.uid, {
          ...newMaterial,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Use localStorage for non-Firebase tutors
        const newMaterialWithId = {
          ...newMaterial,
          id: `material_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        const updatedMaterials = [...materials, newMaterialWithId];
        localStorage.setItem(`tutor_materials_${tutorInfo?.id}`, JSON.stringify(updatedMaterials));
        setMaterials(updatedMaterials);
      }
      await loadStudentsAndMaterials();
      setShowMaterialForm(false);
      setNewMaterial({ title: '', description: '', type: 'worksheet', content: '' });
    } catch (error) {
      console.error('Error saving material:', error);
    }
  };

  const filteredStudents = students.filter(student => 
    student.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateStudentStats = (student) => {
    const metrics = student.studyMetrics || {};
    const flashcardAccuracy = metrics.flashcardsReviewed > 0
      ? Math.round((metrics.flashcardsCorrect / metrics.flashcardsReviewed) * 100)
      : 0;
    const quizAverage = metrics.totalQuizQuestions > 0
      ? Math.round((metrics.totalQuizCorrect / metrics.totalQuizQuestions) * 100)
      : 0;
    
    return {
      flashcardAccuracy,
      quizAverage,
      studyHours: (metrics.studyMinutes || 0) / 60,
      flashcardsReviewed: metrics.flashcardsReviewed || 0,
      quizzesCompleted: metrics.quizzesCompleted || 0,
    };
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tutor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            {tutorInfo?.name ? `${tutorInfo.name}'s Dashboard` : 'Tutor Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {tutorInfo?.subject || 'Manage your students and teaching materials'}
          </p>
        </div>
        <Button onClick={() => setShowMaterialForm(!showMaterialForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold">
                  {students.filter(s => {
                    const stats = calculateStudentStats(s);
                    return stats.studyHours > 0;
                  }).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Teaching Materials</p>
                <p className="text-2xl font-bold">{materials.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Study Time</p>
                <p className="text-2xl font-bold">
                  {students.length > 0
                    ? (students.reduce((sum, s) => sum + calculateStudentStats(s).studyHours, 0) / students.length).toFixed(1)
                    : 0}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Students</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchTerm ? 'No students found' : 'No students yet'}
                  </p>
                ) : (
                  filteredStudents.map((student) => {
                    const stats = calculateStudentStats(student);
                    return (
                      <Card
                        key={student.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedStudent(selectedStudent?.id === student.id ? null : student)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold">
                                {student.profile?.firstName} {student.profile?.lastName}
                              </h3>
                              <p className="text-sm text-muted-foreground">{student.profile?.email}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="flex items-center gap-1">
                                  <BarChart3 className="h-3 w-3" />
                                  {stats.flashcardAccuracy}% accuracy
                                </span>
                                <span className="flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  {stats.quizAverage}% quiz avg
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {stats.studyHours.toFixed(1)}h
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selected Student Details */}
          {selectedStudent && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedStudent.profile?.firstName} {selectedStudent.profile?.lastName} - Analytics
                </CardTitle>
                <CardDescription>{selectedStudent.profile?.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Flashcards</p>
                    <p className="text-2xl font-bold">{calculateStudentStats(selectedStudent).flashcardsReviewed}</p>
                    <p className="text-xs text-muted-foreground">
                      {calculateStudentStats(selectedStudent).flashcardAccuracy}% accuracy
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quizzes</p>
                    <p className="text-2xl font-bold">{calculateStudentStats(selectedStudent).quizzesCompleted}</p>
                    <p className="text-xs text-muted-foreground">
                      {calculateStudentStats(selectedStudent).quizAverage}% average
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Study Time</p>
                    <p className="text-2xl font-bold">{calculateStudentStats(selectedStudent).studyHours.toFixed(1)}h</p>
                    <p className="text-xs text-muted-foreground">Total logged</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">AI Interactions</p>
                    <p className="text-2xl font-bold">{selectedStudent.studyMetrics?.aiInteractions || 0}</p>
                    <p className="text-xs text-muted-foreground">Questions asked</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Recent Activity</h4>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {selectedStudent.updatedAt 
                      ? new Date(selectedStudent.updatedAt).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Teaching Materials */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teaching Materials</CardTitle>
              <CardDescription>Resources for your students</CardDescription>
            </CardHeader>
            <CardContent>
              {showMaterialForm ? (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <Input
                    placeholder="Material Title"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  />
                  <Input
                    placeholder="Description"
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  />
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={newMaterial.type}
                    onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value })}
                  >
                    <option value="worksheet">Worksheet</option>
                    <option value="lesson-plan">Lesson Plan</option>
                    <option value="assessment">Assessment</option>
                    <option value="resource">Resource</option>
                  </select>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                    placeholder="Content or notes..."
                    value={newMaterial.content}
                    onChange={(e) => setNewMaterial({ ...newMaterial, content: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveMaterial} className="flex-1">Save</Button>
                    <Button variant="outline" onClick={() => setShowMaterialForm(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {materials.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No materials yet</p>
                  ) : (
                    materials.map((material, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{material.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{material.description}</p>
                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                              {material.type}
                            </span>
                          </div>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

