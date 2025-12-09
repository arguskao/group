/**
 * StatisticsPanel component for displaying survey statistics
 */
export class StatisticsPanel {
  constructor(container) {
    this.container = container;
    this.render({ total: 0, byRegion: new Map(), byOccupation: new Map() });
  }

  /**
   * Calculate statistics from responses
   * @param {Array<{name: string, phone: string, region: string, occupation: string, timestamp: string}>} responses
   * @returns {{total: number, byRegion: Map<string, number>, byOccupation: Map<string, number>}}
   */
  calculateStats(responses) {
    const stats = {
      total: responses.length,
      byRegion: new Map(),
      byOccupation: new Map()
    };
    
    responses.forEach(response => {
      // Count by region
      const regionCount = stats.byRegion.get(response.region) || 0;
      stats.byRegion.set(response.region, regionCount + 1);
      
      // Count by occupation
      const occupationCount = stats.byOccupation.get(response.occupation) || 0;
      stats.byOccupation.set(response.occupation, occupationCount + 1);
    });
    
    return stats;
  }

  /**
   * Render statistics panel
   * @param {{total: number, byRegion: Map<string, number>, byOccupation: Map<string, number>}} stats
   */
  render(stats) {
    const regionRows = Array.from(stats.byRegion.entries())
      .map(([region, count]) => `
        <tr>
          <td>${region}</td>
          <td>${count}</td>
        </tr>
      `).join('');
    
    const occupationRows = Array.from(stats.byOccupation.entries())
      .map(([occupation, count]) => `
        <tr>
          <td>${occupation}</td>
          <td>${count}</td>
        </tr>
      `).join('');
    
    this.container.innerHTML = `
      <h2>統計資料</h2>
      
      <div class="stats-summary">
        <h3>總回覆數：<span id="total-count">${stats.total}</span></h3>
      </div>
      
      <div class="stats-section">
        <h3>地區統計</h3>
        <table class="stats-table">
          <thead>
            <tr>
              <th>地區</th>
              <th>回覆數</th>
            </tr>
          </thead>
          <tbody>
            ${regionRows || '<tr><td colspan="2">暫無資料</td></tr>'}
          </tbody>
        </table>
      </div>
      
      <div class="stats-section">
        <h3>職業統計</h3>
        <table class="stats-table">
          <thead>
            <tr>
              <th>職業類型</th>
              <th>回覆數</th>
            </tr>
          </thead>
          <tbody>
            ${occupationRows || '<tr><td colspan="2">暫無資料</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Update statistics with new responses
   * @param {Array<{name: string, phone: string, region: string, occupation: string, timestamp: string}>} responses
   */
  update(responses) {
    const stats = this.calculateStats(responses);
    this.render(stats);
  }
}
