import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { SimpleDashboard } from './pages/SimpleDashboard';
import { SimpleSettings } from './pages/SimpleSettings';
import { SimpleStudyMode } from './pages/SimpleStudyMode';
import { SimpleQuestion } from './pages/SimpleQuestion';
import { SimpleResult } from './pages/SimpleResult';
import { SimpleProgress } from './pages/SimpleProgress';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<SimpleDashboard />} />
          <Route path="/study/mode" element={<SimpleStudyMode />} />
          <Route path="/study/questions" element={<SimpleQuestion />} />
          <Route path="/study/result" element={<SimpleResult />} />
          <Route path="/progress" element={<SimpleProgress />} />
          <Route path="/settings" element={<SimpleSettings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
