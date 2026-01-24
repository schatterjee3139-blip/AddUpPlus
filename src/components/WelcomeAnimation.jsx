import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const TOTAL_DURATION = 14;

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function getTextPoints(text, fontSize, yOffset, spacing) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 2000;
  canvas.height = 400;
  ctx.fillStyle = 'white';
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const points = [];
  for (let y = 0; y < canvas.height; y += spacing) {
    for (let x = 0; x < canvas.width; x += spacing) {
      const i = (y * canvas.width + x) * 4;
      if (imageData.data[i] > 128) {
        points.push({
          x: (x - canvas.width / 2) * 0.5,
          y: (-y + canvas.height / 2) * 0.5 + yOffset,
          z: (Math.random() - 0.5) * 15,
        });
      }
    }
  }
  return points;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function WelcomeAnimation({ onComplete }) {
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const nodesRef = useRef([]);
  const connectionsRef = useRef([]);
  const startTimeRef = useRef(Date.now());
  const currentMessageIndexRef = useRef(0);
  const statusElRef = useRef(null);
  const connCountElRef = useRef(null);
  const connectionCounterElRef = useRef(null);
  const restartBtnRef = useRef(null);
  const continueBtnRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const addupPoints = getTextPoints('ADDUP+', 180, 0, 7);
    const targetPositions = shuffle([...addupPoints]).slice(0, 900);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0515, 1);
    container.appendChild(renderer.domElement);
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    class NetworkNode {
      constructor(index, targetPos) {
        const colors = [0x7c3aed, 0xa78bfa, 0xc4b5fd, 0x8b5cf6, 0x9333ea];
        const size = Math.random() * 2 + 1;
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshPhongMaterial({
          color: colors[Math.floor(Math.random() * colors.length)],
          emissive: colors[Math.floor(Math.random() * colors.length)],
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0,
        });
        this.mesh = new THREE.Mesh(geometry, material);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 40 + Math.random() * 90;
        this.startPosition = new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );
        this.mesh.position.copy(this.startPosition);
        this.targetPosition = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
        this.morphDelay = Math.random() * 2.5;
        this.morphDuration = 3 + Math.random() * 2;
        this.fadeInStart = Math.random() * 2;
        this.fadeInDuration = 1 + Math.random();
        this.floatOffset = Math.random() * Math.PI * 2;
        this.floatSpeed = 0.3 + Math.random() * 0.4;
        this.floatAmount = 3 + Math.random() * 4;
      }
      update(elapsed, globalProgress) {
        const fadeProgress = smoothstep(this.fadeInStart, this.fadeInStart + this.fadeInDuration, elapsed);
        this.mesh.material.opacity = fadeProgress * 0.9;
        const morphStartTime = 4 + this.morphDelay;
        const morphEndTime = morphStartTime + this.morphDuration;
        const nodeMorphProgress = smoothstep(morphStartTime, morphEndTime, elapsed);
        const time = elapsed * this.floatSpeed + this.floatOffset;
        const floatScale = 1 - nodeMorphProgress * 0.85;
        const floatX = Math.sin(time) * this.floatAmount * floatScale;
        const floatY = Math.cos(time * 0.7) * this.floatAmount * floatScale;
        const floatZ = Math.sin(time * 0.5) * this.floatAmount * floatScale;
        this.mesh.position.lerpVectors(this.startPosition, this.targetPosition, easeInOutQuad(nodeMorphProgress));
        this.mesh.position.x += floatX;
        this.mesh.position.y += floatY;
        this.mesh.position.z += floatZ;
      }
    }

    class Connection {
      constructor(nodeA, nodeB, delay) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.delay = delay;
        this.drawProgress = 0;
        this.opacity = 0;
        this.maxOpacity = 0.15 + Math.random() * 0.1;
        this.drawSpeed = 0.02 + Math.random() * 0.03;
        this.fadeInSpeed = 0.01 + Math.random() * 0.005;
        const material = new THREE.LineBasicMaterial({
          color: 0xa78bfa,
          transparent: true,
          opacity: 0,
        });
        const geometry = new THREE.BufferGeometry();
        this.line = new THREE.Line(geometry, material);
      }
      update(elapsed) {
        if (elapsed < this.delay) return;
        this.drawProgress = Math.min(1, this.drawProgress + this.drawSpeed);
        this.opacity = Math.min(this.maxOpacity, this.opacity + this.fadeInSpeed);
        this.line.material.opacity = this.opacity;
        const startPos = this.nodeA.mesh.position;
        const endPos = this.nodeB.mesh.position;
        const easedProgress = easeOutQuart(this.drawProgress);
        const currentEnd = new THREE.Vector3().lerpVectors(startPos, endPos, easedProgress);
        const positions = new Float32Array([
          startPos.x, startPos.y, startPos.z,
          currentEnd.x, currentEnd.y, currentEnd.z,
        ]);
        this.line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      }
      updatePositions() {
        if (this.drawProgress > 0) {
          const startPos = this.nodeA.mesh.position;
          const endPos = this.nodeB.mesh.position;
          const easedProgress = easeOutQuart(this.drawProgress);
          const currentEnd = new THREE.Vector3().lerpVectors(startPos, endPos, easedProgress);
          const positions = new Float32Array([
            startPos.x, startPos.y, startPos.z,
            currentEnd.x, currentEnd.y, currentEnd.z,
          ]);
          this.line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        }
      }
    }

    const nodes = [];
    for (let i = 0; i < targetPositions.length; i++) {
      const node = new NetworkNode(i, targetPositions[i]);
      nodes.push(node);
      scene.add(node.mesh);
    }
    nodesRef.current = nodes;

    const maxConnections = 1600;
    const potentialConnections = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distStart = nodes[i].startPosition.distanceTo(nodes[j].startPosition);
        const distTarget = nodes[i].targetPosition.distanceTo(nodes[j].targetPosition);
        if (distStart < 40 || distTarget < 25) {
          potentialConnections.push({
            nodeA: nodes[i],
            nodeB: nodes[j],
            distance: Math.min(distStart, distTarget),
          });
        }
      }
    }
    potentialConnections.sort((a, b) => a.distance - b.distance);
    const connections = [];
    for (let i = 0; i < Math.min(potentialConnections.length, maxConnections); i++) {
      const pc = potentialConnections[i];
      const delay = 0.3 + (i / maxConnections) * 7.5;
      const connection = new Connection(pc.nodeA, pc.nodeB, delay);
      connections.push(connection);
      scene.add(connection.line);
    }
    connectionsRef.current = connections;

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    const pointLight1 = new THREE.PointLight(0xa78bfa, 2, 500);
    pointLight1.position.set(100, 100, 100);
    scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0x7c3aed, 2, 500);
    pointLight2.position.set(-100, -100, -100);
    scene.add(pointLight2);
    const pointLight3 = new THREE.PointLight(0xc4b5fd, 1.5, 400);
    pointLight3.position.set(0, 150, 50);
    scene.add(pointLight3);

    camera.position.set(0, 0, 70);

    const statusMessages = [
      { time: 1, text: 'INITIALIZING...' },
      { time: 3, text: 'CONNECTING NODES...' },
      { time: 6, text: 'BUILDING NETWORK...' },
      { time: 9, text: 'WELCOME BACK!' },
      { time: 11, text: '' },
    ];

    function getCameraState(t) {
      const zoomStart = 4;
      const zoomEnd = 12;
      const zoomProgress = smoothstep(zoomStart, zoomEnd, t);
      const distance = 70 + zoomProgress * 480;
      const orbitSpeed = 0.15 * (1 - zoomProgress * 0.7);
      const orbitAngle = t * orbitSpeed;
      const verticalAmount = 25 * (1 - zoomProgress * 0.9);
      const verticalOffset = Math.sin(t * 0.12) * verticalAmount;
      const x = Math.sin(orbitAngle) * distance * (1 - zoomProgress * 0.95);
      const z = Math.cos(orbitAngle) * distance * 0.3 + distance * 0.7;
      const y = verticalOffset + zoomProgress * 5;
      return { x, y, z };
    }

    function updateStatusMessage(elapsed) {
      const idx = currentMessageIndexRef.current;
      if (idx >= statusMessages.length) return;
      const msg = statusMessages[idx];
      if (elapsed >= msg.time) {
        const el = statusElRef.current;
        if (el) {
          if (msg.text) {
            el.textContent = msg.text;
            el.classList.add('visible');
          } else {
            el.classList.remove('visible');
          }
        }
        currentMessageIndexRef.current = idx + 1;
      }
    }

    function updateConnectionCounter() {
      const active = connections.filter((c) => c.drawProgress > 0).length;
      const el = connCountElRef.current;
      if (el) el.textContent = active;
    }

    function resetAnimation() {
      startTimeRef.current = Date.now();
      currentMessageIndexRef.current = 0;
      if (restartBtnRef.current) restartBtnRef.current.classList.remove('visible');
      if (continueBtnRef.current) continueBtnRef.current.classList.remove('visible');
      if (connectionCounterElRef.current) connectionCounterElRef.current.style.opacity = 1;
      if (connCountElRef.current) connCountElRef.current.textContent = '0';
      if (statusElRef.current) statusElRef.current.classList.remove('visible');
      nodes.forEach((node) => {
        node.mesh.material.opacity = 0;
        node.mesh.position.copy(node.startPosition);
      });
      connections.forEach((c) => {
        c.drawProgress = 0;
        c.opacity = 0;
        c.line.material.opacity = 0;
      });
      camera.position.set(0, 0, 70);
    }

    function animate() {
      animationRef.current = requestAnimationFrame(animate);
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const globalProgress = Math.min(1, elapsed / TOTAL_DURATION);
      nodes.forEach((node) => node.update(elapsed, globalProgress));
      connections.forEach((c) => {
        c.update(elapsed);
        c.updatePositions();
      });
      updateConnectionCounter();
      updateStatusMessage(elapsed);
      const counterOpacity = 1 - smoothstep(10, 12, elapsed);
      if (connectionCounterElRef.current) connectionCounterElRef.current.style.opacity = counterOpacity;
      const camState = getCameraState(elapsed);
      camera.position.set(camState.x, camState.y, camState.z);
      camera.lookAt(0, 0, 0);
      if (elapsed > 12) {
        if (restartBtnRef.current) restartBtnRef.current.classList.add('visible');
        if (continueBtnRef.current) continueBtnRef.current.classList.add('visible');
      }
      const lt = elapsed * 0.3;
      pointLight1.position.x = Math.sin(lt) * 150;
      pointLight1.position.y = Math.cos(lt * 0.7) * 100 + 50;
      pointLight2.position.x = Math.cos(lt * 0.8) * 150;
      pointLight2.position.z = Math.sin(lt * 0.6) * 150;
      renderer.render(scene, camera);
    }

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const handleRestart = () => {
      resetAnimation();
    };

    const handleContinue = () => {
      if (onCompleteRef.current) onCompleteRef.current();
    };

    const restartBtn = restartBtnRef.current;
    const continueBtn = continueBtnRef.current;
    if (restartBtn) restartBtn.addEventListener('click', handleRestart);
    if (continueBtn) continueBtn.addEventListener('click', handleContinue);

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      if (restartBtn) restartBtn.removeEventListener('click', handleRestart);
      if (continueBtn) continueBtn.removeEventListener('click', handleContinue);
      renderer.dispose();
      container.removeChild(renderer.domElement);
      nodes.forEach((n) => {
        n.mesh.geometry.dispose();
        n.mesh.material.dispose();
      });
      connections.forEach((c) => {
        c.line.geometry.dispose();
        c.line.material.dispose();
      });
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden bg-[#0a0515]"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      <div
        ref={statusElRef}
        className="absolute left-1/2 top-[50px] -translate-x-1/2 text-[rgba(167,139,250,0.9)] text-[1.1rem] font-light tracking-[0.15em] z-[200] opacity-0 transition-opacity duration-[0.8s] [&.visible]:opacity-100"
      />
      <div
        ref={connectionCounterElRef}
        className="absolute bottom-[30px] left-[30px] text-[0.9rem] font-light tracking-[0.1em] text-[rgba(167,139,250,0.7)] z-[200] transition-opacity duration-1000"
      >
        CONNECTIONS: <span ref={connCountElRef} className="font-semibold text-[#a78bfa]">0</span>
      </div>
      <div className="absolute bottom-[30px] right-[30px] flex gap-3 z-[200]">
        <button
          ref={restartBtnRef}
          type="button"
          className="px-6 py-3 font-semibold text-[0.9rem] tracking-[0.1em] text-[#a78bfa] bg-transparent border-2 border-[#a78bfa] rounded-lg cursor-pointer opacity-0 pointer-events-none transition-all duration-300 hover:bg-[#a78bfa] hover:text-[#0a0515] hover:shadow-[0_0_30px_rgba(167,139,250,0.5)] [&.visible]:opacity-100 [&.visible]:pointer-events-auto"
        >
          REPLAY
        </button>
        <button
          ref={continueBtnRef}
          type="button"
          className="px-6 py-3 font-semibold text-[0.9rem] tracking-[0.1em] text-[#a78bfa] bg-transparent border-2 border-[#a78bfa] rounded-lg cursor-pointer opacity-0 pointer-events-none transition-all duration-300 hover:bg-[#a78bfa] hover:text-[#0a0515] hover:shadow-[0_0_30px_rgba(167,139,250,0.5)] [&.visible]:opacity-100 [&.visible]:pointer-events-auto"
        >
          GET STARTED
        </button>
      </div>
    </div>
  );
}
