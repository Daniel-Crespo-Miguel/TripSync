import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
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
import Transport from './pages/Transport';
import Feedback from './pages/Feedback';
import Documents from './pages/Documents';
import JoinGroup from './pages/JoinGroup';
import GroupTabs from './components/GroupTabs';
import { GroupProvider } from './contexts/GroupContext';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/crear-viaje" element={<CreateGroup />} />
            <Route path="/unirse/:token" element={<JoinGroup />} />
            
            {/* Rutas del grupo con GroupTabs como layout */}
            <Route path="/grupo/:id" element={
              <GroupProvider>
                <GroupTabs />
              </GroupProvider>
            }>
              <Route index element={<GroupDetail />} />
              <Route path="itinerario" element={<Itinerary />} />
              <Route path="actividades" element={<Activities />} />
              <Route path="gastos" element={<Expenses />} />
              <Route path="chat" element={<Chat />} />
              <Route path="documentos" element={<Documents />} />
              <Route path="clima" element={<Weather />} />
              <Route path="transporte" element={<Transport />} />
              <Route path="feedback" element={<Feedback />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
