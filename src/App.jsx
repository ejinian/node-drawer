import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [nodes, setNodes] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [drawMode, setDrawMode] = useState(false);
  const [arrows, setArrows] = useState([]);
  const [drawingArrow, setDrawingArrow] = useState(null);
  const [nodeCounter, setNodeCounter] = useState(1);
  const [contextMenu, setContextMenu] = useState({
     visible: false,
     x: 0,
     y: 0,
     nodeId: null
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hueValue, setHueValue] = useState(240);
  const [darknessLevel, setDarknessLevel] = useState(50);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Generate theme colors based on current settings
  const getThemeColors = () => {
    if (isDarkMode) {
      const lightness = Math.max(10, 40 - (darknessLevel * 0.3));
      const saturation = Math.max(20, 60 - (darknessLevel * 0.4));
      return {
        primary: `hsl(${hueValue}, ${saturation}%, ${lightness}%)`,
        secondary: `hsl(${(hueValue + 30) % 360}, ${saturation}%, ${lightness + 10}%)`,
        accent: `hsl(${(hueValue + 60) % 360}, ${Math.min(80, saturation + 20)}%, ${lightness + 15}%)`
      };
    } else {
      const lightness = Math.min(85, 50 + (hueValue / 360 * 35));
      const saturation = Math.min(80, 40 + (hueValue / 360 * 40));
      return {
        primary: `hsl(${hueValue}, ${saturation}%, ${lightness}%)`,
        secondary: `hsl(${(hueValue + 40) % 360}, ${saturation}%, ${Math.min(90, lightness + 15)}%)`,
        accent: `hsl(${(hueValue + 80) % 360}, ${Math.min(90, saturation + 20)}%, ${Math.max(30, lightness - 20)}%)`
      };
    }
  };

  // Apply theme to document body
  useEffect(() => {
    const colors = getThemeColors();
    const gradient = `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`;
    document.body.style.background = gradient;
    
    // Set CSS custom properties for theme colors
    document.documentElement.style.setProperty('--theme-primary', colors.primary);
    document.documentElement.style.setProperty('--theme-secondary', colors.secondary);
    document.documentElement.style.setProperty('--theme-accent', colors.accent);
    document.documentElement.style.setProperty('--is-dark-mode', isDarkMode ? '1' : '0');
  }, [isDarkMode, hueValue, darknessLevel]);

  useEffect(() => {
    let counter = nodeCounter;
    const initialNodes = [];
    for (let i = 0; i < 5; i++) {
      initialNodes.push({
        id: counter,
        x: Math.random() * (window.innerWidth * 0.8 - 100) + 50,
        y: Math.random() * (window.innerHeight * 0.7 - 100) + 50,
      });
      counter += 1;
    }
    setNodeCounter(counter);
    setNodes(initialNodes);
  }, [])

  const addNode = () => {
    setNodes(prev => {
      const newNode = {
        id: nodeCounter,
        x: Math.random() * (window.innerWidth * 0.8 - 100) + 50,
        y: Math.random() * (window.innerHeight * 0.7 - 100) + 50,
      };
      return [...prev, newNode];
    });
    setNodeCounter(prev => prev + 1);
  }

  const deleteNode = () => {
    setNodes(prev => prev.slice(0, -1));
  }

  const deleteAllNodes = () => {
    setNodes([]);
    setArrows([]);
    setNodeCounter(1);
  }

  const toggleDrawMode = () => {
    setDrawMode(prev => !prev);
    setDrawingArrow(null);
  }

  const handleNodeClick = (nodeId) => {
    if (!drawMode) return;
    
    if (!drawingArrow) {
      setDrawingArrow({ from: nodeId });
    } else if (drawingArrow.from !== nodeId) {
      const newArrow = {
        id: Date.now(),
        from: drawingArrow.from,
        to: nodeId
      };
      setArrows(prev => [...prev, newArrow]);
      setDrawingArrow(null);
    } else {
      setDrawingArrow(null);
    }
  }

  const handleMouseDown = (e, nodeId) => {
    if (drawMode) {
      handleNodeClick(nodeId);
      return;
    }
    
    e.preventDefault()
    const canvasRect = document.querySelector('.canvas').getBoundingClientRect();
    const nodeRect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - (nodeRect.left + nodeRect.width / 2);
    const offsetY = e.clientY - (nodeRect.top + nodeRect.height / 2);
    
    setDragging({
      id: nodeId,
      offsetX,
      offsetY
    });
  }

  const handleMouseMove = (e) => {
    if (dragging) {
      const canvasRect = document.querySelector('.canvas').getBoundingClientRect()
      const centerX = e.clientX - canvasRect.left - dragging.offsetX
      const centerY = e.clientY - canvasRect.top - dragging.offsetY
      const newX = centerX - 20;
      const newY = centerY - 20;
      const clampedX = Math.max(0, Math.min(newX, canvasRect.width - 40));
      const clampedY = Math.max(0, Math.min(newY, canvasRect.height - 40));
      
      setNodes(prev => prev.map(node => 
        node.id === dragging.id 
          ? { ...node, x: clampedX, y: clampedY }
          : node
      ))
    }
  }

  const handleMouseUp = () => {
    setDragging(null);
  }

  const handleNodeContextMenu = (e, nodeId) => {
     e.preventDefault();
     e.stopPropagation();
     setContextMenu({
       visible: true,
       x: e.clientX,
       y: e.clientY,
       nodeId
     });
   }
    
   const handleCanvasContextMenu = (e) => {
     e.preventDefault();
     setContextMenu({
       visible: true,
       x: e.clientX,
       y: e.clientY,
       nodeId: null
     });
   }

  useEffect(() => {
    if (dragging && !drawMode) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    }
  }, [dragging, drawMode]);

  useEffect(() => {
    const handleAnyClick = (e) => {
      if (contextMenu.visible && !e.target.closest('.context-menu')) {
        setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
      }
      if (showThemeMenu && !e.target.closest('.theme-container')) {
        setShowThemeMenu(false);
      }
    }
    window.addEventListener('click', handleAnyClick);
    return () => window.removeEventListener('click', handleAnyClick);
  }, [contextMenu.visible, showThemeMenu]);

  const getArrowPath = (fromNode, toNode) => {
    const fromX = fromNode.x + 20;
    const fromY = fromNode.y + 20;
    const toX = toNode.x + 20;
    const toY = toNode.y + 20;
    
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const nodeRadius = 20;
    
    const startX = fromX + Math.cos(angle) * nodeRadius;
    const startY = fromY + Math.sin(angle) * nodeRadius;
    const endX = toX - Math.cos(angle) * nodeRadius;
    const endY = toY - Math.sin(angle) * nodeRadius;
    
    return { startX, startY, endX, endY, angle };
  }

  return (
    <div className="App">
      <div className="theme-container">
        <button 
          className="theme-toggle-btn"
          onClick={() => setShowThemeMenu(!showThemeMenu)}
        >
          🎨
        </button>
        
        {showThemeMenu && (
          <div className="theme-menu">
            <div className="theme-section">
              <h3>Theme</h3>
              <div className="mode-toggle">
                <button 
                  className={`mode-btn ${!isDarkMode ? 'active' : ''}`}
                  onClick={() => setIsDarkMode(false)}
                >
                  ☀️ Light
                </button>
                <button 
                  className={`mode-btn ${isDarkMode ? 'active' : ''}`}
                  onClick={() => setIsDarkMode(true)}
                >
                  🌙 Dark
                </button>
              </div>
            </div>
            
            <div className="theme-section">
              <h3>{isDarkMode ? 'Darkness Level' : 'Color Hue'}</h3>
              {isDarkMode ? (
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={darknessLevel}
                    onChange={(e) => setDarknessLevel(parseInt(e.target.value))}
                    className="darkness-slider"
                  />
                  <span className="slider-label">{darknessLevel}%</span>
                </div>
              ) : (
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={hueValue}
                    onChange={(e) => setHueValue(parseInt(e.target.value))}
                    className="hue-slider"
                  />
                  <div className="hue-preview" style={{ backgroundColor: `hsl(${hueValue}, 70%, 60%)` }}></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="controls">
        <button onClick={addNode}>Add Node</button>
        <button onClick={deleteNode} disabled={nodes.length === 0}>
          Delete Node
        </button>
        <button onClick={deleteAllNodes} disabled={nodes.length === 0}>
          Delete All
        </button>
        <button 
          onClick={toggleDrawMode}
          className={drawMode ? 'active' : ''}
        >
          {drawMode ? 'Draw Mode ON' : 'Draw Mode OFF'}
        </button>
        <span className="node-count">Nodes: {nodes.length}</span>
      </div>
      
      <div className="canvas" onContextMenu={handleCanvasContextMenu}>
        <svg className="arrows-layer">
          {arrows.map(arrow => {
            const fromNode = nodes.find(n => n.id === arrow.from);
            const toNode = nodes.find(n => n.id === arrow.to);
            if (!fromNode || !toNode) return null;
            const { startX, startY, endX, endY, angle } = getArrowPath(fromNode, toNode);
            
            return (
              <g key={arrow.id}>
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="rgba(255, 255, 255, 0.6)"
                  strokeWidth="2.5"
                />
                <polygon
                  points={`${endX},${endY} ${endX - 10 * Math.cos(angle - Math.PI/6)},${endY - 10 * Math.sin(angle - Math.PI/6)} ${endX - 10 * Math.cos(angle + Math.PI/6)},${endY - 10 * Math.sin(angle + Math.PI/6)}`}
                  fill="rgba(255, 255, 255, 0.8)"
                />
              </g>
            )
          })}
        </svg>
        
        {nodes.map(node => (
          <div
            key={node.id}
            className={`node ${drawMode ? 'draw-mode' : ''} ${drawingArrow?.from === node.id ? 'selected' : ''}`}
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
            }}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
          >
            {node.id}
          </div>
        ))}
      </div>
      {contextMenu.visible && (
      <div
        className="context-menu"
        style={{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }}
      >
        {contextMenu.nodeId !== null ? (
          <div
            className="context-menu-item"
            onClick={() => {
              setNodes(prev => prev.filter(n => n.id !== contextMenu.nodeId))
              setArrows(prev =>
                prev.filter(a => a.from !== contextMenu.nodeId && a.to !== contextMenu.nodeId)
              )
              setContextMenu({ visible: false, x: 0, y: 0, nodeId: null })
            }}
          >
            Delete Node
          </div>
        ) : (
          <>
            <div
            className="context-menu-item"
            onClick={() => {
              const newX = contextMenu.x - document.querySelector('.canvas').getBoundingClientRect().left - 20;
              const newY = contextMenu.y - document.querySelector('.canvas').getBoundingClientRect().top - 20;
              setNodes(prev => [
                ...prev,
                { id: nodeCounter, x: newX, y: newY }
              ]);
              setNodeCounter(prev => prev + 1);
              setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
            }}
            >
              Add New Node
            </div>
            <div
              className="context-menu-item"
              onClick={() => {
                setDrawMode(prev => !prev);
                setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
              }}
            >
              Toggle Draw Mode
            </div>
            <div
              className="context-menu-item"
              onClick={() => {
                deleteAllNodes();
                setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
              }}
            >
              Delete All Nodes
            </div>
          </>
        )}
      </div>
    )}
    </div>
  )
}

export default App;