// Texas Resource Hub - SOS Pack PDF Generator
// Generates printable emergency resource packs for offline distribution

class SOSPackGenerator {
  constructor() {
    this.resources = [];
    this.cities = new Set();
    this.categories = new Set();
    this.init();
  }

  async init() {
    try {
      // Load resources data
      const response = await fetch('data/resources.json');
      this.resources = await response.json();
      
      // Extract unique cities and categories
      this.resources.forEach(resource => {
        this.cities.add(resource.city);
        this.categories.add(resource.category);
      });

      this.setupUI();
    } catch (error) {
      console.error('Failed to load resources:', error);
      this.showError('Failed to load resource data. Please check your connection.');
    }
  }

  setupUI() {
    // Create SOS Pack section in resources page
    const sosSection = this.createSOSSection();
    const main = document.querySelector('main .container') || document.querySelector('main');
    if (main) {
      main.insertBefore(sosSection, main.firstChild);
    }

    // Add SOS Pack button to navigation
    this.addNavigationButton();
  }

  createSOSSection() {
    const section = document.createElement('section');
    section.id = 'sos-pack-section';
    section.innerHTML = `
      <div class="sos-hero">
        <h2>🚨 SOS Pack Generator</h2>
        <p>Generate printable emergency resource packs for neighbors without smartphones. Perfect for community mutual aid and disaster preparedness.</p>
        
        <div class="sos-controls">
          <div class="control-group">
            <label for="sos-city">Select City:</label>
            <select id="sos-city">
              <option value="all">All Texas Cities</option>
              ${Array.from(this.cities).sort().map(city => 
                `<option value="${city}">${city}</option>`
              ).join('')}
            </select>
          </div>
          
          <div class="control-group">
            <label for="sos-category">Focus Category:</label>
            <select id="sos-category">
              <option value="all">All Categories</option>
              ${Array.from(this.categories).sort().map(category => 
                `<option value="${category}">${category}</option>`
              ).join('')}
            </select>
          </div>
          
          <div class="control-group">
            <label for="sos-cost">Cost Filter:</label>
            <select id="sos-cost">
              <option value="all">All Resources</option>
              <option value="free">Free Only</option>
              <option value="sliding">Free + Sliding Scale</option>
            </select>
          </div>
          
          <button id="generate-sos-pack" class="btn sos-generate-btn">
            📄 Generate SOS Pack PDF
          </button>
        </div>
        
        <div class="sos-preview" id="sos-preview" style="display: none;">
          <h3>Preview (${this.getFilteredResources().length} resources)</h3>
          <div class="preview-resources" id="preview-resources"></div>
        </div>
      </div>
    `;

    // Add styles
    this.addSOSStyles();
    
    // Add event listeners
    this.addEventListeners();
    
    return section;
  }

  addSOSStyles() {
    if (document.getElementById('sos-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'sos-styles';
    style.textContent = `
      .sos-hero {
        background: linear-gradient(135deg, rgba(239,68,68,.10), rgba(6,182,212,.10)),
                    var(--card-grad);
        border: 2px solid #ef4444;
        border-radius: calc(var(--radius) + 4px);
        padding: 32px;
        margin: 32px 0;
        text-align: center;
      }
      
      .sos-hero h2 {
        color: #ef4444;
        margin: 0 0 16px;
        font-size: 1.8rem;
      }
      
      .sos-controls {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        align-items: end;
        margin: 24px 0;
        max-width: 800px;
        margin-left: auto;
        margin-right: auto;
      }
      
      .control-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .control-group label {
        font-weight: 600;
        color: var(--text);
        font-size: 0.9rem;
      }
      
      .control-group select {
        background: #0e162b;
        color: var(--text);
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 12px;
        font-size: 0.95rem;
      }
      
      .sos-generate-btn {
        background: linear-gradient(180deg, #ef4444, #dc2626);
        border: 1px solid #b91c1c;
        box-shadow: 0 8px 20px rgba(239,68,68,.35);
        font-size: 1.1rem;
        padding: 16px 24px;
        grid-column: 1 / -1;
        margin-top: 8px;
      }
      
      .sos-generate-btn:hover {
        filter: brightness(1.1);
      }
      
      .sos-preview {
        background: var(--card-grad);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 24px;
        margin-top: 24px;
        text-align: left;
      }
      
      .sos-preview h3 {
        margin: 0 0 16px;
        color: var(--brand);
      }
      
      .preview-resources {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      }
      
      .preview-resource {
        background: #0c162b;
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 16px;
      }
      
      .preview-resource h4 {
        margin: 0 0 8px;
        color: var(--text);
        font-size: 1.1rem;
      }
      
      .preview-resource .meta {
        color: var(--muted);
        font-size: 0.9rem;
        margin: 4px 0;
      }
      
      .preview-resource .description {
        color: var(--muted);
        font-size: 0.85rem;
        margin: 8px 0 0;
        line-height: 1.4;
      }
      
      .sos-nav-btn {
        background: linear-gradient(180deg, #ef4444, #dc2626);
        border: 1px solid #b91c1c;
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
        margin-left: 12px;
      }
      
      .sos-nav-btn:hover {
        filter: brightness(1.1);
      }
      
      @media (max-width: 768px) {
        .sos-controls {
          grid-template-columns: 1fr;
        }
        
        .sos-generate-btn {
          grid-column: 1;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  addEventListeners() {
    // Filter change events
    ['sos-city', 'sos-category', 'sos-cost'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => this.updatePreview());
      }
    });

    // Generate button
    const generateBtn = document.getElementById('generate-sos-pack');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generatePDF());
    }
  }

  addNavigationButton() {
    const nav = document.querySelector('.nav');
    if (nav) {
      const sosLi = document.createElement('li');
      sosLi.innerHTML = '<a href="#sos-pack-section" class="sos-nav-btn">🚨 SOS Pack</a>';
      nav.appendChild(sosLi);
    }
  }

  getFilteredResources() {
    const city = document.getElementById('sos-city')?.value || 'all';
    const category = document.getElementById('sos-category')?.value || 'all';
    const cost = document.getElementById('sos-cost')?.value || 'all';

    return this.resources.filter(resource => {
      const cityMatch = city === 'all' || resource.city === city;
      const categoryMatch = category === 'all' || resource.category === category;
      
      let costMatch = true;
      if (cost === 'free') {
        costMatch = resource.cost === 'free';
      } else if (cost === 'sliding') {
        costMatch = resource.cost === 'free' || resource.cost === 'sliding';
      }
      
      return cityMatch && categoryMatch && costMatch;
    });
  }

  updatePreview() {
    const resources = this.getFilteredResources();
    const preview = document.getElementById('sos-preview');
    const previewResources = document.getElementById('preview-resources');
    
    if (!preview || !previewResources) return;

    if (resources.length === 0) {
      preview.style.display = 'none';
      return;
    }

    preview.style.display = 'block';
    preview.querySelector('h3').textContent = `Preview (${resources.length} resources)`;
    
    previewResources.innerHTML = resources.slice(0, 6).map(resource => `
      <div class="preview-resource">
        <h4>${resource.name}</h4>
        <div class="meta">${resource.city} • ${resource.category} • ${resource.cost}</div>
        <div class="description">${resource.description}</div>
      </div>
    `).join('');

    if (resources.length > 6) {
      previewResources.innerHTML += `
        <div class="preview-resource">
          <h4>... and ${resources.length - 6} more resources</h4>
          <div class="description">All resources will be included in the PDF pack</div>
        </div>
      `;
    }
  }

  async generatePDF() {
    const resources = this.getFilteredResources();
    
    if (resources.length === 0) {
      alert('No resources match your selected filters. Please adjust your criteria.');
      return;
    }

    const generateBtn = document.getElementById('generate-sos-pack');
    const originalText = generateBtn.textContent;
    generateBtn.textContent = '🔄 Generating PDF...';
    generateBtn.disabled = true;

    try {
      // Use jsPDF for PDF generation
      const { jsPDF } = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      let yPosition = margin;
      
      // Title page
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Texas Resource Hub', margin, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'normal');
      pdf.text('SOS Emergency Resource Pack', margin, yPosition);
      yPosition += 20;
      
      // Date and filters
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 8;
      
      const city = document.getElementById('sos-city')?.value || 'all';
      const category = document.getElementById('sos-category')?.value || 'all';
      const cost = document.getElementById('sos-cost')?.value || 'all';
      
      pdf.text(`City: ${city === 'all' ? 'All Texas Cities' : city}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Category: ${category === 'all' ? 'All Categories' : category}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Cost: ${cost === 'all' ? 'All Resources' : cost}`, margin, yPosition);
      yPosition += 20;
      
      // Emergency contacts
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('🚨 Emergency Contacts', margin, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const emergencyContacts = [
        'National Suicide Prevention Lifeline: 988',
        'National Domestic Violence Hotline: 1-800-799-7233',
        'National Child Abuse Hotline: 1-800-4-A-CHILD',
        'Disaster Distress Helpline: 1-800-985-5990',
        'Texas 211: Dial 211 for local resources'
      ];
      
      emergencyContacts.forEach(contact => {
        pdf.text(contact, margin, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;
      
      // Resources by category
      const resourcesByCategory = this.groupResourcesByCategory(resources);
      
      Object.keys(resourcesByCategory).forEach(category => {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`📋 ${category}`, margin, yPosition);
        yPosition += 15;
        
        resourcesByCategory[category].forEach(resource => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = margin;
          }
          
          // Resource name
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          const nameLines = pdf.splitTextToSize(resource.name, contentWidth);
          pdf.text(nameLines, margin, yPosition);
          yPosition += (nameLines.length * 5) + 2;
          
          // Resource details
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          const details = `${resource.city} • ${resource.cost} • ${resource.access?.join(', ') || 'Standard access'}`;
          pdf.text(details, margin, yPosition);
          yPosition += 6;
          
          // Description
          const descLines = pdf.splitTextToSize(resource.description, contentWidth);
          pdf.text(descLines, margin, yPosition);
          yPosition += (descLines.length * 4) + 8;
          
          // Add separator line
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 5;
        });
        
        yPosition += 10;
      });
      
      // Add QR code for the main site
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('📱 Access More Resources Online', margin, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Scan this QR code or visit: texasresourcehub.org', margin, yPosition);
      yPosition += 20;
      
      // Generate simple QR code (text-based for now)
      pdf.setFontSize(8);
      pdf.text('QR Code: Texas Resource Hub', margin, yPosition);
      yPosition += 6;
      pdf.text('Full directory with search, filters, and updates', margin, yPosition);
      
      // Download the PDF
      const fileName = `texas-sos-pack-${city}-${category}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again or check your browser compatibility.');
    } finally {
      generateBtn.textContent = originalText;
      generateBtn.disabled = false;
    }
  }

  groupResourcesByCategory(resources) {
    return resources.reduce((groups, resource) => {
      const category = resource.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(resource);
      return groups;
    }, {});
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      background: #ef4444;
      color: white;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
      text-align: center;
    `;
    errorDiv.textContent = message;
    
    const main = document.querySelector('main .container') || document.querySelector('main');
    if (main) {
      main.insertBefore(errorDiv, main.firstChild);
    }
  }
}

// Initialize SOS Pack Generator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize on resources page or if SOS pack section exists
  if (window.location.pathname.includes('resources.html') || document.getElementById('sos-pack-section')) {
    new SOSPackGenerator();
  }
});

// Export for use in other scripts
window.SOSPackGenerator = SOSPackGenerator;
