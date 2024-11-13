// At the top of your file
import { LeaveRequest, LeaveStatus, LeaveType } from '../../types';

interface LeaveRequestFormProps {
    onSubmit: (request: LeaveRequest) => void;
}

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ onSubmit }) => {
    // Your component code
}
import React, { useState } from 'react';
import { LeaveRequest, LeaveType, LeaveCategory } from '../types';

// Version 1.0 - Initial Leave Request Form
const LeaveRequestForm = () => {
  const [request, setRequest] = useState<Partial<LeaveRequest>>({
    type: 'annual',
    category: 'vacation',
    status: 'pending',
    department: 'General'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.startDate || !request.endDate) {
      alert('Please select both start and end dates');
      return;
    }
    
    const newRequest = {
        ...request as LeaveRequest,
        id: Date.now().toString()  // Put id after spread to ensure it's not overwritten
      };
    
    console.log('Submitting request:', newRequest);
    // TODO: Add actual submission logic
  };

  return (
    <div className="leave-request-form">
      <h2>Request Leave</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Leave Type</label>
          <select 
            value={request.type}
            onChange={e => setRequest({...request, type: e.target.value as LeaveType})}
          >
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="compassionate">Compassionate Leave</option>
            <option value="bank-holiday">Bank Holiday</option>
          </select>
        </div>

        <div className="form-group">
          <label>Category</label>
          <select 
            value={request.category}
            onChange={e => setRequest({...request, category: e.target.value as LeaveCategory})}
          >
            <option value="vacation">Vacation</option>
            <option value="medical">Medical</option>
            <option value="personal">Personal</option>
          </select>
        </div>

        <div className="form-group">
          <label>Department</label>
          <input 
            type="text"
            value={request.department}
            onChange={e => setRequest({...request, department: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Start Date</label>
          <input 
            type="date"
            value={request.startDate}
            onChange={e => setRequest({...request, startDate: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>End Date</label>
          <input 
            type="date"
            value={request.endDate}
            onChange={e => setRequest({...request, endDate: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Notes (Optional)</label>
          <textarea
            value={request.notes}
            onChange={e => setRequest({...request, notes: e.target.value})}
            placeholder="Add any additional information..."
          />
        </div>

        <button type="submit" className="submit-button">
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default LeaveRequestForm;
