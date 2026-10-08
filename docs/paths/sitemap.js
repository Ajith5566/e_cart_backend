
/**
 * @swagger
 * /sitemap.xml:
 *   get:
 *     summary: Get sitemap in XML format (for search engines)
 *     tags: [Sitemap]
 *     description: >
 *       Returns a valid XML sitemap covering all active public content —
 *       case studies, services, blogs, industries and pages.
 *       Submit this URL to Google Search Console and Bing Webmaster Tools.
 *       Cached for 1 hour.
 *     responses:
 *       200:
 *         description: XML sitemap
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *               example: |
 *                 <?xml version="1.0" encoding="UTF-8"?>
 *                 <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
 *                   <url>
 *                     <loc>https://frontend.phitanydev.in</loc>
 *                     <changefreq>weekly</changefreq>
 *                     <priority>1.0</priority>
 *                   </url>
 *                   <url>
 *                     <loc>https://frontend.phitanydev.in/case-studies/emc-hospital</loc>
 *                     <lastmod>2026-08-01</lastmod>
 *                     <changefreq>monthly</changefreq>
 *                     <priority>0.8</priority>
 *                   </url>
 *                 </urlset>
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /sitemap:
 *   get:
 *     summary: Get sitemap in JSON format (for API consumers)
 *     tags: [Sitemap]
 *     description: >
 *       Returns all sitemap URLs as a JSON array. Each item includes
 *       the URL, content type, last modified date, change frequency and priority.
 *       Use this in your Next.js app/sitemap.ts to generate the sitemap
 *       without querying the database directly.
 *     responses:
 *       200:
 *         description: JSON sitemap
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: number
 *                   example: 42
 *                   description: Total number of URLs in the sitemap
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                         example: "https://frontend.phitanydev.in/case-studies/emc-hospital"
 *                       type:
 *                         type: string
 *                         enum: [static, case-study, service, blog, industry, page]
 *                         example: "case-study"
 *                       lastmod:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2026-08-01T00:00:00.000Z"
 *                       changefreq:
 *                         type: string
 *                         enum: [always, hourly, daily, weekly, monthly, yearly, never]
 *                         example: "monthly"
 *                       priority:
 *                         type: number
 *                         minimum: 0.0
 *                         maximum: 1.0
 *                         example: 0.8
 *             examples:
 *               sample:
 *                 value:
 *                   success: true
 *                   total: 3
 *                   data:
 *                     - url: "https://frontend.phitanydev.in"
 *                       type: "static"
 *                       lastmod: null
 *                       changefreq: "weekly"
 *                       priority: 1.0
 *                     - url: "https://frontend.phitanydev.in/case-studies/emc-hospital"
 *                       type: "case-study"
 *                       lastmod: "2026-08-01T00:00:00.000Z"
 *                       changefreq: "monthly"
 *                       priority: 0.8
 *                     - url: "https://frontend.phitanydev.in/insights/how-we-built-emc"
 *                       type: "blog"
 *                       lastmod: "2026-07-15T00:00:00.000Z"
 *                       changefreq: "weekly"
 *                       priority: 0.7
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */