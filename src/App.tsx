import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SiteHome } from './site/SiteHome';
import { AdminApp } from './admin/AdminApp';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SiteHome />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  );
}
