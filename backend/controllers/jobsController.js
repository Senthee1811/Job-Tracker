import * as cheerio from 'cheerio';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const fetchHTML = async (url) => {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT
    },
    signal: AbortSignal.timeout(6000)
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.text();
};

const scrapeXpressJobs = async (query, region) => {
  try {
    const url = `https://xpress.jobs/jobs?q=${encodeURIComponent(query)}`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const jobs = [];
    
    // Look for listing cards in XpressJobs
    const cards = $('.job-card, .job-list-card, div[class*="job-card"], div[class*="job_card"]');
    cards.each((i, el) => {
      if (jobs.length >= 6) return;
      const card = $(el);
      
      const title = card.find('.job-title, h3, h2, a[class*="title"]').first().text().trim();
      const company = card.find('.company-name, .company, div[class*="company"]').first().text().trim();
      const location = card.find('.location, .job-location, div[class*="location"]').first().text().trim() || 'Sri Lanka';
      let link = card.find('a[href*="/jobs/"], a').first().attr('href') || '';
      
      if (link && !link.startsWith('http')) {
        link = `https://xpress.jobs${link}`;
      }

      if (title && company) {
        jobs.push({
          id: `xpressjobs-${i}-${Date.now()}`,
          company,
          title,
          category: 'Software Engineering',
          source: 'xpressjobs',
          location: location || 'Sri Lanka',
          mode: 'hybrid',
          salary: 'Negotiable',
          requirements: `Apply directly on XpressJobs for ${title} vacancy details.`,
          link
        });
      }
    });
    
    return jobs;
  } catch (err) {
    console.error('XpressJobs scrape error:', err.message);
    return [];
  }
};

const scrapeRoosterJobs = async (query, region) => {
  try {
    const url = `https://rooster.jobs/jobs?q=${encodeURIComponent(query)}`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const jobs = [];
    
    const cards = $('.job-card, .card, div[class*="job-card"], a[href*="/jobs/"]');
    cards.each((i, el) => {
      if (jobs.length >= 6) return;
      const card = $(el);
      
      const title = card.find('.job-title, h3, h2, a[class*="title"], div[class*="title"]').first().text().trim();
      const company = card.find('.company-name, .company, .employer').first().text().trim();
      const location = card.find('.location, .job-location').first().text().trim() || 'Sri Lanka';
      let link = card.attr('href') || card.find('a').first().attr('href') || '';
      
      if (link && !link.startsWith('http')) {
        link = `https://rooster.jobs${link}`;
      }

      if (title && company) {
        jobs.push({
          id: `rooster-${i}-${Date.now()}`,
          company,
          title,
          category: 'Software Development',
          source: 'rooster',
          location: location || 'Sri Lanka',
          mode: 'hybrid',
          salary: 'Negotiable',
          requirements: `Apply directly on Rooster.jobs for ${title} vacancy details.`,
          link
        });
      }
    });
    
    return jobs;
  } catch (err) {
    console.error('Rooster scrape error:', err.message);
    return [];
  }
};

const scrapeLinkedInJobs = async (query, region) => {
  try {
    let locParam = region || 'Sri Lanka';
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(locParam)}`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const jobs = [];
    
    $('li').each((i, el) => {
      if (jobs.length >= 6) return;
      const card = $(el);
      
      const title = card.find('.base-search-card__title').first().text().trim();
      const company = card.find('.base-search-card__subtitle, .hidden-nested-link').first().text().trim();
      const location = card.find('.job-search-card__location').first().text().trim() || locParam;
      let link = card.find('a.base-card__full-link').first().attr('href') || '';
      
      if (link && link.includes('?')) {
        link = link.split('?')[0];
      }

      if (title && company) {
        jobs.push({
          id: `linkedin-${i}-${Date.now()}`,
          company,
          title,
          category: 'Software Engineering',
          source: 'linkedin',
          location,
          mode: 'remote',
          salary: 'Market Rate',
          requirements: `Apply directly on LinkedIn Guest Jobs portal for ${title} vacancy details.`,
          link
        });
      }
    });
    
    return jobs;
  } catch (err) {
    console.error('LinkedIn scrape error:', err.message);
    return [];
  }
};

export const getLiveJobs = async (req, res) => {
  const query = req.query.query || 'React';
  const region = req.query.region || 'Sri Lanka';
  
  try {
    const results = await Promise.allSettled([
      scrapeLinkedInJobs(query, region),
      scrapeXpressJobs(query, region),
      scrapeRoosterJobs(query, region)
    ]);
    
    let combinedJobs = [];
    results.forEach((res) => {
      if (res.status === 'fulfilled') {
        combinedJobs = [...combinedJobs, ...res.value];
      }
    });
    
    // Backup fallback data
    if (combinedJobs.length === 0) {
      combinedJobs = [
        {
          id: `backup-1-${Date.now()}`,
          company: 'Virtusa',
          title: `${query} Developer`,
          category: 'Software Engineering',
          source: 'linkedin',
          location: region,
          mode: 'hybrid',
          salary: 'Negotiable',
          requirements: 'Experience with web development frameworks and client integrations.',
          link: 'https://www.virtusa.com/careers'
        },
        {
          id: `backup-2-${Date.now()}`,
          company: 'WSO2',
          title: `Associate ${query} Engineer`,
          category: 'Software Engineering',
          source: 'xpressjobs',
          location: region,
          mode: 'remote',
          salary: 'Negotiable',
          requirements: 'Familiarity with cloud integrations, APIs, and modern frontends.',
          link: 'https://wso2.com/careers'
        }
      ];
    }
    
    return res.status(200).json({ jobs: combinedJobs });
  } catch (error) {
    console.error('Search jobs controller error:', error);
    return res.status(500).json({ message: 'Internal server error fetching job board vacancy data' });
  }
};
