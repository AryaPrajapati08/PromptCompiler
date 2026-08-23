import { useEffect, useRef, useState } from 'react'
import './App.css'

/*
  BACKEND CONNECTION
  ------------------
  On Render, set:
  VITE_BACKEND_URL=https://promptcompiler-8bop.onrender.com

  The fallback below also makes the app work even if
  the environment variable is not set.
*/
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://promptcompiler-8bop.onrender.com'

function App() {
  // =========================================
  // BASIC STATE
  // =========================================

  const [prompt, setPrompt] = useState('')
  const [compiled, setCompiled] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [activeStep, setActiveStep] = useState(0)

  // =========================================
  // COMPILER RESULT STATE
  // =========================================

  const [intentData, setIntentData] = useState(null)
  const [taskPlan, setTaskPlan] = useState([])
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [verification, setVerification] = useState(null)

  // =========================================
  // IMPROVE PROMPT STATE
  // =========================================

  const [improving, setImproving] = useState(false)
  const [improvedPrompt, setImprovedPrompt] = useState('')
  const [copied, setCopied] = useState(false)
  const [improvedCopied, setImprovedCopied] = useState(false)

  // =========================================
  // PROMPT HISTORY
  // =========================================

  const [promptHistory, setPromptHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem(
        'promptCompilerHistory'
      )

      return savedHistory
        ? JSON.parse(savedHistory)
        : []
    } catch (error) {
      return []
    }
  })

  const [showAddStep, setShowAddStep] = useState(false)
  const [newStep, setNewStep] = useState('')

  // =========================================
  // STARTUP
  // =========================================

  const [starting, setStarting] = useState(true)
  const [progress, setProgress] = useState(0)

  // =========================================
  // REFS
  // =========================================

  const detailsRef = useRef(null)
  const workflowRef = useRef(null)

  // =========================================
  // SAVE HISTORY
  // =========================================

  useEffect(() => {
    try {
      localStorage.setItem(
        'promptCompilerHistory',
        JSON.stringify(promptHistory)
      )
    } catch (error) {
      console.error(
        'Could not save prompt history:',
        error
      )
    }
  }, [promptHistory])

  // =========================================
  // STARTUP ANIMATION
  // =========================================

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        const newProgress = Math.min(
          oldProgress + 2,
          100
        )

        if (newProgress === 100) {
          clearInterval(timer)

          setTimeout(() => {
            setStarting(false)
          }, 700)
        }

        return newProgress
      })
    }, 35)

    return () => clearInterval(timer)
  }, [])

  // =========================================
  // SAVE CURRENT PROMPT TO HISTORY
  // =========================================

  const saveToHistory = (userPrompt, resultData) => {
    const historyItem = {
      id: Date.now(),

      prompt: userPrompt,

      subject:
        resultData?.intent?.subject ||
        'General task',

      goal:
        resultData?.intent?.goal ||
        'General request',

      generatedPrompt:
        resultData?.generated_prompt ||
        '',

      timestamp:
        new Date().toLocaleString(),
    }

    setPromptHistory((previousHistory) => {
      const filteredHistory =
        previousHistory.filter(
          (item) =>
            item.prompt.trim().toLowerCase() !==
            userPrompt.trim().toLowerCase()
        )

      return [
        historyItem,
        ...filteredHistory,
      ].slice(0, 20)
    })
  }

  // =========================================
  // LOAD HISTORY ITEM
  // =========================================

  const loadHistoryItem = (item) => {
    setPrompt(item.prompt)

    setIntentData({
      goal:
        item.goal ||
        'General task',

      subject:
        item.subject ||
        'General task',

      duration:
        'Not specified',

      output:
        'Structured workflow',
    })

    setGeneratedPrompt(
      item.generatedPrompt || ''
    )

    setTaskPlan([])
    setVerification(null)
    setImprovedPrompt('')
    setCompiled(true)
    setError('')
    setActiveStep(5)

    setTimeout(() => {
      detailsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 200)
  }

  // =========================================
  // DELETE HISTORY ITEM
  // =========================================

  const deleteHistoryItem = (id) => {
    setPromptHistory((previousHistory) =>
      previousHistory.filter(
        (item) => item.id !== id
      )
    )
  }

  // =========================================
  // CLEAR HISTORY
  // =========================================

  const clearHistory = () => {
    if (promptHistory.length === 0) {
      return
    }

    const confirmed = window.confirm(
      'Clear all PromptCompiler history?'
    )

    if (!confirmed) {
      return
    }

    setPromptHistory([])
  }

  // =========================================
  // COPY GENERATED PROMPT
  // =========================================

  const copyGeneratedPrompt = async () => {
    if (!generatedPrompt) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        generatedPrompt
      )

      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error(
        'Copy failed:',
        error
      )

      setError(
        'Could not copy the generated prompt.'
      )
    }
  }

  // =========================================
  // COPY IMPROVED PROMPT
  // =========================================

  const copyImprovedPrompt = async () => {
    if (!improvedPrompt) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        improvedPrompt
      )

      setImprovedCopied(true)

      setTimeout(() => {
        setImprovedCopied(false)
      }, 2000)
    } catch (error) {
      console.error(
        'Copy failed:',
        error
      )

      setError(
        'Could not copy the improved prompt.'
      )
    }
  }

  // =========================================
  // IMPROVE PROMPT
  // =========================================

  const improvePrompt = async () => {
    if (!prompt.trim()) {
      return
    }

    setImproving(true)
    setError('')

    try {
      const response = await fetch(
        `${BACKEND_URL}/improve`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            prompt: prompt,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(
          `Improvement request failed: ${response.status}`
        )
      }

      const data =
        await response.json()

      setImprovedPrompt(
        data.improved_prompt || ''
      )
    } catch (error) {
      console.error(
        'Improve prompt error:',
        error
      )

      setError(
        'Could not improve the prompt. Check that the backend is running and CORS is configured.'
      )
    } finally {
      setImproving(false)
    }
  }

  // =========================================
  // DOWNLOAD GENERATED PROMPT
  // =========================================

  const downloadGeneratedPrompt = () => {
    if (!generatedPrompt) {
      return
    }

    const blob = new Blob(
      [generatedPrompt],
      {
        type: 'text/plain',
      }
    )

    const url =
      URL.createObjectURL(blob)

    const link =
      document.createElement('a')

    link.href = url
    link.download =
      'generated-prompt.txt'

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  // =========================================
  // DOWNLOAD IMPROVED PROMPT
  // =========================================

  const downloadImprovedPrompt = () => {
    if (!improvedPrompt) {
      return
    }

    const blob = new Blob(
      [improvedPrompt],
      {
        type: 'text/plain',
      }
    )

    const url =
      URL.createObjectURL(blob)

    const link =
      document.createElement('a')

    link.href = url

    link.download =
      'improved-prompt.txt'

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  // =========================================
  // COMPILE WORKFLOW
  // =========================================

  const compileWorkflow = async () => {
    if (!prompt.trim()) {
      setError(
        'No intent detected. Enter something for the compiler to process.'
      )

      return
    }

    setError('')
    setRunning(true)
    setCompiled(false)
    setActiveStep(1)

    setIntentData(null)
    setTaskPlan([])
    setGeneratedPrompt('')
    setVerification(null)
    setImprovedPrompt('')

    try {
      /*
        IMPORTANT:
        We use BACKEND_URL here instead of
        127.0.0.1:8000.
      */

      const response = await fetch(
        `${BACKEND_URL}/compile`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            prompt: prompt,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(
          `Backend request failed: ${response.status}`
        )
      }

      const data =
        await response.json()

      console.log(
        'Backend response:',
        data
      )

      // =====================================
      // GET DATA FROM BACKEND
      // =====================================

      setIntentData(
        data.intent || null
      )

      setTaskPlan(
        Array.isArray(data.tasks)
          ? data.tasks
          : []
      )

      setGeneratedPrompt(
        data.generated_prompt || ''
      )

      setVerification(
        data.verification || null
      )

      // =====================================
      // SAVE TO HISTORY
      // =====================================

      saveToHistory(
        prompt,
        data
      )

      // =====================================
      // COMPILER ANIMATION
      // =====================================

      setActiveStep(2)

      setTimeout(() => {
        setActiveStep(3)
      }, 800)

      setTimeout(() => {
        setActiveStep(4)
      }, 1600)

      setTimeout(() => {
        setRunning(false)
        setCompiled(true)
        setActiveStep(5)

        setTimeout(() => {
          detailsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }, 300)
      }, 2400)

    } catch (error) {
      console.error(
        'Compile error:',
        error
      )

      setRunning(false)

      setError(
        'Could not connect to the PromptCompiler backend. Check your backend URL and CORS settings.'
      )
    }
  }

  // =========================================
  // ADD STEP
  // =========================================

  const addStep = () => {
    if (!newStep.trim()) {
      return
    }

    setTaskPlan((previousTasks) => [
      ...previousTasks,
      newStep.trim(),
    ])

    setNewStep('')
    setShowAddStep(false)
  }

  // =========================================
  // RECOMPILE
  // =========================================

  const recompileWorkflow = () => {
    if (!prompt.trim()) {
      setError(
        'Enter a prompt before recompiling.'
      )

      return
    }

    compileWorkflow()
  }

  // =========================================
  // RETURN
  // =========================================

  return (
    <>
      {/* =====================================
          STARTUP SCREEN
      ===================================== */}

      {starting && (
        <div className="startup-screen">
          <div className="startup-glow"></div>

          <div className="startup-content">
            <div className="startup-logo">
              <span>
                &lt;/&gt;
              </span>
            </div>

            <h1 className="startup-title">
              Prompt
              <span>
                Compiler
              </span>
            </h1>

            <p className="startup-subtitle">
              AI Workflow Engine
            </p>

            <div className="compiler-status">
              <div className="startup-status-dot"></div>

              <span>
                {progress < 25
                  ? 'Initializing compiler...'
                  : progress < 50
                  ? 'Loading AI engine...'
                  : progress < 75
                  ? 'Analyzing prompt system...'
                  : progress < 100
                  ? 'Compiling interface...'
                  : 'PromptCompiler ready.'}
              </span>
            </div>

            <div className="progress-container">
              <div
                className="progress-bar"
                style={{
                  width: `${progress}%`,
                }}
              ></div>
            </div>

            <div className="progress-percent">
              {progress}%
            </div>
          </div>
        </div>
      )}

      {/* =====================================
          MAIN PROMPTCOMPILER
      ===================================== */}

      <div className="compiler">

        {/* ===================================
            HEADER
        =================================== */}

        <header className="topbar">
          <div className="brand">
            <div className="brand-icon">
              🤖
            </div>

            <div>
              <h2>
                PromptCompiler
              </h2>

              <span>
                AI Workflow Engine
              </span>
            </div>
          </div>

          <div className="system-status">
            <span className="status-dot"></span>
            SYSTEM READY
          </div>
        </header>

        {/* ===================================
            MAIN WORKSPACE
        =================================== */}

        <main className="workspace">

          {/* =================================
              SIDEBAR
          ================================= */}

          <aside className="sidebar">

            <div className="panel-title">
              <span>
                01
              </span>

              INTENT INPUT
            </div>

            <h1>
              Compile your intent.
            </h1>

            <p className="description">
              Describe what you want AI to accomplish.
              PromptCompiler will transform it into a
              structured workflow.
            </p>

            <textarea
              value={prompt}
              onChange={(event) =>
                setPrompt(event.target.value)
              }
              placeholder={`Example:

I have an exam in 5 days.
Teach me DBMS and create
practice questions.`}
            />

            <button
              className="compile-button"
              onClick={compileWorkflow}
              disabled={running}
            >
              {running
                ? '⟳ Compiling...'
                : '⚡ Compile Workflow'}
            </button>

            {/* =================================
                ERROR
            ================================= */}

            {error && (
              <div className="compiler-error">
                <div className="error-icon">
                  !
                </div>

                <div>
                  <strong>
                    COMPILER WARNING
                  </strong>

                  <p>
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* =================================
                COMPILER LOG
            ================================= */}

            <div className="compiler-log">

              <div className="log-title">
                COMPILER LOG
              </div>

              <div className="log-line">
                <span className="check">
                  ✓
                </span>

                Compiler initialized
              </div>

              <div className="log-line">
                <span className="check">
                  ✓
                </span>

                Intent parser ready
              </div>

              <div className="log-line">
                <span className="check">
                  ✓
                </span>

                Workflow engine ready
              </div>

              {running && (
                <div className="log-line running">
                  <span>
                    ⟳
                  </span>

                  Compiling request...
                </div>
              )}

              {compiled && (
                <>
                  <div className="log-line">
                    <span className="check">
                      ✓
                    </span>

                    Intent detected
                  </div>

                  <div className="log-line">
                    <span className="check">
                      ✓
                    </span>

                    Workflow generated
                  </div>
                </>
              )}
            </div>

            {/* =================================
                PROMPT HISTORY
            ================================= */}

            <div className="prompt-history">

              <div className="history-header">

                <div className="history-title">
                  <span>
                    02
                  </span>

                  PROMPT HISTORY
                </div>

                {promptHistory.length > 0 && (
                  <button
                    className="clear-history-button"
                    onClick={clearHistory}
                  >
                    Clear
                  </button>
                )}
              </div>

              {promptHistory.length === 0 ? (
                <div className="history-empty">

                  <div className="history-empty-icon">
                    ◷
                  </div>

                  <p>
                    No prompts compiled yet.
                    Your history will appear here.
                  </p>

                </div>
              ) : (
                <div className="history-list">

                  {promptHistory.map((item) => (
                    <div
                      className="history-item"
                      key={item.id}
                      onClick={() =>
                        loadHistoryItem(item)
                      }
                    >

                      <div className="history-item-icon">
                        AI
                      </div>

                      <div className="history-item-content">

                        <div className="history-item-prompt">
                          {item.prompt}
                        </div>

                        <div className="history-item-meta">

                          <span>
                            {item.subject}
                          </span>

                          <span>
                            {item.timestamp}
                          </span>

                        </div>

                      </div>

                      <button
                        className="history-delete"
                        onClick={(event) => {
                          event.stopPropagation()

                          deleteHistoryItem(
                            item.id
                          )
                        }}
                        title="Delete"
                      >
                        ×
                      </button>

                    </div>
                  ))}

                </div>
              )}

            </div>

          </aside>

          {/* =================================
              RIGHT CANVAS
          ================================= */}

          <section className="canvas">

            {/* =================================
                CANVAS HEADER
            ================================= */}

            <div className="canvas-header">

              <div>
                <span className="panel-label">
                  WORKFLOW CANVAS
                </span>

                <h2>
                  {compiled
                    ? 'Compiled workflow'
                    : 'Waiting for input'}
                </h2>
              </div>

              <div className="canvas-actions">

                <button
                  onClick={() =>
                    setShowAddStep(true)
                  }
                >
                  ＋ Add Step
                </button>

                <button
                  onClick={recompileWorkflow}
                  disabled={
                    running ||
                    !prompt.trim()
                  }
                >
                  ↻ Recompile
                </button>

              </div>
            </div>

            {/* =================================
                ADD STEP
            ================================= */}

            {showAddStep && (
              <div className="add-step-box">

                <input
                  type="text"
                  value={newStep}
                  onChange={(event) =>
                    setNewStep(
                      event.target.value
                    )
                  }
                  placeholder="Enter a new workflow step..."
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      addStep()
                    }
                  }}
                />

                <button
                  onClick={addStep}
                >
                  Add
                </button>

                <button
                  onClick={() => {
                    setShowAddStep(false)
                    setNewStep('')
                  }}
                >
                  Cancel
                </button>

              </div>
            )}

            {/* =================================
                INTENT ANALYSIS
            ================================= */}

            {intentData && (
              <div
                className="intent-panel"
                ref={detailsRef}
              >

                <div className="intent-header">

                  <div className="intent-icon">
                    🧠
                  </div>

                  <div>
                    <span>
                      INTENT ANALYSIS
                    </span>

                    <h3>
                      What the compiler understood
                    </h3>
                  </div>

                </div>

                <div className="intent-grid">

                  <div className="intent-item">
                    <span>
                      GOAL
                    </span>

                    <strong>
                      {intentData.goal}
                    </strong>
                  </div>

                  <div className="intent-item">
                    <span>
                      SUBJECT
                    </span>

                    <strong>
                      {intentData.subject}
                    </strong>
                  </div>

                  <div className="intent-item">
                    <span>
                      DURATION
                    </span>

                    <strong>
                      {intentData.duration}
                    </strong>
                  </div>

                  <div className="intent-item">
                    <span>
                      OUTPUT
                    </span>

                    <strong>
                      {intentData.output}
                    </strong>
                  </div>

                </div>
              </div>
            )}

            {/* =================================
                TASK PLANNING
            ================================= */}

            {taskPlan.length > 0 && (
              <div className="task-panel">

                <div className="task-header">

                  <div className="task-icon">
                    🗺️
                  </div>

                  <div>
                    <span>
                      TASK PLANNING
                    </span>

                    <h3>
                      Execution plan generated
                    </h3>
                  </div>

                </div>

                <div className="task-list">

                  {taskPlan.map(
                    (task, index) => (
                      <div
                        className="task-item"
                        key={index}
                      >

                        <div className="task-number">
                          {String(
                            index + 1
                          ).padStart(2, '0')}
                        </div>

                        <div className="task-text">
                          {task}
                        </div>

                      </div>
                    )
                  )}

                </div>
              </div>
            )}

            {/* =================================
                GENERATED PROMPT
            ================================= */}

            {generatedPrompt && (
              <div className="generated-prompt-panel">

                <div className="generated-prompt-header">

                  <div className="generated-prompt-icon">
                    ⚡
                  </div>

                  <div>
                    <span>
                      GENERATED PROMPT
                    </span>

                    <h3>
                      Optimized prompt produced by the compiler
                    </h3>
                  </div>

                </div>

                <div className="generated-prompt-content">

                  <div className="generated-prompt-actions">

                    <button
                      onClick={
                        copyGeneratedPrompt
                      }
                    >
                      {copied
                        ? '✓ Copied'
                        : '⧉ Copy Prompt'}
                    </button>

                    <button
                      className="download-prompt-button"
                      onClick={
                        downloadGeneratedPrompt
                      }
                    >
                      ↓ Download Prompt
                    </button>

                  </div>

                  <pre>
                    {generatedPrompt}
                  </pre>

                </div>
              </div>
            )}

            {/* =================================
                QUALITY ANALYSIS
            ================================= */}

            {verification && (
              <div className="quality-panel">

                <div className="quality-header">

                  <div className="quality-icon">
                    ◈
                  </div>

                  <div>
                    <span>
                      PROMPT QUALITY
                    </span>

                    <h3>
                      Quality analysis
                    </h3>
                  </div>

                </div>

                <div className="quality-score-row">

                  <div>
                    <div className="quality-label">
                      QUALITY SCORE
                    </div>

                    <div className="quality-score">
                      {verification.score || 0}

                      <span>
                        /100
                      </span>
                    </div>
                  </div>

                  <div
                    className={`quality-badge ${
                      (verification.score || 0) >= 90
                        ? 'excellent'
                        : (verification.score || 0) >= 75
                        ? 'good'
                        : (verification.score || 0) >= 50
                        ? 'improve'
                        : 'weak'
                    }`}
                  >
                    {(verification.score || 0) >= 90
                      ? 'Excellent'
                      : (verification.score || 0) >= 75
                      ? 'Good'
                      : (verification.score || 0) >= 50
                      ? 'Needs Improvement'
                      : 'Weak'}
                  </div>

                </div>

                {verification.checks &&
                  verification.checks.length > 0 && (
                    <div className="quality-section">

                      <div className="quality-section-title">
                        CHECKS PASSED
                      </div>

                      <div className="quality-list">

                        {verification.checks.map(
                          (check, index) => (
                            <div
                              className="quality-check"
                              key={index}
                            >
                              <span>
                                ✓
                              </span>

                              {check}
                            </div>
                          )
                        )}

                      </div>
                    </div>
                  )}

                <div className="improve-prompt-action">

                  <button
                    className="improve-prompt-button"
                    onClick={
                      improvePrompt
                    }
                    disabled={improving}
                  >
                    {improving
                      ? '⟳ Improving...'
                      : '✨ Improve Prompt'}
                  </button>

                </div>

              </div>
            )}

            {/* =================================
                IMPROVED PROMPT
            ================================= */}

            {improvedPrompt && (
              <div className="improved-prompt-panel">

                <div className="improved-prompt-header">

                  <div className="improved-prompt-icon">
                    ✨
                  </div>

                  <div>
                    <span>
                      IMPROVED PROMPT
                    </span>

                    <h3>
                      Enhanced version of your prompt
                    </h3>
                  </div>

                </div>

                <div className="improved-prompt-content">

                  <div className="improved-prompt-actions">

                    <button
                      onClick={
                        copyImprovedPrompt
                      }
                    >
                      {improvedCopied
                        ? '✓ Copied'
                        : '⧉ Copy Improved Prompt'}
                    </button>

                    <button
                      className="download-prompt-button"
                      onClick={
                        downloadImprovedPrompt
                      }
                    >
                      ↓ Download Prompt
                    </button>

                  </div>

                  <pre>
                    {improvedPrompt}
                  </pre>

                </div>
              </div>
            )}

            {/* =================================
                VERIFICATION
            ================================= */}

            {verification && (
              <div className="verification-panel">

                <div className="verification-header">

                  <div className="verification-icon">
                    ✓
                  </div>

                  <div>
                    <span>
                      VERIFICATION
                    </span>

                    <h3>
                      Prompt Quality Check
                    </h3>
                  </div>

                </div>

                <div className="verification-score">

                  <div className="verification-status">
                    {verification.status}
                  </div>

                  <div className="verification-number">

                    {verification.score}

                    <span>
                      /100
                    </span>

                  </div>

                </div>

                <div className="verification-checks">

                  {verification.checks &&
                    verification.checks.map(
                      (check, index) => (
                        <div
                          className="verification-check"
                          key={index}
                        >

                          <span>
                            ✓
                          </span>

                          {check}

                        </div>
                      )
                    )}

                </div>

              </div>
            )}

            {/* =================================
                WORKFLOW
            ================================= */}

            <div
              className="workflow-area"
              ref={workflowRef}
            >

              {/* STEP 01 */}

              <div className="workflow-node">

                <div className="node-icon">
                  🧠
                </div>

                <div className="node-content">

                  <div className="node-top">

                    <span>
                      STEP 01
                    </span>

                    <span
                      className={
                        activeStep === 1
                          ? 'node-status processing'
                          : activeStep > 1
                          ? 'node-status success'
                          : 'node-status'
                      }
                    >
                      {activeStep === 1
                        ? 'ANALYZING...'
                        : activeStep > 1
                        ? 'COMPLETE'
                        : 'READY'}
                    </span>

                  </div>

                  <h3>
                    Intent Analysis
                  </h3>

                  <p>
                    Understand the user's goal,
                    context and requirements.
                  </p>

                </div>
              </div>

              <div className="connector">
                ↓
              </div>

              {/* STEP 02 */}

              <div className="workflow-node">

                <div className="node-icon">
                  🗺️
                </div>

                <div className="node-content">

                  <div className="node-top">

                    <span>
                      STEP 02
                    </span>

                    <span
                      className={
                        activeStep === 2
                          ? 'node-status processing'
                          : activeStep > 2
                          ? 'node-status success'
                          : 'node-status'
                      }
                    >
                      {activeStep === 2
                        ? 'PLANNING...'
                        : activeStep > 2
                        ? 'COMPLETE'
                        : 'READY'}
                    </span>

                  </div>

                  <h3>
                    Task Planning
                  </h3>

                  <p>
                    Break the request into smaller
                    executable AI tasks.
                  </p>

                </div>
              </div>

              <div className="connector">
                ↓
              </div>

              {/* STEP 03 */}

              <div className="workflow-node">

                <div className="node-icon">
                  ⚡
                </div>

                <div className="node-content">

                  <div className="node-top">

                    <span>
                      STEP 03
                    </span>

                    <span
                      className={
                        activeStep === 3
                          ? 'node-status processing'
                          : activeStep > 3
                          ? 'node-status success'
                          : 'node-status'
                      }
                    >
                      {activeStep === 3
                        ? 'GENERATING...'
                        : activeStep > 3
                        ? 'COMPLETE'
                        : 'READY'}
                    </span>

                  </div>

                  <h3>
                    Prompt Generation
                  </h3>

                  <p>
                    Create specialized prompts
                    for each task.
                  </p>

                </div>
              </div>

              <div className="connector">
                ↓
              </div>

              {/* STEP 04 */}

              <div className="workflow-node">

                <div className="node-icon">
                  ✓
                </div>

                <div className="node-content">

                  <div className="node-top">

                    <span>
                      STEP 04
                    </span>

                    <span
                      className={
                        activeStep === 4
                          ? 'node-status processing'
                          : activeStep >= 5
                          ? 'node-status success'
                          : 'node-status'
                      }
                    >
                      {activeStep === 4
                        ? 'VERIFYING...'
                        : activeStep >= 5
                        ? 'VERIFIED'
                        : 'WAITING'}
                    </span>

                  </div>

                  <h3>
                    Verification
                  </h3>

                  <p>
                    Check the generated result and
                    improve weak outputs.
                  </p>

                </div>
              </div>

            </div>

            {/* =================================
                RESULT
            ================================= */}

            {compiled && (
              <div className="result-panel">

                <div className="result-header">

                  <div>

                    <span>
                      BUILD SUCCESSFUL
                    </span>

                    <h3>
                      Workflow compiled successfully.
                    </h3>

                  </div>

                  <div className="success-icon">
                    ✓
                  </div>

                </div>

                <div className="result-content">

                  <div className="result-item">

                    <span>
                      Goal
                    </span>

                    <strong>
                      {intentData?.goal ||
                        'Understand and prepare for the requested task'}
                    </strong>

                  </div>

                  <div className="result-item">

                    <span>
                      Tasks generated
                    </span>

                    <strong>
                      {taskPlan.length}
                    </strong>

                  </div>

                  <div className="result-item">

                    <span>
                      Verification
                    </span>

                    <strong>
                      {verification?.status ||
                        'Passed'}
                    </strong>

                  </div>

                </div>
              </div>
            )}

          </section>
        </main>
      </div>
    </>
  )
}

export default App
