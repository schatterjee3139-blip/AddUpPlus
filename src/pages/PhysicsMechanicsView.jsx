import React, { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

export const PhysicsMechanicsView = ({ onNavigate }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const models = [
    {
      id: 'orbital',
      title: '1. Orbital Mechanics',
      description: 'A planet in stable orbit around a star, governed by simulated gravity. Controls: Use the mouse to rotate the camera.',
    },
    {
      id: 'shm',
      title: '2. Simple Harmonic Motion (Spring)',
      description: 'A mass oscillating on a spring, demonstrating Y = A cos(ωt). Controls: Use the mouse to rotate the camera.',
    },
    {
      id: 'projectile',
      title: '3. Projectile Motion',
      description: 'A projectile fired at an angle, following a parabolic trajectory under constant gravity. Controls: Use the mouse to rotate the camera.',
    },
  ];

  useEffect(() => {
    if (!containerRef.current) {
      console.log('PhysicsMechanicsView: containerRef.current is null');
      return;
    }

    console.log('PhysicsMechanicsView: Initializing 3D scene...');

    // Load Three.js dynamically
    const loadThreeJS = async () => {
      if (window.THREE) {
        console.log('PhysicsMechanicsView: Three.js already loaded');
        initializeScene();
        return;
      }

      console.log('PhysicsMechanicsView: Loading Three.js from CDN...');
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => {
        console.log('PhysicsMechanicsView: Three.js loaded successfully');
        initializeScene();
      };
      script.onerror = (error) => {
        console.error('PhysicsMechanicsView: Failed to load Three.js', error);
      };
      document.head.appendChild(script);
    };

    const initializeScene = () => {
      if (!window.THREE) {
        console.error('PhysicsMechanicsView: THREE is not available');
        return;
      }
      if (!containerRef.current) {
        console.error('PhysicsMechanicsView: containerRef.current is null in initializeScene');
        return;
      }

      console.log('PhysicsMechanicsView: Initializing Three.js scene...');
      const THREE = window.THREE;
      
      // Make THREE available globally for the useEffect that depends on currentModelIndex
      if (!window.THREE_INSTANCE) {
        window.THREE_INSTANCE = THREE;
      }
      let scene, camera, renderer;
      let clock = new THREE.Clock();
      let currentAnimationId = null;
      let controls = {};

      // Constants
      const ORBIT_RADIUS = 5;
      const ORBIT_SPEED = 0.5;
      const AMPLITUDE = 4;
      const ANGULAR_FREQ = 2.0;
      const INITIAL_VELOCITY = 10;
      const LAUNCH_ANGLE_DEG = 60;
      const LAUNCH_ANGLE_RAD = LAUNCH_ANGLE_DEG * (Math.PI / 180);
      const GRAVITY = 9.81;

      // Model objects
      let sun, planet, orbitPivot, orbitLine;
      let mass, spring, support;
      let projectile, trailGroup;
      let timeSinceLaunch = 0;
      let isLaunched = false;

      // Initialize core
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      containerRef.current.appendChild(renderer.domElement);

      // Global lights
      const ambient = new THREE.AmbientLight(0x404040, 3);
      scene.add(ambient);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
      directionalLight.position.set(5, 10, 7.5);
      scene.add(directionalLight);

      // Custom mouse controls
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };
      const rotationSpeed = 0.005;
      const target = new THREE.Vector3(0, 0, 0);
      let cameraRadius = 15;
      let phi = Math.PI / 2;
      let theta = 0;

      function updateCameraPosition() {
        const x = cameraRadius * Math.sin(phi) * Math.cos(theta);
        const y = cameraRadius * Math.cos(phi);
        const z = cameraRadius * Math.sin(phi) * Math.sin(theta);
        camera.position.set(x, y, z);
        camera.lookAt(target);
      }

      renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition.x = e.clientX;
        previousMousePosition.y = e.clientY;
      });

      document.addEventListener('mouseup', () => {
        isDragging = false;
      });

      renderer.domElement.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        theta -= deltaX * rotationSpeed;
        phi -= deltaY * rotationSpeed;
        phi = Math.max(0.01, Math.min(Math.PI - 0.01, phi));
        previousMousePosition.x = e.clientX;
        previousMousePosition.y = e.clientY;
        updateCameraPosition();
      });

      renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        cameraRadius += e.deltaY * 0.01;
        cameraRadius = Math.max(5, Math.min(50, cameraRadius));
        updateCameraPosition();
      });

      controls = {
        resetRotation: () => {
          cameraRadius = 15;
          phi = Math.PI / 2;
          theta = 0;
          updateCameraPosition();
        },
      };

      // Orbital Mechanics
      function initOrbital() {
        camera.position.set(0, 7, 7);
        camera.lookAt(0, 0, 0);
        controls.resetRotation();

        const sunGeometry = new THREE.SphereGeometry(1, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfcb045 });
        sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);

        const planetGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const planetMaterial = new THREE.MeshLambertMaterial({ color: 0x228be6 });
        planet = new THREE.Mesh(planetGeometry, planetMaterial);

        orbitPivot = new THREE.Object3D();
        scene.add(orbitPivot);
        orbitPivot.add(planet);
        planet.position.set(ORBIT_RADIUS, 0, 0);

        const points = [];
        for (let i = 0; i <= 64; i++) {
          const angle = (i / 64) * Math.PI * 2;
          points.push(new THREE.Vector3(Math.cos(angle) * ORBIT_RADIUS, 0, Math.sin(angle) * ORBIT_RADIUS));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xaaaaaa, linewidth: 2 });
        orbitLine = new THREE.Line(geometry, material);
        scene.add(orbitLine);
        orbitLine.rotation.x = Math.PI / 2;
      }

      function animateOrbital(delta) {
        const scaledDelta = delta * simulationSpeedRef;
        orbitPivot.rotation.z += ORBIT_SPEED * scaledDelta;
        planet.rotation.y += 0.5 * scaledDelta;
        sun.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 0.5) * 0.1);
      }

      // Simple Harmonic Motion
      function initSHM() {
        camera.position.set(0, 0, 10);
        camera.lookAt(0, 0, 0);
        controls.resetRotation();

        const supportGeo = new THREE.BoxGeometry(5, 0.5, 0.5);
        const supportMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        support = new THREE.Mesh(supportGeo, supportMat);
        support.position.y = AMPLITUDE + 0.5;
        scene.add(support);

        const massGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const massMat = new THREE.MeshLambertMaterial({ color: 0xff4d6d });
        mass = new THREE.Mesh(massGeo, massMat);
        mass.position.y = 0;
        scene.add(mass);

        const springGeometry = new THREE.CylinderGeometry(0.2, 0.2, AMPLITUDE * 2, 8);
        const springMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc, wireframe: true });
        spring = new THREE.Mesh(springGeometry, springMaterial);
        spring.position.y = support.position.y - AMPLITUDE - 0.25;
        scene.add(spring);
      }

      function animateSHM(delta) {
        const time = clock.getElapsedTime() * simulationSpeedRef;
        const yPosition = AMPLITUDE * Math.cos(ANGULAR_FREQ * time);
        mass.position.y = yPosition;
        const springHeight = support.position.y - mass.position.y - 0.75;
        spring.scale.y = springHeight / (AMPLITUDE * 2);
        spring.position.y = mass.position.y + (springHeight / 2) + 0.75;
      }

      // Projectile Motion
      function initProjectile() {
        camera.position.set(10, 5, 15);
        camera.lookAt(0, 0, 0);
        controls.resetRotation();

        timeSinceLaunch = 0;
        isLaunched = true;

        const projGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const projMat = new THREE.MeshLambertMaterial({ color: 0xffa500 });
        projectile = new THREE.Mesh(projGeo, projMat);
        projectile.position.set(0, 0.5, 0);
        scene.add(projectile);

        const groundGeo = new THREE.PlaneGeometry(30, 30);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x38b000, side: THREE.DoubleSide });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        scene.add(ground);

        trailGroup = new THREE.Group();
        scene.add(trailGroup);

        drawPredictedPath();
      }

      function drawPredictedPath() {
        const pathMaterial = new THREE.LineBasicMaterial({ color: 0x0077ff, linewidth: 3 });
        const pathPoints = [];
        const maxTime = (2 * INITIAL_VELOCITY * Math.sin(LAUNCH_ANGLE_RAD)) / GRAVITY;
        const step = 0.1;

        for (let t = 0; t <= maxTime; t += step) {
          const x = INITIAL_VELOCITY * Math.cos(LAUNCH_ANGLE_RAD) * t;
          const y = (INITIAL_VELOCITY * Math.sin(LAUNCH_ANGLE_RAD) * t) - (0.5 * GRAVITY * t * t);
          pathPoints.push(new THREE.Vector3(x, y + 0.5, 0));
        }

        const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
        const pathLine = new THREE.Line(pathGeometry, pathMaterial);
        scene.add(pathLine);
      }

      function animateProjectile(delta) {
        const scaledDelta = delta * simulationSpeedRef;
        if (!isLaunched) return;

        timeSinceLaunch += scaledDelta;

        const vx = INITIAL_VELOCITY * Math.cos(LAUNCH_ANGLE_RAD);
        const vy0 = INITIAL_VELOCITY * Math.sin(LAUNCH_ANGLE_RAD);

        const x = vx * timeSinceLaunch;
        const y = (vy0 * timeSinceLaunch) - (0.5 * GRAVITY * timeSinceLaunch * timeSinceLaunch);

        projectile.position.set(x, y + 0.5, 0);

        if (timeSinceLaunch > 0 && Math.floor(timeSinceLaunch * 10) % 5 === 0) {
          const trailGeo = new THREE.SphereGeometry(0.1, 8, 8);
          const trailMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
          const trailDot = new THREE.Mesh(trailGeo, trailMat);
          trailDot.position.copy(projectile.position);
          trailGroup.add(trailDot);

          setTimeout(() => {
            trailDot.material.opacity = 0;
            trailDot.scale.setScalar(0.1);
            setTimeout(() => trailGroup.remove(trailDot), 1000);
          }, 500);
        }

        if (y < -0.5) {
          isLaunched = false;
          projectile.position.y = 0.5;
          setTimeout(() => {
            initProjectile();
          }, 2000);
        }
      }

      // Switch model function
      const switchModel = (direction) => {
        if (currentAnimationId) {
          cancelAnimationFrame(currentAnimationId);
        }

        while (scene.children.length > 0) {
          const child = scene.children[0];
          if (child.dispose) child.dispose();
          scene.remove(child);
        }

        const ambient = new THREE.AmbientLight(0x404040, 3);
        scene.add(ambient);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        setCurrentModelIndex((prevIndex) => {
          const newIndex = (prevIndex + direction + models.length) % models.length;
          currentModelIndexRef = newIndex; // Update ref
          clock.start();
          controls.resetRotation();

          if (newIndex === 0) initOrbital();
          else if (newIndex === 1) initSHM();
          else if (newIndex === 2) initProjectile();

          animate();
          return newIndex;
        });
      };

      // Animation loop
      function animate() {
        currentAnimationId = requestAnimationFrame(animate);
        const delta = clock.getDelta();

        if (currentModelIndexRef === 0) animateOrbital(delta);
        else if (currentModelIndexRef === 1) animateSHM(delta);
        else if (currentModelIndexRef === 2) animateProjectile(delta);

        renderer.render(scene, camera);
      }

      // Store functions for external use
      sceneRef.current = {
        switchModel,
        resetCamera: () => controls.resetRotation(),
        setSimulationSpeed: (speed) => { simulationSpeedRef = speed; },
        setCurrentModelIndex: (index) => { currentModelIndexRef = index; },
        cleanup: () => {
          if (currentAnimationId) {
            cancelAnimationFrame(currentAnimationId);
          }
          if (containerRef.current && renderer.domElement && containerRef.current.contains(renderer.domElement)) {
            containerRef.current.removeChild(renderer.domElement);
          }
          if (renderer) {
            renderer.dispose();
          }
        },
        scene,
        camera,
        renderer,
        clock,
        animate,
        initOrbital,
        initSHM,
        initProjectile,
        animateOrbital,
        animateSHM,
        animateProjectile,
      };

      // Initialize first model
      currentModelIndexRef = 0;
      initOrbital();
      clock.start();
      animate();
      
      setIsLoading(false);
      setError(null);
      console.log('PhysicsMechanicsView: Scene initialized successfully');

      // Handle resize
      const handleResize = () => {
        if (!containerRef.current) return;
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (currentAnimationId) {
          cancelAnimationFrame(currentAnimationId);
        }
        if (containerRef.current && renderer.domElement && containerRef.current.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement);
        }
        if (renderer) {
          renderer.dispose();
        }
      };
    };

    loadThreeJS().catch((err) => {
      console.error('PhysicsMechanicsView: Error loading Three.js', err);
      setError('Failed to load 3D graphics library. Please refresh the page.');
      setIsLoading(false);
    });
  }, []); // Only run once on mount

  // Update simulation speed when it changes
  useEffect(() => {
    if (sceneRef.current && sceneRef.current.setSimulationSpeed) {
      sceneRef.current.setSimulationSpeed(simulationSpeed);
    }
  }, [simulationSpeed]);

  // Handle model switching from UI (when currentModelIndex changes from button clicks)
  useEffect(() => {
    if (!sceneRef.current || !window.THREE || currentModelIndex === 0) return; // Skip initial render

    const THREE = window.THREE;
    const { scene, clock, initOrbital, initSHM, initProjectile, animate, resetCamera } = sceneRef.current;

    // Clear scene
    while (scene.children.length > 0) {
      const child = scene.children[0];
      if (child.dispose) child.dispose();
      scene.remove(child);
    }

    // Re-add lights
    const ambient = new THREE.AmbientLight(0x404040, 3);
    scene.add(ambient);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Initialize selected model
    clock.start();
    resetCamera();

    if (currentModelIndex === 0) initOrbital();
    else if (currentModelIndex === 1) initSHM();
    else if (currentModelIndex === 2) initProjectile();

    // Update ref for animation loop
    if (sceneRef.current.setCurrentModelIndex) {
      sceneRef.current.setCurrentModelIndex(currentModelIndex);
    }

    animate();
  }, [currentModelIndex]);

  const handlePrevious = () => {
    setCurrentModelIndex((prev) => (prev - 1 + models.length) % models.length);
  };

  const handleNext = () => {
    setCurrentModelIndex((prev) => (prev + 1) % models.length);
  };

  const handleReset = () => {
    if (sceneRef.current) {
      sceneRef.current.resetCamera();
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onNavigate && (
            <Button variant="ghost" size="sm" onClick={() => onNavigate('courses')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-semibold">Mechanics of Physics</h1>
            <p className="text-sm text-muted-foreground">Interactive 3D Physics Simulations</p>
            {error && (
              <p className="text-sm text-destructive mt-2">Error: {error}</p>
            )}
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{models[currentModelIndex].title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{models[currentModelIndex].description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevious}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-10">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Loading 3D graphics...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 rounded-lg z-10">
                <div className="text-white text-center p-4">
                  <p className="text-red-200 mb-2">{error}</p>
                  <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                    Reload Page
                  </Button>
                </div>
              </div>
            )}
            <div
              ref={containerRef}
              className="w-full bg-black rounded-lg overflow-hidden"
              style={{ 
                height: '600px', 
                minHeight: '600px', 
                position: 'relative',
                display: 'block'
              }}
            >
              {!isLoading && !error && containerRef.current && containerRef.current.children.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <p>Canvas container ready. Initializing 3D scene...</p>
                </div>
              )}
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm p-4 rounded-lg border shadow-lg flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="speed-slider" className="text-sm font-medium whitespace-nowrap">
                  Speed:
                </label>
                <input
                  type="range"
                  id="speed-slider"
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                  className="w-32 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-muted-foreground w-8">{simulationSpeed.toFixed(2)}x</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

