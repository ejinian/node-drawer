import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [nodes, setNodes] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [drawMode, setDrawMode] = useState(false);
  const [arrows, setArrows] = useState([]);
  const [drawingArrow, setDrawingArrow] = useState(null);
  const [nodeCounter, setNodeCounter] = useState(1);

  const generateRandomPosition = () => {
    const newNode = {
      id: nodeCounter,
      x: Math.random() * (window.innerWidth * 0.8 - 100) + 50,
      y: Math.random() * (window.innerHeight * 0.7 - 100) + 50,
    };
    setNodeCounter(prev => prev + 1);
    return newNode;
  }

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
    setNodes(prev => [...prev, generateRandomPosition()]);
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

  useEffect(() => {
    if (dragging && !drawMode) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    }
  }, [dragging, drawMode])

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
        {drawMode && drawingArrow && (
          <span className="draw-instruction">Click another node to draw arrow</span>
        )}
      </div>
      
      <div className="canvas">
        <svg className="arrows-layer">
          {arrows.map(arrow => {
            const fromNode = nodes.find(n => n.id === arrow.from)
            const toNode = nodes.find(n => n.id === arrow.to)
            if (!fromNode || !toNode) return null
            
            const { startX, startY, endX, endY, angle } = getArrowPath(fromNode, toNode)
            
            return (
              <g key={arrow.id}>
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#333"
                  strokeWidth="2"
                />
                <polygon
                  points={`${endX},${endY} ${endX - 10 * Math.cos(angle - Math.PI/6)},${endY - 10 * Math.sin(angle - Math.PI/6)} ${endX - 10 * Math.cos(angle + Math.PI/6)},${endY - 10 * Math.sin(angle + Math.PI/6)}`}
                  fill="#333"
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
          >
            {node.id}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App;