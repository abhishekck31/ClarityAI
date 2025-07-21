
'use client'

import { useState } from 'react'
import { Sparkles, Send, RotateCw, Copy, Download } from 'lucide-react'

interface AnalysisResult {
  summary: string
  action_items: string[]
  deadlines: string[]
}

export default function Home() {
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to analyze')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/clarify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      const parsedResult = JSON.parse(data.ai_response)
      setResult(parsedResult)
    } catch (err) {
      setError('Failed to analyze text. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (result) {
      const text = `Summary: ${result.summary}\n\nAction Items:\n${result.action_items.map(item => `• ${item}`).join('\n')}\n\nDeadlines:\n${result.deadlines.map(item => `• ${item}`).join('\n')}`
      navigator.clipboard.writeText(text)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg gemini-gradient flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">ClarityAI</h1>
            </div>
            <div className="text-sm text-gray-500">
              AI-powered text analysis
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-120px)]">
          {/* Input Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-sm">✏️</span>
                </div>
                Input Text
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Paste your notes, emails, or any text for analysis
              </p>
            </div>
            
            <div className="flex-1 p-6">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter or paste your text here..."
                className="w-full h-full resize-none border-0 focus:ring-0 text-gray-900 placeholder-gray-400 text-sm leading-relaxed bg-transparent"
                style={{ outline: 'none' }}
              />
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleAnalyze}
                disabled={isLoading || !inputText.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Analyze Text</span>
                  </>
                )}
              </button>
              
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Output Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <span className="text-green-600 text-sm">🎯</span>
                  </div>
                  Analysis Results
                </h2>
                {result && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCopy}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy results"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Download results"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="shimmer h-4 rounded w-3/4"></div>
                  <div className="shimmer h-4 rounded w-1/2"></div>
                  <div className="shimmer h-4 rounded w-5/6"></div>
                  <div className="space-y-2 mt-6">
                    <div className="shimmer h-3 rounded w-1/4"></div>
                    <div className="shimmer h-3 rounded w-3/4"></div>
                    <div className="shimmer h-3 rounded w-2/3"></div>
                  </div>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="mr-2">📝</span>
                      Summary
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-gray-800 text-sm leading-relaxed">{result.summary}</p>
                    </div>
                  </div>

                  {/* Action Items */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="mr-2">✅</span>
                      Action Items
                    </h3>
                    {result.action_items.length > 0 ? (
                      <div className="space-y-2">
                        {result.action_items.map((item, index) => (
                          <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <p className="text-gray-800 text-sm">{item}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No action items identified</p>
                    )}
                  </div>

                  {/* Deadlines */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="mr-2">⏰</span>
                      Deadlines
                    </h3>
                    {result.deadlines.length > 0 ? (
                      <div className="space-y-2">
                        {result.deadlines.map((deadline, index) => (
                          <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <p className="text-gray-800 text-sm">{deadline}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No deadlines identified</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">Enter text to see analysis results</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
