import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from './components/Landing';
import Room from './components/Room';
import Video from "./components/Video";
import PythonWS from './components/PythonWS';

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path='/room' element={<Room />}/>
          <Route path="/video" element={<Video />}/>
          <Route path="/pythonws" element={<PythonWS />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
