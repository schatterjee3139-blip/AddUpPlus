import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

const EQUATIONS = [
  // Algebra
  {
    id: 'algebra-quadratic-formula',
    category: 'Algebra',
    name: 'Quadratic Formula',
    expression: 'x = [-b ± √(b² - 4ac)] / (2a)',
    description: 'Solves ax² + bx + c = 0 for real or complex roots.',
    keywords: ['roots', 'quadratic', 'polynomial'],
  },
  {
    id: 'algebra-binomial-theorem',
    category: 'Algebra',
    name: 'Binomial Theorem',
    expression: '(a + b)^n = Σ_{k=0}^{n} [n choose k] · a^{n-k} · b^k',
    description: 'Expands powers of binomials using combinations.',
    keywords: ['expansion', 'combinatorics', 'choose'],
  },
  {
    id: 'algebra-sum-geometric-series',
    category: 'Algebra',
    name: 'Finite Geometric Series',
    expression: 'S_n = a₁ · (1 - r^n) / (1 - r),    r ≠ 1',
    description: 'Sum of the first n terms of a geometric progression.',
    keywords: ['series', 'progression'],
  },
  {
    id: 'algebra-log-product',
    category: 'Algebra',
    name: 'Logarithm Product Rule',
    expression: 'log_b(MN) = log_b(M) + log_b(N)',
    description: 'Converts logarithm of a product to a sum.',
    keywords: ['log', 'properties'],
  },
  {
    id: 'algebra-cubic-formula',
    category: 'Algebra',
    name: 'Cardano’s Formula (Cubic)',
    expression: 'x = u + v,   u³ = -q/2 + √(Δ),   v³ = -q/2 - √(Δ)',
    description: 'General solution for depressed cubic x³ + px + q = 0.',
    keywords: ['cubic', 'roots'],
  },
  {
    id: 'algebra-system-cramers',
    category: 'Algebra',
    name: "Cramer's Rule (2×2)",
    expression: 'x = (e·d - b·f) / (a·d - b·c),   y = (a·f - e·c) / (a·d - b·c)',
    description: 'Solves a pair of linear equations using determinants.',
    keywords: ['linear system', 'determinant'],
  },
  // Geometry
  {
    id: 'geometry-circle-area',
    category: 'Geometry',
    name: 'Area of a Circle',
    expression: 'A = πr²',
    description: 'Area enclosed by a circle of radius r.',
    keywords: ['area', 'circle'],
  },
  {
    id: 'geometry-triangle-heron',
    category: 'Geometry',
    name: "Heron's Formula",
    expression: 'A = √[s(s - a)(s - b)(s - c)],    s = (a + b + c)/2',
    description: 'Area of a triangle from side lengths a, b, c.',
    keywords: ['triangle', 'area'],
  },
  {
    id: 'geometry-distance-3d',
    category: 'Geometry',
    name: 'Distance in 3D Space',
    expression: 'd = √[(x₂ - x₁)² + (y₂ - y₁)² + (z₂ - z₁)²]',
    description: 'Distance between two points in ℝ³.',
    keywords: ['distance', 'space'],
  },
  {
    id: 'geometry-sphere-volume',
    category: 'Geometry',
    name: 'Volume of a Sphere',
    expression: 'V = (4/3)πr³',
    description: 'Volume enclosed by a sphere of radius r.',
    keywords: ['volume', 'sphere'],
  },
  {
    id: 'geometry-cylinder-lateral',
    category: 'Geometry',
    name: 'Lateral Surface of a Cylinder',
    expression: 'A_L = 2πrh',
    description: 'Area of the curved surface of a right cylinder.',
    keywords: ['surface area', 'cylinder'],
  },
  {
    id: 'geometry-ellipse-area',
    category: 'Geometry',
    name: 'Area of an Ellipse',
    expression: 'A = πab',
    description: 'Area for ellipse with semi-axes a and b.',
    keywords: ['ellipse', 'area'],
  },
  // Trigonometry
  {
    id: 'trig-pythagorean',
    category: 'Trigonometry',
    name: 'Pythagorean Identity',
    expression: 'sin²θ + cos²θ = 1',
    description: 'Fundamental relationship between sine and cosine.',
    keywords: ['identity', 'basic'],
  },
  {
    id: 'trig-angle-sum-sin',
    category: 'Trigonometry',
    name: 'Sine Angle Sum',
    expression: 'sin(α + β) = sinα cosβ + cosα sinβ',
    description: 'Expands sine of a sum of angles.',
    keywords: ['angle sum', 'identity'],
  },
  {
    id: 'trig-angle-difference-cos',
    category: 'Trigonometry',
    name: 'Cosine Angle Difference',
    expression: 'cos(α - β) = cosα cosβ + sinα sinβ',
    description: 'Expands cosine of a difference of angles.',
    keywords: ['angle difference', 'identity'],
  },
  {
    id: 'trig-law-sines',
    category: 'Trigonometry',
    name: 'Law of Sines',
    expression: 'a / sinA = b / sinB = c / sinC',
    description: 'Relates side lengths to angles in any triangle.',
    keywords: ['triangle', 'law', 'sine'],
  },
  {
    id: 'trig-law-cosines',
    category: 'Trigonometry',
    name: 'Law of Cosines',
    expression: 'c² = a² + b² - 2ab cosC',
    description: 'Generalized Pythagorean theorem for any triangle.',
    keywords: ['triangle', 'cosine'],
  },
  {
    id: 'trig-double-angle',
    category: 'Trigonometry',
    name: 'Double-Angle for Sine',
    expression: 'sin(2θ) = 2 sinθ cosθ',
    description: 'Relates sine of double angle to single angle values.',
    keywords: ['double angle', 'identity'],
  },
  // Calculus
  {
    id: 'calculus-derivative-power',
    category: 'Calculus',
    name: 'Power Rule (Derivative)',
    expression: 'd/dx [x^n] = n · x^{n-1}',
    description: 'Differentiation rule for power functions.',
    keywords: ['derivative', 'power rule'],
  },
  {
    id: 'calculus-integral-power',
    category: 'Calculus',
    name: 'Power Rule (Integral)',
    expression: '∫ x^n dx = x^{n+1} / (n + 1) + C,   n ≠ -1',
    description: 'Integration rule for power functions.',
    keywords: ['integral', 'power rule'],
  },
  {
    id: 'calculus-fundamental-theorem',
    category: 'Calculus',
    name: 'Fundamental Theorem of Calculus (Part 1)',
    expression: 'd/dx ∫_{a}^{x} f(t) dt = f(x)',
    description: 'Differentiating an integral returns the integrand.',
    keywords: ['ftc', 'integral', 'derivative'],
  },
  {
    id: 'calculus-product-rule',
    category: 'Calculus',
    name: 'Product Rule',
    expression: 'd/dx [u · v] = u′v + uv′',
    description: 'Derivative of a product of two functions.',
    keywords: ['derivative', 'product'],
  },
  {
    id: 'calculus-chain-rule',
    category: 'Calculus',
    name: 'Chain Rule',
    expression: 'd/dx [f(g(x))] = f′(g(x)) · g′(x)',
    description: 'Derivative of a composite function.',
    keywords: ['derivative', 'composition'],
  },
  {
    id: 'calculus-integration-by-parts',
    category: 'Calculus',
    name: 'Integration by Parts',
    expression: '∫ u dv = uv - ∫ v du',
    description: 'Transforms products inside integrals.',
    keywords: ['integral', 'technique'],
  },
  {
    id: 'calculus-taylor-series',
    category: 'Calculus',
    name: 'Taylor Series (about a)',
    expression: 'f(x) = Σ_{n=0}^{∞} [f^{(n)}(a) / n!] · (x - a)^n',
    description: 'Series representation of smooth functions.',
    keywords: ['series', 'approximation'],
  },
  {
    id: 'calculus-definite-integral-substitution',
    category: 'Calculus',
    name: 'u-Substitution (Definite)',
    expression: '∫_{a}^{b} f(g(x)) g′(x) dx = ∫_{g(a)}^{g(b)} f(u) du',
    description: 'Changes variables in definite integrals.',
    keywords: ['integral', 'substitution'],
  },
  // Differential Equations
  {
    id: 'ode-first-order-linear',
    category: 'Differential Equations',
    name: 'First-Order Linear Solution',
    expression: 'y(x) = e^{-∫P(x) dx} [ ∫ Q(x) e^{∫P(x) dx} dx + C ]',
    description: 'Solves dy/dx + P(x)y = Q(x) via integrating factor.',
    keywords: ['ode', 'integrating factor'],
  },
  {
    id: 'ode-second-order-homogeneous',
    category: 'Differential Equations',
    name: 'Second-Order Linear Homogeneous',
    expression: 'y = c₁ e^{r₁x} + c₂ e^{r₂x}',
    description: 'Solution when characteristic equation has distinct roots.',
    keywords: ['ode', 'characteristic'],
  },
  {
    id: 'ode-critically-damped',
    category: 'Differential Equations',
    name: 'Critically Damped Solution',
    expression: 'y = (c₁ + c₂ x) e^{rx}',
    description: 'Solution when characteristic roots are repeated.',
    keywords: ['differential', 'damping'],
  },
  {
    id: 'ode-logistic-growth',
    category: 'Differential Equations',
    name: 'Logistic Growth Model',
    expression: 'P(t) = K / [1 + A e^{-rt}]',
    description: 'Population growth with carrying capacity K.',
    keywords: ['logistic', 'modeling'],
  },
  // Linear Algebra
  {
    id: 'linear-algebra-dot-product',
    category: 'Linear Algebra',
    name: 'Dot Product',
    expression: 'u · v = Σ_{i=1}^{n} u_i v_i = ||u|| ||v|| cosθ',
    description: 'Measures alignment of two vectors.',
    keywords: ['vectors', 'inner product'],
  },
  {
    id: 'linear-algebra-cross-product',
    category: 'Linear Algebra',
    name: 'Cross Product',
    expression: 'u × v = (u₂v₃ - u₃v₂, u₃v₁ - u₁v₃, u₁v₂ - u₂v₁)',
    description: 'Vector orthogonal to u and v in ℝ³.',
    keywords: ['vectors', 'perpendicular'],
  },
  {
    id: 'linear-algebra-determinant-3x3',
    category: 'Linear Algebra',
    name: 'Determinant of 3×3 Matrix',
    expression: 'det(A) = a(ei - fh) - b(di - fg) + c(dh - eg)',
    description: 'Expands determinant of 3×3 matrix A.',
    keywords: ['determinant', 'matrix'],
  },
  {
    id: 'linear-algebra-eigenvalues',
    category: 'Linear Algebra',
    name: 'Eigenvalue Equation',
    expression: 'A v = λ v,   det(A - λI) = 0',
    description: 'Condition for eigenvalues and eigenvectors.',
    keywords: ['eigenvalues', 'matrix'],
  },
  {
    id: 'linear-algebra-projection',
    category: 'Linear Algebra',
    name: 'Projection onto a Vector',
    expression: 'proj_u(v) = [(v · u)/(u · u)] · u',
    description: 'Component of v in the direction of u.',
    keywords: ['projection', 'vectors'],
  },
  // Probability & Statistics
  {
    id: 'stats-mean',
    category: 'Probability & Statistics',
    name: 'Arithmetic Mean',
    expression: 'μ = (1/n) Σ_{i=1}^{n} x_i',
    description: 'Average of n observations.',
    keywords: ['mean', 'average'],
  },
  {
    id: 'stats-variance',
    category: 'Probability & Statistics',
    name: 'Population Variance',
    expression: 'σ² = (1/n) Σ_{i=1}^{n} (x_i - μ)²',
    description: 'Dispersion of values around the mean.',
    keywords: ['variance', 'spread'],
  },
  {
    id: 'stats-standard-deviation',
    category: 'Probability & Statistics',
    name: 'Standard Deviation',
    expression: 'σ = √σ²',
    description: 'Square root of variance.',
    keywords: ['spread', 'dispersion'],
  },
  {
    id: 'stats-bayes',
    category: 'Probability & Statistics',
    name: "Bayes' Theorem",
    expression: 'P(A|B) = [P(B|A) · P(A)] / P(B)',
    description: 'Updates probability of A after observing B.',
    keywords: ['conditional', 'probability'],
  },
  {
    id: 'stats-normal-distribution',
    category: 'Probability & Statistics',
    name: 'Normal Density Function',
    expression: 'f(x) = (1/(σ√(2π))) · e^{-(x - μ)² / (2σ²)}',
    description: 'Probability density of N(μ, σ²).',
    keywords: ['normal', 'gaussian'],
  },
  {
    id: 'stats-central-limit',
    category: 'Probability & Statistics',
    name: 'Central Limit Theorem (informal)',
    expression: 'Σ_{i=1}^{n} X_i ≈ N(nμ, nσ²) for large n',
    description: 'Sum of iid variables approximates a normal distribution.',
    keywords: ['clt', 'approximation'],
  },
  {
    id: 'stats-chebyshev',
    category: 'Probability & Statistics',
    name: "Chebyshev's Inequality",
    expression: 'P(|X - μ| ≥ kσ) ≤ 1 / k²',
    description: 'Probability bound for deviations from the mean.',
    keywords: ['inequality', 'probability'],
  },
  // Number Theory
  {
    id: 'number-theory-eulers-totient',
    category: 'Number Theory',
    name: "Euler's Totient Formula",
    expression: 'φ(n) = n ∏_{p|n} (1 - 1/p)',
    description: 'Counts integers ≤ n that are coprime to n.',
    keywords: ['totient', 'phi function'],
  },
  {
    id: 'number-theory-fermat-little',
    category: 'Number Theory',
    name: "Fermat's Little Theorem",
    expression: 'a^{p-1} ≡ 1 (mod p),   p prime, p ∤ a',
    description: 'Power congruence modulo a prime.',
    keywords: ['modular', 'congruence'],
  },
  {
    id: 'number-theory-chinese-remainder',
    category: 'Number Theory',
    name: 'Chinese Remainder Theorem',
    expression: 'x ≡ a_i (mod m_i) has unique solution mod M = ∏ m_i',
    description: 'Solves simultaneous congruences with coprime moduli.',
    keywords: ['congruence', 'system'],
  },
  {
    id: 'number-theory-quadratic-residue',
    category: 'Number Theory',
    name: 'Quadratic Reciprocity (symbolic)',
    expression: '(p/q)(q/p) = (-1)^{(p-1)(q-1)/4}',
    description: 'Relates quadratic residues of odd primes p and q.',
    keywords: ['residue', 'legendre symbol'],
  },
  // Complex Analysis & Vector Calculus
  {
    id: 'complex-eulers-formula',
    category: 'Complex Analysis & Vector Calculus',
    name: "Euler's Formula",
    expression: 'e^{iθ} = cosθ + i sinθ',
    description: 'Links complex exponentials with trigonometry.',
    keywords: ['complex', 'exponential'],
  },
  {
    id: 'complex-cauchy-integral',
    category: 'Complex Analysis & Vector Calculus',
    name: "Cauchy's Integral Formula",
    expression: 'f(a) = (1 / 2πi) ∮ [f(z) / (z - a)] dz',
    description: 'Evaluates analytic functions via contour integrals.',
    keywords: ['complex', 'integral'],
  },
  {
    id: 'vector-stokes-theorem',
    category: 'Complex Analysis & Vector Calculus',
    name: "Stokes' Theorem",
    expression: '∮_{∂S} F · dr = ∬_{S} (∇ × F) · n dS',
    description: 'Relates circulation around boundary to curl over surface.',
    keywords: ['vector calculus', 'curl'],
  },
  {
    id: 'vector-divergence-theorem',
    category: 'Complex Analysis & Vector Calculus',
    name: 'Divergence Theorem',
    expression: '∭_{V} (∇ · F) dV = ∬_{∂V} F · n dS',
    description: 'Flux of a vector field equals volume integral of divergence.',
    keywords: ['vector calculus', 'flux'],
  },
  {
    id: 'vector-gradient',
    category: 'Complex Analysis & Vector Calculus',
    name: 'Gradient',
    expression: '∇f = (∂f/∂x, ∂f/∂y, ∂f/∂z)',
    description: 'Vector of partial derivatives for scalar field f.',
    keywords: ['gradient', 'partial derivative'],
  },
  {
    id: 'vector-green-theorem',
    category: 'Complex Analysis & Vector Calculus',
    name: "Green's Theorem",
    expression: '∮_{C} (L dx + M dy) = ∬_{D} (∂M/∂x - ∂L/∂y) dA',
    description: 'Converts a line integral around C to double integral over D.',
    keywords: ['green', 'plane'],
  },
];

const groupEquations = (data) => {
  return data.reduce((acc, equation) => {
    if (!acc[equation.category]) {
      acc[equation.category] = [];
    }
    acc[equation.category].push(equation);
    return acc;
  }, {});
};

export const EquationsView = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEquations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return EQUATIONS;
    }
    return EQUATIONS.filter((equation) => {
      const haystack = [
        equation.name,
        equation.expression,
        equation.description,
        ...(equation.keywords || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [searchTerm]);

  const grouped = useMemo(() => groupEquations(filteredEquations), [filteredEquations]);
  const categoryEntries = useMemo(
    () =>
      Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
    [grouped]
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Equations Library</h1>
        <p className="text-muted-foreground max-w-2xl">
          Browse a curated collection of foundational mathematics equations spanning algebra, geometry,
          trigonometry, calculus, statistics, and more. Use the search bar to jump directly to the formulas you
          need to review.
        </p>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search equations by name, expression, or topic..."
          className="w-full md:max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          Showing {filteredEquations.length} equation{filteredEquations.length === 1 ? '' : 's'}
        </div>
      </div>

      {categoryEntries.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No equations match your search.</CardTitle>
            <CardDescription>Try a different keyword or clear the filter to see the full library.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-6">
          {categoryEntries.map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
                <CardDescription>{items.length} formula{items.length === 1 ? '' : 's'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {items
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((equation) => (
                    <div
                      key={equation.id}
                      className="rounded-xl border border-border/60 bg-muted/20 p-4 shadow-sm hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{equation.name}</h3>
                          {equation.description && (
                            <p className="text-sm text-muted-foreground mt-1">{equation.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 overflow-x-auto">
                        <code className="block whitespace-pre text-sm md:text-base font-mono text-primary">
                          {equation.expression}
                        </code>
                      </div>
                      {equation.keywords && equation.keywords.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {equation.keywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="rounded-full border border-border/60 px-2 py-0.5 uppercase tracking-wide"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};


