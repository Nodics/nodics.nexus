import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { NexusBootstrap } from './app/NexusBootstrap';
import './styles/nexus.css';

const root = document.getElementById('root');
if (!root) throw new Error('Nodics Nexus root element is missing');
createRoot(root).render(
  <StrictMode>
    <NexusBootstrap />
  </StrictMode>,
);
