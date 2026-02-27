/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Cashier from './pages/Cashier';
import Login from './pages/Login';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Cashier />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
