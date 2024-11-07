// src/components/Calendar.tsx

interface Holiday {
    date: Date;
    name: string;
    type: 'regular' | 'observed' | 'weekend';
    region: 'US' | 'UK' | 'both';
}

export class Calendar {
    private readonly container: HTMLElement;
    private currentDate: Date;
    private region: 'US' | 'UK' | 'both';

    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container element with id '${containerId}' not found`);
        }
        
        this.container = container;
        this.currentDate = new Date();
        this.region = 'both';
        
        this.initialize();
    }

    private initialize(): void {
        this.createRegionToggle();
        this.render();
    }

    private createRegionToggle(): void {
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'region-toggle';

        const regions = [
            { id: 'US', label: 'United States' },
            { id: 'UK', label: 'United Kingdom' },
            { id: 'both', label: 'All Regions' }
        ];

        regions.forEach(region => {
            const button = document.createElement('button');
            button.textContent = region.label;
            button.className = region.id === this.region ? 'active' : '';
            button.onclick = () => this.setRegion(region.id as 'US' | 'UK' | 'both');
            toggleContainer.appendChild(button);
        });

        this.container.appendChild(toggleContainer);
    }

    private setRegion(region: 'US' | 'UK' | 'both'): void {
        this.region = region;
        this.render();
    }

    private render(): void {
        // Clear existing content except region toggle
        const regionToggle = this.container.querySelector('.region-toggle');
        this.container.innerHTML = '';
        if (regionToggle) this.container.appendChild(regionToggle);

        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-grid';

        // Add header row
        const headerRow = document.createElement('div');
        headerRow.className = 'calendar-header';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-header-cell';
            dayHeader.textContent = day;
            headerRow.appendChild(dayHeader);
        });
        calendarGrid.appendChild(headerRow);

        this.container.appendChild(calendarGrid);
    }
}
