import React from 'react'
import Home from './pages/Home'
import SignUp from './pages/Signup.jsx'
import Login from './pages/Login'


function App() {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/signup' element={<SignUp/>} />
        <Route path='/login' element={<Login/>} />
      </Routes>
    </div>
  )
}

export default App