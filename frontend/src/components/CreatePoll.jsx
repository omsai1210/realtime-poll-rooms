import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function CreatePoll() {
    const navigate = useNavigate()
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState(['', ''])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [createdId, setCreatedId] = useState(null)
    const [copied, setCopied] = useState(false)

    const handleOptionChange = (index, value) => {
        const updated = [...options]
        updated[index] = value
        setOptions(updated)
    }

    const addOption = () => setOptions([...options, ''])

    const removeOption = (index) => {
        if (options.length <= 2) return
        setOptions(options.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        const filledOptions = options.map(o => o.trim()).filter(o => o.length > 0)
        if (!question.trim()) {
            setError('Please enter a question.')
            return
        }
        if (filledOptions.length < 2) {
            setError('Please fill in at least 2 options.')
            return
        }

        setLoading(true)
        try {
            const res = await axios.post('/api/polls', {
                question: question.trim(),
                options: filledOptions,
            })
            setCreatedId(res.data.id)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create poll.')
        } finally {
            setLoading(false)
        }
    }

    const pollUrl = createdId ? `${window.location.origin}/poll/${createdId}` : ''

    const copyLink = () => {
        navigator.clipboard.writeText(pollUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // ---------- SUCCESS VIEW ----------
    if (createdId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Poll Created!</h2>
                    <p className="text-gray-600 text-sm">Share the link below to start collecting votes.</p>

                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-3">
                        <input
                            readOnly
                            value={pollUrl}
                            className="flex-1 bg-transparent text-gray-700 text-sm outline-none truncate"
                        />
                        <button
                            onClick={copyLink}
                            className="shrink-0 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors cursor-pointer"
                        >
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>

                    <button
                        onClick={() => navigate(`/poll/${createdId}`)}
                        className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors cursor-pointer"
                    >
                        Go to Poll →
                    </button>

                    <button
                        onClick={() => { setCreatedId(null); setQuestion(''); setOptions(['', '']); }}
                        className="text-gray-600 hover:text-orange-500 text-sm transition-colors cursor-pointer"
                    >
                        Create another poll
                    </button>
                </div>
            </div>
        )
    }

    // ---------- CREATE FORM VIEW ----------
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-extrabold text-gray-800">
                        Create a Poll
                    </h1>
                    <p className="text-gray-600 text-sm">Ask a question, add options, share instantly.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Question */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700">Your Question</label>
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. What's for lunch?"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                        />
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Options</label>
                        {options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-gray-500 text-sm font-mono w-6 text-right">{i + 1}.</span>
                                <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleOptionChange(i, e.target.value)}
                                    placeholder={`Option ${i + 1}`}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                                />
                                {options.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => removeOption(i)}
                                        className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                                        title="Remove option"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addOption}
                            className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add option
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                            {error}
                        </p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loading ? 'Creating…' : 'Create Poll'}
                    </button>
                </form>
            </div>
        </div>
    )
}
