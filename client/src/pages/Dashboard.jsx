import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import StudentDashboard from './StudentDashboard';
import SupervisorDashboard from './SupervisorDashboard';
import CoordinatorDashboard from './CoordinatorDashboard';
import ItfDashboard from './ItfDashboard';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  switch (user.role) {
    case 'STUDENT':
      return <StudentDashboard />;
    case 'SCHOOL':
    case 'INDUSTRY':
      return <SupervisorDashboard />;
    case 'COORDINATOR':
      return <CoordinatorDashboard />;
    case 'ITF':
      return <ItfDashboard />;
    default:
      return (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h3>Unrecognized Role ({user.role})</h3>
          <p>Please contact system administration.</p>
        </div>
      );
  }
};

export default Dashboard;
