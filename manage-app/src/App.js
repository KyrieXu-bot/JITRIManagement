import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ContentArea from './components/ContentArea';
import './App.css';

function App() {
  const [selected, setSelected] = useState('customers');
  return (
      <div className="App">
          <Sidebar onSelect={setSelected} />
          <ContentArea selected={selected} />
      </div>
  );
  
}

export default App;
