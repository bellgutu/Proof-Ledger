
import React, { useState, useEffect } from 'react';

// Replaced react-icons/lu with inline SVG components to ensure compatibility.
const SendIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M15 15l7-7"/>
  </svg>
);

const LoaderIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const CheckIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/**
 * Generates a JSON payload for a "Mixed Gradual Movement" scenario.
 * The function creates a series of upward and downward movements that undulate between
 * a defined low and high point over a specified time frame.
 * @param {number} highPoint The maximum magnitude for upward movements.
 * @param {number} lowPoint The maximum magnitude for downward movements.
 * @param {number} timeFrame The total time in minutes for the scenario.
 * @returns {object} The generated JSON payload object.
 */
const generateMixedGradualMovement = (highPoint, lowPoint, timeFrame) => {
  const movements = [];
  const now = Date.now();
  // We'll create 8 data points for a smooth, undulating pattern.
  const numberOfPoints = 8;
  const intervalMs = (timeFrame * 60 * 1000) / (numberOfPoints - 1);

  // Generate the movements with varying magnitudes within the high and low bounds.
  for (let i = 0; i < numberOfPoints; i++) {
    const timestamp = new Date(now + i * intervalMs).toISOString();
    let direction, magnitude;

    // Alternate between upward and downward movements
    if (i % 2 === 0) {
      direction = "upward";
      // Magnitude is a random value between 0 and the high point
      magnitude = Math.floor(Math.random() * highPoint) + 1;
    } else {
      direction = "downward";
      // Magnitude is a random value between 0 and the low point
      magnitude = Math.floor(Math.random() * lowPoint) + 1;
    }
    movements.push({ direction, magnitude, timestamp });
  }

  return {
    scenario_name: "Mixed Gradual Movement Test",
    movements: movements
  };
};

/**
 * Generates a JSON payload for a "Slow Movement" scenario.
 * This function creates a simple, non-volatile up-and-down pattern
 * with timestamps spaced far apart.
 * @param {number} highPoint The maximum magnitude for the upward movement.
 * @param {number} lowPoint The maximum magnitude for the downward movement.
 * @param {number} timeFrame The total time in minutes for the scenario.
 * @returns {object} The generated JSON payload object.
 */
const generateSlowMovement = (highPoint, lowPoint, timeFrame) => {
  const now = Date.now();
  const movements = [
    {
      direction: "upward",
      magnitude: highPoint,
      timestamp: new Date(now).toISOString()
    },
    {
      direction: "downward",
      magnitude: lowPoint,
      timestamp: new Date(now + (timeFrame / 2) * 60 * 1000).toISOString()
    },
    {
      direction: "upward",
      magnitude: highPoint,
      timestamp: new Date(now + timeFrame * 60 * 1000).toISOString()
    }
  ];

  return {
    scenario_name: "Slow Movement Test",
    movements: movements
  };
};


// Main App component
const App = () => {
  // State variables for managing the app's UI and data
  const [apiURL, setApiURL] = useState('http://localhost:8545/api/log');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  // New state for user inputs
  const [highPoint, setHighPoint] = useState(50);
  const [lowPoint, setLowPoint] = useState(25);
  const [timeFrame, setTimeFrame] = useState(10);
  const [scenarioType, setScenarioType] = useState('uptrend');

  // State to hold the generated request body as a string
  const [requestBody, setRequestBody] = useState('');

  // Use a useEffect hook to update the request body whenever inputs change
  useEffect(() => {
    let payload;
    if (scenarioType === 'mixed') {
      payload = generateMixedGradualMovement(highPoint, lowPoint, timeFrame);
    } else if (['uptrend', 'downtrend', 'normal'].includes(scenarioType)) {
      payload = { command: scenarioType };
    }
    else {
      payload = generateSlowMovement(highPoint, lowPoint, timeFrame);
    }
    setRequestBody(JSON.stringify(payload, null, 2));
  }, [highPoint, lowPoint, timeFrame, scenarioType]);


  /**
   * Handles the data submission to the API.
   * This is an async function to handle the fetch promise.
   */
  const handleSendData = async () => {
    // Reset state before starting a new request
    setLoading(true);
    setResponse(null);
    setError(null);

    // Parse the JSON from the request body string
    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch (err) {
      setLoading(false);
      setError('Invalid JSON format. Please check your syntax.');
      return;
    }

    try {
      const res = await fetch(apiURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parsedBody)
      });

      // Get the response data
      const data = await res.json();
      
      // Update state with the response
      setResponse({
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        body: data
      });

      // Handle non-OK responses
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      // ** THE CRUCIAL STEP **
      // If the API call is successful, set the command in localStorage
      // This will be detected by the ProfitForge app.
      if (parsedBody.command) {
        localStorage.setItem('price_scenario_command', parsedBody.command);
      }


    } catch (err) {
      // Catch and display any errors
      setError(err.message);
    } finally {
      // Set loading to false once the request is complete
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans antialiased flex flex-col items-center">
      <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            API Data Sender
          </h1>
          <p className="mt-2 text-gray-400">
            Generate and send custom JSON scenarios with a simple interface.
          </p>
        </div>

        {/* Input Controls */}
        <div className="bg-gray-700 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-200">Scenario Builder</h2>
          <div className="flex flex-col space-y-2">
            <label htmlFor="scenario-type" className="block text-sm font-medium text-gray-300">
              Scenario Type
            </label>
            <select
              id="scenario-type"
              className="w-full bg-gray-600 border border-gray-500 rounded-lg py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={scenarioType}
              onChange={(e) => setScenarioType(e.target.value)}
            >
              <option value="uptrend">Simple Uptrend</option>
              <option value="downtrend">Simple Downtrend</option>
              <option value="normal">Normal (Reset)</option>
              <option value="mixed">Mixed Gradual Movement</option>
              <option value="slow">Slow Movement</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col space-y-2">
              <label htmlFor="high-point" className="block text-sm font-medium text-gray-300">
                High Point Magnitude
              </label>
              <input
                type="number"
                id="high-point"
                className="w-full bg-gray-600 border border-gray-500 rounded-lg py-2 px-3 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={highPoint}
                onChange={(e) => setHighPoint(Number(e.target.value))}
                disabled={['normal', 'uptrend', 'downtrend'].includes(scenarioType)}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="low-point" className="block text-sm font-medium text-gray-300">
                Low Point Magnitude
              </label>
              <input
                type="number"
                id="low-point"
                className="w-full bg-gray-600 border border-gray-500 rounded-lg py-2 px-3 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={lowPoint}
                onChange={(e) => setLowPoint(Number(e.target.value))}
                disabled={['normal', 'uptrend', 'downtrend'].includes(scenarioType)}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="time-frame" className="block text-sm font-medium text-gray-300">
                Time Frame (minutes)
              </label>
              <input
                type="number"
                id="time-frame"
                className="w-full bg-gray-600 border border-gray-500 rounded-lg py-2 px-3 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={timeFrame}
                onChange={(e) => setTimeFrame(Number(e.target.value))}
                disabled={['normal', 'uptrend', 'downtrend'].includes(scenarioType)}
              />
            </div>
          </div>
        </div>

        {/* URL Input & Send Button */}
        <div className="space-y-4">
          <label htmlFor="api-url" className="block text-sm font-medium text-gray-300">
            API Endpoint URL
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              id="api-url"
              className="flex-grow bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={apiURL}
              onChange={(e) => setApiURL(e.target.value)}
              placeholder="e.g., https://api.example.com/data"
            />
            <button
              onClick={handleSendData}
              disabled={loading}
              className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <LoaderIcon className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <SendIcon className="w-5 h-5 mr-2" />
                  Send Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Display Area */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Request Body Display */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-200 mb-4">Generated Request Body</h2>
            <pre className="bg-gray-900 text-purple-300 rounded-lg p-4 text-sm overflow-x-auto min-h-[200px] border border-dashed border-gray-600">
              {requestBody}
            </pre>
          </div>

          {/* Response Display */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-200 mb-4 flex items-center">
              API Response
              {response && (
                <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${response.ok ? 'bg-green-500 text-green-900' : 'bg-red-500 text-red-900'}`}>
                  {response.status}
                </span>
              )}
            </h2>
            <div className="min-h-[200px] flex flex-col justify-center items-center">
              {loading ? (
                <div className="text-center text-gray-400">
                  <LoaderIcon className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
                  <p className="mt-2">Waiting for response...</p>
                </div>
              ) : error ? (
                <div className="text-center text-red-400">
                  <XIcon className="w-10 h-10 mx-auto" />
                  <p className="mt-2 font-semibold">Error:</p>
                  <p className="text-sm">{error}</p>
                </div>
              ) : response ? (
                <>
                  <div className="w-full flex justify-center text-green-400 mb-4">
                    <CheckIcon className="w-10 h-10" />
                  </div>
                  <pre className="bg-gray-900 text-green-300 rounded-lg p-4 text-sm overflow-x-auto w-full">
                    {JSON.stringify(response.body, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="text-center text-gray-400">
                  <p>Response will appear here after you send the data.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
