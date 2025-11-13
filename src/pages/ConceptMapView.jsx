import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Sparkles,
  X,
  Trash2,
  Link2,
  MousePointer2,
  Zap,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { suggestConcepts } from '../lib/aiHelpers';
import { useStudyMetrics } from '../contexts/StudyMetricsContext.jsx';
import { cn } from '../lib/utils';

const clamp = (value, min = 5, max = 95) => Math.min(Math.max(value, min), max);

const ConceptNode = ({
  label,
  x,
  y,
  isSelected,
  isConnectionSource,
  isConnectionTarget,
  isDimmed,
  isAI = false,
  onPointerDown,
  onDelete,
}) => {
  const baseClasses =
    'absolute z-10 min-w-[140px] max-w-[220px] rounded-2xl px-4 py-3 shadow-lg text-sm font-medium text-primary-foreground select-none';

  const stateClasses = isSelected
    ? 'bg-primary ring-4 ring-primary/40 ring-offset-2'
    : 'bg-primary/90 hover:bg-primary hover:shadow-xl transition-transform';

  const connectionClasses = cn({
    'ring-4 ring-emerald-300/60 ring-offset-2': isConnectionSource,
    'ring-4 ring-sky-300/60 ring-offset-2': isConnectionTarget && !isConnectionSource,
  });

  return (
  <motion.div
      layout
      className={cn(
        baseClasses,
        stateClasses,
        connectionClasses,
        isDimmed && 'opacity-30'
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: isAI ? 'copy' : 'grab',
      }}
      whileTap={{ scale: isAI ? 1 : 0.97 }}
      onPointerDown={onPointerDown}
    >
      <div className="relative pr-6">
        <span className="block leading-snug">{label}</span>

        {onDelete && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
            className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow hover:bg-destructive/90"
            title="Delete node"
      >
        <X className="h-3 w-3" />
      </button>
    )}
      </div>
  </motion.div>
);
};

export const ConceptMapView = () => {
  const mapRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [conceptInput, setConceptInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSourceId, setConnectionSourceId] = useState(null);
  const [connectionLabel, setConnectionLabel] = useState('');
  const [dragState, setDragState] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddNode, setShowAddNode] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeX, setNewNodeX] = useState(50);
  const [newNodeY, setNewNodeY] = useState(50);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestedNodes, setAISuggestedNodes] = useState([]);
  const [isLoadingAISuggestions, setIsLoadingAISuggestions] = useState(false);
  const [aiSuggestionError, setAISuggestionError] = useState('');
  const [lastAISuggestionSeed, setLastAISuggestionSeed] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const { recordAIInteraction } = useStudyMetrics();

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  // Handle dragging
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (event) => {
      if (!mapRef.current) return;
      const rect = mapRef.current.getBoundingClientRect();

      const pointerX = event.clientX - rect.left - dragState.offsetX;
      const pointerY = event.clientY - rect.top - dragState.offsetY;

      const xPercent = clamp((pointerX / rect.width) * 100);
      const yPercent = clamp((pointerY / rect.height) * 100);

      setNodes((prev) =>
        prev.map((node) =>
          node.id === dragState.id
            ? {
                ...node,
                x: xPercent,
                y: yPercent,
              }
            : node
        )
      );
    };

    const stopDragging = () => {
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDragging, { once: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
    };
  }, [dragState]);

  const createNode = (label, x = 50, y = 50) => ({
    id: `node-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    label,
    x: clamp(x),
    y: clamp(y),
  });

  const createEdge = (fromId, toId, label) => ({
    id: `edge-${fromId}-${toId}-${Date.now()}`,
    from: fromId,
    to: toId,
    label: label?.trim() || '',
  });

  const generateSpiderWeb = async (conceptName, anchorNodeId = null) => {
    const trimmed = conceptName.trim();
    if (!trimmed) return;

    setIsGenerating(true);
    try {
      let workingNodes = [...nodes];
      let centerNode =
        anchorNodeId != null
          ? workingNodes.find((node) => node.id === anchorNodeId) || null
          : workingNodes.find(
              (node) => node.label.toLowerCase() === trimmed.toLowerCase()
            ) || null;

      if (anchorNodeId != null && !centerNode) {
        // Selected node disappeared; bail out.
        return;
      }

      if (!centerNode) {
        centerNode = createNode(trimmed, 50, 48);
        workingNodes = [...workingNodes, centerNode];
      }

      const seedForAI = anchorNodeId != null ? centerNode.label : trimmed;
      const response = await suggestConcepts([seedForAI]);

      const existingLabels = new Set(
        workingNodes.map((node) => node.label.toLowerCase())
      );
      const parsed = response
            .split('\n')
        .map((line) => line.trim().replace(/^[-•]\s*/, ''))
        .filter((line) => line.length > 0)
        .filter((line) => !existingLabels.has(line.toLowerCase()))
        .filter((line) => line.toLowerCase() !== trimmed.toLowerCase())
        .slice(0, 8);

      if (parsed.length === 0) {
        setNodes(workingNodes);
        setSelectedNodeId(centerNode.id);
        return;
      }

      const anchorX = centerNode.x ?? 50;
      const anchorY = centerNode.y ?? 50;
      const radius = anchorNodeId != null ? 18 : 26;
      const angleStep = (2 * Math.PI) / parsed.length;
      const jitter = () => (Math.random() - 0.5) * 6;

      const newNodes = parsed.map((label, idx) => {
        const angle = angleStep * idx;
        const x = anchorX + radius * Math.cos(angle) + jitter();
        const y = anchorY + radius * Math.sin(angle) + jitter();
        return createNode(label, x, y);
      });

      workingNodes = [...workingNodes, ...newNodes];

      setNodes(workingNodes);
      setEdges((prev) => [
        ...prev,
        ...newNodes.map((node) =>
          createEdge(centerNode.id, node.id, anchorNodeId != null ? connectionLabel : '')
        ),
      ]);
      setSelectedNodeId(centerNode.id);
            recordAIInteraction();
        } catch (error) {
      console.error('Failed to generate concept web:', error);
    } finally {
      setIsGenerating(false);
      setConnectionLabel('');
    }
  };

  const handleConceptSubmit = async (event) => {
    event.preventDefault();
    if (!conceptInput.trim() || isGenerating) return;
    await generateSpiderWeb(conceptInput.trim());
    setConceptInput('');
  };

  const handleExpandSelected = async () => {
    if (!selectedNodeId || isGenerating) return;
    const selectedNode = nodes.find((node) => node.id === selectedNodeId);
    if (!selectedNode) return;
    await generateSpiderWeb(selectedNode.label, selectedNode.id);
  };

  const handleDeleteNode = (nodeId) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    setEdges((prev) => prev.filter((edge) => edge.from !== nodeId && edge.to !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    if (connectionSourceId === nodeId) {
      setConnectionSourceId(null);
    }
  };

  const handleDeleteEdge = (edgeId) => {
    setEdges((prev) => prev.filter((edge) => edge.id !== edgeId));
  };

  const handleNodePointerDown = (event, node) => {
    event.stopPropagation();

    if (isConnecting) {
      if (!connectionSourceId) {
        setConnectionSourceId(node.id);
        setSelectedNodeId(node.id);
        return;
      }

      if (connectionSourceId === node.id) {
        setConnectionSourceId(null);
        return;
      }

      const newEdge = createEdge(connectionSourceId, node.id, connectionLabel);
      setEdges((prev) => [...prev, newEdge]);
      setConnectionSourceId(node.id); // allow chaining
      setSelectedNodeId(node.id);
      return;
    }

    setSelectedNodeId(node.id);

    if (mapRef.current) {
      const mapRect = mapRef.current.getBoundingClientRect();
      const centerX = (node.x / 100) * mapRect.width;
      const centerY = (node.y / 100) * mapRect.height;

      setDragState({
        id: node.id,
        offsetX: event.clientX - (mapRect.left + centerX),
        offsetY: event.clientY - (mapRect.top + centerY),
      });
    }
  };

  const handleMapDoubleClick = (event) => {
    if (!mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const node = createNode(`Idea ${nodes.length + 1}`, x, y);
    setNodes((prev) => [...prev, node]);
    setSelectedNodeId(node.id);
  };

  const handleClearMap = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setConnectionSourceId(null);
    setConnectionLabel('');
  };

  const handleAddNode = () => {
    const trimmed = newNodeName.trim();
    if (!trimmed) return;

    const node = createNode(trimmed, newNodeX, newNodeY);
    setNodes((prev) => [...prev, node]);
    setSelectedNodeId(node.id);
    setShowAddNode(false);
    setNewNodeName('');
    setNewNodeX(50);
    setNewNodeY(50);
  };

  const handleAddAISuggestion = (suggestion) => {
    const node = createNode(suggestion.label, suggestion.x, suggestion.y);

    setNodes((prev) => [...prev, node]);
    setEdges((prev) =>
      suggestion.sourceId
        ? [...prev, createEdge(suggestion.sourceId, node.id, suggestion.edgeLabel ?? '')]
        : prev
    );
    setSelectedNodeId(node.id);
    setAISuggestedNodes((prev) => prev.filter((item) => item.id !== suggestion.id));
    recordAIInteraction();
  };

  const connectionEdgesForNode = useMemo(() => {
    if (!selectedNode) return [];
    return edges.filter((edge) => edge.from === selectedNode.id || edge.to === selectedNode.id);
  }, [edges, selectedNode]);

  const isDimmed = (node) =>
    searchQuery.trim().length > 0 &&
    !node.label.toLowerCase().includes(searchQuery.trim().toLowerCase());

  const selectedConnectionSource = nodes.find((node) => node.id === connectionSourceId) || null;

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 1.6;
  const ZOOM_STEP = 0.1;

  const handleZoomIn = () =>
    setZoomLevel((prev) => Number(Math.min(prev + ZOOM_STEP, MAX_ZOOM).toFixed(2)));
  const handleZoomOut = () =>
    setZoomLevel((prev) => Number(Math.max(prev - ZOOM_STEP, MIN_ZOOM).toFixed(2)));
  const handleResetZoom = () => setZoomLevel(1);

  useEffect(() => {
    if (!showAISuggestions) {
      setAISuggestedNodes([]);
      setIsLoadingAISuggestions(false);
      setAISuggestionError('');
      return;
    }

    const seedNode = selectedNode || nodes[0] || null;
    const seedLabel = seedNode?.label?.trim() || conceptInput.trim();

    if (!seedLabel) {
      setAISuggestedNodes([]);
      setAISuggestionError('Add a concept or select a node to get AI suggestions.');
      return;
    }

    if (seedLabel === lastAISuggestionSeed && aiSuggestedNodes.length > 0) {
      return;
    }

    let isCancelled = false;

    const fetchSuggestions = async () => {
      setIsLoadingAISuggestions(true);
      setAISuggestionError('');

      try {
        const response = await suggestConcepts([seedLabel]);
        const existingLabels = new Set(nodes.map((node) => node.label.toLowerCase()));
        const parsed = response
          .split('\n')
          .map((line) => line.trim().replace(/^[-•]\s*/, ''))
          .filter((line) => line.length > 0)
          .filter((line) => !existingLabels.has(line.toLowerCase()))
          .slice(0, 6);

        if (isCancelled) return;

        if (parsed.length === 0) {
          setAISuggestedNodes([]);
          setAISuggestionError('No new suggestions right now. Try selecting another concept.');
          setLastAISuggestionSeed(seedLabel);
          return;
        }

        const anchorX = seedNode?.x ?? 50;
        const anchorY = seedNode?.y ?? 45;
        const radius = seedNode ? 22 : 28;
        const angleStep = (2 * Math.PI) / parsed.length;
        const jitter = () => (Math.random() - 0.5) * 8;

        const suggestions = parsed.map((label, index) => {
          const angle = angleStep * index;
          const x = clamp(anchorX + radius * Math.cos(angle) + jitter());
          const y = clamp(anchorY + radius * Math.sin(angle) + jitter());

          return {
            id: `ai-${seedLabel}-${index}-${Date.now()}`,
            label,
            x,
            y,
            sourceId: seedNode?.id ?? null,
          };
        });

        setAISuggestedNodes(suggestions);
        setLastAISuggestionSeed(seedLabel);
      } catch (error) {
        if (isCancelled) return;
        console.error('Failed to fetch AI suggestions:', error);
        setAISuggestionError('Could not load AI suggestions. Please try again.');
      } finally {
        if (!isCancelled) {
          setIsLoadingAISuggestions(false);
        }
      }
    };

    fetchSuggestions();

    return () => {
      isCancelled = true;
    };
  }, [
    showAISuggestions,
    selectedNode,
    nodes,
    conceptInput,
    lastAISuggestionSeed,
    aiSuggestedNodes.length,
  ]);

  return (
    <div className="relative flex h-[calc(100vh-64px)] flex-col">
      <div className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="flex flex-wrap items-center gap-2 p-3">
        <Button 
          variant="outline" 
          size="sm"
            onClick={() => setShowAddNode((prev) => !prev)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Node
          </Button>

          <Button
            variant={isConnecting ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setIsConnecting((prev) => {
                const next = !prev;
                if (!next) {
                  setConnectionSourceId(null);
                }
                return next;
              });
            }}
          >
            <Link2 className="mr-2 h-4 w-4" /> {isConnecting ? 'Tap nodes to connect' : 'Connect Nodes'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearMap}
            disabled={nodes.length === 0 && edges.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clear Map
        </Button>

          <div className="h-5 w-px bg-border" />

        <Input 
            placeholder="Search concepts..."
            className="w-48 sm:w-64"
          value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
        />

          <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background/80 px-1 py-1 text-xs shadow-sm backdrop-blur">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleZoomOut}
              disabled={zoomLevel <= MIN_ZOOM + 0.01}
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="px-2 font-semibold tabular-nums text-foreground/80">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleZoomIn}
              disabled={zoomLevel >= MAX_ZOOM - 0.01}
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleResetZoom}
              disabled={Math.abs(zoomLevel - 1) < 0.01}
              title="Reset zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
            onClick={() => setShowAISuggestions((prev) => !prev)}
        >
            <Sparkles className="mr-2 h-4 w-4" /> {showAISuggestions ? 'Hide AI Ideas' : 'Show AI Ideas'}
        </Button>
      </div>

      <AnimatePresence>
          {(showAddNode || isConnecting) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
              className="border-t border-border bg-muted/40"
          >
              <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                {showAddNode && (
                  <div className="flex flex-wrap items-center gap-2">
              <Input
                      placeholder="Node title..."
                value={newNodeName}
                      onChange={(event) => setNewNodeName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleAddNode();
                      }}
                      className="w-48 sm:w-64"
              />
              <Input
                type="number"
                      min={0}
                      max={100}
                value={newNodeX}
                      onChange={(event) =>
                        setNewNodeX(clamp(Number(event.target.value) || 50, 0, 100))
                      }
                className="w-20"
              />
              <Input
                type="number"
                      min={0}
                      max={100}
                value={newNodeY}
                      onChange={(event) =>
                        setNewNodeY(clamp(Number(event.target.value) || 50, 0, 100))
                      }
                className="w-20"
              />
                    <Button size="sm" onClick={handleAddNode}>
                      Drop on Map
                    </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddNode(false)}>
                      <X className="mr-1 h-4 w-4" /> Cancel
              </Button>
                  </div>
                )}

                {isConnecting && (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Link2 className="h-4 w-4 text-primary" />
                    {connectionSourceId ? (
                      <span>
                        Select another node to connect from{' '}
                        <span className="font-medium text-primary">
                          {selectedConnectionSource?.label ?? 'node'}
                        </span>
                      </span>
                    ) : (
                      <span>Tap any node to start a connection</span>
                    )}
                    <Input
                      placeholder="Relationship label (optional)"
                      value={connectionLabel}
                      onChange={(event) => setConnectionLabel(event.target.value)}
                      className="w-48 sm:w-64"
                    />
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            ref={mapRef}
            className="relative h-full w-full cursor-default bg-[radial-gradient(circle_at_1px_1px,_rgb(148_163_184/15%)_1px,_transparent_0)] from-background to-background origin-center"
            style={{
              backgroundSize: '60px 60px',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
            }}
            onDoubleClick={handleMapDoubleClick}
            onPointerDown={() => {
              setSelectedNodeId(null);
              if (!isConnecting) {
                setConnectionSourceId(null);
              }
            }}
          >
          <svg className="absolute inset-0 h-full w-full">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
              </marker>
            </defs>

            {edges.map((edge) => {
              const from = nodes.find((node) => node.id === edge.from);
              const to = nodes.find((node) => node.id === edge.to);
              if (!from || !to) return null;

              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;

              const isHighlighted =
                selectedNodeId && (selectedNodeId === edge.from || selectedNodeId === edge.to);

              return (
                <g key={edge.id} className="pointer-events-none">
          <motion.line
                    x1={`${from.x}%`}
                    y1={`${from.y}%`}
                    x2={`${to.x}%`}
                    y2={`${to.y}%`}
                    stroke="currentColor"
                    strokeWidth={isHighlighted ? 3 : 2}
                    strokeLinecap="round"
                    className={cn(
                      'text-slate-400',
                      isHighlighted && 'text-primary drop-shadow-sm'
                    )}
                    markerEnd="url(#arrowhead)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                  {edge.label && (
                    <foreignObject
                      x={`${midX}%`}
                      y={`${midY}%`}
                      width="160"
                      height="40"
                      style={{
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className="pointer-events-none w-full rounded-full bg-background/80 px-2 py-1 text-center text-xs font-medium text-primary shadow backdrop-blur-sm">
                        {edge.label}
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
        </svg>

          <AnimatePresence>
            {nodes.map((node) => (
          <ConceptNode
            key={node.id}
            label={node.label}
            x={node.x}
            y={node.y}
                isSelected={selectedNodeId === node.id}
                isConnectionSource={connectionSourceId === node.id}
                isConnectionTarget={
                  isConnecting && connectionSourceId && connectionSourceId !== node.id
                }
                isDimmed={isDimmed(node)}
                onPointerDown={(event) => handleNodePointerDown(event, node)}
            onDelete={() => handleDeleteNode(node.id)}
          />
        ))}
          </AnimatePresence>
        
          {showAISuggestions && aiSuggestedNodes.length > 0 && (
            <AnimatePresence>
              {aiSuggestedNodes.map((node) => (
          <ConceptNode
            key={node.id}
            label={node.label}
            x={node.x}
            y={node.y}
                  isAI
                  isDimmed={false}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    handleAddAISuggestion(node);
                  }}
          />
        ))}
            </AnimatePresence>
          )}

          {showAISuggestions && (
            <div className="pointer-events-none absolute top-4 right-4 flex max-w-xs flex-col gap-2 text-xs">
              {isLoadingAISuggestions && (
                <div className="pointer-events-auto rounded-lg border border-border/60 bg-background/90 px-3 py-2 shadow">
                  Generating smart suggestions…
                </div>
              )}
              {aiSuggestionError && (
                <div className="pointer-events-auto rounded-lg border border-destructive/40 bg-background/95 px-3 py-2 text-destructive shadow">
                  {aiSuggestionError}
                </div>
              )}
              {showAISuggestions && aiSuggestedNodes.length > 0 && (
                <div className="pointer-events-auto rounded-lg border border-primary/40 bg-background/95 px-3 py-2 text-foreground shadow">
                  Tap an AI idea to add it to your map.
                </div>
              )}
            </div>
          )}

          {nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-full border border-dashed border-border bg-background/90 px-4 py-2 text-sm shadow-sm backdrop-blur"
              >
                Double-click anywhere to drop your first idea.
              </motion.div>
              <div className="flex items-center gap-2 text-xs">
                <MousePointer2 className="h-4 w-4" />
                Drag nodes to reposition • Connect ideas with the toolbar
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      <AnimatePresence>
      {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="pointer-events-auto absolute bottom-4 right-4 z-20 w-72 rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Concept</p>
                <Input
                  value={selectedNode.label}
                  onChange={(event) =>
                    setNodes((prev) =>
                      prev.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, label: event.target.value }
                          : node
                      )
                    )
                  }
                  className="mt-1 text-sm"
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedNodeId(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Position</span>
                <p>
                  x: {selectedNode.x.toFixed(1)}% <br /> y: {selectedNode.y.toFixed(1)}%
                </p>
              </div>
              <div>
                <span className="font-medium text-foreground">Connections</span>
                <p>{connectionEdgesForNode.length} link(s)</p>
              </div>
            </div>

            {connectionEdgesForNode.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Linked Concepts
                </p>
                <div className="space-y-2 text-xs">
                  {connectionEdgesForNode.map((edge) => {
                    const otherNode =
                      edge.from === selectedNode.id
                        ? nodes.find((node) => node.id === edge.to)
                        : nodes.find((node) => node.id === edge.from);

                    if (!otherNode) return null;

                    return (
                      <div
                        key={edge.id}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-2 py-1.5"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{otherNode.label}</span>
                          {edge.label && <span className="text-muted-foreground">{edge.label}</span>}
                        </div>
          <Button
                          size="icon"
            variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteEdge(edge.id)}
          >
                          <Trash2 className="h-4 w-4" />
          </Button>
        </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {nodes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="pointer-events-none absolute left-4 bottom-4 hidden items-center gap-2 rounded-full bg-background/80 px-3 py-2 text-xs font-medium text-muted-foreground shadow backdrop-blur sm:flex"
        >
          <Zap className="h-4 w-4 text-primary" />
          {nodes.length} nodes · {edges.length} connections
        </motion.div>
      )}
    </div>
  );
};

