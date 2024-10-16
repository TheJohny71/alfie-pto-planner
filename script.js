document.addEventListener("DOMContentLoaded", function() {
  // Event listener for Start Planning button
  document.getElementById("startPlanningBtn").addEventListener("click", function() {
    document.getElementById("ptoForm").style.display = "block";
  });

  // Event listener for Submit button
  document.getElementById("submitFormBtn").addEventListener("click", function() {
    try {
      console.log("Form submission started");
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
      const daysPerMonth = Math.ceil(ptoThisYear / preferredMonths.length);

      preferredMonths.forEach(month => {
        if (daysScheduled >= ptoThisYear) return;
        const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
        if (!isNaN(monthIndex)) {
          let day = 1;
          while (daysScheduled < ptoThisYear && day <= 28) {
            const date = new Date(year, monthIndex, day);
            if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
              const formattedMonth = monthIndex < 9 ? `0${monthIndex + 1}` : monthIndex + 1;
              const formattedDay = day < 10 ? `0${day}` : day;
              const ptoDate = `${year}-${formattedMonth}-${formattedDay}`;
              if (!suggestedPTO.includes(ptoDate)) {
                suggestedPTO.push(ptoDate);
                daysScheduled++;
              }
            }
            day++;
          }
        }
      });

      suggestedPTO = suggestedPTO.slice(0, ptoThisYear);
      console.log("PTO Days Generated:", suggestedPTO);

      // Hide PTO form
      document.getElementById("ptoForm").style.display = "none";
      
      // Display calendar with PTO dates using Flatpickr
      const calendarContainerEl = document.getElementById("calendarContainer");
      calendarContainerEl.style.display = "block";

      const calendarEl = document.getElementById("calendar");
      flatpickr(calendarEl, {
        mode: "multiple",
        defaultDate: suggestedPTO,
        inline: true,
        disable: [
          function(date) {
            // Disable weekends
            return (date.getDay() === 0 || date.getDay() === 6);
          }
        ],
        locale: {
          firstDayOfWeek: 1 // Start the week on Monday
        }
      });

      // Display PTO Summary
      const summaryEl = document.getElementById("summary");
      summaryEl.innerHTML = `
        <h3>PTO Summary</h3>
        <p><strong>Total PTO Days Available:</strong> ${totalPTO}</p>
        <p><strong>PTO Days Requested:</strong> ${ptoThisYear}</p>
        <p><strong>PTO Days Scheduled:</strong> ${suggestedPTO.length}</p>
        <p><strong>Remaining PTO Days:</strong> ${totalPTO - ptoThisYear}</p>
        <button class="btn btn-export" id="downloadPdfBtn">Download Summary as PDF</button>
        <button class="btn btn-export" id="downloadExcelBtn">Download Summary as Excel</button>
      `;
      summaryEl.style.display = "block";

      // Add event listeners for download buttons
      document.getElementById("downloadPdfBtn").addEventListener("click", function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text("PTO Summary", 10, 10);
        doc.text(`Total PTO Days Available: ${totalPTO}`, 10, 20);
        doc.text(`PTO Days Requested: ${ptoThisYear}`, 10, 30);
        doc.text(`PTO Days Scheduled: ${suggestedPTO.length}`, 10, 40);
        doc.text(`Remaining PTO Days: ${totalPTO - ptoThisYear}`, 10, 50);
        doc.save("PTO_Summary.pdf");
      });

      document.getElementById("downloadExcelBtn").addEventListener("click", function() {
        const wb = XLSX.utils.book_new();
        const wsData = [
          ["PTO Summary"],
          ["Total PTO Days Available", totalPTO],
          ["PTO Days Requested", ptoThisYear],
          ["PTO Days Scheduled", suggestedPTO.length],
          ["Remaining PTO Days", totalPTO - ptoThisYear]
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "PTO Summary");
        XLSX.writeFile(wb, "PTO_Summary.xlsx");
      });

    } catch (error) {
      console.error("An error occurred:", error);
      alert("An error occurred while processing your request. Please try again.");
    }
  });
});
