import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TabBar } from '../components/TabBar';
import { Goals } from '../features/goals/Goals';
import { Today } from '../features/today/Today';
import { Insights } from '../features/insights/Insights';
import { Frise } from '../features/frise/Frise';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Goals />} />
          <Route path="/today" element={<Today />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/frise" element={<Frise />} />
        </Routes>
        <TabBar />
      </div>
    </BrowserRouter>
  );
}

export default App;
