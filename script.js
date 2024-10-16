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

      // Display weekly plan cards
      document.getElementById("ptoForm").style.display = "none";
      const weekPlanContainer = document.getElementById("weekPlanContainer");
      weekPlanContainer.innerHTML = "";
      suggestedPTO.forEach((ptoDate, index) => {
        const weekCard = document.createElement("div");
        weekCard.className = "week-card";
        weekCard.innerHTML = `
          <div class="week-card-header">PTO Week ${index + 1}</div>
          <div class="week-card-content">
            PTO Date: ${ptoDate}
          </div>
        `;
        weekPlanContainer.appendChild(weekCard);
      });
      weekPlanContainer.style.display = "block";
    } catch (error) {
      console.error("An error occurred:", error);
      alert("An error occurred while processing your request. Please try again.");
    }
  });
});
