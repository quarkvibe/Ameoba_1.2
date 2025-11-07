import { EventEmitter } from 'events';
import { storage } from '../storage';
import { activityMonitor } from './activityMonitor';
import { authenticationVaultService } from './authenticationVaultService';
import { deliveryService } from './deliveryService';
import * as cheerio from 'cheerio';

/**
 * Web Monitoring Service
 * 
 * THE UNIVERSAL TASK SUBSTRATE:
 * Amoeba can monitor ANY website for ANY changes/items
 * 
 * Capabilities:
 * - Continuous monitoring (24/7 until stopped)
 * - Authenticated sites (login required)
 * - Search & filter (eBay, auctions, marketplaces)
 * - Change detection (price drops, new listings)
 * - Smart crawling (AI understands site structure)
 * - Multi-site (eBay, Shopgoodwill, Craigslist, etc.)
 * - Flexible reporting (email, SMS, voice, social)
 * 
 * Following ARCHITECTURE.md:
 * - This is a CILIUM (monitoring capability)
 * - Independent, specialized
 * - Can be enabled/disabled per task
 * - Swappable adapters per site
 * 
 * Use Cases:
 * - Auction monitoring (eBay, Shopgoodwill)
 * - Price tracking (Amazon, retail sites)
 * - Job board monitoring (LinkedIn, Indeed)
 * - Real estate (Zillow, Redfin)
 * - News monitoring (any site)
 * - Competitor tracking (any site)
 * - Change detection (any page)
 */

export interface MonitorTask {
  id: string;
  userId: string;
  name: string;
  description: string;
  
  // Target
  targetSite: 'ebay' | 'shopgoodwill' | 'craigslist' | 'amazon' | 'generic';
  url?: string;  // For generic sites
  searchTerms?: string[];
  filters?: {
    priceMin?: number;
    priceMax?: number;
    condition?: string;
    location?: string;
    category?: string;
    keywords?: string[];
    excludeKeywords?: string[];
  };
  
  // Monitoring
  checkInterval: number;  // Minutes between checks
  continuous: boolean;    // Run 24/7 or one-time?
  maxResults?: number;    // Limit results per check
  
  // Authentication (if site requires login)
  requiresAuth: boolean;
  authProfileId?: string; // References authenticationVaultService
  
  // Reporting
  reportVia: string[];    // ['sms', 'email', 'webhook']
  reportWhen: 'always' | 'changes-only' | 'matches-only';
  reportFormat: 'summary' | 'detailed' | 'raw';
  
  // State
  isActive: boolean;
  lastChecked?: Date;
  lastResults?: any;
  itemsSeen: Set<string>;  // Track to avoid duplicates
  
  createdAt: Date;
  updatedAt: Date;
}

export interface MonitorResult {
  taskId: string;
  checkTime: Date;
  itemsFound: number;
  newItems: number;
  priceChanges: number;
  items: MonitoredItem[];
  nextCheckAt: Date;
}

export interface MonitoredItem {
  id: string;              // Unique ID from site
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  url: string;
  imageUrl?: string;
  seller?: string;
  condition?: string;
  location?: string;
  endTime?: Date;
  metadata?: any;
  firstSeen: Date;
  lastSeen: Date;
  priceHistory?: Array<{ price: number; date: Date }>;
}

class WebMonitoringService extends EventEmitter {
  
  private activeTasks: Map<string, NodeJS.Timeout> = new Map();
  private taskStates: Map<string, Set<string>> = new Map(); // Items seen
  
  /**
   * Start monitoring task
   */
  async startMonitoring(task: MonitorTask): Promise<void> {
    activityMonitor.logActivity('info', `🔍 Starting monitoring: ${task.name} (${task.targetSite})`);
    
    // Validate task
    if (task.requiresAuth && !task.authProfileId) {
      throw new Error('Authentication required but no auth profile configured');
    }
    
    // Run immediately
    await this.performCheck(task);
    
    // Schedule continuous checks if enabled
    if (task.continuous) {
      const intervalMs = task.checkInterval * 60 * 1000;
      
      const interval = setInterval(async () => {
        try {
          await this.performCheck(task);
        } catch (error: any) {
          activityMonitor.logError(error, `Monitoring ${task.id}`);
          
          // Stop if too many failures
          const failures = (task as any).consecutiveFailures || 0;
          if (failures > 5) {
            this.stopMonitoring(task.id);
            activityMonitor.logActivity('error', `🛑 Stopped monitoring ${task.name} after 5 failures`);
          }
        }
      }, intervalMs);
      
      this.activeTasks.set(task.id, interval);
      
      activityMonitor.logActivity('success', 
        `✅ Monitoring active: ${task.name} (checking every ${task.checkInterval} minutes)`
      );
    }
  }
  
  /**
   * Perform single check
   */
  private async performCheck(task: MonitorTask): Promise<MonitorResult> {
    activityMonitor.logActivity('debug', `🔍 Checking: ${task.name}`);
    
    try {
      // Get authentication if needed
      let authSession: any = null;
      if (task.requiresAuth && task.authProfileId) {
        authSession = await authenticationVaultService.getSession(task.authProfileId);
      }
      
      // Fetch & parse based on site type
      const items = await this.fetchItems(task, authSession);
      
      // Track what we've seen (detect new items)
      const previouslySeen = this.taskStates.get(task.id) || new Set<string>();
      const newItems: MonitoredItem[] = [];
      const priceChanges: MonitoredItem[] = [];
      
      items.forEach(item => {
        if (!previouslySeen.has(item.id)) {
          newItems.push(item);
          previouslySeen.add(item.id);
        }
        // TODO: Check price changes
      });
      
      this.taskStates.set(task.id, previouslySeen);
      
      const result: MonitorResult = {
        taskId: task.id,
        checkTime: new Date(),
        itemsFound: items.length,
        newItems: newItems.length,
        priceChanges: priceChanges.length,
        items: newItems, // Only report new items
        nextCheckAt: new Date(Date.now() + task.checkInterval * 60 * 1000),
      };
      
      // Report if conditions met
      if (this.shouldReport(task, result)) {
        await this.reportFindings(task, result);
      }
      
      // Update task state
      task.lastChecked = new Date();
      task.lastResults = result;
      
      activityMonitor.logActivity('success', 
        `✅ Check complete: ${newItems.length} new item(s) found`
      );
      
      this.emit('check:completed', result);
      
      return result;
      
    } catch (error: any) {
      activityMonitor.logError(error, `Monitoring check ${task.id}`);
      throw error;
    }
  }
  
  /**
   * Fetch items from site
   */
  private async fetchItems(task: MonitorTask, authSession: any): Promise<MonitoredItem[]> {
    // Route to site-specific adapter
    switch (task.targetSite) {
      case 'ebay':
        return await this.fetchEbay(task, authSession);
      
      case 'shopgoodwill':
        return await this.fetchShopgoodwill(task, authSession);
      
      case 'craigslist':
        return await this.fetchCraigslist(task, authSession);
      
      case 'amazon':
        return await this.fetchAmazon(task, authSession);
      
      case 'generic':
        return await this.fetchGeneric(task, authSession);
      
      default:
        throw new Error(`Unsupported site: ${task.targetSite}`);
    }
  }
  
  /**
   * eBay adapter
   */
  private async fetchEbay(task: MonitorTask, authSession: any): Promise<MonitoredItem[]> {
    const items: MonitoredItem[] = [];
    
    try {
      // Build eBay search URL
      const searchUrl = this.buildEbaySearchUrl(task);
      
      // Fetch with authentication if needed
      const html = await this.fetchWithAuth(searchUrl, authSession);
      
      // Parse eBay HTML
      const $ = cheerio.load(html);
      
      // eBay item selectors (may need updating if eBay changes HTML)
      $('.s-item').each((i, elem) => {
        const $item = $(elem);
        
        const id = $item.attr('data-listing-id') || `ebay_${i}`;
        const title = $item.find('.s-item__title').text().trim();
        const priceText = $item.find('.s-item__price').text().trim();
        const price = this.parsePrice(priceText);
        const url = $item.find('.s-item__link').attr('href') || '';
        const imageUrl = $item.find('.s-item__image img').attr('src') || '';
        
        // Apply filters
        if (this.matchesFilters(task, { title, price })) {
          items.push({
            id,
            title,
            price,
            currency: 'USD',
            url,
            imageUrl,
            firstSeen: new Date(),
            lastSeen: new Date(),
          });
        }
      });
      
    } catch (error: any) {
      activityMonitor.logError(error, 'eBay fetch');
    }
    
    return items.slice(0, task.maxResults || 50);
  }
  
  /**
   * Shopgoodwill adapter
   */
  private async fetchShopgoodwill(task: MonitorTask, authSession: any): Promise<MonitoredItem[]> {
    const items: MonitoredItem[] = [];
    
    try {
      const searchUrl = this.buildShopgoodwillUrl(task);
      const html = await this.fetchWithAuth(searchUrl, authSession);
      const $ = cheerio.load(html);
      
      // Shopgoodwill selectors
      $('.item-card').each((i, elem) => {
        const $item = $(elem);
        
        const id = $item.attr('data-item-id') || `sgw_${i}`;
        const title = $item.find('.item-title').text().trim();
        const priceText = $item.find('.current-bid').text().trim();
        const price = this.parsePrice(priceText);
        const url = $item.find('a').attr('href') || '';
        const endTimeText = $item.find('.time-left').text().trim();
        
        if (this.matchesFilters(task, { title, price })) {
          items.push({
            id,
            title,
            price,
            currency: 'USD',
            url: url.startsWith('http') ? url : `https://shopgoodwill.com${url}`,
            firstSeen: new Date(),
            lastSeen: new Date(),
            metadata: { endTime: endTimeText },
          });
        }
      });
      
    } catch (error: any) {
      activityMonitor.logError(error, 'Shopgoodwill fetch');
    }
    
    return items.slice(0, task.maxResults || 50);
  }
  
  /**
   * Generic site adapter (AI-powered)
   */
  private async fetchGeneric(task: MonitorTask, authSession: any): Promise<MonitoredItem[]> {
    // For sites without specific adapter
    // AI analyzes page structure and extracts relevant data
    
    try {
      const html = await this.fetchWithAuth(task.url!, authSession);
      const $ = cheerio.load(html);
      
      // Remove scripts, styles
      $('script, style').remove();
      
      // Extract text
      const text = $.text();
      
      // Use AI to parse (future: aiToolsService.extractStructuredData)
      // For now, basic extraction
      
      return [];
    } catch (error: any) {
      activityMonitor.logError(error, 'Generic fetch');
      return [];
    }
  }
  
  /**
   * Fetch with authentication
   */
  private async fetchWithAuth(url: string, authSession: any): Promise<string> {
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Amoeba Web Monitor)',
    };
    
    // Add auth headers if session provided
    if (authSession) {
      if (authSession.cookies) {
        headers['Cookie'] = authSession.cookies;
      }
      if (authSession.authToken) {
        headers['Authorization'] = `Bearer ${authSession.authToken}`;
      }
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.text();
  }
  
  /**
   * Build eBay search URL
   */
  private buildEbaySearchUrl(task: MonitorTask): string {
    const baseUrl = 'https://www.ebay.com/sch/i.html';
    const params = new URLSearchParams();
    
    if (task.searchTerms && task.searchTerms.length > 0) {
      params.append('_nkw', task.searchTerms.join(' '));
    }
    
    if (task.filters?.priceMin) {
      params.append('_udlo', task.filters.priceMin.toString());
    }
    
    if (task.filters?.priceMax) {
      params.append('_udhi', task.filters.priceMax.toString());
    }
    
    if (task.filters?.condition) {
      params.append('LH_ItemCondition', task.filters.condition);
    }
    
    params.append('_sop', '10'); // Sort by newly listed
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  /**
   * Build Shopgoodwill URL
   */
  private buildShopgoodwillUrl(task: MonitorTask): string {
    const baseUrl = 'https://shopgoodwill.com/search';
    const params = new URLSearchParams();
    
    if (task.searchTerms && task.searchTerms.length > 0) {
      params.append('q', task.searchTerms.join(' '));
    }
    
    if (task.filters?.priceMin) {
      params.append('min_price', task.filters.priceMin.toString());
    }
    
    if (task.filters?.priceMax) {
      params.append('max_price', task.filters.priceMax.toString());
    }
    
    params.append('sort', 'newest');
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  /**
   * Parse price from text
   */
  private parsePrice(text: string): number | undefined {
    const match = text.match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return undefined;
  }
  
  /**
   * Check if item matches filters
   */
  private matchesFilters(task: MonitorTask, item: { title: string; price?: number }): boolean {
    const filters = task.filters || {};
    
    // Price filters
    if (filters.priceMin && (!item.price || item.price < filters.priceMin)) {
      return false;
    }
    
    if (filters.priceMax && (!item.price || item.price > filters.priceMax)) {
      return false;
    }
    
    // Keyword filters
    const titleLower = item.title.toLowerCase();
    
    if (filters.keywords && filters.keywords.length > 0) {
      const hasKeyword = filters.keywords.some(kw => titleLower.includes(kw.toLowerCase()));
      if (!hasKeyword) return false;
    }
    
    if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
      const hasExcluded = filters.excludeKeywords.some(kw => titleLower.includes(kw.toLowerCase()));
      if (hasExcluded) return false;
    }
    
    return true;
  }
  
  /**
   * Should we report these findings?
   */
  private shouldReport(task: MonitorTask, result: MonitorResult): boolean {
    switch (task.reportWhen) {
      case 'always':
        return true;
      
      case 'changes-only':
        return result.newItems > 0 || result.priceChanges > 0;
      
      case 'matches-only':
        return result.newItems > 0;
      
      default:
        return result.newItems > 0;
    }
  }
  
  /**
   * Report findings via configured channels
   */
  private async reportFindings(task: MonitorTask, result: MonitorResult): Promise<void> {
    activityMonitor.logActivity('info', `📢 Reporting ${result.newItems} new item(s) for ${task.name}`);
    
    try {
      // Format report
      const content = this.formatReport(task, result);
      
      // Deliver via configured channels
      await deliveryService.deliver({
        content,
        contentId: `monitor_${task.id}_${Date.now()}`,
        userId: task.userId,
        channels: task.reportVia,
      });
      
      activityMonitor.logActivity('success', `✅ Report delivered via ${task.reportVia.join(', ')}`);
      
    } catch (error: any) {
      activityMonitor.logError(error, `Reporting findings for ${task.id}`);
    }
  }
  
  /**
   * Format report for delivery
   */
  private formatReport(task: MonitorTask, result: MonitorResult): string {
    if (task.reportFormat === 'summary') {
      return this.formatSummaryReport(task, result);
    } else if (task.reportFormat === 'detailed') {
      return this.formatDetailedReport(task, result);
    } else {
      return JSON.stringify(result, null, 2);
    }
  }
  
  /**
   * Format summary report
   */
  private formatSummaryReport(task: MonitorTask, result: MonitorResult): string {
    const items = result.items.slice(0, 5); // Top 5
    
    let report = `🔍 ${task.name}\n\n`;
    report += `Found: ${result.newItems} new item(s)\n\n`;
    
    items.forEach((item, i) => {
      report += `${i + 1}. ${item.title}\n`;
      if (item.price) {
        report += `   $${item.price}\n`;
      }
      report += `   ${item.url}\n\n`;
    });
    
    if (result.newItems > 5) {
      report += `...and ${result.newItems - 5} more\n`;
    }
    
    report += `Next check: ${result.nextCheckAt.toLocaleTimeString()}`;
    
    return report;
  }
  
  /**
   * Format detailed report
   */
  private formatDetailedReport(task: MonitorTask, result: MonitorResult): string {
    let report = `# ${task.name} - Monitoring Report\n\n`;
    report += `**Check Time:** ${result.checkTime.toLocaleString()}\n`;
    report += `**New Items:** ${result.newItems}\n`;
    report += `**Price Changes:** ${result.priceChanges}\n\n`;
    
    report += `## Items Found\n\n`;
    
    result.items.forEach((item, i) => {
      report += `### ${i + 1}. ${item.title}\n`;
      if (item.price) {
        report += `- **Price:** $${item.price}\n`;
      }
      if (item.condition) {
        report += `- **Condition:** ${item.condition}\n`;
      }
      if (item.seller) {
        report += `- **Seller:** ${item.seller}\n`;
      }
      if (item.location) {
        report += `- **Location:** ${item.location}\n`;
      }
      report += `- **Link:** ${item.url}\n\n`;
    });
    
    report += `**Next Check:** ${result.nextCheckAt.toLocaleString()}\n`;
    
    return report;
  }
  
  /**
   * Stop monitoring task
   */
  stopMonitoring(taskId: string): void {
    const interval = this.activeTasks.get(taskId);
    
    if (interval) {
      clearInterval(interval);
      this.activeTasks.delete(taskId);
      activityMonitor.logActivity('info', `🛑 Stopped monitoring: ${taskId}`);
      this.emit('monitoring:stopped', taskId);
    }
  }
  
  /**
   * Get active monitoring tasks
   */
  getActiveTasks(): string[] {
    return Array.from(this.activeTasks.keys());
  }
  
  /**
   * Pause monitoring (temporarily)
   */
  pauseMonitoring(taskId: string): void {
    this.stopMonitoring(taskId);
    activityMonitor.logActivity('info', `⏸️ Paused monitoring: ${taskId}`);
  }
  
  /**
   * Resume monitoring
   */
  async resumeMonitoring(task: MonitorTask): Promise<void> {
    await this.startMonitoring(task);
    activityMonitor.logActivity('success', `▶️ Resumed monitoring: ${task.id}`);
  }
}

export const webMonitoringService = new WebMonitoringService();

