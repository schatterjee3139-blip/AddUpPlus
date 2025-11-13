import React from 'react';
import { CheckSquare, ArrowRight, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useCourseCatalog } from '../contexts/CourseCatalogContext.jsx';

export const CoursesView = ({ onNavigate }) => {
  const { catalog, joinedCourses, joinCourse, leaveCourse, isJoined } = useCourseCatalog();

  const handleGoToWorkspace = (courseId, defaultView) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('workspaceLastCourse', courseId);
        window.localStorage.setItem('workspacePreferredView', defaultView || '');
      }
    } catch (error) {
      console.warn('Failed to persist workspace preference', error);
    }
    onNavigate && onNavigate('workspace');
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Courses</h1>
        <p className="text-muted-foreground max-w-2xl">
          Join courses to unlock tailored flashcards, notes, quizzes, and analytics. You can revisit this page
          anytime to manage the subjects you&apos;re actively studying.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Joined Courses</h2>
          <p className="text-sm text-muted-foreground">
            Launch the focused workspace or remove a course when you&apos;re finished with it.
          </p>
        </div>

        {joinedCourses.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">No courses joined yet</CardTitle>
              <CardDescription>
                Browse the catalog below and tap <strong>Join Course</strong> to add subjects to your study plan.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {joinedCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle as="h3">{course.name}</CardTitle>
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: course.color }}
                    />
                  </div>
                  <CardDescription>{course.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{course.focus}</p>
                </CardContent>
                <CardFooter className="flex items-center justify-between gap-2 flex-wrap">
                  <Button
                    variant="secondary"
                    onClick={() => handleGoToWorkspace(course.id, course.defaultView)}
                  >
                    Go to Workspace <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => leaveCourse(course.id)}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Leave
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Explore Course Catalog</h2>
          <p className="text-sm text-muted-foreground">
            Join as many courses as you like—each one adds tailored study tools to your dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {catalog.map((course) => {
            const joined = isJoined(course.id);
            return (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle as="h3">{course.name}</CardTitle>
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: course.color }}
                    />
                  </div>
                  <CardDescription>{course.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{course.focus}</p>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    variant={joined ? 'outline' : 'default'}
                    onClick={() => joinCourse(course.id)}
                    disabled={joined}
                  >
                    {joined ? (
                      <>
                        Joined <CheckSquare className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Join Course <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
};


