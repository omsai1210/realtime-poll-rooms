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
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Poll Created!</h2>
                    <p className="text-purple-200 text-sm">Share the link below to start collecting votes.</p>

                    <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3">
                        <input
                            readOnly
                            value={pollUrl}
                            className="flex-1 bg-transparent text-purple-100 text-sm outline-none truncate"
                        />
                        <button
                            onClick={copyLink}
                            className="shrink-0 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors cursor-pointer"
                        >
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>

                    <button
                        onClick={() => navigate(`/poll/${createdId}`)}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold transition-all cursor-pointer"
                    >
                        Go to Poll →
                    </button>

                    <button
                        onClick={() => { setCreatedId(null); setQuestion(''); setOptions(['', '']); }}
                        className="text-purple-300 hover:text-white text-sm transition-colors cursor-pointer"
                    >
                        Create another poll
                    </button>
                </div>
            </div>
        )
    }

    // ---------- CREATE FORM VIEW ----------
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Create a Poll
                    </h1>
                    <p className="text-purple-200/70 text-sm">Ask a question, add options, share instantly.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Question */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-purple-200">Your Question</label>
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. What's for lunch?"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-purple-300/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        />
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-purple-200">Options</label>
                        {options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-purple-400 text-sm font-mono w-6 text-right">{i + 1}.</span>
                                <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleOptionChange(i, e.target.value)}
                                    placeholder={`Option ${i + 1}`}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-purple-300/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                />
                                {options.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => removeOption(i)}
                                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
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
                            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add option
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                            {error}
                        </p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loading ? 'Creating…' : 'Create Poll'}
                    </button>
                </form>
            </div>
        </div>
    )
}
