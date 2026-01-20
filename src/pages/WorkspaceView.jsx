import React, { useEffect, useMemo, useState, useRef } from 'react';
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
import { chatCompletion, searchYouTubeVideos } from '../lib/api';
import { stripMarkdown } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToUserData, updateWorkspaceData, initializeUserData } from '../lib/localStorage';
import {
  Layers,
  Brain,
  CalendarRange,
  Sparkles,
  Loader2,
  RefreshCcw,
  BookOpenCheck,
  Target,
  Clock,
  TrendingUp,
  Award,
  FileText,
  BarChart3,
  PlayCircle,
  ExternalLink,
  GraduationCap,
  CheckCircle2,
  BookMarked,
  Lightbulb,
  Rocket,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CheckSquare,
} from 'lucide-react';

const DEFAULT_TOPICS = ['Key definitions and terminology', 'Core techniques and representative problems', 'Applications and extensions to explore next'];

const DEFAULT_TOOLKIT = [
  'Review the linked workspace tabs to assemble notes, flashcards, and quizzes.',
  'Use AI suggestions across tools to uncover prerequisite or enrichment material.',
];

const DEFAULT_PRACTICE = [
  'Set a 25-minute focused study block daily.',
  'Review mistakes and summarize insights after each practice session.',
];

const DESMOS_API_KEY = 'dcb31709b452b1cf9dc26972add0fda6'; // Standard Desmos API key for public use

const COURSE_INTRODUCTIONS = {
  'prealgebra': `Welcome to Pre-Algebra Foundations! This course serves as the essential bridge between arithmetic and algebra, preparing you for the formal mathematical thinking you'll need in higher-level courses.

In this course, you'll develop a strong foundation in working with integers, understanding ratios and proportional relationships, and mastering the fundamental operations that form the backbone of algebra. You'll learn to think symbolically and recognize patterns that will make algebra intuitive rather than intimidating.

Learning Objectives:
• Master operations with integers, fractions, and decimals
• Understand and apply ratios, proportions, and percentages
• Solve multi-step word problems using algebraic thinking
• Develop number sense and estimation skills
• Learn to work with variables and basic expressions
• Understand the order of operations and algebraic properties
• Build confidence in mathematical reasoning and problem-solving

By the end of this course, you'll have automated your number sense while establishing the structural habits required for formal algebra. You'll be able to manipulate numbers fluently and approach algebraic problems with confidence.

Prerequisites: Basic arithmetic skills (addition, subtraction, multiplication, division) and familiarity with fractions and decimals.

Course Structure: This course is organized into modules that progressively build your algebraic thinking, starting with number operations and moving toward symbolic manipulation and problem-solving strategies.`,

  'algebra-1': `Welcome to Algebra I Foundations! This course is where mathematics becomes truly powerful as you learn to model real-world situations using symbols, equations, and functions.

You'll develop deep fluency with linear models, functional notation, and multi-step inequalities. More importantly, you'll learn to see the connections between different representations of mathematical relationships—symbolic rules, tables, graphs, and real-world contexts.

Learning Objectives:
• Master linear equations and inequalities in one and two variables
• Understand and work with functions, including function notation
• Graph linear functions and interpret their real-world meaning
• Solve systems of linear equations using multiple methods
• Model real-world situations with linear functions
• Work with exponents and exponential functions
• Develop algebraic manipulation skills and problem-solving strategies

This course will help you synthesize connections between symbolic rules, tables, and graphs to model real-world phenomena. You'll learn to think algebraically and see mathematics as a tool for understanding the world around you.

Prerequisites: Strong foundation in pre-algebra, including operations with integers, fractions, and basic equation solving.

Course Structure: Organized into modules covering linear relationships, systems, functions, and modeling, with each module building on previous concepts.`,

  'geometry': `Welcome to Euclidean Geometry! This course takes you from visual intuition to formal mathematical proof, developing your ability to reason deductively and construct rigorous arguments.

You'll move from inductive reasoning to formal proof through the study of similarity, congruence, analytic geometry, and transformational approaches. Geometry is where mathematics becomes visual and where you'll learn to think both spatially and logically.

Learning Objectives:
• Master geometric proofs using deductive reasoning
• Understand and apply properties of triangles, quadrilaterals, and circles
• Work with similarity, congruence, and transformations
• Apply coordinate geometry to solve geometric problems
• Understand and use geometric constructions
• Develop spatial reasoning and visualization skills
• Learn to translate visual intuition into precise mathematical arguments

This course will help you translate visual intuition into precise deductive arguments supported by coordinate and vector tools. You'll develop both geometric intuition and logical reasoning skills.

Prerequisites: Strong foundation in algebra, including solving equations and working with formulas.

Course Structure: Organized into modules covering basic geometric concepts, proofs, similarity and congruence, circles, coordinate geometry, and transformations.`,

  'algebra-2': `Welcome to Algebra II & Functions! This course expands your algebraic toolkit significantly, introducing you to advanced function families and preparing you for precalculus and calculus.

You'll master quadratic, polynomial, rational, exponential, and logarithmic functions while exploring inverse relationships and complex arithmetic. This course strengthens your ability to manipulate advanced functions through multi-representation analysis.

Learning Objectives:
• Master quadratic functions and their applications
• Understand polynomial functions, including factoring and graphing
• Work with rational functions and their asymptotes
• Explore exponential and logarithmic functions
• Understand inverse functions and their properties
• Work with complex numbers and operations
• Develop advanced algebraic manipulation skills
• Model real-world situations with advanced functions

This course will strengthen your manipulation of advanced functions through multi-representation analysis and technology-supported investigations. You'll see how different types of functions model different real-world phenomena.

Prerequisites: Strong foundation in Algebra I, including linear functions, systems of equations, and basic function concepts.

Course Structure: Organized into modules covering quadratics, polynomials, rational functions, exponentials and logarithms, and complex numbers, with emphasis on connections between algebraic and graphical representations.`,

  'trigonometry': `Welcome to Trigonometry Essentials! This course introduces you to the circular functions that are fundamental to understanding periodic phenomena, waves, and many applications in science and engineering.

You'll construct the unit-circle framework, prove identities, and apply sinusoidal models across mechanics, waves, and engineering contexts. Trigonometry connects geometry, algebra, and calculus in beautiful ways.

Learning Objectives:
• Master the unit circle and trigonometric functions
• Understand and apply trigonometric identities
• Solve trigonometric equations
• Work with inverse trigonometric functions
• Apply trigonometry to right triangles and the Law of Sines/Cosines
• Model periodic phenomena with sinusoidal functions
• Understand polar coordinates and their applications
• Connect trigonometry to complex numbers and calculus

This course will help you internalize circular reasoning and transform identities to solve multi-step analytic and applied problems. You'll see how trigonometry appears throughout mathematics and science.

Prerequisites: Strong foundation in Algebra II, including functions, graphing, and algebraic manipulation.

Course Structure: Organized into modules covering the unit circle, trigonometric functions, identities, equations, applications, and connections to other mathematical areas.`,

  'precalculus': `Welcome to Precalculus & Advanced Functions! This course serves as the crucial bridge between algebra and calculus, preparing you for the formal study of limits, derivatives, and integrals.

You'll investigate composite, parametric, polar, and vector functions while extending sequences and limits toward calculus formalism. This course orchestrates multi-representation modeling projects that transition smoothly into differential and integral thinking.

Learning Objectives:
• Master composite and inverse functions
• Understand parametric and polar representations
• Work with vectors and their applications
• Explore sequences and series, including convergence
• Understand limits and continuity conceptually
• Model complex situations with advanced functions
• Develop mathematical maturity and proof skills
• Prepare for the formal study of calculus

This course will help you orchestrate multi-representation modeling projects that transition smoothly into differential and integral thinking. You'll develop the mathematical maturity needed for calculus.

Prerequisites: Strong foundation in Algebra II and Trigonometry, including all function types and trigonometric concepts.

Course Structure: Organized into modules covering advanced functions, vectors, sequences and series, limits, and preparation for calculus, with emphasis on mathematical modeling.`,

  'calculus-ab': `Welcome to Calculus AB! This course introduces you to one of the most powerful and beautiful branches of mathematics, where you'll learn to analyze change and accumulation.

You'll build analysis-ready intuition for limits, derivatives, and definite integrals with FRQ-backed applications in optimization and accumulation. Calculus is the mathematics of change, and you'll learn to use it to solve real-world problems.

Learning Objectives:
• Understand limits and continuity rigorously
• Master differentiation, including all derivative rules
• Apply derivatives to optimization and related rates problems
• Understand the Fundamental Theorem of Calculus
• Master integration techniques and applications
• Apply integrals to area, volume, and accumulation problems
• Develop conceptual understanding alongside procedural fluency
• Prepare for AP Calculus AB exam with FRQ practice

This course will help you blend conceptual reasoning with AP-style procedural proficiency through daily proof sketches and contextual modeling. You'll see how calculus connects to everything from physics to economics.

Prerequisites: Strong foundation in Precalculus, including functions, trigonometry, and limits concepts.

Course Structure: Organized into modules covering limits, derivatives, applications of derivatives, integrals, and applications of integrals, with AP exam preparation throughout.`,

  'calculus-bc': `Welcome to Calculus BC! This advanced course extends calculus through Taylor series, differential equations, polar and parametric calculus, and advanced integration strategies.

You'll solidify higher-level analysis with convergence proofs, power-series modeling, and sophisticated FRQ practice. This course takes you beyond the basics of calculus into more advanced topics that are essential for STEM fields.

Learning Objectives:
• Master advanced integration techniques
• Understand and apply Taylor and Maclaurin series
• Work with polar and parametric calculus
• Solve differential equations analytically and numerically
• Understand convergence and divergence of series
• Apply advanced calculus to complex modeling problems
• Develop rigorous mathematical reasoning
• Prepare for AP Calculus BC exam with advanced FRQ practice

This course will help you solidify higher-level analysis with convergence proofs, power-series modeling, and sophisticated FRQ practice. You'll develop the mathematical sophistication needed for advanced STEM courses.

Prerequisites: Strong foundation in Calculus AB, including all basic differentiation and integration concepts.

Course Structure: Organized into modules covering advanced integration, series, polar/parametric calculus, differential equations, and advanced applications, with BC exam preparation throughout.`,

  'multivariable-calculus': `Welcome to Multivariable Calculus! This course generalizes calculus to three dimensions and beyond, opening up new ways to model and understand the physical world.

You'll generalize calculus to ℝ³ with partial derivatives, multiple integrals, and vector fields grounded in graphical intuition and applications. This course develops spatial reasoning while mastering gradient, divergence, curl, and coordinate transformations for physical systems.

Learning Objectives:
• Master partial derivatives and the chain rule in multiple variables
• Understand gradients, directional derivatives, and optimization
• Work with multiple integrals in various coordinate systems
• Understand vector fields, line integrals, and surface integrals
• Master Green's, Stokes', and the Divergence Theorem
• Apply multivariable calculus to physics and engineering problems
• Develop strong spatial reasoning and visualization skills
• Connect multivariable concepts to real-world applications

This course will help you develop spatial reasoning while mastering gradient, divergence, curl, and coordinate transformations for physical systems. You'll see how calculus extends naturally to higher dimensions.

Prerequisites: Strong foundation in single-variable calculus, including all differentiation and integration techniques.

Course Structure: Organized into modules covering functions of multiple variables, partial derivatives, multiple integrals, vector calculus, and applications to physics and engineering.`,

  'differential-equations': `Welcome to Differential Equations! This course teaches you to model and solve problems involving rates of change, which appear throughout science, engineering, and mathematics.

You'll solve first-order and linear systems, classify critical points, and deploy Laplace and numerical techniques for real-world models. Differential equations are the language of change, and you'll learn to speak it fluently.

Learning Objectives:
• Solve first-order differential equations analytically
• Understand and solve linear differential equations
• Classify and analyze critical points and stability
• Apply Laplace transforms to solve differential equations
• Use numerical methods for systems that can't be solved analytically
• Model real-world phenomena with differential equations
• Understand systems of differential equations
• Connect differential equations to calculus and linear algebra

This course will help you integrate analytic, qualitative, and computational methods to analyze continuous dynamical systems. You'll see how differential equations model everything from population growth to electrical circuits.

Prerequisites: Strong foundation in calculus, including integration techniques, and familiarity with linear algebra concepts.

Course Structure: Organized into modules covering first-order equations, linear equations, systems, Laplace transforms, numerical methods, and applications to modeling.`,

  'linear-algebra': `Welcome to Linear Algebra! This course introduces you to one of the most important and widely applicable branches of mathematics, essential for data science, computer graphics, and many other fields.

You'll study vector spaces, linear transformations, spectral theory, and decomposition techniques with geometric and computational perspectives. Linear algebra provides the mathematical foundation for understanding high-dimensional data and transformations.

Learning Objectives:
• Master vector spaces and subspaces
• Understand linear transformations and their properties
• Work with matrices, including operations and inverses
• Master eigenvalues, eigenvectors, and diagonalization
• Understand orthogonality and least squares
• Apply linear algebra to data science and machine learning
• Develop geometric intuition for abstract concepts
• Connect linear algebra to calculus and differential equations

This course will help you bridge symbolic manipulation and visualization while preparing for advanced data science and theoretical work. You'll see how linear algebra appears throughout mathematics and its applications.

Prerequisites: Strong foundation in algebra, including systems of equations, and familiarity with vectors from precalculus or physics.

Course Structure: Organized into modules covering vectors and matrices, vector spaces, linear transformations, eigenvalues and eigenvectors, orthogonality, and applications.`,

  'probability-statistics': `Welcome to Probability & Statistics! This course teaches you to make sense of uncertainty and data, skills that are essential in our data-driven world.

You'll develop rigorous mastery of probability, random variables, inference, and modeling using authentic data investigations. Statistics is the science of learning from data, and you'll learn to do it correctly and meaningfully.

Learning Objectives:
• Master probability theory and conditional probability
• Understand random variables and their distributions
• Work with sampling distributions and the Central Limit Theorem
• Perform statistical inference, including hypothesis testing
• Construct and interpret confidence intervals
• Apply regression analysis to model relationships
• Design experiments and studies properly
• Communicate statistical findings clearly and accurately

This course will help you craft defensible statistical arguments and simulations that translate uncertainty into actionable insights. You'll learn to think critically about data and avoid common statistical pitfalls.

Prerequisites: Strong foundation in algebra, including functions and graphing, and familiarity with basic probability concepts.

Course Structure: Organized into modules covering probability, random variables, sampling, inference, regression, and experimental design, with emphasis on real data analysis.`,

  'discrete-math': `Welcome to Discrete Mathematics & Combinatorics! This course explores the mathematics of discrete structures, which is fundamental to computer science, cryptography, and many areas of modern mathematics.

You'll explore combinatorics, graph theory, recursion, and discrete optimization with emphasis on proof and algorithmic thinking. Discrete mathematics is the mathematics of computers and counting, and you'll learn to think combinatorially.

Learning Objectives:
• Master counting principles and combinatorics
• Understand graph theory and its applications
• Work with recursion and recurrence relations
• Explore discrete optimization problems
• Develop proof techniques specific to discrete mathematics
• Apply discrete math to computer science problems
• Understand algorithms and their analysis
• Build problem-solving agility through contest-caliber reasoning

This course will help you accelerate problem-solving agility through contest-caliber reasoning and strategy toolkits. You'll develop the mathematical thinking needed for computer science and competitive mathematics.

Prerequisites: Strong foundation in algebra and mathematical reasoning, including basic proof techniques.

Course Structure: Organized into modules covering combinatorics, graph theory, recursion, discrete optimization, and applications to computer science and competitive mathematics.`,

  'number-theory': `Welcome to Number Theory! This course explores the beautiful and deep properties of integers, one of the oldest and most fundamental areas of mathematics.

You'll investigate divisibility, congruences, arithmetic functions, and Diophantine equations through proof-intensive study. Number theory combines elegance with depth, and you'll learn to appreciate both.

Learning Objectives:
• Master divisibility, primes, and the Fundamental Theorem of Arithmetic
• Understand modular arithmetic and congruences
• Work with arithmetic functions and their properties
• Solve Diophantine equations
• Understand and apply Fermat's Little Theorem and Euler's Theorem
• Explore quadratic residues and reciprocity
• Develop rigorous proof-writing skills
• Appreciate the beauty and structure of number theory

This course will help you cultivate structural insight using classic theorems, research problems, and Olympiad-level explorations. You'll see how simple questions about integers lead to deep mathematics.

Prerequisites: Strong foundation in algebra and mathematical proof, including familiarity with mathematical induction.

Course Structure: Organized into modules covering divisibility, primes, modular arithmetic, arithmetic functions, Diophantine equations, and advanced topics, with emphasis on proofs.`,

  'abstract-algebra': `Welcome to Abstract Algebra! This course introduces you to the study of algebraic structures, one of the most elegant and powerful areas of modern mathematics.

You'll construct a rigorous understanding of groups, rings, fields, and module theory with research-grade examples. Abstract algebra is about finding patterns and structure, and you'll learn to see mathematics in a new way.

Learning Objectives:
• Master group theory, including subgroups, cosets, and quotient groups
• Understand ring theory and field theory
• Work with homomorphisms and isomorphisms
• Explore module theory and its applications
• Develop sophisticated proof-writing skills
• Understand the classification of finite groups
• Connect abstract algebra to other areas of mathematics
• Appreciate the beauty of mathematical structure

This course will help you internalize algebraic structures via scaffolded proof portfolios and structure-preserving maps. You'll develop the mathematical maturity needed for advanced mathematics.

Prerequisites: Strong foundation in linear algebra and mathematical proof, including familiarity with groups from previous courses.

Course Structure: Organized into modules covering groups, rings, fields, modules, and advanced topics, with emphasis on proofs and examples.`,

  'real-analysis': `Welcome to Real Analysis! This course provides the rigorous foundation for calculus, developing the formal theory behind the concepts you learned in calculus.

You'll formalize calculus with epsilon-delta proofs, metric analysis, uniform convergence, and Riemann/measure integration. Real analysis is where calculus becomes rigorous mathematics, and you'll learn to think with precision.

Learning Objectives:
• Master epsilon-delta proofs and limits
• Understand continuity, differentiability, and integrability rigorously
• Work with sequences and series, including convergence
• Explore metric spaces and topology
• Understand uniform convergence and its implications
• Master Riemann integration and measure theory
• Develop rigorous mathematical reasoning
• Connect analysis to calculus and other areas of mathematics

This course will help you strengthen rigorous reasoning through counterexamples, detailed proof writing, and advanced problem sets. You'll develop the mathematical precision needed for advanced mathematics.

Prerequisites: Strong foundation in calculus and mathematical proof, including familiarity with limits and continuity.

Course Structure: Organized into modules covering the real numbers, sequences and series, continuity, differentiation, integration, and metric spaces, with emphasis on rigorous proofs.`,

  'topology': `Welcome to Topology! This course introduces you to the study of shape and space, one of the most abstract and beautiful areas of modern mathematics.

You'll study topological spaces, continuity, compactness, and connectedness enriched with manifolds and product constructions. Topology is geometry without distance, and you'll learn to think about shape in fundamentally new ways.

Learning Objectives:
• Master topological spaces and their properties
• Understand continuity in topological terms
• Work with compactness and connectedness
• Explore manifolds and their properties
• Understand product spaces and quotient spaces
• Develop geometric intuition for abstract concepts
• Connect topology to analysis and geometry
• Appreciate the beauty of abstract mathematical structure

This course will help you balance geometric intuition and formal abstraction through visualization and proof projects. You'll see how topology connects to many areas of mathematics.

Prerequisites: Strong foundation in real analysis and mathematical proof, including familiarity with metric spaces.

Course Structure: Organized into modules covering topological spaces, continuity, compactness, connectedness, manifolds, and advanced topics, with emphasis on both intuition and rigor.`,

  'math-contests': `Welcome to Math Contest Training! This course prepares you for competitive mathematics, including AMC, AIME, and USAMO, by developing your problem-solving skills and mathematical creativity.

You'll prepare for AMC/AIME/USAMO with curated problem sets, strategic frameworks, and creative solution dissections. Competitive mathematics is about thinking creatively under pressure, and you'll learn to do both.

Learning Objectives:
• Master problem-solving strategies and techniques
• Develop creative mathematical thinking
• Work efficiently under time pressure
• Understand common contest problem types and patterns
• Build a toolkit of problem-solving strategies
• Practice with authentic contest problems
• Develop mathematical intuition and pattern recognition
• Learn to communicate solutions clearly and elegantly

This course will help you sharpen inventive reasoning under pressure with timed sprints and reflection-driven review. You'll develop the skills needed to excel in competitive mathematics.

Prerequisites: Strong foundation across all areas of mathematics, including algebra, geometry, number theory, and combinatorics.

Course Structure: Organized into modules covering different contest topics, problem-solving strategies, timed practice sessions, and solution analysis, with emphasis on authentic contest problems.`,
};

export const WorkspaceView = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const {
    joinedCourses,
    courseBlueprints,
    blueprintStatus,
    generateCourseBlueprint,
    courseWorkspaceData,
    generateCourseWorkspaceData,
    courseYouTubeVideos,
    generateCourseYouTubeVideos,
  } = useCourseCatalog();

  const [highlightCourseId, setHighlightCourseId] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem('workspaceLastCourse');
    } catch {
      return null;
    }
  });

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [moduleDetailedContent, setModuleDetailedContent] = useState(() => {
    if (typeof window === 'undefined') return {};
    if (!currentUser) {
      try {
        const stored = window.localStorage.getItem('moduleDetailedContent');
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
    return {};
  });
  const [loadingModules, setLoadingModules] = useState({});
  const [courseIntroduction, setCourseIntroduction] = useState({});
  const [moduleVideos, setModuleVideos] = useState(() => {
    if (typeof window === 'undefined') return {};
    if (!currentUser) {
      try {
        const stored = window.localStorage.getItem('moduleVideos');
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const isInitialLoadRef = useRef(true);
  const lastSaveTimeRef = useRef(0);
  const isUpdatingRef = useRef(false);

  // Initialize and subscribe to Firebase when user logs in
  useEffect(() => {
    if (!currentUser) {
      // Load from localStorage if not logged in
      try {
        const stored = window.localStorage.getItem('moduleDetailedContent');
        if (stored) setModuleDetailedContent(JSON.parse(stored));
        const storedVideos = window.localStorage.getItem('moduleVideos');
        if (storedVideos) setModuleVideos(JSON.parse(storedVideos));
        const storedExpanded = window.localStorage.getItem('expandedModules');
        if (storedExpanded) setExpandedModules(JSON.parse(storedExpanded));
      } catch (error) {
        console.warn('Failed to load module content from storage', error);
      }
      return;
    }

    const initializeAndSubscribe = async () => {
      try {
        // Initialize user data if needed
        await initializeUserData(currentUser.uid, {
          email: currentUser.email,
          displayName: currentUser.displayName,
        });

        // Subscribe to real-time updates
        const unsubscribe = subscribeToUserData(currentUser.uid, (userData) => {
          if (userData && userData.workspace) {
            // Only update if this is initial load or if we haven't saved recently
            if (isInitialLoadRef.current) {
              setModuleDetailedContent(userData.workspace.moduleDetailedContent || {});
              setModuleVideos(userData.workspace.moduleVideos || {});
              setExpandedModules(userData.workspace.expandedModules || {});
              isInitialLoadRef.current = false;
            } else {
              const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
              if (!isUpdatingRef.current && timeSinceLastSave > 2000) {
                setModuleDetailedContent(userData.workspace.moduleDetailedContent || {});
                setModuleVideos(userData.workspace.moduleVideos || {});
                setExpandedModules(userData.workspace.expandedModules || {});
              }
            }
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error initializing workspace data:', error);
        return () => {};
      }
    };

    let unsubscribe;
    initializeAndSubscribe().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
      isInitialLoadRef.current = true;
    };
  }, [currentUser]);

  // Persist to Firebase or localStorage (consolidated and debounced)
  useEffect(() => {
    // Skip if initial load
    if (isInitialLoadRef.current && currentUser) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (currentUser) {
        isUpdatingRef.current = true;
        lastSaveTimeRef.current = Date.now();
        updateWorkspaceData(currentUser.uid, {
          moduleDetailedContent,
          moduleVideos,
          expandedModules,
        })
          .then(() => {
            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 1000);
          })
          .catch((error) => {
            console.error('Failed to update workspace data in Firebase:', error);
            isUpdatingRef.current = false;
          });
      } else {
        // Fallback to localStorage
        try {
          window.localStorage.setItem('moduleDetailedContent', JSON.stringify(moduleDetailedContent));
          window.localStorage.setItem('moduleVideos', JSON.stringify(moduleVideos));
          window.localStorage.setItem('expandedModules', JSON.stringify(expandedModules));
        } catch (error) {
          console.warn('Failed to persist workspace data', error);
        }
      }
    }, 500); // Debounce by 500ms

    return () => clearTimeout(timeoutId);
  }, [moduleDetailedContent, moduleVideos, expandedModules, currentUser]);

  const getCourseIntroduction = (course) => {
    const introKey = course.id;
    
    // Use premade introduction if available
    const premadeIntro = COURSE_INTRODUCTIONS[introKey];
    if (premadeIntro) {
      const intro = {
        content: premadeIntro,
        generatedAt: Date.now(),
      };
      
      // Store in state if not already there
      if (!courseIntroduction[introKey]) {
        setCourseIntroduction((prev) => ({
          ...prev,
          [introKey]: intro,
        }));
      }
      
      return intro;
    }
    
    // Fallback to stored introduction if exists
    if (courseIntroduction[introKey]) {
      return courseIntroduction[introKey];
    }
    
    return null;
  };

  const generateModuleDetailedContent = async (course, module, moduleIndex) => {
    const contentKey = `${course.id}-${moduleIndex}`;
    
    if (moduleDetailedContent[contentKey]) return moduleDetailedContent[contentKey];

    setLoadingModules((prev) => ({ ...prev, [contentKey]: true }));
    
    try {
      // Optimized shorter prompt for faster generation
      const moduleTopics = module.items.slice(0, 5).join(', ');
      const prompt = `Create a concise mathematics lesson module.

Course: ${course.name}
Module: ${module.title || `Module ${moduleIndex + 1}`}
Key Topics: ${moduleTopics}

Provide content in this exact format (keep each section brief - 2-3 sentences max):

OVERVIEW: [2-3 sentences on what this covers and why it matters]

CONCEPTS: [List 3-4 key concepts, each in 1-2 sentences]

EXAMPLES: [2 worked examples, show steps briefly]

MISTAKES: [3 common errors with quick fixes]

PRACTICE: [2 specific study strategies]

APPLICATIONS: [2 real-world uses]

Keep responses concise. Use plain text, separate sections with blank lines.`;

      const response = await chatCompletion(prompt);
      const content = stripMarkdown(
        response?.choices?.[0]?.message?.content ||
        response?.content ||
        'Unable to generate module content.'
      );

      const detailedContent = {
        content,
        generatedAt: Date.now(),
      };

      setModuleDetailedContent((prev) => ({
        ...prev,
        [contentKey]: detailedContent,
      }));

      return detailedContent;
    } catch (error) {
      console.error('Failed to generate module content', error);
      // Provide fallback content immediately instead of error
      const fallbackContent = {
        content: `OVERVIEW: This module covers ${module.title || `Module ${moduleIndex + 1}`} in ${course.name}. Understanding these concepts is essential for success in this course.

CONCEPTS: ${module.items.slice(0, 4).map((item, idx) => `${idx + 1}. ${item}`).join('\n')}

EXAMPLES: Work through practice problems step-by-step, showing all algebraic manipulations.

MISTAKES: Common errors include calculation mistakes and misunderstanding key definitions. Review examples carefully.

PRACTICE: Practice daily with varied problems. Review mistakes systematically.

APPLICATIONS: These concepts apply to advanced topics and real-world problem solving.`,
        generatedAt: Date.now(),
        error: false,
      };
      
      setModuleDetailedContent((prev) => ({
        ...prev,
        [contentKey]: fallbackContent,
      }));
      
      return fallbackContent;
    } finally {
      setLoadingModules((prev) => ({ ...prev, [contentKey]: false }));
    }
  };

  const fetchModuleVideos = async (course, module, moduleIndex) => {
    const moduleKey = `${course.id}-${moduleIndex}`;
    
    // Return if videos already exist
    if (moduleVideos[moduleKey]) return moduleVideos[moduleKey];

    try {
      const searchQuery = `${course.name} ${module.title || `Module ${moduleIndex + 1}`} ${module.items.slice(0, 3).join(' ')}`;
      const videos = await searchYouTubeVideos(searchQuery, 3);
      
      setModuleVideos((prev) => ({
        ...prev,
        [moduleKey]: videos,
      }));
      
      return videos;
    } catch (error) {
      console.error('Failed to fetch module videos', error);
      return [];
    }
  };

  const toggleModule = async (course, module, moduleIndex) => {
    const moduleKey = `${course.id}-${moduleIndex}`;
    const isExpanded = expandedModules[moduleKey];
    
    setExpandedModules((prev) => ({
      ...prev,
      [moduleKey]: !isExpanded,
    }));

    // Generate content and fetch videos when expanding
    if (!isExpanded) {
      if (!moduleDetailedContent[moduleKey]) {
        await generateModuleDetailedContent(course, module, moduleIndex);
      }
      if (!moduleVideos[moduleKey]) {
        await fetchModuleVideos(course, module, moduleIndex);
      }
    }
  };

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
      // Generate workspace data if not present
      if (!courseWorkspaceData[course.id] && status !== 'loading') {
        generateCourseWorkspaceData(course.id).catch(() => {
          /* status handled in context */
        });
      }
      // Generate blueprint if not present
      if (!courseBlueprints[course.id] && status !== 'loading') {
        generateCourseBlueprint(course.id).catch(() => {
          /* status handled in context */
        });
      }
      // Generate YouTube videos if not present
      if (!courseYouTubeVideos[course.id]) {
        generateCourseYouTubeVideos(course.id).catch(() => {
          /* handled silently */
        });
      }
      // Get course introduction (premade, no generation needed)
      if (!courseIntroduction[course.id]) {
        getCourseIntroduction(course);
      }
    });
  }, [joinedCourses, courseBlueprints, courseWorkspaceData, courseYouTubeVideos, courseIntroduction, blueprintStatus, generateCourseBlueprint, generateCourseWorkspaceData, generateCourseYouTubeVideos]);

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
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
        <h1 className="text-3xl font-semibold">Course Workspace</h1>
        <p className="text-muted-foreground max-w-2xl">
          Every joined course gets a dedicated workspace outlining what to study, which tools to lean on, and a suggested weekly cadence.
          Use these plans to stay organized and dive deeper into each math track.
        </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {sortedCourses.map((course) => {
          const workspaceData = courseWorkspaceData[course.id];
          const status = blueprintStatus[course.id];
          const isLoading = status === 'loading' && !workspaceData;
          const topics = workspaceData?.topics || DEFAULT_TOPICS;
          const toolkit = workspaceData?.toolkit || DEFAULT_TOOLKIT;
          const practice = workspaceData?.practice || DEFAULT_PRACTICE;
          const youtubeVideos = courseYouTubeVideos[course.id] || [];

          return (
            <Card
              key={course.id}
              className={[
                'flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 border-2',
                course.id === highlightCourseId ? 'ring-2 ring-primary/60 border-primary/30' : 'border-border/50',
              ].join(' ')}
            >
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md"
                        style={{ backgroundColor: course.color }}
                      >
                        {course.name.charAt(0)}
                      </div>
                  <div>
                        <CardTitle as="h2" className="text-2xl font-bold">
                      {course.name}
                    </CardTitle>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                            {course.defaultView.toUpperCase()} Focus
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            Active Course
                          </span>
                  </div>
                      </div>
                    </div>
                    <CardDescription className="text-base leading-relaxed">
                      {course.summary}
                    </CardDescription>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <Target className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Primary Focus</p>
                        <p className="text-sm text-muted-foreground">{course.focus}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-8 flex-1 py-6">
                {/* Course Introduction Section */}
                <section className="space-y-4">
                  <header className="flex items-center gap-2 text-xl font-bold text-foreground pb-3 border-b-2 border-primary/30">
                    <GraduationCap className="h-6 w-6 text-primary" />
                    Course Introduction & Objectives
                  </header>
                  {(() => {
                    const intro = getCourseIntroduction(course);
                    if (!intro) {
                      return (
                        <div className="rounded-lg border border-dashed border-border/50 p-6 text-center text-muted-foreground">
                          <p>Introduction will be available shortly...</p>
                        </div>
                      );
                    }
                    
                    return (
                    <div className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 space-y-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {intro.content.split('\n\n').map((paragraph, idx) => {
                          const trimmed = paragraph.trim();
                          if (!trimmed) return null;
                          
                          // Check if it's a list of objectives
                          if (trimmed.toLowerCase().includes('objective') || trimmed.toLowerCase().includes('learning goal')) {
                            return (
                              <div key={idx} className="space-y-2">
                                <h4 className="text-base font-semibold text-foreground mb-2">{trimmed.split(':')[0]}</h4>
                                {trimmed.split(':')[1] && (
                                  <ul className="space-y-1.5 ml-4">
                                    {trimmed.split(':')[1].split('\n').filter(l => l.trim()).map((item, itemIdx) => (
                                      <li key={itemIdx} className="flex items-start gap-2 text-sm text-foreground">
                                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                        <span>{item.trim().replace(/^[-*•]\s*/, '')}</span>
                                      </li>
                    ))}
                  </ul>
                                )}
                              </div>
                            );
                          }
                          
                          return (
                            <p key={idx} className="text-sm text-foreground leading-relaxed mb-3">
                              {trimmed}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                    );
                  })()}
                </section>

                {/* Course Modules Section - Expandable */}
                <section className="space-y-4">
                  <header className="flex items-center gap-2 text-xl font-bold text-foreground pb-3 border-b-2 border-primary/30">
                    <BookMarked className="h-6 w-6 text-primary" />
                    Course Modules
                  </header>
                    {(() => {
                      const status = blueprintStatus[course.id];
                    const blueprint = courseBlueprints[course.id];
                    
                    if (status === 'loading' || !blueprint) {
                        return (
                        <div className="flex items-center justify-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-8">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span className="text-base">Generating course modules…</span>
                          </div>
                        );
                      }
                    
                    // Parse blueprint to extract modules
                    const parseBlueprint = (content) => {
                      if (!content) return { modules: [] };
                      
                      const lines = content.split('\n');
                      const modules = [];
                      let currentModule = null;
                      let inModule = false;
                      
                      lines.forEach((line) => {
                        const trimmed = line.trim();
                        const lower = trimmed.toLowerCase();
                        
                        if (lower.includes('module') || lower.includes('unit') || lower.includes('week') || /^#+\s*(module|unit|week)/i.test(trimmed)) {
                          if (currentModule) modules.push(currentModule);
                          currentModule = { 
                            title: trimmed.replace(/^#+\s*/, '').replace(/module\s*\d*:?\s*/i, '').trim() || `Module ${modules.length + 1}`, 
                            items: [] 
                          };
                          inModule = true;
                          return;
                        }
                        
                        if (inModule && currentModule) {
                          if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
                            currentModule.items.push(trimmed.replace(/^[-*\d+\.]\s*/, ''));
                          } else if (trimmed && !trimmed.startsWith('#') && trimmed.length > 10) {
                            currentModule.items.push(trimmed);
                          }
                        }
                      });
                      
                      if (currentModule) modules.push(currentModule);
                      return { modules };
                    };
                    
                    const parsed = parseBlueprint(blueprint);
                    
                    if (parsed.modules.length === 0) {
                        return (
                        <div className="rounded-lg border border-dashed border-border/50 p-6 text-center text-muted-foreground">
                          <p>Modules will appear here once generated...</p>
                            </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-3">
                        {parsed.modules.map((module, idx) => {
                          const moduleKey = `${course.id}-${idx}`;
                          const isExpanded = expandedModules[moduleKey];
                          const moduleContent = moduleDetailedContent[moduleKey];
                          const isLoading = loadingModules[moduleKey];
                          const videos = moduleVideos[moduleKey] || [];
                          
                          return (
                            <div
                              key={idx}
                              className="rounded-lg border-2 border-border/50 bg-muted/10 overflow-hidden transition-all"
                            >
                              {/* Module Header - Clickable */}
                              <button
                                onClick={() => toggleModule(course, module, idx)}
                                className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition-colors text-left"
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg font-bold text-primary">{idx + 1}</span>
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-lg font-bold text-foreground mb-1">
                                      {module.title || `Module ${idx + 1}`}
                                    </h3>
                                    {module.items.length > 0 && (
                                      <p className="text-sm text-muted-foreground line-clamp-1">
                                        {module.items[0]}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {isLoading && (
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                  )}
                                  {isExpanded ? (
                                    <ChevronUp className="h-5 w-5 text-primary" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                              </button>
                              
                              {/* Expanded Content */}
                              {isExpanded && (
                                <div className="border-t border-border/50 bg-background">
                                  {isLoading ? (
                                    <div className="flex items-center justify-center gap-3 p-8">
                                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                      <span className="text-base">Generating detailed content…</span>
                                    </div>
                                  ) : moduleContent?.error ? (
                                    <div className="p-6 rounded-lg border border-destructive/40 bg-destructive/5 text-destructive">
                                      <p>{moduleContent.content}</p>
                                    </div>
                                  ) : moduleContent ? (
                                    <div className="p-6 space-y-6">
                                      {/* Parse and display content in sections */}
                                      {moduleContent.content.split(/\n{2,}/).map((section, sectionIdx) => {
                                        const trimmed = section.trim();
                                        if (!trimmed) return null;
                                        
                                        // Check if it's a section header
                                        const isHeader = trimmed.split('\n')[0].length < 100 && 
                                                       (trimmed.split('\n')[0].includes(':') || 
                                                        trimmed.split('\n')[0].toLowerCase().includes('overview') ||
                                                        trimmed.split('\n')[0].toLowerCase().includes('concept') ||
                                                        trimmed.split('\n')[0].toLowerCase().includes('example') ||
                                                        trimmed.split('\n')[0].toLowerCase().includes('mistake') ||
                                                        trimmed.split('\n')[0].toLowerCase().includes('practice') ||
                                                        trimmed.split('\n')[0].toLowerCase().includes('application'));
                                        
                                        if (isHeader) {
                                          const [header, ...content] = trimmed.split('\n');
                                          return (
                                            <div key={sectionIdx} className="space-y-3">
                                              <h4 className="text-base font-semibold text-foreground pb-2 border-b border-primary/20">
                                                {header.replace(/:/g, '')}
                                              </h4>
                                              <div className="space-y-2 pl-4">
                                                {content.filter(l => l.trim()).map((line, lineIdx) => {
                                                  const lineTrimmed = line.trim();
                                                  if (lineTrimmed.startsWith('-') || lineTrimmed.startsWith('*')) {
                                                    return (
                                                      <div key={lineIdx} className="flex items-start gap-2">
                                                        <span className="text-primary mt-1.5 flex-shrink-0">•</span>
                                                        <p className="text-sm text-foreground leading-relaxed flex-1">
                                                          {lineTrimmed.substring(2)}
                                                        </p>
                          </div>
                        );
                      }
                        return (
                                                    <p key={lineIdx} className="text-sm text-foreground leading-relaxed">
                                                      {lineTrimmed}
                                                    </p>
                                                  );
                                                })}
                                              </div>
                          </div>
                        );
                      }
                                        
                                        // Regular content
                      return (
                                          <div key={sectionIdx} className="space-y-2">
                                            {trimmed.split('\n').map((line, lineIdx) => {
                                              const lineTrimmed = line.trim();
                                              if (!lineTrimmed) return null;
                                              
                                              if (lineTrimmed.startsWith('-') || lineTrimmed.startsWith('*')) {
                        return (
                                                  <div key={lineIdx} className="flex items-start gap-2 pl-4">
                                                    <span className="text-primary mt-1.5 flex-shrink-0">•</span>
                                                    <p className="text-sm text-foreground leading-relaxed flex-1">
                                                      {lineTrimmed.substring(2)}
                                                    </p>
                          </div>
                        );
                      }
                                              
                      return (
                                                <p key={lineIdx} className="text-sm text-foreground leading-relaxed">
                                                  {lineTrimmed}
                                                </p>
                                              );
                                            })}
                                          </div>
                                        );
                                      })}
                                      
                                      {/* YouTube Videos Section */}
                                      {videos.length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-border/50">
                                          <div className="flex items-center gap-2 mb-4">
                                            <PlayCircle className="h-5 w-5 text-primary" />
                                            <h4 className="text-base font-semibold text-foreground">
                                              Recommended Videos for This Topic
                                            </h4>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {videos.map((video) => (
                                              <div
                                                key={video.id}
                                                className="rounded-lg border border-border/50 bg-muted/10 overflow-hidden hover:bg-muted/20 transition-colors cursor-pointer"
                                                onClick={() => setSelectedVideo(video)}
                                              >
                                                <div className="relative aspect-video bg-muted">
                                                  <img
                                                    src={video.thumbnail}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover"
                                                  />
                                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                                                    <PlayCircle className="h-12 w-12 text-white" />
                                                  </div>
                                                </div>
                                                <div className="p-3">
                                                  <h5 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                                                    {video.title}
                                                  </h5>
                                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {video.channelTitle}
                                                  </p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="p-6 text-center text-muted-foreground">
                                      <p>Click to generate detailed content</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        </div>
                      );
                    })()}
                </section>

                {/* Weekly Routine Section */}
                <section className="space-y-4">
                  <header className="flex items-center gap-2 text-xl font-bold text-foreground pb-3 border-b-2 border-primary/30">
                    <CalendarRange className="h-6 w-6 text-primary" />
                    Weekly Study Routine
                  </header>
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-8">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-base">Generating study routine…</span>
                  </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {practice.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 hover:from-primary/15 hover:to-primary/10 transition-all shadow-sm"
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-sm text-foreground leading-relaxed font-medium flex-1">{item}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Quiz Button Section */}
                <section className="space-y-4">
                  <header className="flex items-center gap-2 text-xl font-bold text-foreground pb-3 border-b-2 border-primary/30">
                    <CheckSquare className="h-6 w-6 text-primary" />
                    Test Your Knowledge
                  </header>
                  <div className="rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Test Yourself?</h3>
                        <p className="text-sm text-muted-foreground">
                          Take a quiz to assess your understanding of this course material.
                        </p>
                      </div>
                      <Button
                        onClick={() => onNavigate && onNavigate('quiz')}
                        className="flex items-center gap-2"
                        size="lg"
                      >
                        <CheckSquare className="h-5 w-5" />
                        Start Quiz
                      </Button>
                    </div>
                  </div>
                </section>

                {/* YouTube Videos Section */}
                <section className="space-y-4 pt-4 border-t-2 border-primary/30">
                  <header className="flex items-center gap-2 text-xl font-bold text-foreground pb-3 border-b-2 border-primary/30">
                    <PlayCircle className="h-6 w-6 text-primary" />
                    Recommended YouTube Videos
                  </header>
                  {youtubeVideos.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Loading video recommendations…</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {youtubeVideos.map((video) => (
                        <button
                          key={video.id}
                          onClick={() => setSelectedVideo(video)}
                          className="group block w-full text-left rounded-lg border border-border/50 bg-muted/10 hover:bg-muted/20 hover:border-primary/30 transition-all overflow-hidden cursor-pointer"
                        >
                          <div className="relative aspect-video bg-muted/30">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <PlayCircle className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-16 w-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/80 transition-colors">
                                <PlayCircle className="h-10 w-10 text-white" />
                              </div>
                            </div>
                          </div>
                          <div className="p-3 space-y-1">
                            <h4 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                              {video.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {video.channelTitle}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-primary mt-2">
                              <PlayCircle className="h-3 w-3" />
                              <span>Play Video</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                {/* Video Modal */}
                {selectedVideo && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setSelectedVideo(null)}
                  >
                    <div
                      className="relative w-full max-w-4xl bg-background rounded-lg shadow-2xl overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative aspect-video bg-black">
                        <iframe
                          src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&rel=0`}
                          title={selectedVideo.title}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="p-4 border-t border-border/50">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {selectedVideo.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {selectedVideo.channelTitle}
                        </p>
                        <div className="flex items-center justify-between">
                          <a
                            href={selectedVideo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>Open on YouTube</span>
                          </a>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedVideo(null)}
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-border/50 bg-muted/10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border/50">
                  <CalendarRange className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Default Workspace</p>
                      <p className="text-sm font-semibold text-foreground">{course.defaultView.charAt(0).toUpperCase() + course.defaultView.slice(1)}</p>
                    </div>
                  </div>
                </div>
                {course.defaultView && (
                    <Button
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
                    className="inline-flex items-center gap-2"
                    >
                    Open {course.defaultView.charAt(0).toUpperCase() + course.defaultView.slice(1)} Workspace
                    </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

    </div>
  );
};


