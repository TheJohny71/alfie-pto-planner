<script>
  document.addEventListener("DOMContentLoaded", function() {
    // Event listener for Start Planning button
    document.getElementById("startPlanningBtn").addEventListener("click", function() {
      document.getElementById("ptoForm").style.display = "block";
    });

    // Event listener for Submit button
    document.getElementById("submitFormBtn").addEventListener("click", function() {
      console.log("Form submitted");

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

      console.log("Inputs validated");

      // Generate PTO dates (distribute across the year more evenly)
      let suggestedPTO = [];
      let daysScheduled = 0;

      preferredMonths.forEach(month => {
        if (daysScheduled >= ptoThisYear) return;
        const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
        if (!isNaN(monthIndex)) {
          for (let day = 1; day <= 28; day += Math.ceil(28 / Math.ceil(ptoThisYear / preferredMonths.length))) {
            if (daysScheduled >= ptoThisYear) break;
            const formattedMonth = monthIndex < 9 ? `0${monthIndex + 1}` : monthIndex + 1;
            const formattedDay = day < 10 ? `0${day}` : day;
            suggestedPTO.push(`${year}-${formattedMonth}-${formattedDay}`);
            daysScheduled++;
          }
        }
      });

      suggestedPTO = suggestedPTO.slice(0, ptoThisYear);
      console.log("PTO Days Generated:", suggestedPTO);

      // Generate Bank Holidays (for the UK)
      const bankHolidays = [
        { date: `${year}-01-01`, title: "New Year's Day" },
        { date: `${year}-04-18`, title: "Good Friday" },
        { date: `${year}-04-21`, title: "Easter Monday" },
        { date: `${year}-05-05`, title: "Early May Bank Holiday" },
        { date: `${year}-05-26`, title: "Spring Bank Holiday" },
        { date: `${year}-08-25`, title: "Summer Bank Holiday" },
        { date: `${year}-12-25`, title: "Christmas Day" },
        { date: `${year}-12-26`, title: "Boxing Day" }
      ];

      console.log("Bank Holidays Generated:", bankHolidays);

      // Generate Weekends for the year
      const weekends = [];
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
        if (date.getDay() === 0 || date.getDay() === 6) {
          weekends.push(date.toISOString().split('T')[0]);
        }
      }

      console.log("Weekends Generated:", weekends);

      // Display Calendar
      const calendarEl = document.getElementById("calendar");
      calendarEl.innerHTML = ""; // Clear previous calendar content
      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        initialDate: `${year}-01-01`,
        height: 350,
        events: [
          ...suggestedPTO.map(date => ({
            title: "PTO Day",
            start: date,
            color: "#4caf50"
          })),
          ...bankHolidays.map(holiday => ({
            title: holiday.title,
            start: holiday.date,
            color: "#ffcc00"
          })),
          ...weekends.map(date => ({
            title: "Weekend",
            start: date,
            color: "#f0f0f0"
          }))
        ]
      });
      calendar.render();

      console.log("Calendar rendered");

      // Display PTO Summary
      const ptoSummaryEl = document.getElementById("ptoSummaryContent");
      const scheduledPTOCount = suggestedPTO.length;
      const remainingPTO = totalPTO - scheduledPTOCount;
      ptoSummaryEl.innerHTML = `
        <h2>PTO Summary</h2>
        <p>Total PTO Days Available: ${totalPTO}</p>
        <p>PTO Days Requested: ${ptoThisYear}</p>
        <p>PTO Days Scheduled: ${scheduledPTOCount}</p>
        <p>Remaining PTO Days: ${remainingPTO >= 0 ? remainingPTO : 0}</p>
      `;
      console.log("PTO Summary displayed");
    });
  });
</script>
