import React, { useState, useEffect, useRef } from "react";

const TETROMINOS = [
  { shape: [4, 5, 6, 7], size: 4, color: '#52FABE' },
  { shape: [0, 3, 4, 5], size: 3, color: '#5A49AC' },
  { shape: [2, 3, 4, 5], size: 3, color: '#CE8C65' },
  { shape: [0, 1, 4, 5], size: 3, color: '#C74950' },
  { shape: [1, 2, 3, 4], size: 3, color: '#8EBD3F' },
  { shape: [1, 3, 4, 5], size: 3, color: '#B75BAD' },
  { shape: [0, 1, 2, 3], size: 2, color: '#C2AB47' }
];

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const TetrisGrid = () => {
  const rows = 22;
  const cols = 10;

  const [gridData, setGridData] = useState(
    Array.from({ length: rows * cols }, () => ({ color: 'black' , filled: false}))
  );

  const [position, setPosition] = useState({ row: 0, col: 3 });
  const [holdPiece, setHoldPiece] = useState(null);
  const initialQueue = shuffle(TETROMINOS);
  const [nextQueue, setNextQueue] = useState(initialQueue.slice(1));
  const [activePiece, setActivePiece] = useState(initialQueue[0]);
  const [shadowOverlapCount, setShadowOverlapCount] = useState(0);
  const [isHold, setIsHold] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const lastMoveTimeRef = useRef(Date.now());

  const resetGame = () => {
    const newQueue = shuffle(TETROMINOS);
    setGridData(Array.from({ length: rows * cols }, () => ({ color: 'black', filled: false })));
    setPosition({ row: 0, col: 3 });
    setNextQueue(newQueue);
    setActivePiece(newQueue[0]);
    setHoldPiece(null);
    setGameOver(false);
  };

  const gridWidth = cols * 24 + 4;
  const gridHeight = rows * 24 + 4;
  const holdHeight = 4 * 24;
  const nextHeight = 16 * 24;

  // Valid 判斷
  const isValidPosition = (row, col) => {
    return activePiece.shape.every(i => {
      const r = Math.floor(i / activePiece.size) + row;
      const c = i % activePiece.size + (( activePiece.size===2 )? col + 1: col);
      const index = r * cols + c;
      return r >= 0 && r < rows && c >= 0 && c < cols && !gridData[index].filled;
    });
  };

  // 往左移動
  const moveLeft  = () => {
    const newCol = position.col - 1;
    if(isValidPosition(position.row, newCol)){
      setPosition( p => ({ ...p, col: newCol}));
    }
  }

  // 往右移動
  const moveRight = () => {
    const newCol = position.col + 1;
    if(isValidPosition(position.row, newCol)){
      setPosition( p => ({ ...p, col: newCol}));
    }
  }

  // 往下移動
  const moveDown = () => {
    if (gameOver) return;
    setPosition(prev => {
      const newRow = prev.row + 1;
      return isValidPosition(newRow, prev.col) ? { ...prev, row: newRow } : prev;
    });
  };

  // 向右旋轉
  const rotateRight = (piece) => {
    const newShape = piece.shape.map(i => {
      const row = Math.floor(i / piece.size);
      const col = i % piece.size;
      return col * piece.size + (piece.size - 1 - row);
    });
    return { ...piece, shape: newShape };
  };
  
  // HOLD 區塊
  const holdSwap = () => {

    if (!holdPiece && !isHold) {
      setHoldPiece(activePiece);
      setActivePiece(TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)]);
    } else {
      const temp = activePiece;
      setActivePiece(holdPiece);
      setHoldPiece(temp);
    }
    setPosition({ row: 0, col: 3 });
  };

  // 中間 區塊
  

  
    const spawnGrid = Array.from({ length: rows * cols }, (_, index) => ({
      ...gridData[index],
      isShadow: false
    }));

    const getShadowRow = () => {
      let shadowRow = position.row;
      while (isValidPosition(shadowRow + 1, position.col)) {
        shadowRow++;
      }
      return shadowRow;
    };

    const shadowRow = getShadowRow();
    let count = 0;
    activePiece.shape.forEach(i => {
      const r = Math.floor(i / activePiece.size);
      const c = i % activePiece.size;
      const shadowRowPos = r + shadowRow;
      const activeRowPos = r + position.row;
      const col = c + ((activePiece.size === 2) ? position.col + 1 : position.col);
      const shadowIndex = shadowRowPos * cols + col;
      const activeIndex = activeRowPos * cols + col;

      if (shadowRowPos >= 0 && shadowRowPos < rows && col >= 0 && col < cols) {
        spawnGrid[shadowIndex] = { ...spawnGrid[shadowIndex], filled: true, color: '#3E3727', isShadow: true };
      }

      if (activeRowPos >= 0 && activeRowPos < rows && col >= 0 && col < cols) {
        if (spawnGrid[activeIndex].isShadow) {
          count++;
        }
        spawnGrid[activeIndex] = { filled: true, color: activePiece.color, isShadow: false };
      }
    });
  useEffect(()=>{
    setShadowOverlapCount(count);
  },  [count]);
  

  useEffect(()=>{
    if (shadowOverlapCount === 4) {
      //moveDown();
      let  newGridData = [...gridData];
      activePiece.shape.forEach(i => {
        const r = Math.floor(i / activePiece.size);
        const c = i % activePiece.size;
        const row = r + position.row;
        const col = c + ((activePiece.size === 2) ? position.col + 1 : position.col);
        const index = row * cols + col;
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          newGridData[index] = { filled: true, color: activePiece.color };
        }
      });
      
      // Line clear logic
      for (let r = 0; r < rows; r++) {
        const rowStart = r * cols;
        const rowFilled = newGridData.slice(rowStart, rowStart + cols).every(cell => cell.filled);
        if (rowFilled) {
          const newRow = Array.from({ length: cols }, () => ({ filled: false, color: 'black' }));
          newGridData = [
            ...newRow,
            ...newGridData.slice(0, rowStart),
            ...newGridData.slice(rowStart + cols)
          ];
        }
      }
      setGridData(newGridData);
      
      const gameOverTrigger = newGridData.some((cell, index) => {
        const row = Math.floor(index / cols);
        return row < 2 && cell.filled;
      });

      if (gameOverTrigger) {
        setGameOver(true);
        return;
      }else{
        const [next, ...rest] = nextQueue;
        setActivePiece(next);
        setNextQueue(prevQueue => {
          if (rest.length < 5) {
            return [...rest, ...shuffle(TETROMINOS)];
          }
          return rest;
        });
        setPosition({ row: 0, col: 3 });
      }
      setShadowOverlapCount(0);
    }
  }, [shadowOverlapCount]);

 /* if (shadowOverlapCount === 4) {
    //moveDown();
    let  newGridData = [...gridData];
    activePiece.shape.forEach(i => {
      const r = Math.floor(i / activePiece.size);
      const c = i % activePiece.size;
      const row = r + position.row;
      const col = c + ((activePiece.size === 2) ? position.col + 1 : position.col);
      const index = row * cols + col;
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        newGridData[index] = { filled: true, color: activePiece.color };
      }
    });

    // Line clear logic
    for (let r = 0; r < rows; r++) {
      const rowStart = r * cols;
      const rowFilled = newGridData.slice(rowStart, rowStart + cols).every(cell => cell.filled);
      if (rowFilled) {
        const newRow = Array.from({ length: cols }, () => ({ filled: false, color: 'black' }));
        newGridData = [
          ...newRow,
          ...newGridData.slice(0, rowStart),
          ...newGridData.slice(rowStart + cols)
        ];
      }
    }
    setGridData(newGridData);
    
    if (gameOverTrigger) {
      setGameOver(true);
      return;
    }

    const [next, ...rest] = nextQueue;
    setActivePiece(next);
    setNextQueue(prevQueue => {
      if (rest.length < 5) {
        return [...rest, ...shuffle(TETROMINOS)];
      }
      return rest;
    });
    setPosition({ row: 0, col: 3 });
  }*/

  const borderedGrid = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = spawnGrid[r * cols + c];
      const isFilled = cell.filled;
      const isHidden = r < 2 && !isFilled;

      borderedGrid.push(
        <div
          key={`cell-${r * cols + c}`}
          style={{
            width: '24px',
            height: '24px',
            backgroundColor: isFilled ? cell.color : 'black',
            borderLeft: isHidden ? 'none' : (r >= 2 && r <= 21 && c === 0) ? '4px solid white' : '1px solid #4B5563',
            borderRight: isHidden ? 'none' : (r >= 2 && r <= 21 && c === cols - 1) ? '4px solid white' : '1px solid #4B5563',
            borderTop: isHidden ? 'none' : '1px solid #4B5563',
            borderBottom: r === rows - 1 ? '4px solid white' : (isHidden ? 'none' : '1px solid #4B5563'),
            boxShadow: isFilled
              ? 'inset -2px -2px 4px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.3)'
              : 'none'
          }}
        />
      );
    }
  }

  useEffect(() =>{
    const handleKeyDown = (e) => {
      if (gameOver) return;
      if(e.key==='ArrowLeft') moveLeft();
      else if (e.key === 'ArrowRight') moveRight();
      else if (e.key === 'ArrowDown') moveDown();
      else if (e.code === 'ArrowUp') {
        const tryRotate = (piece, attempts = 3) => {
          for (let i = 0; i < attempts; i++) {
            const newPiece = rotateRight(piece);
            const offset = i === 1 ? -1 : i === 2 ? 1 : 0;
            const newCol = position.col + offset;

            // 先檢查所有區塊是否在邊界內並沒撞到已填滿的格子
            const valid = newPiece.shape.every(index => {
              const r = Math.floor(index / newPiece.size) + position.row;
              const c = index % newPiece.size + newCol;
              const inBounds = r >= 0 && r < rows && c >= 0 && c < cols;
              const empty = !gridData[r * cols + c]?.filled;
              return inBounds && empty;
            });

            if (valid) {
              setActivePiece(newPiece);
              if (offset !== 0) setPosition(p => ({ ...p, col: newCol }));
              break;
            }
          }
        };
        tryRotate(activePiece);
      }
      else if (e.code === 'Space') {
        setPosition(prev => ({ ...prev, row: getShadowRow() }));
      }
      else if (e.key === 'Shift') {
        holdSwap();
        setIsHold(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [position, activePiece, holdPiece] );

  useEffect(() =>{
    if (gameOver) return;
    const interval = setInterval(() => {
      moveDown();
    }, 750);
    return () => clearInterval(interval);
  }, [] );

  const holdCells = Array.from({ length: 3 * 5 }, (_, i) => {
    const row = Math.floor(i / 5);
    const col = i % 5;
    const color = holdPiece && holdPiece.shape.some(index => {
      const r = Math.floor(index / holdPiece.size);
      const c = index % holdPiece.size;
      return r === row && c === col;
    }) ? holdPiece.color : 'black';

    return (
      <div
        key={`hold-${i}`}
        style={{
          width: '24px',
          height: '24px',
          backgroundColor: color
        }}
      />
    );
  });

  const holdGrid = () => {
    return [
      <div
        key={`hold-label`}
        style={{
          gridColumn: 'span 5',
          height: '24px',
          backgroundColor: 'white',
          color: 'black',
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: '24px'
        }}
      >
        HOLD
      </div>,
      ...holdCells
    ];
  };

  const nextGrid = () => {
    const preview = nextQueue.slice(0, 5);
    const cells = Array.from({ length: 15 * 5 }, (_, i) => {
      const row = Math.floor(i / 5);
      const col = i % 5;
      let color = 'black';
      const piece = preview[Math.floor(row / 3)];
      if (piece) {
        const localRow = row % 3;
        const isActive = piece.shape.some(index => {
          const r = Math.floor(index / piece.size);
          const c = index % piece.size;
          return r === localRow && c === col;
        });
        if (isActive) color = piece.color;
      }
      return (
        <div
          key={`next-${i}`}
          style={{ width: '24px', height: '24px', backgroundColor: color }}
        />
      );
    });

    return [
      <div
        key={`next-label`}
        style={{
          gridColumn: 'span 5',
          height: '24px',
          backgroundColor: 'white',
          color: 'black',
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: '24px'
        }}
      >
        NEXT
      </div>,
      ...cells
    ];
  };


  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'start',
        height: '100vh',
        backgroundColor: 'black'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'start', marginTop: '48px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(5, 24px)`,
            gridTemplateRows: `repeat(5, 24px)`,
            height: `${holdHeight}px`,
            borderLeft: '4px solid white',
            borderTop: '4px solid white',
            borderBottom: '4px solid white',
            boxSizing: 'content-box',
            marginTop: '48px'
          }}
        >
          {holdGrid()}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 24px)`,
            gridTemplateRows: `repeat(${rows}, 24px)`,
            width: `${gridWidth}px`,
            height: `${gridHeight}px`,
            boxSizing: 'content-box'
          }}
        >
          {borderedGrid}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(5, 24px)`,
            gridTemplateRows: `repeat(17, 24px)`,
            height: `${nextHeight}px`,
            borderRight: '4px solid white',
            borderTop: '4px solid white',
            borderBottom: '4px solid white',
            boxSizing: 'content-box',
            marginTop: '48px'
          }}
        >
          {nextGrid()}
        </div>
      </div>
      <div>
      {/*{showFail && (
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', color: 'red', fontSize: '48px', fontWeight: 'bold' }}>FAIL</div>
      )}*/}
      {gameOver && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'red', fontSize: '40px', textAlign: 'center' }}>
          Game Over<br />
          <button onClick={resetGame} style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}>Restart</button>
        </div>
      )}
    </div>
    </div>
    
  );
};

export default TetrisGrid;