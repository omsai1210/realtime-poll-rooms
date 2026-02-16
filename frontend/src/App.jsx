import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CreatePoll from './components/CreatePoll'
import VotingRoom from './components/VotingRoom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreatePoll />} />
        <Route path="/poll/:id" element={<VotingRoom />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
