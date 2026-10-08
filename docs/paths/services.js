

/**
 * @swagger
 * /services:
 *   get:
 *     summary: Get all active top-level services with their children
 *     tags: [Services]
 *     description: >
 *       Returns top-level services (parentService = null) with their
 *       child services nested inside. Use this for the Services listing page.
 *     responses:
 *       200:
 *         description: List of active top-level services with children
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                         example: "Digital Engineering"
 *                       slug:
 *                         type: string
 *                         example: "digital-engineering"
 *                       description:
 *                         type: string
 *                       bannerImage:
 *                         type: string
 *                         example: "/uploads/services/1710-banner.jpg"
 *                       bullets:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["Corporate & Institutional Websites", "Custom Web Applications"]
 *                       featured:
 *                         type: boolean
 *                       displayOrder:
 *                         type: number
 *                       children:
 *                         type: array
 *                         description: Child services nested under this top-level service
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             title:
 *                               type: string
 *                               example: "Corporate & Institutional Websites"
 *                             slug:
 *                               type: string
 *                               example: "corporate-institutional-websites"
 *                             shortDescription:
 *                               type: string
 *                             tagline:
 *                               type: string
 *                             heroImage:
 *                               type: string
 *                             displayOrder:
 *                               type: number
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
 * /services/featured:
 *   get:
 *     summary: Get featured top-level services (for homepage section)
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Maximum number of featured services to return
 *     responses:
 *       200:
 *         description: List of featured services
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       description:
 *                         type: string
 *                       bannerImage:
 *                         type: string
 *                       bullets:
 *                         type: array
 *                         items:
 *                           type: string
 *                       displayOrder:
 *                         type: number
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
 * /services/{slug}:
 *   get:
 *     summary: Get a service by slug (top-level or child)
 *     tags: [Services]
 *     description: >
 *       For a top-level service: returns full detail with children, bullets,
 *       description, and meta.
 *       For a child/leaf service: returns full detail including process steps,
 *       technologies (with descriptions), FAQs, related case studies
 *       (derived from case studies whose services array includes this _id),
 *       related services (siblings sharing the same parentService), and meta.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The service slug
 *         example: "corporate-institutional-websites"
 *     responses:
 *       200:
 *         description: Service detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                       example: "Corporate & Institutional Websites"
 *                     slug:
 *                       type: string
 *                     parentService:
 *                       type: object
 *                       description: populated parent (null for top-level)
 *                       properties:
 *                         _id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         slug:
 *                           type: string
 *                     description:
 *                       type: string
 *                     bannerImage:
 *                       type: string
 *                     bullets:
 *                       type: array
 *                       items:
 *                         type: string
 *                     shortDescription:
 *                       type: string
 *                     tagline:
 *                       type: string
 *                     heroImage:
 *                       type: string
 *                     introTitle:
 *                       type: string
 *                     introDescription:
 *                       type: string
 *                     process:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             example: "Discovery"
 *                           description:
 *                             type: string
 *                             example: "We learn your business goals..."
 *                     technologies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           technology:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               slug:
 *                                 type: string
 *                               logo:
 *                                 type: string
 *                           description:
 *                             type: string
 *                             example: "Powers the back-end — product catalogue..."
 *                     faqs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           question:
 *                             type: string
 *                           answer:
 *                             type: string
 *                     relatedCaseStudies:
 *                       type: array
 *                       description: Derived at render time — case studies whose services array includes this _id
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           bannerImage:
 *                             type: string
 *                           shortDescription:
 *                             type: string
 *                     relatedServices:
 *                       type: array
 *                       description: Siblings sharing the same parentService
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           shortDescription:
 *                             type: string
 *                           heroImage:
 *                             type: string
 *                     featured:
 *                       type: boolean
 *                     displayOrder:
 *                       type: number
 *                     meta:
 *                       type: object
 *                       properties:
 *                         meta_title:
 *                           type: string
 *                         meta_description:
 *                           type: string
 *                         meta_keywords:
 *                           type: array
 *                           items:
 *                             type: string
 *                         og_title:
 *                           type: string
 *                         og_description:
 *                           type: string
 *                         og_image:
 *                           type: string
 *                         twitter_title:
 *                           type: string
 *                         twitter_description:
 *                           type: string
 *                         twitter_image:
 *                           type: string
 *                         canonical_url:
 *                           type: string
 *                         allow_indexing:
 *                           type: boolean
 *                         schema_markup:
 *                           type: string
 *       404:
 *         description: Service not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
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