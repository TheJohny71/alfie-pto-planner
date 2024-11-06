import React, { useState } from 'react';
// Version 1.0 - Initial Leave Request Form
const LeaveRequestForm = () => {
    const [request, setRequest] = useState({
        type: 'annual',
        category: 'vacation',
        status: 'pending',
        department: 'General'
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!request.startDate || !request.endDate) {
            alert('Please select both start and end dates');
            return;
        }
        const newRequest = {
            ...request,
            id: Date.now().toString() // Put id after spread to ensure it's not overwritten
        };
        console.log('Submitting request:', newRequest);
        // TODO: Add actual submission logic
    };
    return (React.createElement("div", { className: "leave-request-form" },
        React.createElement("h2", null, "Request Leave"),
        React.createElement("form", { onSubmit: handleSubmit },
            React.createElement("div", { className: "form-group" },
                React.createElement("label", null, "Leave Type"),
                React.createElement("select", { value: request.type, onChange: e => setRequest({ ...request, type: e.target.value }) },
                    React.createElement("option", { value: "annual" }, "Annual Leave"),
                    React.createElement("option", { value: "sick" }, "Sick Leave"),
                    React.createElement("option", { value: "compassionate" }, "Compassionate Leave"),
                    React.createElement("option", { value: "bank-holiday" }, "Bank Holiday"))),
            React.createElement("div", { className: "form-group" },
                React.createElement("label", null, "Category"),
                React.createElement("select", { value: request.category, onChange: e => setRequest({ ...request, category: e.target.value }) },
                    React.createElement("option", { value: "vacation" }, "Vacation"),
                    React.createElement("option", { value: "medical" }, "Medical"),
                    React.createElement("option", { value: "personal" }, "Personal"))),
            React.createElement("div", { className: "form-group" },
                React.createElement("label", null, "Department"),
                React.createElement("input", { type: "text", value: request.department, onChange: e => setRequest({ ...request, department: e.target.value }), required: true })),
            React.createElement("div", { className: "form-group" },
                React.createElement("label", null, "Start Date"),
                React.createElement("input", { type: "date", value: request.startDate, onChange: e => setRequest({ ...request, startDate: e.target.value }), required: true })),
            React.createElement("div", { className: "form-group" },
                React.createElement("label", null, "End Date"),
                React.createElement("input", { type: "date", value: request.endDate, onChange: e => setRequest({ ...request, endDate: e.target.value }), required: true })),
            React.createElement("div", { className: "form-group" },
                React.createElement("label", null, "Notes (Optional)"),
                React.createElement("textarea", { value: request.notes, onChange: e => setRequest({ ...request, notes: e.target.value }), placeholder: "Add any additional information..." })),
            React.createElement("button", { type: "submit", className: "submit-button" }, "Submit Request"))));
};
export default LeaveRequestForm;
