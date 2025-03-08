import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Audio } from 'expo-av';

const GRID_SIZE = 8;
const WORDS = [
  'PROTEIN',
  'MUSCLE',  // Changed MASS to MUSCLE
  'EATING',
  'HEALTH',  // Changed DIET to HEALTH
  'STRONG'   // Changed GAIN to STRONG
];

const DIRECTIONS = [
  [0, 1],   // right
  [1, 0],   // down
  [1, 1],   // diagonal right-down
  [-1, 1],  // diagonal left-down
];

export default function CrosswordPuzzle({ words, onComplete, isActive, resetTimer, onTimeUp }) {
  const [grid, setGrid] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [timer, setTimer] = useState(300);
  const [startCell, setStartCell] = useState(null);
  const [dragEndCell, setDragEndCell] = useState(null);
  const [sound, setSound] = useState();

  // Add mouse interaction states
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [currentSelection, setCurrentSelection] = useState([]);

  const gridRef = useRef(null);

  // Modify timer effect
  useEffect(() => {
    let interval;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            clearInterval(interval);
            if (onTimeUp) onTimeUp(); // Call the callback when timer reaches zero
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timer, onTimeUp]);

  useEffect(() => {
    if (resetTimer) {
      setTimer(300); // Reset to 5 minutes when resetTimer prop changes
    }
  }, [resetTimer]);

  // Initialize grid with words and random letters
  useEffect(() => {
    if (!isActive) return;
    
    const newGrid = Array(GRID_SIZE).fill().map(() => 
      Array(GRID_SIZE).fill(''));
    
    // Place words in random positions and directions
    words.forEach(word => {
      let placed = false;
      while (!placed) {
        const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        const startX = Math.floor(Math.random() * GRID_SIZE);
        const startY = Math.floor(Math.random() * GRID_SIZE);
        
        if (canPlaceWord(word, startX, startY, direction, newGrid)) {
          placeWord(word, startX, startY, direction, newGrid);
          placed = true;
        }
      }
    });

    // Fill remaining cells with random letters
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (newGrid[i][j] === '') {
          newGrid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
      }
    }

    setGrid(newGrid);
    setFoundWords([]);
  }, [words, isActive]);

  const canPlaceWord = (word, startX, startY, direction, grid) => {
    const length = word.length;
    for (let i = 0; i < length; i++) {
      const x = startX + (direction[0] * i);
      const y = startY + (direction[1] * i);
      
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
      if (grid[x][y] !== '' && grid[x][y] !== word[i]) return false;
    }
    return true;
  };

  const placeWord = (word, startX, startY, direction, grid) => {
    const length = word.length;
    for (let i = 0; i < length; i++) {
      const x = startX + (direction[0] * i);
      const y = startY + (direction[1] * i);
      grid[x][y] = word[i];
    }
  };

  const handleCellPressIn = (x, y) => {
    setStartCell({ x, y });
    setSelectedCells([{ x, y }]);
  };

  const handleCellPressMove = (x, y) => {
    if (startCell) {
      const dx = x - startCell.x;
      const dy = y - startCell.y;
      const cells = [];
      let currX = startCell.x;
      let currY = startCell.y;
      
      // Calculate cells in the line
      while (currX !== x || currY !== y) {
        cells.push({ x: currX, y: currY });
        if (Math.abs(dx) > Math.abs(dy)) {
          currX += Math.sign(dx);
        } else {
          currY += Math.sign(dy);
        }
      }
      cells.push({ x, y });
      setSelectedCells(cells);
      setDragEndCell({ x, y });
    }
  };

  const handleCellPressOut = () => {
    if (startCell && dragEndCell) {
      const selectedWord = getSelectedWord(startCell, dragEndCell);
      if (WORDS.includes(selectedWord) && !foundWords.includes(selectedWord)) {
        setFoundWords([...foundWords, selectedWord]);
        if (foundWords.length + 1 === WORDS.length) {
          onComplete();
        }
      }
    }
    setStartCell(null);
    setDragEndCell(null);
    setSelectedCells([]);
  };

  const handleCellPress = (x, y) => {
    if (!startCell) {
      setStartCell({ x, y });
      setSelectedCells([{ x, y }]);
    } else {
      const selectedWord = getSelectedWord(startCell, { x, y });
      if (WORDS.includes(selectedWord)) {
        setFoundWords([...foundWords, selectedWord]);
        if (foundWords.length + 1 === WORDS.length) {
          onComplete();
        }
      }
      setStartCell(null);
      setSelectedCells([]);
    }
  };

  const getSelectedWord = (start, end) => {
    const dx = Math.sign(end.x - start.x);
    const dy = Math.sign(end.y - start.y);
    let word = '';
    let x = start.x;
    let y = start.y;
    
    while (x !== end.x || y !== end.y) {
      word += grid[x][y];
      x += dx;
      y += dy;
    }
    word += grid[end.x][end.y];
    
    return word;
  };

  const isLetterInFoundWord = (x, y, word) => {
    for (let i = 0; i < word.length; i++) {
      const letter = word[i];
      for (let j = 0; j < grid.length; j++) {
        for (let k = 0; k < grid[j].length; k++) {
          if (grid[j][k] === letter && j === x && k === y) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Modify handleCellPressIn for mouse events
  const getCellFromEvent = (event, gridRef) => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;
    
    // Get actual cell dimensions
    const cellWidth = rect.width / GRID_SIZE;
    const cellHeight = rect.height / GRID_SIZE;
    
    // Calculate cell coordinates directly from click position
    const x = Math.floor(relY / cellHeight);
    const y = Math.floor(relX / cellWidth);
    
    // Validate coordinates
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      return { x, y };
    }
    return null;
  };

  const handleMouseDown = (event) => {
    const cell = getCellFromEvent(event, gridRef);
    if (cell) {
      setIsMouseDown(true);
      setStartCell(cell);
      setCurrentSelection([cell]);
    }
  };

  const handleMouseMove = (event) => {
    if (!isMouseDown || !startCell) return;
    
    const cell = getCellFromEvent(event, gridRef);
    if (!cell) return;

    // Get direction of selection
    const dx = cell.x - startCell.x;
    const dy = cell.y - startCell.y;
    
    // Determine primary direction
    let direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = [Math.sign(dx), 0];
    } else if (Math.abs(dy) > Math.abs(dx)) {
      direction = [0, Math.sign(dy)];
    } else {
      direction = [Math.sign(dx), Math.sign(dy)];
    }

    // Generate cells in selection
    const cells = [];
    let curr = {...startCell};
    while (true) {
      cells.push({...curr});
      if (curr.x === cell.x && curr.y === cell.y) break;
      curr.x += direction[0];
      curr.y += direction[1];
      // Prevent infinite loops
      if (cells.length > GRID_SIZE * 2) break;
    }

    setCurrentSelection(cells);
  };

  const playSuccessSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../../assets/sound-effects/menu-select.mp3')
    );
    setSound(sound);
    await sound.playAsync();
  };

  const handleMouseUp = () => {
    if (currentSelection.length > 0) {
      const word = currentSelection.map(cell => grid[cell.x][cell.y]).join('');
      
      const forwards = word;
      const backwards = word.split('').reverse().join('');
      
      if ((words.includes(forwards) && !foundWords.includes(forwards)) ||
          (words.includes(backwards) && !foundWords.includes(backwards))) {
        
        const newWord = words.includes(forwards) ? forwards : backwards;
        setFoundWords(prev => [...prev, newWord]);
        playSuccessSound(); // Play sound when word is found
        
        if (foundWords.length + 1 === words.length) {
          onComplete();
        }
      }
    }
    
    setIsMouseDown(false);
    setStartCell(null);
    setCurrentSelection([]);
  };

  // Add helper function to get cells in a line
  const getLineCells = (start, end) => {
    const cells = [];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    if (steps === 0) return [start];

    const xStep = dx / steps;
    const yStep = dy / steps;

    for (let i = 0; i <= steps; i++) {
      cells.push({
        x: Math.round(start.x + xStep * i),
        y: Math.round(start.y + yStep * i)
      });
    }
    return cells;
  };

  // Add helper function to get word from cells
  const getWordFromCells = (cells) => {
    return cells.map(cell => grid[cell.x][cell.y]).join('');
  };

  // Add dynamic cell size calculation
  const [cellSize, setCellSize] = useState(45);
  const styles = useStyles(cellSize); // Move styles into a function that takes cellSize

  useEffect(() => {
    const updateCellSize = () => {
      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        const containerSize = Math.min(rect.width, rect.height);
        const newSize = Math.floor(containerSize / GRID_SIZE);
        setCellSize(newSize);
      }
    };

    updateCellSize();
    const resizeObserver = new ResizeObserver(updateCellSize);
    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.gameHeader}>
        <View style={styles.timerContainer}>
          <Image
            source={require('../../../assets/timer.gif')}
            style={styles.timerGif}
          />
          <Text style={styles.timer}>
            {Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}
          </Text>
        </View>
        <Text style={styles.foundCount}>
          Found: {foundWords.length}/{words.length}
        </Text>
      </View>

      <View style={styles.gameContent}>
        <View 
          ref={gridRef}
          style={styles.gridContainer}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {grid.map((row, x) => (
            <View key={x} style={styles.row}>
              {row.map((letter, y) => (
                <View
                  key={`${x}-${y}`}
                  style={[
                    styles.cell,
                    currentSelection.some(cell => cell.x === x && cell.y === y) && styles.selectedCell,
                    foundWords.some(word => {
                      const coords = getWordCoordinates(word, grid);
                      return coords.some(coord => coord.x === x && coord.y === y);
                    }) && styles.foundCell
                  ]}
                >
                  <Text style={styles.letter}>{letter}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.wordListContainer}>
          <Text style={styles.wordListTitle}>Find these words:</Text>
          <View style={styles.wordListContent}>
            {words.map(word => (
              <View key={word} style={styles.wordItem}>
                <Text style={[
                  styles.word,
                  foundWords.includes(word) && styles.foundWord
                ]}>
                  {word}
                </Text>
                {foundWords.includes(word) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

// Add this helper function to get coordinates for a found word
const getWordCoordinates = (word, grid) => {
  const coords = [];
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      // Check each direction
      for (const [dx, dy] of DIRECTIONS) {
        let found = true;
        const tempCoords = [];
        
        for (let k = 0; k < word.length; k++) {
          const x = i + dx * k;
          const y = j + dy * k;
          
          if (x < 0 || x >= grid.length || y < 0 || y >= grid[0].length ||
              grid[x][y] !== word[k]) {
            found = false;
            break;
          }
          tempCoords.push({ x, y });
        }
        
        if (found) {
          coords.push(...tempCoords);
          return coords;
        }
      }
    }
  }
  return coords;
};

// Move StyleSheet creation into a function that takes cellSize as parameter
const useStyles = (cellSize) => StyleSheet.create({
  container: {
    padding: 20,
  },
  timer: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    borderWidth: 2,
    borderColor: '#000',
    position: 'relative',
    cursor: 'pointer',
    userSelect: 'none',
    touchAction: 'none',
    flex: 2, // Reduce grid size relative to word list
    aspectRatio: 1, // Keep it square
    backgroundColor: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    margin: 0,
    overflow: 'hidden',
    maxHeight: '100%', // Ensure it doesn't overflow
  },
  row: {
    flexDirection: 'row',
    margin: 0,
    padding: 0,
    width: '100%',
    height: `${100/GRID_SIZE}%`,
  },
  cell: {
    width: `${100/GRID_SIZE}%`,
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    pointerEvents: 'none',
    cursor: 'pointer',
    margin: 0,
    padding: 0,
  },
  selectedCell: {
    backgroundColor: 'rgba(33, 150, 243, 0.5)',
    borderColor: '#1976D2',
  },
  foundCell: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  letter: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  foundLetter: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  wordList: {
    padding: 10,
  },
  wordListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  word: {
    fontSize: 16,
    marginVertical: 5,
  },
  foundWord: {
    textDecorationLine: 'line-through',
    color: '#4CAF50',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
  },
  gameContent: {
    flexDirection: 'row',
    gap: 20,
    height: '85%', // Ensure consistent height
    alignItems: 'flex-start', // Add this to align items at the top
  },
  wordListContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    height: '100%',
    maxHeight: '100%', // Ensure it doesn't overflow
    overflow: 'auto', // Add scrolling if needed
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  checkmark: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
  },
  foundCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    alignSelf: 'center'
  },
  timerGif: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  wordListContent: {
    flex: 1,
    justifyContent: 'flex-start',
  }
});
