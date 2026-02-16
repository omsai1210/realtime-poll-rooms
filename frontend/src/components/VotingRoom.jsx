import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import io from 'socket.io-client'

export default function VotingRoom() {
    const { id } = useParams()
    const [poll, setPoll] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [hasVoted, setHasVoted] = useState(false)
    const [socket, setSocket] = useState(null)

    // Check localStorage for previous votes on mount
    useEffect(() => {
        const votedPolls = JSON.parse(localStorage.getItem('votedPollIds') || '[]')
        if (votedPolls.includes(id)) {
            setHasVoted(true)
        }
    }, [id])

    // Fetch poll data on mount
    useEffect(() => {
        const fetchPoll = async () => {
            try {
                const res = await axios.get(`/api/polls/${id}`)
                setPoll(res.data)
                setLoading(false)
            } catch (err) {
                if (err.response?.status === 404) {
                    setError('Poll not found')
                } else {
                    setError('Failed to load poll')
                }
                setLoading(false)
            }
        }
        fetchPoll()
    }, [id])

    // Setup Socket.io connection
    useEffect(() => {
        const newSocket = io()
        setSocket(newSocket)

        newSocket.emit('joinPoll', id)
        console.log(`Joined poll room: ${id}`)

        newSocket.on('pollUpdated', (updatedPoll) => {
            console.log('Poll updated:', updatedPoll)
            setPoll(updatedPoll)
        })

        newSocket.on('error', (err) => {
            console.error('Socket error:', err)
        })

        return () => {
            newSocket.disconnect()
        }
    }, [id])

    // Handle vote
    const handleVote = (optionId) => {
        if (hasVoted || !socket) return

        socket.emit('vote', { pollId: id, optionId })
        setHasVoted(true)

        // Store vote in localStorage
        const votedPolls = JSON.parse(localStorage.getItem('votedPollIds') || '[]')
        if (!votedPolls.includes(id)) {
            votedPolls.push(id)
            localStorage.setItem('votedPollIds', JSON.stringify(votedPolls))
        }
    }

    // Calculate total votes
    const totalVotes = poll?.options.reduce((sum, opt) => sum + opt.voteCount, 0) || 0

    // ---------- LOADING STATE ----------
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-purple-200">Loading poll...</p>
                </div>
            </div>
        )
    }

    // ---------- ERROR STATE ----------
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Poll Not Found</h2>
                    <p className="text-purple-200/70">
                        {error === 'Poll not found'
                            ? "This poll doesn't exist. It may have been deleted or the link is incorrect."
                            : error}
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold transition-all cursor-pointer"
                    >
                        Create a New Poll
                    </button>
                </div>
            </div>
        )
    }

    // ---------- POLL VIEW ----------
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 space-y-6">
                {/* Header */}
                <div className="text-center space-y-3">
                    <h1 className="text-3xl font-extrabold text-white">{poll.question}</h1>
                    <div className="flex items-center justify-center gap-2 text-sm text-purple-300/70">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
                    </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                    {poll.options.map((option) => {
                        const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0

                        return (
                            <button
                                key={option._id}
                                onClick={() => handleVote(option._id)}
                                disabled={hasVoted}
                                className={`w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${hasVoted
                                    ? 'bg-white/5 border-white/10 cursor-not-allowed'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-400/50 cursor-pointer'
                                    }`}
                            >
                                {/* Progress bar background */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                />

                                {/* Content */}
                                <div className="relative flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{option.text}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-purple-300 text-sm font-mono">
                                            {option.voteCount} {option.voteCount === 1 ? 'vote' : 'votes'}
                                        </span>
                                        <span className="text-purple-200 text-lg font-bold w-12 text-right">
                                            {percentage}%
                                        </span>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Voted indicator */}
                {hasVoted && (
                    <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>You've voted! Results update in real-time.</span>
                    </div>
                )}

                {/* Share link */}
                <div className="pt-4 border-t border-white/10">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href)
                            alert('Link copied!')
                        }}
                        className="w-full py-2 text-sm text-purple-300 hover:text-white transition-colors cursor-pointer"
                    >
                        📋 Copy poll link to share
                    </button>
                </div>
            </div>
        </div>
    )
}
