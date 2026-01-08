import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateGroup from './pages/CreateGroup';
import GroupDetail from './pages/GroupDetail';
import Expenses from './pages/Expenses';
import Activities from "./pages/Activities";
import Itinerary from "./pages/Itinerary";
import Chat from "./pages/Chat";
import Weather from "./pages/Weather";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/crear-viaje" element={<CreateGroup />} />
        <Route path="/grupo/:id" element={<GroupDetail />} />
        <Route path="/grupo/:id/gastos" element={<Expenses />} />
        <Route path="/grupo/:id/actividades" element={<Activities />} />
        <Route path="/grupo/:id/itinerario" element={<Itinerary />} />
        <Route path="/grupo/:id/chat" element={<Chat />} />
        <Route path="/grupo/:id/clima" element={<Weather />} />

      </Routes>
    </Router>
  );
}

export default App;
