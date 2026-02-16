import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import io from 'socket.io-client'

export default function VotingRoom() {
    const { id } = useParams()
    const [poll, setPoll] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [socket, setSocket] = useState(null)

    // Username state
    const [username, setUsername] = useState('')
    const [tempUsername, setTempUsername] = useState('')
    const [showUsernameModal, setShowUsernameModal] = useState(false)
    const [usernameError, setUsernameError] = useState('')

    // Check for existing username in localStorage
    useEffect(() => {
        const storedUsername = localStorage.getItem(`poll_username_${id}`)
        if (storedUsername) {
            setUsername(storedUsername)
        } else {
            setShowUsernameModal(true)
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
            if (err.message) {
                alert(err.message)
            }
        })

        return () => {
            newSocket.disconnect()
        }
    }, [id])

    // Handle username submission
    const handleSetUsername = () => {
        const trimmed = tempUsername.trim()

        if (trimmed.length === 0) {
            setUsernameError('Please enter a username')
            return
        }

        if (trimmed.length > 20) {
            setUsernameError('Username must be 20 characters or less')
            return
        }

        if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
            setUsernameError('Only letters and numbers allowed')
            return
        }

        setUsername(trimmed)
        localStorage.setItem(`poll_username_${id}`, trimmed)
        setShowUsernameModal(false)
        setUsernameError('')
    }

    // Handle vote
    const handleVote = (optionId) => {
        if (!username || !socket) return

        socket.emit('vote', { pollId: id, optionId, username })
    }

    // Calculate total votes
    const totalVotes = poll?.options.reduce((sum, opt) => sum + (opt.votes?.length || opt.voteCount || 0), 0) || 0

    // Find max votes for highlighting
    const maxVotes = poll?.options.reduce((max, opt) => Math.max(max, opt.votes?.length || opt.voteCount || 0), 0) || 0

    // Find user's current vote
    const userVote = poll?.options.find(opt =>
        opt.votes?.some(v => v.username === username)
    )?._id

    // ---------- LOADING STATE ----------
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading poll...</p>
                </div>
            </div>
        )
    }

    // ---------- ERROR STATE ----------
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Poll Not Found</h2>
                    <p className="text-gray-600">
                        {error === 'Poll not found'
                            ? "This poll doesn't exist. It may have been deleted or the link is incorrect."
                            : error}
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors cursor-pointer"
                    >
                        Create a New Poll
                    </button>
                </div>
            </div>
        )
    }

    // ---------- POLL VIEW ----------
    return (
        <>
            {/* Username Modal */}
            {showUsernameModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-800">Enter Your Name</h2>
                            <p className="text-gray-600 text-sm mt-2">Required to vote on this poll</p>
                        </div>

                        <div className="space-y-2">
                            <input
                                type="text"
                                value={tempUsername}
                                onChange={(e) => setTempUsername(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSetUsername()}
                                placeholder="Your name"
                                maxLength={20}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500">Letters and numbers only, max 20 characters</p>
                            {usernameError && (
                                <p className="text-sm text-red-600">{usernameError}</p>
                            )}
                        </div>

                        <button
                            onClick={handleSetUsername}
                            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors cursor-pointer"
                        >
                            Join Poll
                        </button>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 space-y-6">
                    {/* Question - Orange Speech Bubble */}
                    <div className="relative bg-orange-500 text-white rounded-2xl px-6 py-4 shadow-lg">
                        <h1 className="text-xl font-bold">{poll.question}</h1>
                        {/* Speech bubble tail */}
                        <div className="absolute -bottom-3 left-8 w-6 h-6 bg-orange-500 transform rotate-45"></div>
                    </div>

                    {/* User info */}
                    {username && (
                        <div className="flex items-center justify-between text-sm pt-2">
                            <div className="flex items-center gap-2 text-gray-600">
                                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-semibold">
                                    {username[0].toUpperCase()}
                                </div>
                                <span className="font-medium">{username}</span>
                            </div>
                            {userVote && (
                                <span className="text-green-600 text-xs font-medium">✓ Voted</span>
                            )}
                        </div>
                    )}

                    {/* Options */}
                    <div className="space-y-3 pt-2">
                        {poll.options.map((option) => {
                            const voteCount = option.votes?.length || option.voteCount || 0
                            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
                            const isLeading = voteCount === maxVotes && maxVotes > 0
                            const isUserVote = option._id === userVote

                            return (
                                <button
                                    key={option._id}
                                    onClick={() => handleVote(option._id)}
                                    disabled={!username}
                                    className={`w-full text-left rounded-2xl transition-all relative overflow-hidden ${!username ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-md'
                                        }`}
                                >
                                    {/* Progress bar background */}
                                    <div
                                        className={`absolute inset-0 transition-all duration-500 ${isLeading ? 'bg-orange-200' : 'bg-gray-100'
                                            }`}
                                        style={{ width: `${percentage}%` }}
                                    />

                                    {/* Button content */}
                                    <div
                                        className={`relative px-5 py-3 rounded-2xl flex items-center justify-between ${isLeading ? 'bg-orange-500 text-white font-semibold' : 'bg-gray-200 text-gray-800'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isUserVote && (
                                                <span className="text-green-500 font-bold">✓</span>
                                            )}
                                            <span>{option.text}</span>
                                        </div>
                                        <span className="text-sm font-bold">{percentage}%</span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {/* Live indicator */}
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 pt-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">Live</span>
                        </div>
                        <span>|</span>
                        <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
                        {poll.voters?.length > 0 && (
                            <>
                                <span>|</span>
                                <span>{poll.voters.length} {poll.voters.length === 1 ? 'voter' : 'voters'}</span>
                            </>
                        )}
                    </div>

                    {/* Share link */}
                    <div className="pt-4 border-t border-gray-200">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href)
                                alert('Link copied!')
                            }}
                            className="w-full py-2 text-sm text-gray-600 hover:text-orange-500 transition-colors cursor-pointer"
                        >
                            📋 Copy poll link to share
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
