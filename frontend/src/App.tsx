import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from './components/Landing';
import Room from './components/Room';
import Video from "./components/Video";

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path='/room' element={<Room />}/>
          <Route path="/video" element={<Video />}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
