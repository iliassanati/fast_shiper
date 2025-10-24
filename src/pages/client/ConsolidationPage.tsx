// src/pages/client/ConsolidationPage.tsx
import { useNavigate } from 'react-router-dom';
import ConsolidationWorkflow from '@/sections/workflows/ConsolidationWorkflow';

export default function ConsolidationPage() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/client/dashboard');
  };

  return <ConsolidationWorkflow onClose={handleClose} />;
}
