import * as React from 'react';
import * as vscode from 'vscode';

const App: React.FC = () => {
  const [time, setTime] = React.useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime(time => time - 1);
      }, 1000);
    } else if (time === 0) {
      // Send message to extension
      vscode.postMessage({
        command: 'alert',
        text: 'Timer completed!'
      });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, time]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setTime(25 * 60);
    setIsActive(false);
  };

  return (
    <div className="container">
      <h1>Tomato Timer</h1>
      <div className="timer">
        {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
      </div>
      <div className="controls">
        <button onClick={toggleTimer}>
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button onClick={resetTimer}>
          Reset
        </button>
      </div>
    </div>
  );
};

export default App;
