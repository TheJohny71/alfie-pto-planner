document.addEventListener("DOMContentLoaded", function() {
    // Event listener for Start Planning button
    document.getElementById("startPlanningBtn").addEventListener("click", function() {
      document.getElementById("ptoForm").style.display = "block";
    });
  
    // Event listener for Submit button
    document.getElementById("submitFormBtn").addEventListener("click", function() {
      // Get form values
      const year = document.getElementById("yearSelect").value;
      const totalPTO = parseInt(document.getElementById("totalPTO").value);
      const ptoThisYear = parseInt(document.getElementById("ptoThisYear").value);
      const preferredMonths = document.getElementById("preferredMonths").value.split(",").map(month => month.trim()).filter(month => month !== "");
  
      // Validate inputs
      if (isNaN(totalPTO) || isNaN(ptoThisYear) || totalPTO <= 0 || ptoThisYear <= 0 || preferredMonths.length === 0) {
        alert("Please fill in all fields correctly.");
        return;
      }
  
      console.log("Input values: ", { year, totalPTO, ptoThisYear, preferredMonths });
  
      // Generate PTO dates
      let suggestedPTO = [];
      preferredMonths.forEach(month => {
        const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
        if (!isNaN(monthIndex)) {
          const formattedMonth = monthIndex < 9 ? `0${monthIndex + 1}` : monthIndex + 1;
          suggestedPTO.push(`${year}-${formattedMonth}-15`);
        }
      });
  
      // Limit the number of PTO days to the requested amount
      suggestedPTO = suggestedPTO.slice(0, ptoThisYear);
  
      console.log("Scheduled PTO dates: ", suggestedPTO);
  
      // Generate Bank Holidays (for the UK)
      const bankHolidays = [
        `${year}-01-01`, // New Year's Day
        `${year}-04-18`, // Good Friday
        `${year}-04-21`, // Easter Monday
        `${year}-05-05`, // Early May bank holiday
        `${year}-05-26`, // Spring bank holiday
        `${year}-08-25`, // Summer bank holiday
        `${year}-12-25`, // Christmas Day
        `${year}-12-26`  // Boxing Day
      ];
  
      // Generate Weekends for the year
      const weekends = [];
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
        if (date.getDay() === 0 || date.getDay() === 6) {
          weekends.push(date.toISOString().split('T')[0]);
        }
      }
  
      // Display Calendar
      const calendarEl = document.getElementById("calendar");
      calendarEl.innerHTML = ""; // Clear previous calendar content
      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        initialDate: `${year}-01-01`,
        height: 450,
        events: [
          ...suggestedPTO.map(date => ({
            title: "PTO Day",
            start: date,
            color: "#90caf9"
          })),
          ...bankHolidays.map(date => ({
            title: "Bank Holiday",
            start: date,
            color: "#ffeb3b"
          })),
          ...weekends.map(date => ({
            title: "Weekend",
            start: date,
            color: "#f0f0f0"
          }))
        ]
      });
      calendar.render();
  
      // Display PTO Summary
      const ptoSummaryEl = document.getElementById("ptoSummary");
      const scheduledPTOCount = suggestedPTO.length;
      const remainingPTO = totalPTO - scheduledPTOCount;
      ptoSummaryEl.innerHTML = `
        <h2>PTO Summary</h2>
        <p>Total PTO Days Available: ${totalPTO}</p>
        <p>PTO Days Requested: ${ptoThisYear}</p>
        <p>PTO Days Scheduled: ${scheduledPTOCount}</p>
        <p>Remaining PTO Days: ${remainingPTO >= 0 ? remainingPTO : 0}</p>
      `;
    });
  });
