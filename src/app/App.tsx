import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TabBar } from '../components/TabBar';
import { Goals } from '../features/goals/Goals';
import { Today } from '../features/today/Today';
import { Insights } from '../features/insights/Insights';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Goals />} />
          <Route path="/today" element={<Today />} />
          <Route path="/insights" element={<Insights />} />
        </Routes>
        <TabBar />
      </div>
    </BrowserRouter>
  );
}

export default App;
