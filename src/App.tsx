import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Studio from '@/components/Studio'
const App = () => (<BrowserRouter><Routes><Route path="/" element={<Studio/>} /></Routes></BrowserRouter>)
export default App
