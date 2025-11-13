import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useCourseCatalog } from '../contexts/CourseCatalogContext.jsx';
import {
  Layers,
  Brain,
  CalendarRange,
  Sparkles,
  Loader2,
  RefreshCcw,
  BookOpenCheck,
} from 'lucide-react';

const TOOLKIT_BY_VIEW = {
  flashcards: [
    'Launch the Flashcards tab for spaced repetition sets tailored to this course.',
    'Use AI explanations on difficult cards to surface step-by-step reasoning.',
  ],
  notes: [
    'Open the Notes workspace for structured outlines, theorem banks, and worked examples.',
    'Annotate key definitions and copy important derivations into your own notebook.',
  ],
  quizzes: [
    'Run adaptive quizzes to benchmark progress and surface weak points.',
    'Review solution breakdowns after each quiz to capture missing steps.',
  ],
  concepts: [
    'Build a concept map to connect formulas, strategies, and representative problems.',
    'Use AI suggestions to branch into prerequisite or extension ideas automatically.',
  ],
  analytics: [
    'Track accuracy and pacing trends to adjust daily practice volume.',
    'Filter dashboards by topic to spot units that need refreshers.',
  ],
};

const COURSE_DETAILS = {
  prealgebra: {
    topics: ['Integer operations & order of operations', 'Ratios, rates, and proportional reasoning', 'Introductory equation solving'],
    practice: ['Daily 15-minute number sense drills', 'Weekly mixed review set covering fractions and decimals'],
  },
  'algebra-1': {
    topics: ['Linear equations & inequalities', 'Systems of equations and modeling', 'Function notation and graph interpretation'],
    practice: ['Sketch one real-world linear model each week', 'Complete error-analysis for two solved problems per unit'],
  },
  geometry: {
    topics: ['Triangle congruence & similarity proofs', 'Coordinate geometry & transformations', 'Circles, area, and volume applications'],
    practice: ['Write one two-column or paragraph proof every study day', 'Complete a weekly construction or diagram labeling task'],
  },
  'algebra-2': {
    topics: ['Quadratic, polynomial, and rational functions', 'Exponential & logarithmic relationships', 'Sequences, series, and complex numbers'],
    practice: ['Alternate between graphing and symbolic manipulation drills', 'Summarize growth/decay scenarios using real data once per week'],
  },
  trigonometry: {
    topics: ['Unit circle and radian measure', 'Trigonometric identities & transformations', 'Law of Sines/Cosines applications'],
    practice: ['Daily unit-circle recall warmup', 'Identity verification challenges twice a week'],
  },
  precalculus: {
    topics: ['Advanced functions & composite models', 'Parametric, polar, and vector representations', 'Limits preview and analytic trigonometry'],
    practice: ['Create one multi-representation project each week (graph + table + formula)', 'Summarize weekly unit concepts in a concept map'],
  },
  'calculus-ab': {
    topics: ['Limits and continuity', 'Differentiation techniques & applications', 'Definite integrals and Fundamental Theorem'],
    practice: ['Daily derivative drill (product/chain mix)', 'FRQ-style free response every weekend'],
  },
  'calculus-bc': {
    topics: ['Series and convergence tests', 'Parametric and polar calculus', 'Advanced integration techniques'],
    practice: ['Series convergence journal: classify two series every day', 'Polar curve sketching twice a week with area/arc length practice'],
  },
  'multivariable-calculus': {
    topics: ['Partial derivatives & gradients', 'Multiple integrals & change of variables', 'Vector fields, line & surface integrals'],
    practice: ['Gradient field sketching for different scalar fields weekly', 'Flux/circulation problem set every few days'],
  },
  'differential-equations': {
    topics: ['First-order models & integrating factors', 'Second-order linear systems', 'Phase plane and qualitative analysis'],
    practice: ['Solve one modeling problem per day from physics or biology contexts', 'Create slope fields or solution sketches twice weekly'],
  },
  'linear-algebra': {
    topics: ['Matrix operations & linear systems', 'Vector spaces, basis, and dimension', 'Eigenvalues, eigenvectors, and diagonalization'],
    practice: ['Row-reduction drills three times a week', 'Matrix transformation sketchbook for geometric interpretations'],
  },
  'probability-statistics': {
    topics: ['Random variables & distributions', 'Inference (confidence intervals & tests)', 'Regression and modeling'],
    practice: ['Daily quick probability puzzle or data vignette', 'Weekly data set analysis summarizing key statistics'],
  },
  'discrete-math': {
    topics: ['Counting principles & inclusion-exclusion', 'Graph theory fundamentals', 'Recurrence relations and induction'],
    practice: ['Contest-style counting challenge each day', 'Write two full combinatorial proofs per week'],
  },
  'number-theory': {
    topics: ['Divisibility and modular arithmetic', 'Congruences & Diophantine equations', 'Prime distribution and arithmetic functions'],
    practice: ['Daily modular arithmetic drill set', 'Weekly proof portfolio entry (e.g., classic Olympiad lemma)'],
  },
  'abstract-algebra': {
    topics: ['Group theory, subgroups, and homomorphisms', 'Ring theory & polynomial rings', 'Field extensions & applications'],
    practice: ['Construct Cayley tables and explore subgroup lattices weekly', 'Complete proof write-ups for core theorems (Lagrange, homomorphism)'],
  },
  'real-analysis': {
    topics: ['Sequences and series convergence', 'Continuity and differentiability rigor', 'Riemann integration and uniform convergence'],
    practice: ['Maintain an ε-δ proof logbook', 'Weekly deep dive on a counterexample or pathological function'],
  },
  topology: {
    topics: ['Metric and topological spaces', 'Continuity, compactness, and connectedness', 'Product and quotient constructions'],
    practice: ['Diagram separation properties for new spaces', 'Present one theorem proof to a study partner weekly'],
  },
  'math-contests': {
    topics: ['AMC/AIME algebra & counting', 'Geometry strategies with inversion & transformations', 'Number theory tricks & inequalities'],
    practice: ['Timed sprint every other day (12-15 problems)', 'Archive solutions with alternative strategies for misses'],
  },
  'financial-math': {
    topics: ['Simple & compound interest models', 'Annuities, amortization, and yield curves', 'Risk assessment and portfolio math'],
    practice: ['Build spreadsheet simulations for new formulas weekly', 'Write case studies analyzing loan or investment scenarios'],
  },
  'math-modeling': {
    topics: ['Optimization & linear programming', 'Regression, curve fitting, and residual analysis', 'Simulation and sensitivity studies'],
    practice: ['Launch a modeling notebook documenting assumptions and variables', 'Prototype small data projects every weekend'],
  },
};

const DEFAULT_TOPICS = ['Key definitions and terminology', 'Core techniques and representative problems', 'Applications and extensions to explore next'];

const DEFAULT_PRACTICE = [
  'Set a 25-minute focused study block daily.',
  'Review mistakes and summarize insights after each practice session.',
];

const getToolkit = (defaultView) => TOOLKIT_BY_VIEW[defaultView] || [
  'Review the linked workspace tabs to assemble notes, flashcards, and quizzes.',
  'Use AI suggestions across tools to uncover prerequisite or enrichment material.',
];

const getDetails = (course) => {
  const details = COURSE_DETAILS[course.id] || {};
  return {
    topics: details.topics || DEFAULT_TOPICS,
    practice: details.practice || DEFAULT_PRACTICE,
  };
};

export const WorkspaceView = ({ onNavigate }) => {
  const {
    joinedCourses,
    courseBlueprints,
    blueprintStatus,
    generateCourseBlueprint,
  } = useCourseCatalog();

  const [highlightCourseId, setHighlightCourseId] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem('workspaceLastCourse');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem('workspaceLastCourse');
      if (stored) {
        setHighlightCourseId(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    joinedCourses.forEach((course) => {
      const status = blueprintStatus[course.id];
      if (!courseBlueprints[course.id] && status !== 'loading') {
        generateCourseBlueprint(course.id).catch(() => {
          /* status handled in context */
        });
      }
    });
  }, [joinedCourses, courseBlueprints, blueprintStatus, generateCourseBlueprint]);

  const sortedCourses = useMemo(
    () => {
      const list = [...joinedCourses].sort((a, b) => a.name.localeCompare(b.name));
      if (!highlightCourseId) {
        return list;
      }
      return list.sort((a, b) => {
        if (a.id === highlightCourseId) return -1;
        if (b.id === highlightCourseId) return 1;
        return 0;
      });
    },
    [joinedCourses, highlightCourseId]
  );

  if (sortedCourses.length === 0) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-2xl">No courses in your workspace yet</CardTitle>
            <CardDescription>
              Join a course from the catalog to unlock a tailored workspace with study plans, recommended tools, and weekly routines.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => onNavigate && onNavigate('courses')}>
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Course Workspace</h1>
        <p className="text-muted-foreground max-w-2xl">
          Every joined course gets a dedicated workspace outlining what to study, which tools to lean on, and a suggested weekly cadence.
          Use these plans to stay organized and dive deeper into each math track.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedCourses.map((course) => {
          const { topics, practice } = getDetails(course);
          const toolkit = getToolkit(course.defaultView);

          return (
            <Card
              key={course.id}
              className={[
                'flex flex-col shadow-sm hover:shadow-lg transition-shadow',
                course.id === highlightCourseId ? 'ring-2 ring-primary/60' : '',
              ].join(' ')}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle as="h2" className="text-xl">
                      {course.name}
                    </CardTitle>
                    <CardDescription>{course.summary}</CardDescription>
                  </div>
                  <span
                    className="h-4 w-4 rounded-full mt-1"
                    style={{ backgroundColor: course.color }}
                    title="Course accent color"
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-6 flex-1">
                <section className="space-y-2">
                  <header className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Layers className="h-4 w-4 text-primary" />
                    Core Concepts to Master
                  </header>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {topics.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>

                <div className="h-px w-full bg-border/70" />

                <section className="space-y-2">
                  <header className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <BookOpenCheck className="h-4 w-4 text-primary" />
                    Recommended Study Toolkit
                  </header>
                  <p className="text-sm text-muted-foreground">
                    {course.focus}
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {toolkit.map((tool) => (
                      <li key={tool}>{tool}</li>
                    ))}
                  </ul>
                </section>

                <div className="h-px w-full bg-border/70" />

                <section className="space-y-2">
                  <header className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI-Generated Course Blueprint
                  </header>
                  <div className="text-sm text-muted-foreground space-y-2">
                    {(() => {
                      const status = blueprintStatus[course.id];
                      if (status === 'loading') {
                        return (
                          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span>Generating personalized syllabus…</span>
                          </div>
                        );
                      }
                      if (status === 'error') {
                        return (
                          <div className="space-y-2">
                            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-destructive">
                              We couldn’t generate this course outline. Try again below.
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateCourseBlueprint(course.id)}
                              className="inline-flex items-center gap-2"
                            >
                              <RefreshCcw className="h-4 w-4" />
                              Retry Generation
                            </Button>
                          </div>
                        );
                      }
                      const blueprint = courseBlueprints[course.id];
                      if (!blueprint) {
                        return (
                          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span>Preparing course outline…</span>
                          </div>
                        );
                      }
                      return (
                        <div className="rounded-lg border border-border/60 bg-muted/10 p-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                          {blueprint}
                        </div>
                      );
                    })()}
                  </div>
                </section>

                <div className="h-px w-full bg-border/70" />

                <section className="space-y-2">
                  <header className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Brain className="h-4 w-4 text-primary" />
                    Weekly Routine Blueprint
                  </header>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {practice.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              </CardContent>

              <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <CalendarRange className="h-4 w-4 text-primary" />
                  Suggested default workspace: {course.defaultView.toUpperCase()}
                </div>
                {course.defaultView && (
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.localStorage.setItem('workspacePreferredView', course.defaultView || '');
                          window.localStorage.setItem('workspaceLastCourse', course.id);
                        }
                        setHighlightCourseId(course.id);
                        if (onNavigate) {
                          onNavigate(course.defaultView);
                        }
                      }}
                    >
                      Open {course.defaultView.charAt(0).toUpperCase() + course.defaultView.slice(1)}
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};


