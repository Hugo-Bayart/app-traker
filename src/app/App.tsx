import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TabBar } from '../components/TabBar';
import { Reve } from '../features/reve/Reve';
import { Goals } from '../features/goals/Goals';
import { GoalDetail } from '../features/goals/GoalDetail';
import { Today } from '../features/today/Today';
import { Insights } from '../features/insights/Insights';
import { Frise } from '../features/frise/Frise';
import { Settings } from '../features/settings/Settings';
import { ThemeProvider } from '../contexts/ThemeContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <div className="app">
          <Routes>
            <Route path="/" element={<Reve />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/goals/:id" element={<GoalDetail />} />
            <Route path="/today" element={<Today />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/frise" element={<Frise />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
          <TabBar />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
