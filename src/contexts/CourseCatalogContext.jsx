import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { chatCompletion } from '../lib/api';

export const COURSE_CATALOG = [
  {
    id: 'prealgebra',
    name: 'Pre-Algebra Foundations',
    summary: 'Bridge arithmetic to algebra through rigorous work with integers, ratios, proportional reasoning, and introductory symbolic manipulation.',
    focus: 'Automate number sense while establishing the structural habits required for formal algebra.',
    color: '#fcd34d',
    defaultView: 'flashcards',
  },
  {
    id: 'algebra-1',
    name: 'Algebra I Foundations',
    summary: 'Develop deep fluency with linear models, functional notation, and multi-step inequalities supported by data-driven modeling tasks.',
    focus: 'Synthesize connections between symbolic rules, tables, and graphs to model real-world phenomena.',
    color: '#4ade80',
    defaultView: 'concepts',
  },
  {
    id: 'geometry',
    name: 'Euclidean Geometry',
    summary: 'Move from inductive reasoning to formal proof via similarity, congruence, analytic geometry, and transformational approaches.',
    focus: 'Translate visual intuition into precise deductive arguments supported by coordinate and vector tools.',
    color: '#60a5fa',
    defaultView: 'notes',
  },
  {
    id: 'algebra-2',
    name: 'Algebra II & Functions',
    summary: 'Master quadratic, polynomial, rational, exponential, and logarithmic families while exploring inverse relationships and complex arithmetic.',
    focus: 'Strengthen manipulation of advanced functions through multi-representation analysis and technology-supported investigations.',
    color: '#34d399',
    defaultView: 'flashcards',
  },
  {
    id: 'trigonometry',
    name: 'Trigonometry Essentials',
    summary: 'Construct the unit-circle framework, prove identities, and apply sinusoidal models across mechanics, waves, and engineering contexts.',
    focus: 'Internalize circular reasoning and transform identities to solve multi-step analytic and applied problems.',
    color: '#818cf8',
    defaultView: 'quizzes',
  },
  {
    id: 'precalculus',
    name: 'Precalculus & Advanced Functions',
    summary: 'Investigate composite, parametric, polar, and vector functions while extending sequences and limits toward calculus formalism.',
    focus: 'Orchestrate multi-representation modeling projects that transition smoothly into differential and integral thinking.',
    color: '#f97316',
    defaultView: 'concepts',
  },
  {
    id: 'calculus-ab',
    name: 'Calculus AB',
    summary: 'Build analysis-ready intuition for limits, derivatives, and definite integrals with FRQ-backed applications in optimization and accumulation.',
    focus: 'Blend conceptual reasoning with AP-style procedural proficiency through daily proof sketches and contextual modeling.',
    color: '#a855f7',
    defaultView: 'quizzes',
  },
  {
    id: 'calculus-bc',
    name: 'Calculus BC',
    summary: 'Extend calculus through Taylor series, differential equations, polar and parametric calculus, and advanced integration strategies.',
    focus: 'Solidify higher-level analysis with convergence proofs, power-series modeling, and sophisticated FRQ practice.',
    color: '#38bdf8',
    defaultView: 'flashcards',
  },
  {
    id: 'multivariable-calculus',
    name: 'Multivariable Calculus',
    summary: 'Generalize calculus to ℝ³ with partial derivatives, multiple integrals, and vector fields grounded in graphical intuition and applications.',
    focus: 'Develop spatial reasoning while mastering gradient, divergence, curl, and coordinate transformations for physical systems.',
    color: '#c084fc',
    defaultView: 'concepts',
  },
  {
    id: 'differential-equations',
    name: 'Differential Equations',
    summary: 'Solve first-order and linear systems, classify critical points, and deploy Laplace and numerical techniques for real-world models.',
    focus: 'Integrate analytic, qualitative, and computational methods to analyze continuous dynamical systems.',
    color: '#22d3ee',
    defaultView: 'quizzes',
  },
  {
    id: 'linear-algebra',
    name: 'Linear Algebra',
    summary: 'Study vector spaces, linear transformations, spectral theory, and decomposition techniques with geometric and computational perspectives.',
    focus: 'Bridge symbolic manipulation and visualization while preparing for advanced data science and theoretical work.',
    color: '#fb7185',
    defaultView: 'notes',
  },
  {
    id: 'probability-statistics',
    name: 'Probability & Statistics',
    summary: 'Develop rigorous mastery of probability, random variables, inference, and modeling using authentic data investigations.',
    focus: 'Craft defensible statistical arguments and simulations that translate uncertainty into actionable insights.',
    color: '#facc15',
    defaultView: 'analytics',
  },
  {
    id: 'discrete-math',
    name: 'Discrete Mathematics & Combinatorics',
    summary: 'Explore combinatorics, graph theory, recursion, and discrete optimization with emphasis on proof and algorithmic thinking.',
    focus: 'Accelerate problem-solving agility through contest-caliber reasoning and strategy toolkits.',
    color: '#fbbf24',
    defaultView: 'quizzes',
  },
  {
    id: 'number-theory',
    name: 'Number Theory',
    summary: 'Investigate divisibility, congruences, arithmetic functions, and Diophantine equations through proof-intensive study.',
    focus: 'Cultivate structural insight using classic theorems, research problems, and Olympiad-level explorations.',
    color: '#bef264',
    defaultView: 'notes',
  },
  {
    id: 'abstract-algebra',
    name: 'Abstract Algebra',
    summary: 'Construct a rigorous understanding of groups, rings, fields, and module theory with research-grade examples.',
    focus: 'Internalize algebraic structures via scaffolded proof portfolios and structure-preserving maps.',
    color: '#f472b6',
    defaultView: 'concepts',
  },
  {
    id: 'real-analysis',
    name: 'Real Analysis',
    summary: 'Formalize calculus with epsilon-delta proofs, metric analysis, uniform convergence, and Riemann/measure integration.',
    focus: 'Strengthen rigorous reasoning through counterexamples, detailed proof writing, and advanced problem sets.',
    color: '#f87171',
    defaultView: 'notes',
  },
  {
    id: 'topology',
    name: 'Topology',
    summary: 'Study topological spaces, continuity, compactness, and connectedness enriched with manifolds and product constructions.',
    focus: 'Balance geometric intuition and formal abstraction through visualization and proof projects.',
    color: '#34d399',
    defaultView: 'notes',
  },
  {
    id: 'math-contests',
    name: 'Math Contest Training',
    summary: 'Prepare for AMC/AIME/USAMO with curated problem sets, strategic frameworks, and creative solution dissections.',
    focus: 'Sharpen inventive reasoning under pressure with timed sprints and reflection-driven review.',
    color: '#fda4af',
    defaultView: 'quizzes',
  },
  {
    id: 'financial-math',
    name: 'Financial Mathematics',
    summary: 'Model uncertainty in markets through interest theory, annuities, duration, immunization, and risk metrics.',
    focus: 'Connect algebra, calculus, and statistics to financial decision-making via spreadsheet modeling and case studies.',
    color: '#16a34a',
    defaultView: 'analytics',
  },
  {
    id: 'math-modeling',
    name: 'Mathematical Modeling & Data Science',
    summary: 'Design end-to-end modeling pipelines incorporating optimization, regression, simulation, and sensitivity analysis.',
    focus: 'Translate messy, real-world questions into mathematical frameworks with iterative validation and storytelling.',
    color: '#0ea5e9',
    defaultView: 'concepts',
  },
];

const CourseCatalogContext = createContext(null);

export const CourseCatalogProvider = ({ children }) => {
  const [blueprintStatus, setBlueprintStatus] = useState({});
  const [joinedCourseIds, setJoinedCourseIds] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem('joinedCourseIds');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load joined courses from storage', error);
      return [];
    }
  });

  const [courseBlueprints, setCourseBlueprints] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = window.localStorage.getItem('workspaceCourseBlueprints');
      if (!stored) return {};
      const parsed = JSON.parse(stored);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (error) {
      console.warn('Failed to load course blueprints from storage', error);
      return {};
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('joinedCourseIds', JSON.stringify(joinedCourseIds));
    } catch (error) {
      console.warn('Failed to persist joined courses', error);
    }
  }, [joinedCourseIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem('workspaceCourseBlueprints', JSON.stringify(courseBlueprints));
    } catch (error) {
      console.warn('Failed to persist generated course blueprints', error);
    }
  }, [courseBlueprints]);

  useEffect(() => {
    setBlueprintStatus((prev) => {
      const next = { ...prev };
      Object.keys(courseBlueprints).forEach((courseId) => {
        if (next[courseId] !== 'ready') {
          next[courseId] = 'ready';
        }
      });
      return next;
    });
  }, [courseBlueprints]);

  const courseLookup = useMemo(() => {
    const map = new Map();
    COURSE_CATALOG.forEach((course) => map.set(course.id, course));
    return map;
  }, []);

  const joinedCourses = useMemo(
    () => joinedCourseIds.map((id) => courseLookup.get(id)).filter(Boolean),
    [joinedCourseIds, courseLookup]
  );

  const generateCourseBlueprint = useCallback(
    async (courseId) => {
      if (!courseId) return null;
      if (courseBlueprints[courseId]) return courseBlueprints[courseId];

      const course = courseLookup.get(courseId);
      if (!course) {
        console.warn('Attempted to generate course for unknown course id', courseId);
        return null;
      }

      setBlueprintStatus((prev) => ({ ...prev, [courseId]: 'loading' }));

      const prompt = `
You are an expert instructional designer creating an exhaustive self-study course outline for the following advanced mathematics course:
Course Name: ${course.name}
Course Summary: ${course.summary}
Primary Focus: ${course.focus}

Deliver a Markdown-formatted syllabus that includes:
1. A short inspirational course overview (2 paragraphs) highlighting why the course matters.
2. A table of prerequisite knowledge and quick-refresh resources.
3. A 6-8 module roadmap. For each module list:
   - Module theme and learning objectives
   - Core concepts and theorems
   - Signature problem types/projects
   - Suggested readings or video resources (use generic placeholders, no links needed)
4. Dedicated practice regimen suggestions (daily/weekly cadence with increasing difficulty).
5. Capstone project ideas integrating multiple modules.
6. Reflection prompts and self-assessment checklists.

Keep the tone motivating yet rigorous and assume the learner is aiming for competition or university-level mastery.`;

      try {
        const response = await chatCompletion(prompt);
        const content =
          response?.choices?.[0]?.message?.content ||
          response?.content ||
          'AI was unable to generate content. Please try again.';

        setCourseBlueprints((prev) => ({
          ...prev,
          [courseId]: content,
        }));
        setBlueprintStatus((prev) => ({ ...prev, [courseId]: 'ready' }));

        return content;
      } catch (error) {
        console.error(`Failed to generate course blueprint for ${courseId}`, error);
        setBlueprintStatus((prev) => ({ ...prev, [courseId]: 'error' }));
        throw error;
      }
    },
    [courseBlueprints, courseLookup]
  );

  const joinCourse = useCallback(
    (courseId) => {
      setJoinedCourseIds((prev) => {
        if (prev.includes(courseId)) return prev;
        return [...prev, courseId];
      });

      if (!courseBlueprints[courseId]) {
        generateCourseBlueprint(courseId).catch(() => {
          /* handled via status */
        });
      }
    },
    [courseBlueprints, generateCourseBlueprint]
  );

  const leaveCourse = useCallback((courseId) => {
    setJoinedCourseIds((prev) => {
      const updated = prev.filter((id) => id !== courseId);
      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({
      catalog: COURSE_CATALOG,
      joinedCourseIds,
      joinedCourses,
      joinCourse,
      leaveCourse,
      isJoined: (courseId) => joinedCourseIds.includes(courseId),
      getCourseById: (courseId) => courseLookup.get(courseId) || null,
      courseBlueprints,
      blueprintStatus,
      generateCourseBlueprint,
    }),
    [
      courseLookup,
      joinedCourseIds,
      joinedCourses,
      joinCourse,
      leaveCourse,
      courseBlueprints,
      blueprintStatus,
      generateCourseBlueprint,
    ]
  );

  return (
    <CourseCatalogContext.Provider value={value}>
      {children}
    </CourseCatalogContext.Provider>
  );
};

export const useCourseCatalog = () => {
  const context = useContext(CourseCatalogContext);
  if (!context) {
    throw new Error('useCourseCatalog must be used within a CourseCatalogProvider');
  }
  return context;
};


