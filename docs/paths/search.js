

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search across case studies, services, industries, solutions, technologies and blogs
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (minimum 2 characters)
 *         example: "healthcare"
 *     responses:
 *       200:
 *         description: Flat array of search results matching SearchIndexItem shape
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 query:
 *                   type: string
 *                   example: "healthcare"
 *                 total:
 *                   type: number
 *                   example: 8
 *                   description: Total number of results across all categories
 *                 data:
 *                   type: array
 *                   description: >
 *                     Flat array of results — filter by `category` to group in UI.
 *                     Each item has name, category, tag, href and image.
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Display name of the result
 *                         example: "EMC Hospital"
 *                       category:
 *                         type: string
 *                         enum:
 *                           - Case Study
 *                           - Service
 *                           - Industry
 *                           - Solution
 *                           - Technology
 *                           - Blog
 *                         example: "Case Study"
 *                       tag:
 *                         type: string
 *                         description: >
 *                           Subtitle shown under the name.
 *                           For Case Study — industry name (e.g. "Healthcare").
 *                           For Service — parent service title (e.g. "Digital Engineering").
 *                           Empty string for Industry, Solution, Technology, Blog.
 *                         example: "Healthcare"
 *                       href:
 *                         type: string
 *                         description: Full frontend URL to navigate to on click
 *                         example: "/case-studies/emc-hospital"
 *                       image:
 *                         type: string
 *                         description: Full absolute image URL (prefixed with BASE_URL)
 *                         example: "https://mernappadmin.phitanydev.in/uploads/casestudies/1710-banner.jpg"
 *             examples:
 *               sample:
 *                 value:
 *                   success: true
 *                   query: "healthcare"
 *                   total: 3
 *                   data:
 *                     - name: "EMC Hospital"
 *                       category: "Case Study"
 *                       tag: "Healthcare"
 *                       href: "/case-studies/emc-hospital"
 *                       image: "https://mernappadmin.phitanydev.in/uploads/casestudies/1710-banner.jpg"
 *                     - name: "SAR Healthline"
 *                       category: "Case Study"
 *                       tag: "Healthcare"
 *                       href: "/case-studies/sar-healthline"
 *                       image: "https://mernappadmin.phitanydev.in/uploads/casestudies/1711-banner.jpg"
 *                     - name: "Healthcare"
 *                       category: "Industry"
 *                       tag: ""
 *                       href: "/industries/healthcare"
 *                       image: "https://mernappadmin.phitanydev.in/uploads/industries/1710-healthcare.jpg"
 *       400:
 *         description: Query too short — must be at least 2 characters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Query must be at least 2 characters"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Search failed"
 */